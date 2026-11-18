import { json } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { db } from '#lib/server/db/index.ts';
import { moduleTable, pomodoroTable } from '#lib/server/db/schema.ts';

// A work interval may be completed this much earlier than planned (rounding of timestamps).
const TOLERANCE_MS = 5000;

export const POST: RequestHandler = async ({ request, locals }) => {
	const body = await request.json().catch(() => null);
	const user_id = locals.user.id;

	if (body?.action === 'start') {
		const minutes = Number(body.minutes);
		if (!Number.isInteger(minutes) || minutes < 1 || minutes > 180) {
			return json({ error: 'Invalid duration' }, { status: 400 });
		}

		const module_id = typeof body.module_id === 'string' ? body.module_id : null;
		if (module_id) {
			const own = db
				.select()
				.from(moduleTable)
				.where(and(eq(moduleTable.id, module_id), eq(moduleTable.user_id, user_id)))
				.get();
			if (!own) return json({ error: 'Unknown module' }, { status: 400 });
		}

		const row = db.transaction((tx) => {
			// Only one interval can run at a time.
			tx.update(pomodoroTable)
				.set({ status: 'cancelled', ended_at: new Date() })
				.where(and(eq(pomodoroTable.user_id, user_id), eq(pomodoroTable.status, 'running')))
				.run();

			return tx
				.insert(pomodoroTable)
				.values({
					user_id,
					module_id,
					type: 'work',
					planned_duration: minutes,
					started_at: new Date()
				})
				.returning({ id: pomodoroTable.id })
				.get();
		});

		return Response.json({ id: row.id });
	}

	if (body?.action === 'complete' || body?.action === 'cancel') {
		const id = typeof body.id === 'string' ? body.id : '';
		const row = db
			.select()
			.from(pomodoroTable)
			.where(
				and(
					eq(pomodoroTable.id, id),
					eq(pomodoroTable.user_id, user_id),
					eq(pomodoroTable.status, 'running')
				)
			)
			.get();
		if (!row) return Response.json({ error: 'Unknown session' }, { status: 404 });

		if (body.action === 'complete') {
			// Pauses only make an interval longer, so the planned time must have passed.
			const elapsed = Date.now() - row.started_at.getTime();
			if (elapsed < row.planned_duration * 60_000 - TOLERANCE_MS) {
				return Response.json({ error: 'Interval is not over yet' }, { status: 400 });
			}
		}

		db.update(pomodoroTable)
			.set({
				status: body.action === 'complete' ? 'completed' : 'cancelled',
				ended_at: new Date()
			})
			.where(eq(pomodoroTable.id, row.id))
			.run();

		return Response.json({ ok: true });
	}

	return Response.json({ error: 'Unknown action' }, { status: 400 });
};
