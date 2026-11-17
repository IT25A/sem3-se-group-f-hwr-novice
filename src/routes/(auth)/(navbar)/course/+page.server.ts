import { fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db } from '#lib/server/db/index.ts';
import { courseTable, userTable } from '#lib/server/db/schema.ts';
import { fetchCourseOptions } from '#lib/server/hwrical/courses.ts';
import { semesterOf } from '#lib/server/courses/semester.ts';

export const load: PageServerLoad = async ({ locals }) => {
	const course = locals.user.course_id
		? db.select().from(courseTable).where(eq(courseTable.id, locals.user.course_id)).get()
		: undefined;

	let options: string[] = [];
	let optionsError = false;
	try {
		options = await fetchCourseOptions();
	} catch (error) {
		console.error('Could not load the course list', error);
		optionsError = true;
	}

	return {
		options,
		optionsError,
		year: new Date().getFullYear(),
		current: course
			? {
					value: `${course.study}/${course.course_part}`,
					cohort: course.cohort,
					semester: semesterOf(course.cohort)
				}
			: null
	};
};

export const actions = {
	save: async ({ request, locals }) => {
		const formData = await request.formData();
		const value = formData.get('course')?.toString() ?? '';
		const cohort = Number(formData.get('cohort'));

		if (value === 'none') {
			db.update(userTable).set({ course_id: null }).where(eq(userTable.id, locals.user.id)).run();
			redirect(303, '/dashboard');
		}

		const [study, course_part] = value.split('/');
		const year = new Date().getFullYear();
		if (!study || !course_part || !Number.isInteger(cohort) || cohort < 2020 || cohort > year) {
			return fail(400, {
				error: 'Bitte wähle einen Kurs und einen gültigen Studienbeginn.',
				value,
				cohort
			});
		}

		try {
			if (!(await fetchCourseOptions()).includes(value)) {
				return fail(400, { error: 'Diesen Kurs gibt es nicht.', value, cohort });
			}
		} catch {
			return fail(503, {
				error: 'Die Kursliste konnte gerade nicht geladen werden. Bitte versuche es später erneut.',
				value,
				cohort
			});
		}

		const course =
			db
				.select()
				.from(courseTable)
				.where(
					and(
						eq(courseTable.study, study),
						eq(courseTable.course_part, course_part),
						eq(courseTable.cohort, cohort)
					)
				)
				.get() ?? db.insert(courseTable).values({ study, course_part, cohort }).returning().get();

		db.update(userTable)
			.set({ course_id: course.id })
			.where(eq(userTable.id, locals.user.id))
			.run();
		redirect(303, '/dashboard');
	}
} satisfies Actions;
