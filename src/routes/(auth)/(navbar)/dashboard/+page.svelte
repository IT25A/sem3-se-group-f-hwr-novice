<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

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

	function dayLabel(date: Date) {
		const text = shortDay(date);
		const day = new Date(now);
		if (date.toDateString() === day.toDateString()) return `Heute · ${text}`;
		day.setDate(day.getDate() + 1);
		return date.toDateString() === day.toDateString() ? `Morgen · ${text}` : text;
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

	<section class="panel">
		<h2>Agenda</h2>

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
			<p class="empty">In den nächsten {data.agenda.days.length} Tagen stehen keine Termine an.</p>
		{/if}

		{#each listed as day (day.key)}
			<h3 class="day">{dayLabel(day.date)}</h3>
			<ul>
				{#each day.entries as entry (entry.id)}
					<li class:travel={entry.travel}>
						<span class="time">{entry.time}</span>
						<span class="dot" style:background-color={COLORS[entry.kind]} aria-hidden="true"></span>
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

		{#if hiddenCount > 0}
			<p class="more">
				… und {hiddenCount}
				{hiddenCount === 1 ? 'weiterer Termin' : 'weitere Termine'} in den nächsten {data.agenda
					.days.length} Tagen.
			</p>
		{/if}

		<p class="legend">
			{#each LEGEND as [kind, name] (kind)}
				<span class="key">
					<span class="dot" style:background-color={COLORS[kind]}></span>{name}
				</span>
			{/each}
			<a class="calendar-link" href={resolve('/(auth)/(navbar)/(calendar)/calendar')}>
				Zum Kalender
			</a>
		</p>
	</section>
</div>

<style>
	.page {
		max-width: 60rem;
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

	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		display: grid;
		grid-template-columns: 6rem 0.6rem minmax(0, 1fr);
		gap: 0.75rem;
		align-items: baseline;
		padding: 0.6rem 0;
		border-top: 1px solid var(--border);
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
		padding: 0.3rem 0;
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
		margin-top: 0.75rem;
	}

	.legend {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.25rem 1rem;
		margin-top: 1.25rem;
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

	.calendar-link {
		margin-left: auto;
	}
</style>
