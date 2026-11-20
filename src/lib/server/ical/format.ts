// Writes an iCalendar (RFC 5545) feed. All times are in UTC, so no time zones are needed.

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

export function buildCalendar(name: string, events: IcsEvent[]) {
	const stamp = utc(new Date());
	const lines = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//HWR Novice//Calendar//DE',
		'CALSCALE:GREGORIAN',
		'METHOD:PUBLISH',
		`X-WR-CALNAME:${escapeText(name)}`,
		'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
		'X-PUBLISHED-TTL:PT1H'
	];

	for (const event of events) {
		lines.push('BEGIN:VEVENT', `UID:${event.uid}`, `DTSTAMP:${stamp}`);
		if (event.allDay) {
			lines.push(
				`DTSTART;VALUE=DATE:${day(event.start)}`,
				`DTEND;VALUE=DATE:${nextDay(event.start)}`
			);
		} else {
			lines.push(`DTSTART:${utc(event.start)}`, `DTEND:${utc(event.end)}`);
		}
		lines.push(`SUMMARY:${escapeText(event.title)}`);
		if (event.location) lines.push(`LOCATION:${escapeText(event.location)}`);
		if (event.description) lines.push(`DESCRIPTION:${escapeText(event.description)}`);
		lines.push('END:VEVENT');
	}

	lines.push('END:VCALENDAR');
	return lines.map(fold).join('\r\n') + '\r\n';
}
