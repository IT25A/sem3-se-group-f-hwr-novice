import type { PageServerLoad } from './$types';
import { seed } from '#lib/server/db/seed.ts';
import { syncLessons } from '#lib/server/lessons/sync.ts';
import { lessonTable, moduleTable } from '#lib/server/db/schema.ts';
import { eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';

const KIND_NAMES: Record<string, string> = {
	SU: 'Seminaristischer Unterricht',
	PÜ: 'Praktische Übung',
	PCÜ: 'Seminar am PC',
	PT: 'Praxistransfer',
	SI: 'Seminaristischer Intensivunterricht'
};

export const load: PageServerLoad = async () => {
	seed();

	let scheduleError = false;
	try {
		await syncLessons();
	} catch (error) {
		console.error('Could not sync the schedule', error);
		scheduleError = true;
	}

	const rows = db
		.select()
		.from(lessonTable)
		.leftJoin(moduleTable, eq(lessonTable.module_id, moduleTable.id))
		.orderBy(lessonTable.starts_at)
		.all();

	const events = rows.map(({ lesson, module }) => {
		return {
			title: module ? `${module.code} ${lesson.title}` : lesson.title,
			start: lesson.starts_at,
			end: lesson.ends_at,
			location: lesson.location,
			description: [
				module && `Modul: ${module.name}`,
				lesson.kind && `Art: ${KIND_NAMES[lesson.kind] ?? lesson.kind}`,
				lesson.description
			]
				.filter(Boolean)
				.join('\n')
		};
	});

	return { events, scheduleError };
};
