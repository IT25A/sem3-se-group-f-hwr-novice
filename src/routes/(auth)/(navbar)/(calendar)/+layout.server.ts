import type { LayoutServerLoad } from './$types';
import { seed } from '#lib/server/db/seed.ts';
import { syncCourse } from '#lib/server/lessons/sync.ts';
import { courseTable, lessonTable, moduleTable } from '#lib/server/db/schema.ts';
import { asc, eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import type { CalendarEvent, CalendarSource } from 'svelte5plus-calendar';

const KIND_NAMES: Record<string, string> = {
	SU: 'Seminaristischer Unterricht',
	PÜ: 'Praktische Übung',
	PCÜ: 'Seminar am PC',
	PT: 'Praxistransfer',
	SI: 'Seminaristischer Intensivunterricht'
};

export const load: LayoutServerLoad = async ({ locals }) => {
	seed();

	const course = locals.user.course_id
		? db.select().from(courseTable).where(eq(courseTable.id, locals.user.course_id)).get()
		: undefined;

	let scheduleError = false;
	if (course) {
		try {
			await syncCourse(course);
		} catch (error) {
			console.error('Could not sync the schedule', error);
			scheduleError = true;
		}
	}

	const rows = course
		? db
				.select()
				.from(lessonTable)
				.leftJoin(moduleTable, eq(lessonTable.module_id, moduleTable.id))
				.where(eq(lessonTable.course_id, course.id))
				.orderBy(asc(lessonTable.starts_at))
				.all()
		: [];

	const events = rows.map(({ lesson, module }, index) => {
		return {
			id: `${index}`,
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
				.join('\n'),
			color: lesson.kind === 'Klausur' ? 'red' : undefined,
			calendarId: 'HWR'
		} satisfies CalendarEvent;
	});

	const sources: CalendarSource[] = [
		{
			id: 'HWR',
			name: 'HWR Berlin - Stundenplan',
			editable: false,
			color: 'teal'
		},
		{
			id: 'private',
			name: 'Private Termine',
			color: 'graphite'
		},
		{
			id: 'public',
			name: 'Öffentliche Termine',
			color: 'blue'
		}
	];

	return {
		events,
		scheduleError,
		sources,
		hasCourse: Boolean(course)
	};
};
