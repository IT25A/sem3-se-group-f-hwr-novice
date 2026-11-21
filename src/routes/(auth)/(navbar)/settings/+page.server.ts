import { fail } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db } from '#lib/server/db/index.ts';
import { courseTable, userTable } from '#lib/server/db/schema.ts';
import { fetchCourseOptions } from '#lib/server/hwrical/courses.ts';
import { semesterOf } from '#lib/server/courses/semester.ts';
import { adoptCatalog } from '#lib/server/modules/personal.ts';
import { createToken } from '#lib/server/ical/token.ts';

export const load: PageServerLoad = async ({ locals, url }) => {
	const course = locals.user.course_id
		? db.select().from(courseTable).where(eq(courseTable.id, locals.user.course_id)).get()
		: undefined;

	const feed = db
		.select({
			token: userTable.ical_token,
			lessons: userTable.ical_lessons,
			privateEvents: userTable.ical_private,
			publicEvents: userTable.ical_public
		})
		.from(userTable)
		.where(eq(userTable.id, locals.user.id))
		.get();

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
			: null,
		ical: {
			url: feed?.token ? `${url.origin}/ical/${feed.token}.ics` : null,
			lessons: feed?.lessons ?? true,
			privateEvents: feed?.privateEvents ?? true,
			publicEvents: feed?.publicEvents ?? true
		}
	};
};

export const actions = {
	course: async ({ request, locals }) => {
		const formData = await request.formData();
		const value = formData.get('course')?.toString() ?? '';
		const cohort = Number(formData.get('cohort'));

		if (value === 'none') {
			db.update(userTable).set({ course_id: null }).where(eq(userTable.id, locals.user.id)).run();
			return { success: true, value, cohort };
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
		adoptCatalog(locals.user.id, course);
		return { success: true, value, cohort };
	},

	// Chooses what the calendar feed contains
	icalSources: async ({ request, locals }) => {
		const formData = await request.formData();

		db.update(userTable)
			.set({
				ical_private: formData.has('private'),
				ical_public: formData.has('public'),
				// without a course the checkbox is disabled and not sent, so keep the old value
				...(locals.user.course_id ? { ical_lessons: formData.has('lessons') } : {})
			})
			.where(eq(userTable.id, locals.user.id))
			.run();
	},

	// Creates the link of the feed. If there is one already, it is replaced by a new one
	icalToken: async ({ locals }) => {
		db.update(userTable)
			.set({ ical_token: createToken() })
			.where(eq(userTable.id, locals.user.id))
			.run();
	},

	// Turns the feed off. The old link stops working
	icalOff: async ({ locals }) => {
		db.update(userTable).set({ ical_token: null }).where(eq(userTable.id, locals.user.id)).run();
	}
} satisfies Actions;
