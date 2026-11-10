import type { Lesson } from '../hwrical/hwrical.ts';

export function parseLesson(lesson: Pick<Lesson, 'title' | 'description'>) {
	const fields = new Map<string, string>();
	for (const line of (lesson.description ?? '').split(/\r?\n/)) {
		const index = line.indexOf(':');
		const value = line.slice(index + 1).trim();
		if (index > 0 && value !== '-') fields.set(line.slice(0, index).trim(), value);
	}

	const subject = fields.get('Veranstaltung') ?? lesson.title;
	const match = /^(IT\d{4})\s*-\s*(.*)$/.exec(subject);

	const pause = /(\d+)/.exec(fields.get('Pause') ?? '');

	return {
		code: match ? match[1] : null,
		title: match ? match[2] : subject,
		kind: fields.get('Art') ?? '',
		lecturer: fields.get('Dozent') ?? '',
		note: fields.get('Anmerkung') ?? '',
		pause: pause ? Number(pause[1]) : 0
	};
}

export function describeLesson(lesson: { lecturer: string; note: string; pause: number }) {
	return [
		lesson.lecturer && `Dozent: ${lesson.lecturer}`,
		lesson.note && `Anmerkung: ${lesson.note}`,
		lesson.pause > 0 && `Pause: ${lesson.pause} min`
	]
		.filter(Boolean)
		.join('\n');
}

export function lessonKey(code: string | null, title: string, start: Date) {
	return `${code ?? title}|${start.toISOString()}`;
}
