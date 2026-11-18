// "informatik/kursa" => "Informatik Kurs A"
export function courseName(option: string) {
	const [study, part = ''] = option.split('/');
	const letter = part?.match(/^kurs([a-z])$/)?.[1];
	return letter ? `${study} – Kurs ${letter.toUpperCase()}` : study;
}
