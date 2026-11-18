import { eq } from 'drizzle-orm';
import { db } from '../db/index.ts';
import {
	type Course,
	type Module,
	moduleTable,
	lessonAssignmentTable,
	type LessonAssignment
} from '../db/schema.ts';
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

export function assignmentsOf(userId: string) {
	return db
		.select()
		.from(lessonAssignmentTable)
		.where(eq(lessonAssignmentTable.user_id, userId))
		.all();
}

// Adds the module of the user to each lesson A manual assignment by title takes priority
// over the module with the same code
export function linkLessons<T extends { code: string | null; title: string }>(
	lessons: T[],
	modules: Pick<Module, 'id' | 'code'>[],
	assignments: Pick<LessonAssignment, 'title' | 'module_id'>[] = []
) {
	const byCode = new Map<string, string>();
	for (const module of modules) if (module.code) byCode.set(module.code, module.id);
	const byTitle = new Map(
		assignments.map((assignment) => [assignment.title, assignment.module_id])
	);

	return lessons.map((lesson) => ({
		...lesson,
		module_id: byTitle.get(lesson.title) ?? (lesson.code ? (byCode.get(lesson.code) ?? null) : null)
	}));
}
