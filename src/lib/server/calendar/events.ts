import { and, asc, eq, or } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { eventTable, lessonTable, moduleTable, userTable } from '../db/schema.ts';
import { assignmentsOf, linkLessons } from '../modules/personal.ts';

const KIND_NAMES: Record<string, string> = {
	SU: 'Seminaristischer Unterricht',
	PÜ: 'Praktische Übung',
	PCÜ: 'Seminar am PC',
	PT: 'Praxistransfer',
	SI: 'Seminaristischer Intensivunterricht'
};

type Viewer = { id: string; course_id: string | null };

// The lessons of the user's course, with the module of the user in the description.
export function lessonsOf(user: Viewer) {
	if (!user.course_id) return [];

	const modules = db.select().from(moduleTable).where(eq(moduleTable.user_id, user.id)).all();
	const modulesById = new Map(modules.map((module) => [module.id, module]));

	const lessons = linkLessons(
		db
			.select()
			.from(lessonTable)
			.where(eq(lessonTable.course_id, user.course_id))
			.orderBy(asc(lessonTable.starts_at))
			.all(),
		modules,
		assignmentsOf(user.id)
	);

	return lessons.map((lesson) => {
		const module = lesson.module_id ? modulesById.get(lesson.module_id) : undefined;
		return {
			key: lesson.key,
			title: lesson.code ? `${lesson.code} ${lesson.title}` : lesson.title,
			start: lesson.starts_at,
			end: lesson.ends_at,
			location: lesson.location,
			description: [
				module && `Modul: ${module.name}`,
				lesson.kind && `Art: ${KIND_NAMES[lesson.kind] ?? lesson.kind}`,
				lesson.description
			]
				.filter(Boolean)
				.join('\n'),
			exam: lesson.kind === 'Klausur'
		};
	});
}

// Events the user may see: their own private ones, the public ones of their course and the global ones.
export function eventsOf(user: Viewer) {
	return db
		.select({ event: eventTable })
		.from(eventTable)
		.innerJoin(userTable, eq(eventTable.user_id, userTable.id))
		.where(
			or(
				and(eq(eventTable.type, 'private'), eq(eventTable.user_id, user.id)),
				and(
					eq(eventTable.type, 'public'),
					user.course_id ? eq(userTable.course_id, user.course_id) : eq(userTable.id, '')
				),
				eq(eventTable.type, 'global')
			)
		)
		.all()
		.map((row) => row.event);
}

type EventLike = { type: string | null; title: string };

// Which of the calendar sources an event belongs to (global events are listed as public).
export const sourceOf = (event: EventLike) => (event.type === 'private' ? 'private' : 'public');

export const titleOf = (event: EventLike) =>
	(event.type === 'global' ? 'AStA: ' : '') + event.title;
