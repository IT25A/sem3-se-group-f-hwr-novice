import { and, asc, eq, isNotNull } from 'drizzle-orm';
import { db } from '../db/index.ts';
import {
	courseTable,
	lessonTable,
	modulePassTable,
	moduleTable,
	pomodoroTable
} from '../db/schema.ts';
import { semesterOf } from '../courses/semester.ts';
import { courseName } from '#lib/courses/label.ts';
import { CATALOGS, catalogFor, ECTS_PER_SEMESTER, TOTAL_ECTS } from './catalog.ts';
import { assignmentsOf, linkLessons } from './personal.ts';
import { calculateProgress, EXAM_KINDS } from './progress.ts';

type Owner = { id: string; course_id: string | null };

// Everything the modules page and the dashboard show about the progress of a user.
export function loadOverview(user: Owner) {
	const modules = db
		.select()
		.from(moduleTable)
		.where(eq(moduleTable.user_id, user.id))
		.orderBy(asc(moduleTable.name))
		.all();

	const course = user.course_id
		? db.select().from(courseTable).where(eq(courseTable.id, user.course_id)).get()
		: undefined;

	// semesters before the current one are assumed to be passed. Without a course nothing is.
	const earlier = course
		? ECTS_PER_SEMESTER * Math.min(Math.max(semesterOf(course.cohort) - 1, 0), 6)
		: 0;

	const assignments = assignmentsOf(user.id);

	const lessons = user.course_id
		? linkLessons(
				db.select().from(lessonTable).where(eq(lessonTable.course_id, user.course_id)).all(),
				modules,
				assignments
			)
		: [];

	const sessions = db
		.select()
		.from(pomodoroTable)
		.where(
			and(
				eq(pomodoroTable.user_id, user.id),
				eq(pomodoroTable.type, 'work'),
				eq(pomodoroTable.status, 'completed'),
				isNotNull(pomodoroTable.module_id),
				isNotNull(pomodoroTable.ended_at)
			)
		)
		.all();

	// Minutes of completed work sessions per module
	const selfStudyMinutes = new Map<string, number>();
	for (const session of sessions) {
		if (!session.module_id) continue;
		selfStudyMinutes.set(
			session.module_id,
			(selfStudyMinutes.get(session.module_id) ?? 0) + session.planned_duration
		);
	}

	const passedIds = new Set(
		db
			.select({ module_id: modulePassTable.module_id })
			.from(modulePassTable)
			.where(eq(modulePassTable.user_id, user.id))
			.all()
			.map((row) => row.module_id)
	);

	const now = new Date();

	const upcoming = lessons
		.filter((lesson) => lesson.ends_at > now)
		.sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime());

	const currentCodes = new Set(
		course
			? catalogFor(course.study, course.cohort, semesterOf(course.cohort)).map(
					(module) => module.code
				)
			: []
	);

	const catalogCodes = new Set(
		Object.values(CATALOGS)
			.flat()
			.map((module) => module.code)
	);

	const countsForSemester = (code: string | null) =>
		!course || !code || !catalogCodes.has(code) || currentCodes.has(code);

	const progress = calculateProgress(modules, lessons, selfStudyMinutes, now).map((item) => {
		const own = upcoming.filter((lesson) => lesson.module_id === item.module.id);
		return {
			...item,
			focusMinutes: selfStudyMinutes.get(item.module.id) ?? 0,
			passed: passedIds.has(item.module.id),
			includedInTotal: countsForSemester(item.module.code),
			next: own.find((lesson) => !EXAM_KINDS.includes(lesson.kind))?.starts_at ?? null,
			examAt: own.find((lesson) => EXAM_KINDS.includes(lesson.kind))?.starts_at ?? null
		};
	});

	const semesterLp = progress
		.filter((item) => item.passed && item.includedInTotal)
		.reduce((sum, item) => sum + item.module.lp, 0);
	const ects = { earned: earlier + semesterLp, earlier, total: TOTAL_ECTS };

	const semester = course ? semesterOf(course.cohort) : 0;
	const header = course
		? {
				course: courseName(`${course.study}/${course.course_part}`),
				cohort: course.cohort,
				semester: semester >= 1 && semester <= 6 ? semester : null
			}
		: null;

	return { now, course, modules, assignments, lessons, progress, ects, header };
}

const NO_MODULE = /wegezeit/i;

// Lessons without a module, grouped by title.
export function unassignedOf(
	lessons: { module_id: string | null; title: string; starts_at: Date }[],
	now: Date
) {
	const groups = new Map<string, { title: string; count: number; next: Date | null }>();
	for (const lesson of lessons) {
		if (lesson.module_id || NO_MODULE.test(lesson.title)) continue;
		const group = groups.get(lesson.title) ?? { title: lesson.title, count: 0, next: null };
		group.count++;
		if (lesson.starts_at > now && (!group.next || lesson.starts_at < group.next)) {
			group.next = lesson.starts_at;
		}
		groups.set(lesson.title, group);
	}
	return [...groups.values()].sort((a, b) => a.title.localeCompare(b.title));
}
