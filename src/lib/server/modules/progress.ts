import type { Module, StoredLesson } from '../db/schema.ts';

const LE_MINUTES = 45;
const EXAM_KINDS = ['Klausur', 'Prüfung'];

const toLe = (minutes: number) => minutes / LE_MINUTES;
const lessonMinutes = (lesson: Pick<StoredLesson, 'starts_at' | 'ends_at'>) =>
	(lesson.ends_at.getTime() - lesson.starts_at.getTime()) / 60_000;

export function calculateProgress(
	modules: Module[],
	lessons: Pick<StoredLesson, 'module_id' | 'kind' | 'starts_at' | 'ends_at'>[],
	selfStudyMinutes: Map<string, number>,
	now: Date
) {
	return modules.map((module) => {
		const own = lessons.filter((lesson) => lesson.module_id === module.id);
		const teaching = own.filter((lesson) => !EXAM_KINDS.includes(lesson.kind));
		const exams = own.filter((lesson) => EXAM_KINDS.includes(lesson.kind));

		const le = (list: typeof own) =>
			list.reduce((sum, lesson) => sum + toLe(lessonMinutes(lesson)), 0);

		const presence = {
			done: le(teaching.filter((lesson) => lesson.ends_at <= now)),
			total: le(teaching)
		};
		const exam = {
			taken: exams.some((lesson) => lesson.ends_at <= now),
			total: module.exam_le
		};
		const selfStudy = {
			done: Math.min(module.self_study_le, toLe(selfStudyMinutes.get(module.id) ?? 0)),
			total: module.self_study_le
		};

		const total = presence.total + exam.total + selfStudy.total;
		const done = presence.done + (exam.taken ? exam.total : 0) + selfStudy.done;

		return { module, presence, exam, selfStudy, total, done };
	});
}
