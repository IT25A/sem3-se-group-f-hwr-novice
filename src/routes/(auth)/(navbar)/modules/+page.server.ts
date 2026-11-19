import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { asc, eq, and, isNotNull } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import {
	lessonTable,
	moduleTable,
	pomodoroTable,
	modulePassTable,
	courseTable,
	lessonAssignmentTable
} from '#lib/server/db/schema.ts';
import { calculateProgress, EXAM_KINDS } from '#lib/server/modules/progress.ts';
import {
	CATALOGS,
	catalogFor,
	ECTS_PER_SEMESTER,
	TOTAL_ECTS
} from '#lib/server/modules/catalog.ts';
import { assignmentsOf, linkLessons } from '#lib/server/modules/personal.ts';
import { semesterOf } from '#lib/server/courses/semester.ts';
import { courseName } from '#lib/courses/label.ts';

const NO_MODULE = /wegezeit/i;

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

	const assignments = assignmentsOf(locals.user.id);

	const lessons = locals.user.course_id
		? linkLessons(
				db.select().from(lessonTable).where(eq(lessonTable.course_id, locals.user.course_id)).all(),
				modules,
				assignments
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
		if (!session.module_id) continue;
		selfStudyMinutes.set(
			session.module_id,
			(selfStudyMinutes.get(session.module_id) ?? 0) + session.planned_duration
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

	const now = new Date();

	const upcoming = lessons
		.filter((lesson) => lesson.ends_at > now)
		.sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime());

	const progress = calculateProgress(modules, lessons, selfStudyMinutes, now).map((item) => {
		const own = upcoming.filter((lesson) => lesson.module_id === item.module.id);
		return {
			...item,
			focusMinutes: selfStudyMinutes.get(item.module.id) ?? 0,
			passed: passedIds.has(item.module.id),
			next: own.find((lesson) => !EXAM_KINDS.includes(lesson.kind))?.starts_at ?? null,
			examAt: own.find((lesson) => EXAM_KINDS.includes(lesson.kind))?.starts_at ?? null
		};
	});

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

	// lessons without a module, grouped by title.
	const groups = new Map<string, { title: string; count: number; next: Date | null }>();
	for (const lesson of lessons) {
		if (lesson.module_id || NO_MODULE.test(lesson.title)) continue;
		const group = groups.get(lesson.title) ?? { title: lesson.title, count: 0, next: null };
		group.count++;
		if (lesson.starts_at > now && (!group.next || lesson.starts_at < group.next)) {
			group.next = lesson.starts_at;
		}
		groups.set(lesson.title, group);
	}
	const unassigned = [...groups.values()].sort((a, b) => a.title.localeCompare(b.title));

	const manual = assignments.map((assignment) => ({
		title: assignment.title,
		module: modules.find((module) => module.id === assignment.module_id)?.name ?? ''
	}));

	const semester = course ? semesterOf(course.cohort) : 0;
	const header = course
		? {
				course: courseName(`${course.study}/${course.course_part}`),
				cohort: course.cohort,
				semester: semester >= 1 && semester <= 6 ? semester : null
			}
		: null;

	return { progress, ects, unassigned, manual, header };
};

// Reads a whole number from a form filed. Empty means 0, anything else invalid returns NaN.
function whole(value: FormDataEntryValue | null) {
	const text = value?.toString().trim() ?? '';
	return text === '' ? 0 : Number(text);
}

export const actions = {
	/* Assigns all lessons with a title to one of the user's modules. */
	assign: async ({ request, locals }) => {
		const formData = await request.formData();
		const title = formData.get('title')?.toString() ?? '';
		const module_id = formData.get('module_id')?.toString() ?? '';
		const user_id = locals.user.id;

		const found = db
			.select()
			.from(moduleTable)
			.where(and(eq(moduleTable.id, module_id), eq(moduleTable.user_id, user_id)))
			.get();
		if (!found) return fail(400, { error: 'Unknown module' });

		// title must belong to a lesson of the user's own course.
		const lesson = locals.user.course_id
			? db
					.select()
					.from(lessonTable)
					.where(
						and(eq(lessonTable.course_id, locals.user.course_id), eq(lessonTable.title, title))
					)
					.get()
			: undefined;
		if (!lesson) return fail(400, { error: 'Unknown lesson' });

		db.insert(lessonAssignmentTable)
			.values({ user_id, title, module_id })
			.onConflictDoUpdate({
				target: [lessonAssignmentTable.user_id, lessonAssignmentTable.title],
				set: { module_id }
			})
			.run();
	},
	/* Removes a manual assignment */
	unassign: async ({ request, locals }) => {
		const title = (await request.formData()).get('title')?.toString() ?? '';
		db.delete(lessonAssignmentTable)
			.where(
				and(
					eq(lessonAssignmentTable.user_id, locals.user.id),
					eq(lessonAssignmentTable.title, title)
				)
			)
			.run();
	},
	/* Creates an own module. */
	create: async ({ request, locals }) => {
		const formData = await request.formData();
		const name = formData.get('name')?.toString().trim() ?? '';
		const code = formData.get('code')?.toString().trim().toUpperCase() || null;
		const lp = whole(formData.get('lp'));
		const presence_le = whole(formData.get('presence_le'));
		const self_study_le = whole(formData.get('self_study_le'));

		if (!name || name.length > 100) {
			return fail(400, { error: 'Bitte einen Namen angeben (max. 100 Zeichen)' });
		}
		if (code && code.length > 20) {
			return fail(400, { error: 'Der Code ist zu lang (max. 20 Zeichen)' });
		}
		if (![lp, presence_le, self_study_le].every((n) => Number.isInteger(n) && n >= 0)) {
			return fail(400, { error: 'LP und LE müssen ganze Zahlen ab 0 sein.' });
		}
		if (lp > 30) {
			return fail(400, { error: 'Ein Modul hat höchstens 30 LP.' });
		}

		if (code) {
			const existing = db
				.select()
				.from(moduleTable)
				.where(and(eq(moduleTable.user_id, locals.user.id), eq(moduleTable.code, code)))
				.get();
			if (existing) return fail(400, { error: `Ein Modul mit dem Code ${code} gibt es bereits.` });
		}

		db.insert(moduleTable)
			.values({ user_id: locals.user.id, code, name, lp, presence_le, self_study_le })
			.run();
	},
	/* Deletes an own module. Its pomodoro sessions are kept but lose their module association. */
	remove: async ({ request, locals }) => {
		const module_id = (await request.formData()).get('module_id')?.toString() ?? '';

		const found = db
			.select()
			.from(moduleTable)
			.where(and(eq(moduleTable.id, module_id), eq(moduleTable.user_id, locals.user.id)))
			.get();
		if (!found) return fail(400, { error: 'Unknown module' });

		db.transaction((tx) => {
			tx.update(pomodoroTable)
				.set({ module_id: null })
				.where(eq(pomodoroTable.module_id, module_id))
				.run();
			tx.delete(modulePassTable).where(eq(modulePassTable.module_id, module_id)).run();
			tx.delete(moduleTable).where(eq(moduleTable.id, module_id)).run();
		});
	},
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
