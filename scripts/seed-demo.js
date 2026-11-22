import Database from 'better-sqlite3';
import * as argon2 from 'argon2';

// Creates a demo user in the course IT25A with the timetable of the 3rd semester,
// the modules of the semester, private events and a history of focus sessions.
// Running it again resets the data of that user.
//
// Usage: npm run db:seed-demo [username] [password]    (default: Jonas / demo-passwort)

const [, , username = 'Jonas', password = 'demo-passwort'] = process.argv;

if (password.length < 8) {
	console.error('The password must be at least 8 characters long.');
	process.exit(1);
}

// The app code is TypeScript, so this needs a Node version that strips types (22.18 or newer).
let BASELINE, catalogFor, describeLesson, lessonKey;
try {
	({ BASELINE } = await import('../src/lib/server/lessons/baseline.ts'));
	({ catalogFor } = await import('../src/lib/server/modules/catalog.ts'));
	({ describeLesson, lessonKey } = await import('../src/lib/server/lessons/parser.ts'));
} catch (error) {
	console.error(`Could not load the app modules (Node 22.18 or newer is needed): ${error.message}`);
	process.exit(1);
}

const dbPath = process.env.DATABASE_URL || './data/database.sqlite';
const TZ = 'Europe/Berlin';
const MIN = 60_000;
const DAY = 86_400_000;
const NOW = process.env.DEMO_NOW ? new Date(process.env.DEMO_NOW) : new Date();

// --- Time helpers. All wall clock times are in Berlin, whatever the time zone of this machine is.

const clock = new Intl.DateTimeFormat('en-GB', {
	timeZone: TZ,
	hourCycle: 'h23',
	year: 'numeric',
	month: '2-digit',
	day: '2-digit',
	hour: '2-digit',
	minute: '2-digit',
	second: '2-digit'
});

function partsOf(date) {
	const part = (type) => Number(clock.formatToParts(date).find((item) => item.type === type).value);
	return {
		y: part('year'),
		m: part('month'),
		d: part('day'),
		h: part('hour'),
		min: part('minute')
	};
}

// the day (y, m, d) a moment is on
const dayOf = (date) => {
	const { y, m, d } = partsOf(date);
	return { y, m, d };
};

const dayKey = ({ y, m, d }) => `${y}-${m}-${d}`;
const dayNumber = ({ y, m, d }) => y * 10000 + m * 100 + d; // to compare days
const weekdayOf = ({ y, m, d }) => new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = Sunday

function addDays({ y, m, d }, days) {
	const date = new Date(Date.UTC(y, m - 1, d + days));
	return { y: date.getUTCFullYear(), m: date.getUTCMonth() + 1, d: date.getUTCDate() };
}

function offsetAt(ms) {
	const whole = Math.floor(ms / 1000) * 1000;
	const { y, m, d, h, min } = partsOf(new Date(whole));
	const seconds = Math.floor(whole / 1000) % 60;
	return Date.UTC(y, m - 1, d, h, min, seconds) - whole;
}

// wall clock time in Berlin on a day, "HH:MM" -> moment
function at(day, time) {
	const [h, min] = time.split(':').map(Number);
	const guess = Date.UTC(day.y, day.m - 1, day.d, h, min);
	const first = guess - offsetAt(guess);
	return new Date(guess - offsetAt(first));
}

const seconds = (date) => Math.floor(date.getTime() / 1000);

// "2026-11-25" -> day
const parseDay = (text) => {
	const [y, m, d] = text.split('-').map(Number);
	return { y, m, d };
};

// --- A fixed seed, so the same data comes out every time.

