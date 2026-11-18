import { and, asc, desc, eq, gte } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db } from '#lib/server/db/index.ts';
import { moduleTable, pomodoroTable } from '#lib/server/db/schema.ts';

export const load: PageServerLoad = async ({ locals }) => {
	const modules = db
		.select({ id: moduleTable.id, code: moduleTable.code, name: moduleTable.name })
		.from(moduleTable)
		.where(eq(moduleTable.user_id, locals.user.id))
		.orderBy(asc(moduleTable.name))
		.all();
	const names = new Map(modules.map((module) => [module.id, module.name]));

	const completed = and(
		eq(pomodoroTable.user_id, locals.user.id),
		eq(pomodoroTable.type, 'work'),
		eq(pomodoroTable.status, 'completed')
	);

	const recent = db
		.select()
		.from(pomodoroTable)
		.where(completed)
		.orderBy(desc(pomodoroTable.ended_at))
		.limit(10)
		.all();

	const startOfDay = new Date();
	startOfDay.setHours(0, 0, 0, 0);
	const today = db
		.select()
		.from(pomodoroTable)
		.where(and(completed, gte(pomodoroTable.ended_at, startOfDay)))
		.all();

	return {
		modules,
		today: {
			count: today.length,
			minutes: today.reduce((sum, session) => sum + session.planned_duration, 0)
		},
		recent: recent.map((session) => ({
			id: session.id,
			ended_at: session.ended_at,
			minutes: session.planned_duration,
			module: session.module_id ? (names.get(session.module_id) ?? null) : null
		}))
	};
};
