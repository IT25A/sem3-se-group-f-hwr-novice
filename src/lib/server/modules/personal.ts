import { db } from '../db/index.ts';
import { type Course, type Module, moduleTable } from '../db/schema.ts';
import { semesterOf } from '../courses/semester.ts';
import { catalogFor } from './catalog.ts';

// Copies the catalog modules of the course's current semester into the modules
// of the user if they don't exist yet (same code)
export function adoptCatalog(userId: string, course: Course) {
	const catalog = catalogFor(course.study, course.cohort, semesterOf(course.cohort));
	if (catalog.length === 0) return;

	db.insert(moduleTable)
		.values(catalog.map((module) => ({ ...module, user_id: userId })))
		.onConflictDoNothing()
		.run();
}

// Adds the module of the user to each lesson (the module with the same code)
export function linkLessons<T extends { code: string | null }>(
	lessons: T[],
	modules: Pick<Module, 'id' | 'code'>[]
) {
	const byCode = new Map<string, string>();
	for (const module of modules) if (module.code) byCode.set(module.code, module.id);

	return lessons.map((lesson) => ({
		...lesson,
		module_id: lesson.code ? (byCode.get(lesson.code) ?? null) : null
	}));
}
