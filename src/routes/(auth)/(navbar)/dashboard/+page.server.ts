import type { PageServerLoad } from './$types';
import { fetchLessons } from '#lib/server/hwrical/schedule.ts';

export const load: PageServerLoad = async () => {
	return {
		events: await fetchLessons('informatik', { course_part: 'kursa', year_part: 'semester3' })
	};
};
