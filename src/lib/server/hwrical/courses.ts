import { COURSES_URL, type CourseResponse } from './hwrical.ts';

const TIMEOUT_MS = 5000;
// The list rarely ever changes. It is used as it as for an hour. If the
// service does not anser, the last list is used for up to a week.
const FRESH_MS = 60 * 60 * 1000;
const STALE_MS = 7 * 24 * 60 * 60 * 1000;

export async function fetchCourses(): Promise<CourseResponse> {
	const res = await fetch(COURSES_URL(), { signal: AbortSignal.timeout(TIMEOUT_MS) });
	if (!res.ok) throw new Error(`Course request failed with status ${res.status}`);
	return await res.json();
}

export async function fetchCoursesNames(): Promise<string[]> {
	return Object.keys((await fetchCourses()).courses);
}

// all selectable sources as "study/course_part", e.g. "informatik/kursa"
async function loadCourseOptions(): Promise<string[]> {
	const { courses } = await fetchCourses();
	const options = new Set<string>();
	for (const [study, entries] of Object.entries(courses)) {
		for (const entry of entries) options.add(`${study}/${entry.course_part}`);
	}
	return [...options].sort();
}

let cache: { options: string[]; at: number } | null = null;
let pending: Promise<string[]> | null = null;

export async function fetchCourseOptions(): Promise<string[]> {
	if (cache && Date.now() - cache.at < FRESH_MS) return cache.options;

	// requests that come in at the same time share one call
	pending ??= loadCourseOptions()
		.then((options) => {
			cache = { options, at: Date.now() };
			return options;
		})
		.finally(() => (pending = null));

	try {
		return await pending;
	} catch (error) {
		if (cache && Date.now() - cache.at < STALE_MS) {
			console.error('Using the cached course list', error);
			return cache.options;
		}
		throw error;
	}
}
