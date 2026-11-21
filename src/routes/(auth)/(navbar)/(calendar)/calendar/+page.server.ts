import { fail } from '@sveltejs/kit';
import type { Actions, RequestHandler } from './$types';
import { db } from '#lib/server/db/index.ts';
import { eventTable } from '#lib/server/db/schema.ts';

export const actions = {
	/* Creates an event of the user */
	create: async ({ request, locals }) => {
		const formData = await request.formData();
		const type = formData.get('type')?.toString() ?? 'private';
		const title = formData.get('title')?.toString().trim() ?? '';
		const location = formData.get('location')?.toString().trim() ?? '';
		const description = formData.get('description')?.toString().trim() ?? '';
		const startValue = formData.get('start')?.toString() ?? '';
		const endValue = formData.get('end')?.toString() ?? '';

		if (!title) return fail(400, { error: 'Bitte gib einen Titel ein.' });
		if (!location) return fail(400, { error: 'Bitte gib einen Ort ein.' });
		if (!startValue) return fail(400, { error: 'Bitte gib einen Startzeitpunkt ein.' });

		const start = new Date(startValue);
		if (Number.isNaN(start.getTime())) {
			return fail(400, { error: 'Der Startzeitpunkt ist ungültig.' });
		}

		let end: Date | null = null;
		if (endValue) {
			end = new Date(endValue);
			if (Number.isNaN(end.getTime())) {
				return fail(400, { error: 'Der Endzeitpunkt ist ungültig.' });
			}
			if (end < start) {
				return fail(400, { error: 'Das Ende darf nicht vor dem Start liegen.' });
			}
		}

		if (type !== 'private' && type !== 'public' && type !== 'global') {
			return fail(400, { error: 'Bitte waehle einen gültigen Typ.' });
		}

		if (type === 'global' && !locals.user.asta_member) {
			return fail(403, { error: 'Du darfst diesen Termintyp nicht erstellen.' });
		}

		try {
			db.insert(eventTable)
				.values({
					user_id: locals.user.id,
					type,
					title,
					start,
					end,
					time: start.toLocaleTimeString('de-DE', {
						hour: '2-digit',
						minute: '2-digit',
						hour12: false
					}),
					location,
					description: description || null
				})
				.run();
		} catch (error) {
			console.error('Could not create event', error);
			return fail(500, {
				error: 'Der Termin konnte nicht gespeichert werden. Bitte versuche es erneut.'
			});
		}

		return { success: true };
	}
} satisfies Actions;
