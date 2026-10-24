import * as HWRICal from '#lib/server/hwrical/hwrical.ts';

export async function fetchCourses(): Promise<HWRICal.CourseResponse> {
	return await fetch(HWRICal.COURSES_URL()).then((res) => res.json());
}

export async function fetchCoursesNames(): Promise<string[]> {
	return Object.keys((await fetchCourses()).courses);
}