function random(seed) {
	let state = seed;
	return () => {
		state = (state + 0x6d2b79f5) | 0;
		let t = Math.imul(state ^ (state >>> 15), 1 | state);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}
const rng = random(2026);
const between = (low, high) => low + Math.floor(rng() * (high - low + 1));
const chance = (probability) => rng() < probability;

// --- The lessons of the course

const lessons = BASELINE.map((line) => {
	const [code, kind, title, location, start, end, lecturer, pause, note] = line.split('|');
	return {
		code,
		kind,
		title,
		location,
		lecturer,
		pause: Number(pause),
		note,
		start: new Date(start),
		end: new Date(end),
		online: /online/i.test(location) || /online/i.test(note)
	};
});

// --- Private and public events of the user. Times are Berlin wall clock times.
// "quiet" means a family day or a trip: hardly any studying.

const events = [];
const event = (type, title, start, end, location = '', description = null, quiet = false) =>
	events.push({ type, title, start, end, location, description, quiet });

// every Thursday evening bouldering
for (let week = 0; week < 12; week++) {
	const day = addDays(parseDay('2026-10-01'), week * 7);
	event('private', 'Bouldern', at(day, '19:00'), at(day, '20:30'), 'Bouldergarten Kreuzberg');
}

event(
	'private',
	'Wochenende bei den Eltern',
	at(parseDay('2026-10-16'), '18:00'),
	at(parseDay('2026-10-18'), '17:00'),
	'Hannover',
	null,
	true
);
event(
	'private',
	'Kino mit Freunden',
	at(parseDay('2026-11-07'), '20:00'),
	at(parseDay('2026-11-07'), '22:30'),
	'Yorck Kino'
);
event(
	'private',
	'Lerngruppe Data Science',
	at(parseDay('2026-11-18'), '17:00'),
	at(parseDay('2026-11-18'), '19:00'),
	'Bibliothek HWR',
	'Statistik-Aufgaben zusammen durchgehen'
);
event(
	'private',
	'Lerngruppe Data Science',
	at(parseDay('2026-11-25'), '17:30'),
	at(parseDay('2026-11-25'), '19:30'),
	'Bibliothek HWR',
	'Übungsaufgaben zur Statistik'
);
event(
	'private',
	'Zahnarzt',
	at(parseDay('2026-11-27'), '08:00'),
	at(parseDay('2026-11-27'), '09:00'),
	'Praxis Dr. Wendt'
);
event(
	'private',
	'Geburtstagsfeier Lena',
	at(parseDay('2026-11-28'), '19:30'),
	at(parseDay('2026-11-29'), '01:00'),
	'Neukölln'
);
event(
	'private',
	'Kaffee bei Oma',
	at(parseDay('2026-11-29'), '00:00'),
	null,
	'Spandau',
	null,
	true
);
event(
	'private',
	'Städtetrip Leipzig',
	at(parseDay('2026-12-04'), '18:00'),
	at(parseDay('2026-12-06'), '15:00'),
	'Leipzig',
	null,
	true
);
event(
	'public',
	'Lerngruppe Data Science',
	at(parseDay('2026-12-09'), '12:30'),
	at(parseDay('2026-12-09'), '14:30'),
	'Bibliothek HWR',
	'Altklausuren rechnen und offene Fragen klären'
);
event(
	'public',
	'Weihnachtsfeier IT25A',
	at(parseDay('2026-12-18'), '19:00'),
	at(parseDay('2026-12-18'), '23:30'),
	'Kreuzberg'
);

// --- How much each module is worked on, as the share of the target for today (the same target
// as on the dashboard). Software-Engineering is the project of Jonas, Verteilte Systeme has a talk
// and a paper instead of an exam. Both take off in November, with longer blocks. Because of the
// presentation of the project, Data Science and Embedded Systems (exams in December) come short.

const GOAL = { IT2101: 0.98, IT2111: 0.9, IT2121: 0.82, IT1111: 0.4, IT2091: 0.25 };

// 1 = evenly over the semester, more = most of it comes late
const LATE = { IT2101: 2, IT2111: 2 };

// the share of sessions that are longer than the usual 25 minutes
const LONG_SESSIONS = { IT2101: 0.5, IT2111: 0.6 };

// --- Study habits: windows of a day with the chance that she studies in them.

const WINDOWS = {
	weekday: [
		{ from: '07:45', to: '12:00', chance: 0.6 },
		{ from: '14:30', to: '18:30', chance: 0.65 },
		{ from: '19:15', to: '22:30', chance: 0.9 }
	],
	saturday: [
		{ from: '10:00', to: '13:00', chance: 0.9 },
		{ from: '14:30', to: '17:30', chance: 0.65 },
		{ from: '20:00', to: '22:00', chance: 0.25 }
	],
	sunday: [
		{ from: '11:00', to: '13:30', chance: 0.7 },
		{ from: '16:00', to: '19:00', chance: 0.6 }
	]
};

// --- Database

const db = new Database(dbPath, { fileMustExist: true });
db.pragma('foreign_keys = ON');

const hash = await argon2.hash(password);

try {
	// course
	let course = db
		.prepare('SELECT id FROM course WHERE study = ? AND course_part = ? AND cohort = ?')
		.get('informatik', 'kursa', 2025);
	if (!course) {
		course = { id: crypto.randomUUID() };
		db.prepare('INSERT INTO course (id, study, course_part, cohort) VALUES (?, ?, ?, ?)').run(
			course.id,
			'informatik',
			'kursa',
			2025
		);
	}

	// timetable
	const insertLesson = db.prepare(
		`INSERT OR IGNORE INTO lesson
			(id, key, course_id, code, kind, title, location, description, starts_at, ends_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
	);
	for (const lesson of lessons) {
		insertLesson.run(
			crypto.randomUUID(),
			lessonKey(lesson.code, lesson.title, lesson.start),
			course.id,
			lesson.code,
			lesson.kind,
			lesson.title,
			lesson.location,
			describeLesson(lesson),
			seconds(lesson.start),
			seconds(lesson.end)
		);
	}

	// user, reset if there is one already
	let user = db.prepare('SELECT id FROM user WHERE name = ?').get(username);
	if (user) {
		for (const table of ['pomodoro', 'events', 'lesson_assignment', 'module_pass', 'module']) {
			db.prepare(`DELETE FROM ${table} WHERE user_id = ?`).run(user.id);
		}
		db.prepare('UPDATE user SET password_hash = ?, course_id = ? WHERE id = ?').run(
			hash,
			course.id,
			user.id
		);
	} else {
		user = { id: crypto.randomUUID() };
		db.prepare('INSERT INTO user (id, name, password_hash, course_id) VALUES (?, ?, ?, ?)').run(
			user.id,
			username,
			hash,
			course.id
		);
	}

	// modules of the 3rd semester
	const modules = catalogFor('informatik', 2025, 3).map((module) => ({
		...module,
		id: crypto.randomUUID()
	}));
	const insertModule = db.prepare(
		`INSERT INTO module (id, user_id, code, name, lp, presence_le, exam_le, self_study_le)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
	);
	for (const module of modules) {
		insertModule.run(
			module.id,
			user.id,
			module.code,
			module.name,
			module.lp,
			module.presence_le,
			module.exam_le,
			module.self_study_le
		);
	}

	// events
	const insertEvent = db.prepare(
		`INSERT INTO events (id, user_id, type, title, start, end, time, location, description)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
	);
	const timeText = new Intl.DateTimeFormat('de-DE', {
		timeZone: TZ,
		hour: '2-digit',
		minute: '2-digit',
		hour12: false
	});
	for (const item of events) {
		insertEvent.run(
			crypto.randomUUID(),
			user.id,
			item.type,
			item.title,
			seconds(item.start),
			item.end ? seconds(item.end) : null,
			timeText.format(item.start),
			item.location,
			item.description
		);
	}

	// --- Focus sessions, day by day from the first lesson until now.

	const firstDay = dayOf(lessons.reduce((a, b) => (a.start < b.start ? a : b)).start);
	const today = dayOf(NOW);
	const lessonsByDay = new Map();
	for (const lesson of lessons) {
		const key = dayKey(dayOf(lesson.start));
		lessonsByDay.set(key, [...(lessonsByDay.get(key) ?? []), lesson]);
	}

	// What she can not do at a time: lessons (with the way there and back) and events.
	function busyOn(day) {
		const from = at(day, '00:00').getTime();
		const to = at(addDays(day, 1), '00:00').getTime();
		const busy = [];

		for (const lesson of [
			...(lessonsByDay.get(dayKey(addDays(day, -1))) ?? []),
			...(lessonsByDay.get(dayKey(day)) ?? [])
		]) {
			const pad = (lesson.online ? 10 : 45) * MIN;
			busy.push([lesson.start.getTime() - pad, lesson.end.getTime() + pad]);
		}
		for (const item of events) {
			if (item.end) busy.push([item.start.getTime() - 20 * MIN, item.end.getTime() + 20 * MIN]);
		}

		return busy.filter(([start, end]) => end > from && start < to);
	}

	// the free parts of a window
	function freeParts(window, busy) {
		let free = [window];
		for (const [start, end] of busy) {
			free = free.flatMap(([a, b]) => {
				if (end <= a || start >= b) return [[a, b]];
				return [...(start > a ? [[a, start]] : []), ...(end < b ? [[end, b]] : [])];
			});
		}
		return free.filter(([a, b]) => b - a >= 55 * MIN);
	}

	// How much she should have worked on a module by now (minutes), like the dashboard counts it
	const goal = new Map(
		modules.map((module) => {
			const own = lessons.filter((lesson) => lesson.code === module.code);
			const teaching = own.filter((lesson) => lesson.kind !== 'Klausur');
			const exams = own.filter((lesson) => lesson.kind === 'Klausur');
			if (teaching.length === 0) return [module.id, 0];

			const from = Math.min(...teaching.map((lesson) => lesson.start.getTime()));
			const until = exams.length
				? Math.min(...exams.map((lesson) => lesson.start.getTime()))
				: Math.max(...teaching.map((lesson) => lesson.end.getTime()));
			const share = Math.min(1, Math.max(0, (NOW.getTime() - from) / (until - from)));
			return [module.id, module.self_study_le * 45 * share * (GOAL[module.code] ?? 0)];
		})
	);
	const start = at(firstDay, '00:00').getTime();

	// Which module she works on: the ones behind her pace first, what was taught today more likely
	function pickModule(day, startAt) {
		const todays = lessonsByDay.get(dayKey(day)) ?? [];
		const yesterdays = lessonsByDay.get(dayKey(addDays(day, -1))) ?? [];

		const weights = modules.map((module) => {
			const wanted = goal.get(module.id);
			if (!wanted || module.self_study_le === 0) return 0;

			const elapsed = Math.min(1, Math.max(0, (startAt - start) / (NOW.getTime() - start)));
			const pace = wanted * elapsed ** (LATE[module.code] ?? 1);
			let weight = Math.min(8, Math.max(0.1, 1 + (6 * (pace - done.get(module.id))) / wanted));
			const own = todays.filter((lesson) => lesson.code === module.code);
			// taught earlier today, or about to be taught
			const after = (lesson) => startAt - lesson.end.getTime();
			const before = (lesson) => lesson.start.getTime() - startAt;
			if (own.some((lesson) => after(lesson) >= 0 && after(lesson) < 5 * 60 * MIN)) weight *= 2;
			if (own.some((lesson) => before(lesson) > 0 && before(lesson) < 4 * 60 * MIN)) weight *= 1.4;
			if (yesterdays.some((lesson) => lesson.code === module.code)) weight *= 1.3;
			return weight;
		});

		let pick = rng() * weights.reduce((sum, weight) => sum + weight, 0);
		for (const [index, weight] of weights.entries()) {
			pick -= weight;
			if (pick <= 0) return modules[index];
		}
		return modules[0];
	}

	const insertSession = db.prepare(
		`INSERT INTO pomodoro
			(id, user_id, module_id, type, planned_duration, started_at, ended_at, status)
		 VALUES (?, ?, ?, 'work', ?, ?, ?, ?)`
	);
	const done = new Map(modules.map((module) => [module.id, 0]));
	let sessionCount = 0;

	for (let day = firstDay; dayNumber(day) <= dayNumber(today); day = addDays(day, 1)) {
		const weekday = weekdayOf(day);
		const windows =
			weekday === 6 ? WINDOWS.saturday : weekday === 0 ? WINDOWS.sunday : WINDOWS.weekday;
		const busy = busyOn(day);

		// a long day of lessons is tiring, a trip or a family day is not for studying
		const taught = (lessonsByDay.get(dayKey(day)) ?? []).reduce(
			(sum, lesson) => sum + (lesson.end - lesson.start) / MIN,
			0
		);
		const quiet = events.some(
			(item) =>
				item.quiet &&
				dayNumber(dayOf(item.start)) <= dayNumber(day) &&
				dayNumber(dayOf(item.end ?? item.start)) >= dayNumber(day)
		);
		// the first weeks are calmer, the project takes more time towards the presentation
		const season = dayNumber(day) < 20261102 ? 0.85 : 1.25;
		const factor = (taught >= 300 ? 0.7 : 1) * (quiet ? 0.15 : 1) * season;

		for (const window of windows) {
			const parts = freeParts([at(day, window.from).getTime(), at(day, window.to).getTime()], busy);
			if (parts.length === 0) continue;

			const free = parts.reduce((sum, [a, b]) => sum + (b - a) / MIN, 0);
			if (!chance(Math.min(0.97, window.chance * factor) * Math.min(1, free / 120))) continue;

			const [from, to] = parts.reduce((a, b) => (b[1] - b[0] > a[1] - a[0] ? b : a));
			let time = from + between(0, 4) * 5 * MIN;
			let module = pickModule(day, time);
			const count = weekday === 6 || weekday === 0 ? between(4, 7) : between(3, 5);

			for (let index = 0; index < count; index++) {
				if (index === 2 && count >= 4 && chance(0.3)) module = pickModule(day, time);

				const longShare = LONG_SESSIONS[module.code] ?? 0.15;
				const planned = chance(longShare) ? [45, 50][between(0, 1)] : chance(0.9) ? 25 : 30;
				if (time + planned * MIN > to) break;
				if (time + planned * MIN + 5 * MIN > NOW.getTime()) break;

				const cancelled = chance(0.05);
				const ended = cancelled
					? time + between(5, planned - 3) * MIN
					: time + planned * MIN + between(0, 50) * 1000;

				insertSession.run(
					crypto.randomUUID(),
					user.id,
					module.id,
					planned,
					Math.floor(time / 1000),
					Math.floor(ended / 1000),
					cancelled ? 'cancelled' : 'completed'
				);

				if (!cancelled) {
					done.set(module.id, done.get(module.id) + planned);
					sessionCount++;
				}
				time += planned * MIN + ((index + 1) % 4 === 0 ? 15 : 5) * MIN + between(0, 3) * MIN;
			}
		}
	}

	console.log(`User '${username}' is ready (password: ${password}), course IT25A.`);
	console.log(`${events.length} events, ${sessionCount} completed focus sessions:`);
	for (const module of modules) {
		const minutes = done.get(module.id);
		if (module.self_study_le > 0) {
			const le = (minutes / 45).toFixed(1).padStart(5);
			console.log(`  ${module.name.padEnd(32)} ${le} / ${module.self_study_le} LE`);
		}
	}
} catch (error) {
	console.error(`Could not create the demo user: ${error.message}`);
	process.exitCode = 1;
} finally {
	db.close();
}
