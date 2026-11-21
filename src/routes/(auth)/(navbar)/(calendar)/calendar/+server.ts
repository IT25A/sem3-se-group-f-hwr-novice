import type { RequestHandler } from './$types';
import { db } from '#lib/server/db/index.ts';
import { eventTable, EventType } from '#lib/server/db/schema.ts';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

export const DELETE: RequestHandler = async ({ request, locals }) => {
	const eventId = (await request.json())['eventId'];
	const user = locals.user;

	const event = db.select().from(eventTable).where(eq(eventTable.id, eventId)).get();

	if (!event) throw error(404, 'Event not found');

	if (event.type == EventType.GLOBAL && !user.asta_member)
		throw error(403, 'Forbidden to delete this event');

	if (event.user_id != user.id && (!user.asta_member && event.type == EventType.GLOBAL))
		throw error(403, 'Forbidden to delete this event');

	db.delete(eventTable).where(eq(eventTable.id, eventId)).run();

	return new Response();
};
