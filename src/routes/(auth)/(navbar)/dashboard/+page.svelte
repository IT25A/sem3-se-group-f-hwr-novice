<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';
	import DayBars from './DayBars.svelte';
	import FocusBars from './FocusBars.svelte';
	import SemesterTimeline from './SemesterTimeline.svelte';
	import ProgressRing from '#lib/components/ProgressRing.svelte';

	let { data }: PageProps = $props();

	const MAX_ENTRIES = 6;
	const COLORS: Record<string, string> = {
		lesson: '#0d9488',
		exam: '#d82425',
		private: '#4b5563',
		public: '#2563eb'
	};
	const LEGEND = [
		['lesson', 'Stundenplan'],
		['exam', 'Klausur'],
		['private', 'Privat'],
		['public', 'Öffentlich']
	] as const;

	const clock = new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit' });
	const longDay = new Intl.DateTimeFormat('de-DE', {
		weekday: 'long',
		day: 'numeric',
		month: 'long'
	});
	const dayMonth = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit' });
	const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
	// "Mo, 23.11." instead of "Mo., 23.11."
	const shortDay = (date: Date) => `${WEEKDAYS[date.getDay()]}, ${dayMonth.format(date)}`;

	// moves on every 30 seconds, so countdown and list stay current
	let now = $state(Date.now());
	onMount(() => {
		now = Date.now();
		const timer = setInterval(() => (now = Date.now()), 30_000);
		return () => clearInterval(timer);
	});

	const isOver = (entry: { end: Date | null }) => entry.end !== null && entry.end.getTime() <= now;

	// the days with something left to do
	const days = $derived(
		data.agenda.days
			.map((day) => ({ ...day, entries: day.entries.filter((entry) => !isOver(entry)) }))
			.filter((day) => day.entries.length > 0)
	);

	// travel times do not take a place in the list
	const slots = (day: { entries: { travel: boolean }[] }) =>
		day.entries.filter((entry) => !entry.travel).length;

	// whole days, as long as the list does not get too long
	const listed = $derived.by(() => {
		const result: typeof days = [];
		let count = 0;
		for (const day of days) {
			if (result.length > 0 && count + slots(day) > MAX_ENTRIES) break;
			result.push(day);
			count += slots(day);
		}
		return result;
	});
	const hiddenCount = $derived(
		days.reduce((sum, day) => sum + slots(day), 0) -
			listed.reduce((sum, day) => sum + slots(day), 0)
	);

	// the first timed entry that is not over, a long one is only counted on its first day
	const next = $derived.by(() => {
		const seen = new Set<string>();
		for (const day of data.agenda.days) {
			for (const entry of day.entries) {
				if (entry.end === null || entry.travel || isOver(entry) || seen.has(entry.id)) continue;
				return entry;
			}
		}
		return data.agenda.later;
	});

	const running = $derived(next !== null && next.start.getTime() <= now);

	function duration(ms: number) {
		const minutes = Math.max(1, Math.round(ms / 60_000));
		if (minutes < 60) return `${minutes} Min.`;
		const rest = minutes % 60;
		return rest ? `${Math.floor(minutes / 60)} Std. ${rest} Min.` : `${minutes / 60} Std.`;
	}

	function untilText(entry: { start: Date; end: Date | null }) {
		const start = entry.start.getTime();
		if (start <= now) return `noch ${duration((entry.end?.getTime() ?? start) - now)}`;

		const day = new Date(start).toDateString();
		if (day === new Date(now).toDateString()) return `in ${duration(start - now)}`;

		const tomorrow = new Date(now);
		tomorrow.setDate(tomorrow.getDate() + 1);
		const label = day === tomorrow.toDateString() ? 'morgen' : shortDay(entry.start);
		return `${label} um ${clock.format(entry.start)}`;
	}

	// "Heute", "Morgen" or the weekday
	function dayName(date: Date) {
		const day = new Date(now);
		if (date.toDateString() === day.toDateString()) return 'Heute';
		day.setDate(day.getDate() + 1);
		return date.toDateString() === day.toDateString() ? 'Morgen' : WEEKDAYS[date.getDay()];
	}

	const range = (entry: { start: Date; end: Date | null }) =>
		entry.end
			? `${clock.format(entry.start)}–${clock.format(entry.end)}`
			: clock.format(entry.start);

	// place and lecturer, "ONLINE" is already shown as a tag
	const details = (entry: { location: string; lecturer: string }) =>
		[/^online$/i.test(entry.location) ? '' : entry.location, entry.lecturer]
			.filter(Boolean)
			.join(' · ');

	const percent = (done: number, total: number) =>
		total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;

	// whole calendar days from today until the date
	function daysUntil(date: Date) {
		const midnight = (value: Date | number) => new Date(value).setHours(0, 0, 0, 0);
		return Math.round((midnight(date) - midnight(now)) / 86_400_000);
	}

	function countdown(date: Date) {
		const days = daysUntil(date);
		if (days <= 0) return 'heute';
		return days === 1 ? 'morgen' : `in ${days} Tagen`;
	}

	const WEEK = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

	function focusText(minutes: number) {
		const hours = Math.floor(minutes / 60);
		const rest = minutes % 60;
		if (hours === 0) return `${rest} Min.`;
		return rest ? `${hours} Std. ${rest} Min.` : `${hours} Std.`;
	}

	const todayIndex = $derived((new Date(now).getDay() + 6) % 7);

	const focusDays = $derived(
		data.focus.days.map((minutes, index) => ({
			label: WEEK[index],
			minutes,
			title: `${WEEK[index]}: ${minutes > 0 ? focusText(minutes) : 'keine Fokuszeit'}`
		}))
	);

	// only shown if there was focus time in the same period of last week
	const comparison = $derived.by(() => {
		if (data.focus.last === 0) return '';
		const diff = data.focus.minutes - data.focus.last;
		if (diff === 0) return 'genauso viel wie zur gleichen Zeit letzte Woche';
		return `${focusText(Math.abs(diff))} ${diff > 0 ? 'mehr' : 'weniger'} als zur gleichen Zeit letzte Woche`;
	});

	// the last day of a phase ("to" is the midnight after it)
	const lastDay = (date: Date) => new Date(date.getTime() - 1);

	function span(until: Date) {
		const days = Math.max(1, Math.ceil((until.getTime() - now) / 86_400_000));
		if (days < 14) return `${days} ${days === 1 ? 'Tag' : 'Tage'}`;
		return `${Math.round(days / 7)} Wochen`;
	}

	const phaseLine = $derived.by(() => {
		const timeline = data.timeline;
		if (!timeline) return '';
		const { kind, until } = timeline.current;
		if (until && kind === 'theory') return `Jetzt: Theoriephase, noch ${span(until)}`;
		if (until && kind === 'practice') return `Jetzt: Praxisphase, noch ${span(until)}`;
		return timeline.phases.length > 0
			? 'Keine weiteren Veranstaltungen im Stundenplan.'
			: 'Für dieses Semester liegt noch kein Stundenplan vor.';
	});

	const nextLine = $derived.by(() => {
		const timeline = data.timeline;
		if (!timeline) return '';
		if (timeline.next) {
			const range = `${dayMonth.format(timeline.next.from)} – ${dayMonth.format(lastDay(timeline.next.to))}`;
			const lead = timeline.current.kind === 'theory' ? 'Danach Praxisphase, nächste' : 'Nächste';
			return `${lead} Theoriephase: ${range}`;
		}
		return 'Keine weiteren Veranstaltungen im Stundenplan.';
	});
