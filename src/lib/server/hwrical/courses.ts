import * as HWRICal from '#lib/server/hwrical/hwrical.ts';

export async function fetchCourses(): Promise<HWRICal.CourseResponse> {
    return await fetch(HWRICal.COURSES_URL()).then(res => res.json())
}

export async function fetchCoursesNames(): Promise<string[]> {
		const courses = await fetchCourses();
		return Object.keys(courses.courses).map(it => {
			if (it[0] === it[0].toLowerCase()) {
				return it[0].toUpperCase() + it.slice(1);
			}
			return it;
		});
}