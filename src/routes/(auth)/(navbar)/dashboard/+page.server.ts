import type { PageServerLoad } from './$types';
import { agendaOf } from '#lib/server/dashboard/agenda.ts';
import { focusOf } from '#lib/server/dashboard/focus.ts';
import { syncCourseOf } from '#lib/server/lessons/sync.ts';
import { loadOverview, unassignedOf } from '#lib/server/modules/overview.ts';

export const load: PageServerLoad = async ({ locals }) => {
	const scheduleError = !(await syncCourseOf(locals.user));
	const { now, lessons, progress, ects, header } = loadOverview(locals.user);

	const counted = progress.filter((item) => item.includedInTotal);

	// the next exams of modules that are not passed yet
	const exams = progress
		.flatMap((item) =>
			item.examAt && !item.passed
				? [{ id: item.module.id, name: item.module.name, at: item.examAt }]
				: []
		)
		.sort((a, b) => a.at.getTime() - b.at.getTime())
		.slice(0, 3);

	return {
		scheduleError,
		hasCourse: Boolean(locals.user.course_id),
		agenda: agendaOf(locals.user),
		ects,
		semester: header?.semester ?? null,
		modules: { passed: counted.filter((item) => item.passed).length, total: counted.length },
		exams,
		focus: focusOf(locals.user),
		unassigned: unassignedOf(lessons, now).length
	};
};
