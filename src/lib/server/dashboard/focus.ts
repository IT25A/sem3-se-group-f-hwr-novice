import { and, eq, gte, isNotNull } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { moduleTable, pomodoroTable } from '../db/schema.ts';

const DAY = 86_400_000;

// Monday 00:00 of the week the date is in
function mondayOf(date: Date) {
	const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
	monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
	return monday;
}

// Completed work sessions of this week, per day (Monday first), compared to the week before.
export function focusOf(user: { id: string }, now = new Date()) {
	const monday = mondayOf(now);
	const lastMonday = new Date(monday.getTime() - 7 * DAY);
	// last week is only counted up to the same moment, so the comparison is fair
	const cutoff = new Date(now.getTime() - 7 * DAY);

	const sessions = db
		.select()
		.from(pomodoroTable)
		.where(
			and(
				eq(pomodoroTable.user_id, user.id),
				eq(pomodoroTable.type, 'work'),
				eq(pomodoroTable.status, 'completed'),
				isNotNull(pomodoroTable.ended_at),
				gte(pomodoroTable.ended_at, lastMonday)
			)
		)
		.all();

	const days = [0, 0, 0, 0, 0, 0, 0];
	const perModule = new Map<string, number>();
	let count = 0;
	let last = 0;

	for (const session of sessions) {
		const ended = session.ended_at;
		if (!ended) continue;

		if (ended < monday) {
			if (ended <= cutoff) last += session.planned_duration;
			continue;
		}

		days[(ended.getDay() + 6) % 7] += session.planned_duration;
		count++;
		if (session.module_id) {
			perModule.set(
				session.module_id,
				(perModule.get(session.module_id) ?? 0) + session.planned_duration
			);
		}
	}

	const best = [...perModule.entries()].sort((a, b) => b[1] - a[1])[0];
	const name = best
		? db
				.select({ name: moduleTable.name })
				.from(moduleTable)
				.where(eq(moduleTable.id, best[0]))
				.get()?.name
		: undefined;

	return {
		days,
		minutes: days.reduce((sum, minutes) => sum + minutes, 0),
		count,
		last,
		top: best && name ? { name, minutes: best[1] } : null
	};
}
