import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { db } from '#lib/server/db/index.ts';
import { eventTable } from '#lib/server/db/schema.ts';

// GitHub Copilot generated
export const actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();
		const type = formData.get('type')?.toString() ?? 'private';
		const title = formData.get('title')?.toString().trim() ?? '';
		const location = formData.get('location')?.toString().trim() ?? '';
		const description = formData.get('description')?.toString().trim() ?? '';
		const startValue = formData.get('start')?.toString() ?? '';
		const endValue = formData.get('end')?.toString() ?? '';

		const values = { type, title, location, description, start: startValue, end: endValue };

		if (!title) {
			return fail(400, { ...values, error: 'Bitte gib einen Titel ein.', missing_title: true });
		}
		if (!location) {
			return fail(400, { ...values, error: 'Bitte gib einen Ort ein.', missing_location: true });
		}
		if (!startValue) {
			return fail(400, {
				...values,
				error: 'Bitte gib einen Startzeitpunkt ein.',
				missing_start: true
			});
		}

		const start = new Date(startValue);
		if (Number.isNaN(start.getTime())) {
			return fail(400, {
				...values,
				error: 'Der Startzeitpunkt ist ungültig.',
				invalid_start: true
			});
		}

		let end: Date | null = null;
		if (endValue) {
			end = new Date(endValue);
			if (Number.isNaN(end.getTime())) {
				return fail(400, { ...values, error: 'Der Endzeitpunkt ist ungültig.', invalid_end: true });
			}
			if (end < start) {
				return fail(400, {
					...values,
					error: 'Das Ende darf nicht vor dem Start liegen.',
					end_before_start: true
				});
			}
		}

		const eventType =
			type === 'private'
				? 'private'
				: type === 'public'
					? 'public'
					: type === 'global'
						? 'global'
						: null;

		if (!eventType) {
			return fail(400, {
				...values,
				error: 'Bitte waehle einen gueltigen Typ.',
				invalid_type: true
			});
		}
		if ((eventType === 'global') && !locals.user.asta_member) {
			return fail(403, {
				...values,
				error: 'Du darfst diesen Termintyp nicht erstellen.',
				forbidden_type: true
			});
		}

		try {
			db.insert(eventTable)
				.values({
					user_id: locals.user.id,
					type: eventType,
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
				...values,
				error: 'Der Termin konnte nicht gespeichert werden. Bitte versuche es erneut.',
				database_error: true
			});
		}

		redirect(303, '/calendar');
	}
} satisfies Actions;
