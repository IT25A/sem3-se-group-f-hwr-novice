import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { asc, eq, and, isNotNull } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { lessonTable, moduleTable, pomodoroTable, modulePassTable } from '#lib/server/db/schema.ts';
import { seed } from '#lib/server/db/seed.ts';
import { calculateProgress } from '#lib/server/modules/progress.ts';
import { EARLIER_ECTS, TOTAL_ECTS } from '#lib/server/modules/catalog.ts';

export const load: PageServerLoad = async ({ locals }) => {
	seed();

	const modules = db.select().from(moduleTable).orderBy(asc(moduleTable.code)).all();
	const lessons = locals.user.course_id
		? db
				.select()
				.from(lessonTable)
				.where(
					and(eq(lessonTable.course_id, locals.user.course_id), isNotNull(lessonTable.module_id))
				)
				.all()
		: [];

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

	const passedIds = new Set(
		db
			.select({ module_id: modulePassTable.module_id })
			.from(modulePassTable)
			.where(eq(modulePassTable.user_id, locals.user.id))
			.all()
			.map((row) => row.module_id)
	);

	const progress = calculateProgress(modules, lessons, selfStudyMinutes, new Date()).map(
		(item) => ({ ...item, passed: passedIds.has(item.module.id) })
	);

	const semesterLp = progress
		.filter((item) => item.passed)
		.reduce((sum, item) => sum + item.module.lp, 0);
	const ects = { earned: EARLIER_ECTS + semesterLp, earlier: EARLIER_ECTS, total: TOTAL_ECTS };

	return { progress, ects };
};

export const actions = {
	/* Marks a module as passed or takes the mark back. */
	toggle: async ({ request, locals }) => {
		const module_id = (await request.formData()).get('module_id')?.toString() ?? '';
		const user_id = locals.user.id;

		const found = db.select().from(moduleTable).where(eq(moduleTable.id, module_id)).get();
		if (!found) return fail(400, { error: 'Unknown module' });

		const deleted = db
			.delete(modulePassTable)
			.where(and(eq(modulePassTable.user_id, user_id), eq(modulePassTable.module_id, module_id)))
			.returning()
			.get();

		if (!deleted) db.insert(modulePassTable).values({ user_id, module_id }).run();
	}
} satisfies Actions;
