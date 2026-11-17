export function semesterOf(cohort: number, now = new Date()): number {
	const year = now.getFullYear();
	const month = now.getMonth() + 1;

	if (month >= 10) return 2 * (year - cohort) + 1;
	if (month >= 4) return 2 * (year - cohort);

	// january to march still belong to the winter semester of the previous year.
	return 2 * (year - 1 - cohort) + 1;
}
