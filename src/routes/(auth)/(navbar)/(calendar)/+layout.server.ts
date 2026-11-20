import type { LayoutServerLoad } from './$types';
import { syncCourse } from '#lib/server/lessons/sync.ts';
import { courseTable } from '#lib/server/db/schema.ts';
import { eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { eventsOf, lessonsOf, sourceOf, titleOf } from '#lib/server/calendar/events.ts';
import type { CalendarEvent, CalendarSource } from 'svelte5plus-calendar';

export const load: LayoutServerLoad = async ({ locals }) => {
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

	const courses = lessonsOf(locals.user).map(
		(lesson, index) =>
			({
				id: `${index}`,
				title: lesson.title,
				start: lesson.start,
				end: lesson.end,
				location: lesson.location,
				description: lesson.description,
				color: lesson.exam ? 'red' : undefined,
				calendarId: 'HWR'
			}) satisfies CalendarEvent
	);

	const events = eventsOf(locals.user).map((it) => {
		return {
			id: it.id,
			editable: locals.userId == it.user_id || (it.type == 'global' && locals.user.asta_member),
			calendarId: sourceOf(it),
			title: titleOf(it),
			location: it.location,
			description: it.description ?? '',
			start: it.start,
			allDay: it.end == null,
			end: it.end ?? it.start
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
		events: [...courses, ...events],
		scheduleError,
		sources,
		hasCourse: Boolean(course)
	};
};
