import { EXAM_KINDS } from '../modules/progress.ts';

const DAY = 86_400_000;

// Lesson days that are further apart than this belong to different phases
const GAP_DAYS = 7;

// A theory phase at least this long opens a new semester
const OPENING_DAYS = 6 * 7;

// Length of a semester as long as the next one is not in the timetable yet
const SEMESTER_DAYS = 24 * 7;

type Lesson = { kind: string; title: string; starts_at: Date };

// Semester and theory phases, found by the gaps between lesson days of the whole timetable archive.
export function timelineOf(lessons: Lesson[], now: Date) {
	const days = [
		...new Set(
			lessons.map((lesson) => {
				const date = lesson.starts_at;
				return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
			})
		)
	].sort((a, b) => a - b);

	const ranges: [number, number][] = [];
	for (const day of days) {
		const range = ranges.at(-1);
		if (range && Math.round((day - range[1]) / DAY) <= GAP_DAYS) range[1] = day;
		else ranges.push([day, day]);
	}

	// "to" is the midnight after the last lesson day
	const phases = ranges.map(([first, last]) => {
		const to = new Date(last);
		to.setDate(to.getDate() + 1);
		return { from: new Date(first), to };
	});
	if (phases.length === 0) return null;

	const long = phases.filter(
		(phase) => (phase.to.getTime() - phase.from.getTime()) / DAY >= OPENING_DAYS
	);
	const openings = long.length > 0 ? long : phases.slice(0, 1);

	// the latest opening phase that has begun. Before the first one, that one.
	let opening = 0;
	openings.forEach((phase, index) => {
		if (phase.from <= now) opening = index;
	});

	const start = openings[opening].from;
	const following = openings[opening + 1];
	const lastKnown = phases[phases.length - 1].to;

	const estimated = new Date(start);
	estimated.setDate(estimated.getDate() + SEMESTER_DAYS);
	const end = following
		? following.from
		: new Date(Math.max(estimated.getTime(), lastKnown.getTime(), now.getTime() + 7 * DAY));

	const inSemester = (date: Date) => date >= start && date < end;

	const exams = lessons
		.filter((lesson) => EXAM_KINDS.includes(lesson.kind) && inSemester(lesson.starts_at))
		.map((lesson) => ({ at: lesson.starts_at, title: lesson.title }));

	const index = phases.findIndex((phase) => phase.to > now);
	const phase = phases[index];

	const current =
		index === -1
			? { kind: 'open' as const, until: null }
			: phase.from <= now
				? { kind: 'theory' as const, until: phase.to }
				: { kind: 'practice' as const, until: phase.from };

	const next =
		current.kind === 'theory'
			? (phases[index + 1] ?? null)
			: current.kind === 'practice'
				? phase
				: null;

	return {
		start,
		end,
		week: now >= start ? Math.floor((now.getTime() - start.getTime()) / (7 * DAY)) + 1 : null,
		phases: phases.filter((item) => inSemester(item.from)),
		exams,
		current,
		next,
		knownUntil: lastKnown
	};
}
