import type { PageServerLoad } from './$types';
import { asc } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { lessonTable, moduleTable, pomodoroTable } from '#lib/server/db/schema.ts';
import { seed } from '#lib/server/db/seed.ts';
import { isNotNull } from 'drizzle-orm';
import { eq } from 'drizzle-orm';
import { and } from 'drizzle-orm';
import { calculateProgress } from '#lib/server/modules/progress.ts';

export const load: PageServerLoad = async ({ locals }) => {
	seed();

	const modules = db.select().from(moduleTable).orderBy(asc(moduleTable.code)).all();
	const lessons = db.select().from(lessonTable).where(isNotNull(lessonTable.module_id)).all();

	const sessions = db
		.select()
		.from(pomodoroTable)
		.where(
			and(
				eq(pomodoroTable.user_id, locals.user.id),
				eq(pomodoroTable.type, 'work'),
				eq(pomodoroTable.status, 'completed'),
				isNotNull(pomodoroTable.module_id),
				isNotNull(pomodoroTable.ended_at)
			)
		)
		.all();

	// Minutes of completed work sessions per module
	const selfStudyMinutes = new Map<string, number>();
	for (const session of sessions) {
		if (!session.module_id || !session.ended_at) continue;
		const minutes = (session.ended_at.getTime() - session.started_at.getTime()) / 60_000;
		selfStudyMinutes.set(
			session.module_id,
			(selfStudyMinutes.get(session.module_id) ?? 0) + minutes
		);
	}
	return { progress: calculateProgress(modules, lessons, selfStudyMinutes, new Date()) };
};
