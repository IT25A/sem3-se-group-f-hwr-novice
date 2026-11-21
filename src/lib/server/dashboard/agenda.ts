import { eventsOf, lessonsOf, sourceOf, titleOf } from '../calendar/events.ts';
import { EXAM_KINDS } from '../modules/progress.ts';

export const AGENDA_DAYS = 14;

export type AgendaKind = 'lesson' | 'exam' | 'private' | 'public';

export type Item = {
	id: string;
	kind: AgendaKind;
	title: string;
	start: Date;
	end: Date | null; // null: takes the whole day
	location: string;
	lecturer: string;
	online: boolean;
	travel: boolean; // time to get to the place, not a lesson itself
};

// An item as listed on one day. The time column differs from day to day for long items.
export type AgendaEntry = Item & { time: string };

export type AgendaDay = { key: string; date: Date; entries: AgendaEntry[] };

type Viewer = { id: string; course_id: string | null };

const clock = new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit' });

const lecturerOf = (description: string) => /^Dozent: (.+)$/m.exec(description)?.[1] ?? '';

// "Kurs B - ONLINE" is a note of the lesson, "ONLINE" can also be the place
const isOnline = (location: string, description: string) =>
	/online/i.test(location) || /^Anmerkung:.*online/im.test(description);

const startOfDay = (date: Date, offset = 0) =>
	new Date(date.getFullYear(), date.getMonth(), date.getDate() + offset);

const dayKey = (date: Date) =>
	`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

// Does the item take place on the day from..to?
function touches(item: Item, from: Date, to: Date) {
	if (!item.end || item.end <= item.start) return item.start >= from && item.start < to;
	return item.start < to && item.end > from;
}

// What the time column says on the day from..to.
function timeOn(item: Item, from: Date, to: Date) {
	if (!item.end) return 'ganztägig';

	const starts = item.start >= from;
	const ends = item.end <= to;
	if (starts && ends) {
		return item.end > item.start
			? `${clock.format(item.start)}–${clock.format(item.end)}`
			: clock.format(item.start);
	}
	if (starts) return `ab ${clock.format(item.start)}`;
	if (ends) return `bis ${clock.format(item.end)}`;
	return 'ganztägig';
}

// Lessons, exams and events of the user for the next days, grouped by day.
export function agendaOf(user: Viewer, now = new Date()) {
	const items: Item[] = [
		...lessonsOf(user).map((lesson): Item => ({
			id: lesson.key,
			kind: EXAM_KINDS.includes(lesson.kind) ? 'exam' : 'lesson',
			title: lesson.name,
			start: lesson.start,
			end: lesson.end,
			location: lesson.location,
			lecturer: lecturerOf(lesson.description),
			online: isOnline(lesson.location, lesson.description),
			travel: /wegezeit/i.test(lesson.name)
		})),
		...eventsOf(user).map((event): Item => ({
			id: event.id,
			kind: sourceOf(event),
			title: titleOf(event),
			start: event.start,
			end: event.end,
			location: event.location,
			lecturer: '',
			online: isOnline(event.location, ''),
			travel: false
		}))
	];

	const today = startOfDay(now);

	const days: AgendaDay[] = Array.from({ length: AGENDA_DAYS }, (_, index) => {
		const from = startOfDay(today, index);
		const to = startOfDay(today, index + 1);

		// all-day items first, then by the time they start on this day
		const order = (entry: AgendaEntry) =>
			entry.end ? Math.max(entry.start.getTime(), from.getTime()) : -1;

		const entries = items
			.filter((item) => touches(item, from, to))
			.map((item) => ({ ...item, time: timeOn(item, from, to) }))
			.sort((a, b) => order(a) - order(b) || a.title.localeCompare(b.title));

		return { key: dayKey(from), date: from, entries };
	});

	// The first item after these days, for when nothing is left in them (holidays).
	const horizon = startOfDay(today, AGENDA_DAYS);
	const later =
		items
			.filter((item) => item.end && !item.travel && item.start >= horizon)
			.sort((a, b) => a.start.getTime() - b.start.getTime())[0] ?? null;

	return { days, later };
}
