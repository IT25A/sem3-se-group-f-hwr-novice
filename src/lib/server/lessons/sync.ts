import { eq } from 'drizzle-orm';
import { db } from '../db';
import { lessonTable, moduleTable } from '../db/schema';
import { fetchLessons } from '../hwrical/schedule.ts';
import { lessonKey, parseLesson, describeLesson } from './parser';

export async function syncLessons() {
	const feed = await fetchLessons('informatik', { course_part: 'kursa', year_part: 'semester3' });
	if (feed.length === 0) return; // most likely an error, do not delete anything

	const moduleIds = new Map(
		db
			.select()
			.from(moduleTable)
			.all()
			.map((module) => [module.code, module.id])
	);

	const rows = feed.map((lesson) => {
		const parsed = parseLesson(lesson);
		const { code, title, kind } = parsed;
		return {
			key: lessonKey(code, title, lesson.start),
			module_id: code ? (moduleIds.get(code) ?? null) : null,
			kind,
			title,
			location: lesson.location ?? '',
			description: describeLesson(parsed),
			starts_at: lesson.start,
			ends_at: lesson.end
		};
	});

	db.transaction((tx) => {
		for (const row of rows) {
			tx.insert(lessonTable)
				.values(row)
				.onConflictDoUpdate({ target: lessonTable.key, set: row })
				.run();
		}

		const keys = new Set(rows.map((row) => row.key));
		const lastStart = Math.max(...rows.map((row) => row.starts_at.getTime()));
		const now = Date.now();

		for (const lesson of tx.select().from(lessonTable).all()) {
			const start = lesson.starts_at.getTime();
			if (start > now && start <= lastStart && !keys.has(lesson.key)) {
				tx.delete(lessonTable).where(eq(lessonTable.id, lesson.id)).run();
			}
		}
	});
}
