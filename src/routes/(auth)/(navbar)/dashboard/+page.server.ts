import type { PageServerLoad } from './$types';
import { fetchLessons } from '#lib/server/hwrical/schedule.ts';

export const load: PageServerLoad = async () => {
	try {
		const events = await fetchLessons('informatik', {
			course_part: 'kursa',
			year_part: 'semester3'
		});
		return { events, scheduleError: false };
	} catch (error) {
		console.error('Could not load the schedule', error);
		return { events: [], scheduleError: true };
	}
};
