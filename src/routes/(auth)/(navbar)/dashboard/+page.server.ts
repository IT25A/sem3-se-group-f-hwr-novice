import type { PageServerLoad } from './$types';
import { agendaOf } from '#lib/server/dashboard/agenda.ts';
import { syncCourseOf } from '#lib/server/lessons/sync.ts';

export const load: PageServerLoad = async ({ locals }) => {
	const scheduleError = !(await syncCourseOf(locals.user));

	return {
		scheduleError,
		hasCourse: Boolean(locals.user.course_id),
		agenda: agendaOf(locals.user)
	};
};
