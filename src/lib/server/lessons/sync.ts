import { eq, asc } from 'drizzle-orm';
import { db } from '../db';
import { lessonTable, moduleTable, type Course, courseTable } from '../db/schema';
import { semesterOf } from '../courses/semester';
import { fetchLessons } from '../hwrical/schedule.ts';
import { BASELINE } from '../lessons/baseline.ts';
import { lessonKey, parseLesson, describeLesson } from './parser';

// the feed is asked at most this often per course.
const MIN_INTERVAL_MS = 15 * 60 * 1000;

// timestables from before the archive existed, by "study/course_part/cohort"
const BASELINES: Record<string, string[]> = {
	'informatik/kursa/2025': BASELINE
};

function insertBaseline(course: Course, moduleIds: Map<string, string>) {
	const lines = BASELINES[`${course.study}/${course.course_part}/${course.cohort}`];
	if (!lines) return;

	const existing = db
		.select()
		.from(lessonTable)
		.where(eq(lessonTable.course_id, course.id))
		.limit(1)
		.get();
	if (existing) return;

	const rows = lines.map((line) => {
		const [code, kind, title, location, start, end, lecturer, pause, note] = line.split('|');
		const startsAt = new Date(start);
		return {
			course_id: course.id,
			key: lessonKey(code, title, startsAt),
			module_id: moduleIds.get(code) ?? null,
			kind,
			title,
			location,
			description: describeLesson({ lecturer, note, pause: Number(pause) }),
			starts_at: startsAt,
			ends_at: new Date(end)
		};
	});
	db.insert(lessonTable).values(rows).onConflictDoNothing().run();
}

export async function syncCourse(course: Course) {
	const semester = semesterOf(course.cohort);
	if (semester < 1 || semester > 6) return; // there is no feed for this semester

	if (Date.now() - (course.synced_at?.getTime() ?? 0) < MIN_INTERVAL_MS) return;

	const moduleIds = new Map(
		db
			.select()
			.from(moduleTable)
			.all()
			.map((module) => [module.code, module.id])
	);
	insertBaseline(course, moduleIds);

	const feed = await fetchLessons(course.study, {
		course_part: course.course_part,
		year_part: `semester${semester}`
	});
	if (feed.length === 0) return; // most likely an error, do not delete anything

	const rows = feed.map((lesson) => {
		const parsed = parseLesson(lesson);
		const { code, title, kind } = parsed;
		return {
			course_id: course.id,
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
				.onConflictDoUpdate({ target: [lessonTable.course_id, lessonTable.key], set: row })
				.run();
		}

		const keys = new Set(rows.map((row) => row.key));
		const lastStart = Math.max(...rows.map((row) => row.starts_at.getTime()));
		const now = Date.now();

		for (const lesson of tx
			.select()
			.from(lessonTable)
			.where(eq(lessonTable.course_id, course.id))
			.all()) {
			const start = lesson.starts_at.getTime();
			if (start > now && start <= lastStart && !keys.has(lesson.key)) {
				tx.delete(lessonTable).where(eq(lessonTable.id, lesson.id)).run();
			}
		}

		tx.update(courseTable)
			.set({ synced_at: new Date() })
			.where(eq(courseTable.id, course.id))
			.run();
	});
}
