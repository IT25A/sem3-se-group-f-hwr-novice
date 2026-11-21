import { EXAM_KINDS } from '../modules/progress.ts';
import type { loadOverview } from '../modules/overview.ts';

// Below this many LE a rating makes no sense yet
const MIN_TARGET_LE = 2;

// From this share of the target on, a module counts as on track
const ON_TRACK = 0.85;

type Lesson = { module_id: string | null; kind: string; starts_at: Date; ends_at: Date };

// Self study per module: done (focus time) against the target for today.
// The target grows evenly from the first lesson of the module until its exam,
// or else until its last lesson.
export function studyPlanOf(
	progress: ReturnType<typeof loadOverview>['progress'],
	lessons: Lesson[],
	now: Date
) {
	// nothing to show before the first completed focus session of a module
	if (!progress.some((item) => item.focusMinutes > 0)) return [];

	return progress
		.filter((item) => item.includedInTotal && !item.passed && item.module.self_study_le > 0)
		.map((item) => {
			const own = lessons.filter((lesson) => lesson.module_id === item.module.id);
			const teaching = own.filter((lesson) => !EXAM_KINDS.includes(lesson.kind));
			const exams = own.filter((lesson) => EXAM_KINDS.includes(lesson.kind));

			const from =
				teaching.length > 0
					? Math.min(...teaching.map((lesson) => lesson.starts_at.getTime()))
					: null;
			const until =
				exams.length > 0
					? Math.min(...exams.map((lesson) => lesson.starts_at.getTime()))
					: teaching.length > 0
						? Math.max(...teaching.map((lesson) => lesson.ends_at.getTime()))
						: null;

			const total = item.module.self_study_le;
			const done = item.selfStudy.done;

			let target: number | null = null;
			if (from !== null && until !== null && until > from) {
				const share = Math.min(1, Math.max(0, (now.getTime() - from) / (until - from)));
				if (total * share >= MIN_TARGET_LE) target = total * share;
			}

			return {
				id: item.module.id,
				name: item.module.name,
				done,
				total,
				target,
				status:
					target === null
						? null
						: done >= target * ON_TRACK
							? ('on-track' as const)
							: ('behind' as const),
				gap: target === null ? 0 : target - done
			};
		})
		.sort((a, b) => b.gap - a.gap); // the biggest deficit first
}
