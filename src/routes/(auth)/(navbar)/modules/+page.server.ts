import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { asc, eq, and, isNotNull } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import {
	lessonTable,
	moduleTable,
	pomodoroTable,
	modulePassTable,
	courseTable
} from '#lib/server/db/schema.ts';
import { calculateProgress } from '#lib/server/modules/progress.ts';
import {
	CATALOGS,
	catalogFor,
	ECTS_PER_SEMESTER,
	TOTAL_ECTS
} from '#lib/server/modules/catalog.ts';
import { linkLessons } from '#lib/server/modules/personal.ts';
import { semesterOf } from '#lib/server/courses/semester.ts';

export const load: PageServerLoad = async ({ locals }) => {
	const modules = db
		.select()
		.from(moduleTable)
		.where(eq(moduleTable.user_id, locals.user.id))
		.orderBy(asc(moduleTable.name))
		.all();

	const course = locals.user.course_id
		? db.select().from(courseTable).where(eq(courseTable.id, locals.user.course_id)).get()
		: undefined;

	// semesters before the current one are assumed to be passed. Without a course nothing is.
	const earlier = course
		? ECTS_PER_SEMESTER * Math.min(Math.max(semesterOf(course.cohort) - 1, 0), 6)
		: 0;

	const lessons = locals.user.course_id
		? linkLessons(
				db.select().from(lessonTable).where(eq(lessonTable.course_id, locals.user.course_id)).all(),
				modules
			)
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

	const currentCodes = new Set(
		course
			? catalogFor(course.study, course.cohort, semesterOf(course.cohort)).map(
					(module) => module.code
				)
			: []
	);

	const catalogCodes = new Set(
		Object.values(CATALOGS)
			.flat()
			.map((module) => module.code)
	);

	const countsForSemester = (code: string | null) =>
		!course || !code || !catalogCodes.has(code) || currentCodes.has(code);

	const semesterLp = progress
		.filter((item) => item.passed && countsForSemester(item.module.code))
		.reduce((sum, item) => sum + item.module.lp, 0);
	const ects = { earned: earlier + semesterLp, earlier, total: TOTAL_ECTS };

	return { progress, ects };
};

export const actions = {
	/* Marks a module as passed or takes the mark back. */
	toggle: async ({ request, locals }) => {
		const module_id = (await request.formData()).get('module_id')?.toString() ?? '';
		const user_id = locals.user.id;

		const found = db
			.select()
			.from(moduleTable)
			.where(and(eq(moduleTable.id, module_id), eq(moduleTable.user_id, user_id)))
			.get();
		if (!found) return fail(400, { error: 'Unknown module' });

		const deleted = db
			.delete(modulePassTable)
			.where(and(eq(modulePassTable.user_id, user_id), eq(modulePassTable.module_id, module_id)))
			.returning()
			.get();

		if (!deleted) db.insert(modulePassTable).values({ user_id, module_id }).run();
	}
} satisfies Actions;
