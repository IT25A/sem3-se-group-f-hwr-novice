import { COURSES_URL, type CourseResponse } from './hwrical.ts';

export async function fetchCourses(): Promise<CourseResponse> {
	const res = await fetch(COURSES_URL());
	if (!res.ok) throw new Error(`Course request failed with status ${res.status}`);
	return await res.json();
}

export async function fetchCoursesNames(): Promise<string[]> {
	return Object.keys((await fetchCourses()).courses);
}

// all selectable sources as "study/course_part", e.g. "informatik/kursa"
export async function fetchCourseOptions(): Promise<string[]> {
	const { courses } = await fetchCourses();
	const options = new Set<string>();
	for (const [study, entries] of Object.entries(courses)) {
		for (const entry of entries) options.add(`${study}/${entry.course_part}`);
	}
	return [...options].sort();
}