</script>

<div class="page">
	<header>
		<h1>Hallo, {data.user.name}</h1>
		<p class="date">{longDay.format(now)}</p>
	</header>

	{#if !data.hasCourse}
		<p class="notice">
			Du hast noch keinen Kurs gewählt, deshalb gibt es keinen Stundenplan.
			<a href={resolve('/(auth)/(navbar)/settings')}>Kurs auswählen</a>
		</p>
	{/if}
	{#if data.scheduleError}
		<p class="notice" role="alert">
			Der Stundenplan konnte gerade nicht geladen werden. Bitte versuche es später erneut.
		</p>
	{/if}

	<div class="grid">
		<section class="panel">
			<div class="head">
				<h2>Agenda</h2>
				<a href={resolve('/(auth)/(navbar)/(calendar)/calendar')}>Zum Kalender</a>
			</div>

			{#if next}
				<div class="next">
					<p class="label">{running ? 'Läuft gerade' : 'Als Nächstes'} · {untilText(next)}</p>
					<p class="next-title">
						{next.title}
						{#if next.kind === 'exam'}<span class="pill tag exam">Klausur</span>{/if}
						{#if next.online}<span class="pill tag">Online</span>{/if}
					</p>
					<p class="meta">{[range(next), details(next)].filter(Boolean).join(' · ')}</p>
				</div>
			{:else}
				<p class="empty">
					In den nächsten {data.agenda.days.length} Tagen stehen keine Termine an.
				</p>
			{/if}

			<div class="list">
				{#each listed as day (day.key)}
					<ul class="group">
						{#each day.entries as entry, index (entry.id)}
							<li class:travel={entry.travel}>
								<span class="when">
									{#if index === 0}
										<strong>{dayName(day.date)}</strong>
										<small>{dayMonth.format(day.date)}</small>
									{/if}
								</span>
								<span class="time">{entry.time}</span>
								<span class="dot" style:background-color={COLORS[entry.kind]} aria-hidden="true"
								></span>
								<div class="what">
									<p class="title">{entry.title}</p>
									{#if details(entry)}<p class="meta">{details(entry)}</p>{/if}
									{#if entry.kind === 'exam'}<span class="pill tag exam">Klausur</span>{/if}
									{#if entry.online && !entry.travel}<span class="pill tag">Online</span>{/if}
								</div>
							</li>
						{/each}
					</ul>
				{/each}
			</div>

			{#if hiddenCount > 0}
				<p class="more">
					… und {hiddenCount}
					{hiddenCount === 1 ? 'weiterer Termin' : 'weitere Termine'} in den nächsten {data.agenda
						.days.length} Tagen.
				</p>
			{/if}

			{#if listed.length > 0}
				<p class="legend">
					{#each LEGEND as [kind, name] (kind)}
						<span class="key"
							><span class="dot" style:background-color={COLORS[kind]}></span>{name}</span
						>
					{/each}
				</p>
			{/if}

			{#if data.agenda.days.some((day) => day.entries.length > 0)}
				<div class="overview">
					<h3 class="day">Belegte Zeit pro Tag (in Stunden)</h3>
					<DayBars days={data.agenda.days} {now} />
				</div>
			{/if}
		</section>

		<aside class="side">
			<section class="panel">
				<div class="head">
					<h2>Studienfortschritt</h2>
					<a href={resolve('/(auth)/(navbar)/modules')}>Zu den Modulen</a>
				</div>
				<div class="progress">
					<ProgressRing value={percent(data.ects.earned, data.ects.total)}>
						<strong class="percent">{percent(data.ects.earned, data.ects.total)}&nbsp;%</strong>
					</ProgressRing>
					<dl class="facts">
						<div>
							<dt>ECTS</dt>
							<dd>{data.ects.earned} von {data.ects.total}</dd>
						</div>
						{#if data.semester}
							<div>
								<dt>Semester</dt>
								<dd>{data.semester} von 6</dd>
							</div>
						{/if}
						{#if data.modules.total > 0}
							<div>
								<dt>Module im Semester</dt>
								<dd>{data.modules.passed} von {data.modules.total} bestanden</dd>
							</div>
						{/if}
					</dl>
				</div>
				{#if data.hasCourse && data.unassigned > 0}
					<p class="hint">
						{data.unassigned}
						{data.unassigned === 1 ? 'Veranstaltung ist' : 'Veranstaltungen sind'} noch keinem Modul zugeordnet.
						<a href={resolve('/(auth)/(navbar)/modules')}>Zuordnen</a>
					</p>
				{/if}
			</section>

			<section class="panel">
				<div class="head">
					<h2>Klausuren</h2>
				</div>
				{#if data.exams.length > 0}
					<ul class="exams">
						{#each data.exams as exam (exam.id)}
							<li>
								<div>
									<p class="title">{exam.name}</p>
									<p class="meta">{shortDay(exam.at)} · {clock.format(exam.at)}</p>
								</div>
								<span class="countdown" class:soon={daysUntil(exam.at) <= 7}>
									{countdown(exam.at)}
								</span>
							</li>
						{/each}
					</ul>
				{:else}
					<p class="empty">Keine Klausuren in Sicht.</p>
				{/if}
			</section>

			<section class="panel">
				<div class="head">
					<h2>Fokuszeit</h2>
					{#if data.focus.count > 0}
						<a href={resolve('/(auth)/(navbar)/pomodoro')}>Zur Fokuszeit</a>
					{/if}
				</div>
				{#if data.focus.count > 0}
					<p class="total">
						<strong>{focusText(data.focus.minutes)}</strong>
						<span>diese Woche</span>
					</p>
					<p class="meta">
						{data.focus.count}
						{data.focus.count === 1 ? 'Sitzung' : 'Sitzungen'}{comparison ? ` · ${comparison}` : ''}
					</p>
					<FocusBars days={focusDays} today={todayIndex} />
					{#if data.focus.top}
						<p class="meta top">
							Meiste Zeit: {data.focus.top.name} ({focusText(data.focus.top.minutes)})
						</p>
					{/if}
				{:else}
					<p class="empty">Diese Woche noch keine Fokuszeit.</p>
					<a class="start" href={resolve('/(auth)/(navbar)/pomodoro')}>Fokuszeit starten</a>
				{/if}
			</section>
		</aside>
	</div>

	{#if data.timeline}
		<section class="panel wide">
			<div class="head">
				<h2>Semesterverlauf</h2>
				<p class="meta">
					{[
						data.semester ? `${data.semester}. Semester` : '',
						data.timeline.week ? `Semesterwoche ${data.timeline.week}` : ''
					]
						.filter(Boolean)
						.join(' · ')}
				</p>
			</div>
			<SemesterTimeline
				start={data.timeline.start}
				end={data.timeline.end}
				phases={data.timeline.phases}
				exams={data.timeline.exams}
				{now}
			/>
			<p class="phase-now">{phaseLine}</p>
			{#if nextLine}<p class="meta">{nextLine}</p>{/if}
		</section>
	{/if}
</div>

<style>
	.page {
		max-width: 80rem;
		padding-bottom: 2rem;
	}

	h1 {
		font-family: 'Cormorant Garamond', serif;
		font-size: clamp(2.5rem, 9vw, 4rem);
		font-weight: 600;
		margin: 0 0 0.4rem 0;
		padding-top: 2.5rem;
	}

	h2 {
		margin: 0;
		font-size: 1.15rem;
	}

	p {
		margin: 0;
		line-height: 1.6;
	}

	.head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.5rem 1rem;
	}

	.date {
		margin-bottom: 1.5rem;
		color: var(--secondary);
	}

	.notice {
		margin-bottom: 1rem;
		padding: 0.75rem 1rem;
		border: 1px dashed var(--border);
		background-color: var(--surface);
		color: var(--secondary);
	}

	a {
		color: var(--hwr-red);
		font-weight: 600;
	}

	/* Next entry */
	.next {
		margin-top: 1rem;
		padding: 0.9rem 1rem;
		border: 1px solid var(--border);
		background-color: var(--background);
	}

	.label,
	.meta,
	.more,
	.legend {
		font-size: 0.9rem;
		color: var(--secondary);
	}

	.next-title {
		margin-top: 0.2rem;
		font-size: 1.25rem;
		font-weight: 600;
	}

	.empty {
		margin-top: 1rem;
		color: var(--secondary);
	}

	/* Days */
	.day {
		margin: 1.5rem 0 0.25rem;
		font-size: 0.9rem;
		font-weight: 600;
	}

	.list {
		--day-col: 6.5rem;
		--gap: 0.75rem;
		margin-top: 1rem;
	}

	.group {
		margin: 0;
		padding: 0.25rem 0;
		list-style: none;
	}

	.group + .group {
		border-top: 1px solid var(--border);
	}

	li {
		display: grid;
		grid-template-columns: var(--day-col) 6rem 0.6rem minmax(0, 1fr);
		gap: var(--gap);
		align-items: baseline;
		padding: 0.5rem 0;
	}

	.when {
		display: flex;
		gap: 0.4rem;
		align-items: baseline;
		white-space: nowrap;
	}

	.when small {
		font-size: 0.8rem;
		color: var(--secondary);
	}

	.time {
		font-size: 0.9rem;
		font-variant-numeric: tabular-nums;
		color: var(--secondary);
	}

	.dot {
		align-self: start;
		width: 0.6rem;
		height: 0.6rem;
		margin-top: 0.45rem;
		border-radius: 50%;
	}

	.title {
		font-weight: 600;
	}

	/* Title and details side by side if there is room, else below each other */
	.what {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0 0.75rem;
	}

	.what .tag {
		margin-left: 0;
	}

	/* Travel times are smaller and quieter than the lessons */
	li.travel {
		color: var(--secondary);
	}

	.travel .title {
		font-size: 0.9rem;
		font-weight: 400;
	}

	.travel .dot {
		visibility: hidden;
	}

	.tag {
		margin-left: 0.4rem;
		padding: 0.05rem 0.5rem;
		font-size: 0.75rem;
		font-weight: 400;
	}

	.tag.exam {
		border-color: var(--hwr-red);
		color: var(--hwr-red);
	}

	.more {
		padding-top: 0.4rem;
		padding-left: calc(var(--day-col) + var(--gap));
	}

	.legend {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.25rem 1rem;
		margin-top: 0.5rem;
	}

	.overview {
		margin-top: 1.75rem;
		border-top: 1px solid var(--border);
	}

	.overview .day {
		margin-top: 1rem;
	}

	.key {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
	}

	.key .dot {
		align-self: center;
		margin-top: 0;
	}

	/* Layout */
	.grid {
		display: grid;
		grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
		gap: 1.5rem;
		align-items: start;
	}

	.side {
		display: grid;
		gap: 1.5rem;
	}

	@media (max-width: 60rem) {
		.grid {
			grid-template-columns: minmax(0, 1fr);
		}
	}

	/* Progress */
	.progress {
		display: flex;
		align-items: center;
		gap: 1.25rem;
		margin-top: 1rem;
	}

	.percent {
		font-size: 1.5rem;
	}

	.facts {
		display: grid;
		flex: 1;
		gap: 0.5rem;
		margin: 0;
	}

	.facts div {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
	}

	.facts dt {
		color: var(--secondary);
	}

	.facts dd {
		margin: 0;
		font-weight: 600;
		text-align: right;
	}

	.hint {
		margin-top: 1rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--border);
		font-size: 0.9rem;
		color: var(--secondary);
	}

	/* Exams */
	.exams {
		margin: 0.5rem 0 0;
		padding: 0;
		list-style: none;
	}

	.exams li {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.5rem 0;
	}

	.countdown {
		white-space: nowrap;
		font-weight: 600;
	}

	.countdown.soon {
		color: var(--hwr-red);
	}

	/* Focus time */
	.total {
		margin-top: 1rem;
	}

	.total strong {
		font-size: 1.75rem;
		font-weight: 600;
	}

	.total span {
		color: var(--secondary);
	}

	.top {
		margin-top: 0.75rem;
	}

	.start {
		display: inline-block;
		margin-top: 1rem;
		padding: 0.55rem 1rem;
		border-radius: 0.5rem;
		background-color: var(--hwr-red);
		color: white;
	}

	.start:hover {
		background-color: var(--hwr-red-darker);
	}

	/* Semester timeline */
	.wide {
		margin-top: 1.5rem;
	}

	.phase-now {
		margin-top: 1rem;
		font-weight: 600;
	}

	@media (max-width: 40rem) {
		.list {
			--day-col: 0rem;
		}

		li {
			grid-template-columns: 6rem 0.6rem minmax(0, 1fr);
		}

		.when {
			grid-column: 1 / -1;
			flex-direction: row;
			gap: 0.4rem;
			align-items: baseline;
		}

		.when:empty {
			display: none;
		}

		.more {
			padding-left: 0;
		}
	}
</style>
