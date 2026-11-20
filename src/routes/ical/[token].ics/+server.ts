import { createHash } from 'node:crypto';
import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { db } from '#lib/server/db/index.ts';
import { courseTable, userTable } from '#lib/server/db/schema.ts';
import { syncCourse } from '#lib/server/lessons/sync.ts';
import { eventsOf, lessonsOf, sourceOf, titleOf } from '#lib/server/calendar/events.ts';
import { buildCalendar, type IcsEvent } from '#lib/server/ical/format.ts';

// stable, so that calendar apps update an event instead of adding it twice
const uid = (kind: string, key: string) =>
	`${kind}-${createHash('sha1').update(key).digest('hex')}@hwr-novice`;

export const GET: RequestHandler = async ({ params }) => {
	const user = db.select().from(userTable).where(eq(userTable.ical_token, params.token)).get();
	if (!user) error(404, 'Not found');

	const items: IcsEvent[] = [];

	if (user.ical_lessons && user.course_id) {
		const course = db.select().from(courseTable).where(eq(courseTable.id, user.course_id)).get();
		if (course) {
			// an unreachable schedule must not break the feed, the stored lessons are used then
			await syncCourse(course).catch((cause) =>
				console.error('Could not sync the schedule', cause)
			);
		}

		for (const lesson of lessonsOf(user)) {
			items.push({
				uid: uid('lesson', lesson.key),
				title: lesson.title,
				start: lesson.start,
				end: lesson.end,
				location: lesson.location,
				description: lesson.description
			});
		}
	}

	for (const event of eventsOf(user)) {
		if (sourceOf(event) === 'private' ? !user.ical_private : !user.ical_public) continue;

		items.push({
			uid: uid('event', event.id),
			title: titleOf(event),
			start: event.start,
			end: event.end ?? event.start,
			allDay: event.end == null,
			location: event.location,
			description: event.description ?? ''
		});
	}

	return new Response(buildCalendar('HWR Novice', items), {
		headers: {
			'Content-Type': 'text/calendar; charset=utf-8',
			'Content-Disposition': 'inline; filename="hwr-novice.ics"',
			'Cache-Control': 'private, no-cache',
			'X-Robots-Tag': 'noindex'
		}
	});
};
