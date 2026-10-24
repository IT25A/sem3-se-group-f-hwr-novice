import { COURSES_URL, type CourseResponse } from '#lib/server/hwrical/hwrical';

export async function fetchCourses(): Promise<CourseResponse> {
	return await fetch(COURSES_URL()).then((res) => res.json());
}

export async function fetchCoursesNames(): Promise<string[]> {
	return Object.keys((await fetchCourses()).courses);
}
