import { type Course, type Lesson, SCHEDULE_URL } from './hwrical';
import ICAL from "ical"

export async function fetchScheduleICal(study: string, course: Course) {
	const icalRaw = await fetch(SCHEDULE_URL(study, course)).then((res) => res.text());
	return ICAL.parseICS(icalRaw)
}

export async function fetchLessons(study: string, course: Course) {
	const ical = await fetchScheduleICal(study, course)

	return Object.entries(ical)
		.filter(([, it]) => it.type === "VEVENT")
		.map((([, it]) => ({
			start: it.start,
			end: it.end,
			location: it.location,
			title: it.summary,
			description: it.description
		} as Lesson)))
}