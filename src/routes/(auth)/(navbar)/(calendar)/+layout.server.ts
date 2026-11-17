import type { LayoutServerLoad } from './$types';
import { seed } from '#lib/server/db/seed.ts';
import { syncCourse } from '#lib/server/lessons/sync.ts';
import { courseTable, eventTable, lessonTable, moduleTable } from '#lib/server/db/schema.ts';
import { and, asc, eq, or } from 'drizzle-orm';
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

	const courseRows = course
		? db
				.select()
				.from(lessonTable)
				.leftJoin(moduleTable, eq(lessonTable.module_id, moduleTable.id))
				.where(eq(lessonTable.course_id, course.id))
				.orderBy(asc(lessonTable.starts_at))
				.all()
		: [];

	const courses = courseRows.map(({ lesson, module }, index) => {
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

	const eventRows = db.select().from(eventTable)
		.where(
			or(
				and(
					eq(eventTable.type, "private"),
					eq(eventTable.user_id, locals.userId)
				),
				eq(eventTable.type, "public"),
				eq(eventTable.type, "global")
			)
		).all()

	const events = eventRows.map((it) => {
		return {
			id: it.id,
			editable: locals.userId == it.user_id,
			calendarId: it.type == "private" ? "private" : "public",
			title: it.title,
			location: it.location,
			description: it.description ?? "",
			start: it.start,
			allDay: it.end == null,
			end: it.end ?? it.start
		} satisfies CalendarEvent;
	})

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
		events: [...courses, ...events],
		scheduleError,
		sources,
		hasCourse: Boolean(course)
	};
};
