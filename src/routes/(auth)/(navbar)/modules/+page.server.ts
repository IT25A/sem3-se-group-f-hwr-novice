import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { eq, and } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import {
	lessonTable,
	moduleTable,
	pomodoroTable,
	modulePassTable,
	lessonAssignmentTable
} from '#lib/server/db/schema.ts';
import { loadOverview, unassignedOf } from '#lib/server/modules/overview.ts';

export const load: PageServerLoad = async ({ locals }) => {
	const { now, modules, assignments, lessons, progress, ects, header } = loadOverview(locals.user);

	const unassigned = unassignedOf(lessons, now);

	const manual = assignments.map((assignment) => ({
		title: assignment.title,
		module: modules.find((module) => module.id === assignment.module_id)?.name ?? ''
	}));

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

		return { success: true };
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
