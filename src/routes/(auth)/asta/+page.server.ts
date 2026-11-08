import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '#lib/server/db/index.ts';
import { eq, and, asc } from 'drizzle-orm';
import { type AstaEvent, astaEventTable } from '#lib/server/db/schema.ts';

export const load: PageServerLoad = async () => {
	const events: AstaEvent[] = db.select().from(astaEventTable).orderBy(asc(astaEventTable.date), asc(astaEventTable.time)).all();
	return { events };
};

export const actions = {
	'add-event': async ({ request, locals }) => {
		const formData = await request.formData();
		const user_id = locals.user?.id;
		const title = formData.get('title')?.toString().trim() ?? '';
		const date = formData.get('date')?.toString().trim() ?? '';
		const time = formData.get('time')?.toString().trim() ?? '';
		const location = formData.get('location')?.toString().trim() ?? '';

		if (!user_id) {
			return fail(401, { error: 'User not authenticated', title, date, time, location });
		}

		if (!title || !date || !time || !location) {
			return fail(400, { error: 'Invalid event data', title, date, time, location });
		}

		const eventTimestamp = Date.parse(date + 'T' + time);

		if (Number.isNaN(eventTimestamp)) {
			return fail(400, { error: 'Invalid date or time format', title, date, time, location });
		}
		if (eventTimestamp < Date.now()) {
			return fail(400, { error: 'Event date must be in the future', title, date, time, location });
		}

		if (title.length > 50 || location.length > 50 || title.length < 3 || location.length < 3) {
			return fail(400, {
				error: 'Title and location must be between 3 and 50 characters',
				title,
				date,
				time,
				location
			});
		}

		try {
			const createdEvent = db
				.insert(astaEventTable)
				.values({ user_id, title, date, time, location })
				.returning()
				.get();
			if (!createdEvent) {
				return fail(500, { error: 'Failed to create event', title, date, time, location });
			}
		} catch {
			return fail(500, { error: 'Failed to create event', title, date, time, location });
		}
		return { success: true };
	},

	'delete-event': async ({ request, locals }) => {
		const formData = await request.formData();
		const id = formData.get('id')?.toString().trim() ?? '';
		const user_id = locals.user?.id;

		if (!id || !user_id) {
			return fail(400, { error: 'Invalid event ID or user ID' });
		}

		try {
			const deletedEvent = db
				.delete(astaEventTable)
				.where(and(eq(astaEventTable.id, id), eq(astaEventTable.user_id, user_id)))
				.returning()
				.get();
			if (!deletedEvent) {
				return fail(403, { error: 'Permission denied or event not found' });
			}
		} catch {
			return fail(500, { error: 'Failed to delete event' });
		}

		return { deleted: true };
	}
} satisfies Actions;
