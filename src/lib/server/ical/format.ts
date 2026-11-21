// Writes an iCalendar (RFC 5545) feed. Times are written in the time zone of the university.

export type IcsEvent = {
	uid: string;
	title: string;
	start: Date;
	end: Date;
	allDay?: boolean; // only the date of start is used
	location?: string;
	description?: string;
};

const TIME_ZONE = 'Europe/Berlin';
const dayFormat = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }); // 2026-11-20
const encoder = new TextEncoder();

// 20261120T090000Z
const utc = (date: Date) =>
	date
		.toISOString()
		.replace(/[-:]/g, '')
		.replace(/\.\d{3}/, '');

const timeFormat = new Intl.DateTimeFormat('de-DE', {
	timeZone: TIME_ZONE,
	year: 'numeric',
	month: '2-digit',
	day: '2-digit',
	hour: '2-digit',
	minute: '2-digit',
	second: '2-digit',
	hourCycle: 'h23'
});

// 20261120T090000, wall-clock time in the time zone of the university
function local(date: Date) {
	const p = Object.fromEntries(
		timeFormat.formatToParts(date).map((part) => [part.type, part.value])
	);
	return `${p.year}${p.month}${p.day}T${p.hour}${p.minute}${p.second}`;
}

// 20261120, in the time zone of the university
const day = (date: Date) => dayFormat.format(date).replaceAll('-', '');

function nextDay(date: Date) {
	const [year, month, dayOfMonth] = dayFormat.format(date).split('-').map(Number);
	return new Date(Date.UTC(year, month - 1, dayOfMonth + 1))
		.toISOString()
		.slice(0, 10)
		.replaceAll('-', '');
}

// Backslash, semicolon, comma and line breaks have a special meaning in text values.
const escapeText = (text: string) =>
	text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

// Lines may be 75 bytes long at most. Longer ones continue on the next line with a space.
function fold(line: string) {
	if (encoder.encode(line).length <= 75) return line;

	const parts: string[] = [];
	let current = '';
	let size = 0;
	for (const char of line) {
		const bytes = encoder.encode(char).length;
		const limit = parts.length === 0 ? 75 : 74; // the leading space of a continuation counts
		if (size + bytes > limit) {
			parts.push(current);
			current = '';
			size = 0;
		}
		current += char;
		size += bytes;
	}
	parts.push(current);
	return parts.join('\r\n ');
}

// Rules of Europe/Berlin (CET/CEST), so that calendar apps know the time zone
const VTIMEZONE = [
	'BEGIN:VTIMEZONE',
	`TZID:${TIME_ZONE}`,
	'BEGIN:STANDARD',
	'DTSTART:19701025T030000',
	'TZOFFSETFROM:+0200',
	'TZOFFSETTO:+0100',
	'TZNAME:CET',
	'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
	'END:STANDARD',
	'BEGIN:DAYLIGHT',
	'DTSTART:19700329T020000',
	'TZOFFSETFROM:+0100',
	'TZOFFSETTO:+0200',
	'TZNAME:CEST',
	'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
	'END:DAYLIGHT',
	'END:VTIMEZONE'
];

export function buildCalendar(name: string, events: IcsEvent[]) {
	const stamp = utc(new Date());
	const lines = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//HWR Novice//Calendar//DE',
		'CALSCALE:GREGORIAN',
		'METHOD:PUBLISH',
		`X-WR-CALNAME:${escapeText(name)}`,
		`X-WR-TIMEZONE:${TIME_ZONE}`,
		'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
		'X-PUBLISHED-TTL:PT1H',
		...VTIMEZONE
	];

	for (const event of events) {
		lines.push('BEGIN:VEVENT', `UID:${event.uid}`, `DTSTAMP:${stamp}`);
		if (event.allDay) {
			lines.push(
				`DTSTART;VALUE=DATE:${day(event.start)}`,
				`DTEND;VALUE=DATE:${nextDay(event.start)}`
			);
		} else {
			lines.push(
				`DTSTART;TZID=${TIME_ZONE}:${local(event.start)}`,
				`DTEND;TZID=${TIME_ZONE}:${local(event.end)}`
			);
		}
		lines.push(`SUMMARY:${escapeText(event.title)}`);
		if (event.location) lines.push(`LOCATION:${escapeText(event.location)}`);
		if (event.description) lines.push(`DESCRIPTION:${escapeText(event.description)}`);
		lines.push('END:VEVENT');
	}

	lines.push('END:VCALENDAR');
	return lines.map(fold).join('\r\n') + '\r\n';
}
