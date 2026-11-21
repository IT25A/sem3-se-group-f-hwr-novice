<script lang="ts">
	type Day = {
		key: string;
		date: Date;
		entries: unknown[];
		minutes: { lessons: number; other: number };
	};

	let { days, now }: { days: Day[]; now: number } = $props();

	const FULL = 10 * 60; // a bar this high stands for ten hours
	const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
	const number = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 });

	// hours with one decimal
	const hours = (minutes: number) => number.format(Math.round(minutes / 6) / 10);

	const columns = $derived(
		days.map((day) => {
			const { lessons, other } = day.minutes;
			const total = lessons + other;
			const weekday = day.date.getDay();
			const scale = total > FULL ? FULL / total : 1; // a very long day fills the bar, no more
			const free = day.entries.length === 0 && weekday >= 1 && weekday <= 5;
			const allDayOnly = total === 0 && day.entries.length > 0;
			const parts = [
				lessons > 0 && `${hours(lessons)} Std. Stundenplan`,
				other > 0 && `${hours(other)} Std. Termine`
			].filter(Boolean);
			const label = `${WEEKDAYS[weekday]}, ${day.date.getDate()}.${day.date.getMonth() + 1}.`;
			const text =
				parts.join(', ') || (allDayOnly ? 'ganztägige Termine' : free ? 'frei' : 'keine Termine');

			return {
				key: day.key,
				weekday: WEEKDAYS[weekday],
				number: day.date.getDate(),
				weekend: weekday === 0 || weekday === 6,
				monday: weekday === 1,
				today: day.date.toDateString() === new Date(now).toDateString(),
				free,
				value: free ? 'frei' : allDayOnly ? '•' : total > 0 ? hours(total) : '',
				lessonsPct: ((lessons * scale) / FULL) * 100,
				otherPct: ((other * scale) / FULL) * 100,
				title: `${label}: ${text}`
			};
		})
	);
</script>

<ol class="bars" aria-label="Belegte Zeit pro Tag in Stunden">
	{#each columns as column, index (column.key)}
		<li
			class:today={column.today}
			class:weekend={column.weekend}
			class:week={column.monday && index > 0}
			title={column.title}
			aria-label={column.title}
		>
			<span class="value" class:free={column.free}>{column.value}</span>
			<div class="track">
				<div class="segment lessons" style:height="{column.lessonsPct}%"></div>
				<div class="segment other" style:height="{column.otherPct}%"></div>
			</div>
			<span class="weekday">{column.weekday}</span>
			<span class="date">{column.number}</span>
		</li>
	{/each}
</ol>

<p class="legend">
	<span class="key"><span class="swatch lessons"></span>Stundenplan</span>
	<span class="key"><span class="swatch other"></span>Termine</span>
</p>

<style>
	.bars {
		display: flex;
		gap: 0.2rem;
		margin: 0.75rem 0 0;
		padding: 0;
		list-style: none;
	}

	li {
		display: flex;
		flex: 1;
		flex-direction: column;
		align-items: center;
		gap: 0.15rem;
		min-width: 0;
		font-size: 0.75rem;
		color: var(--secondary);
	}

	li.week {
		margin-left: 0.5rem;
	}

	.value {
		height: 1rem;
		line-height: 1rem;
		white-space: nowrap;
		font-variant-numeric: tabular-nums;
	}

	.value.free {
		color: #0d9488;
	}

	.track {
		display: flex;
		flex-direction: column-reverse;
		width: 100%;
		height: 5rem;
		border-bottom: 1px solid var(--border);
	}

	.lessons {
		background-color: #0d9488;
	}

	.other {
		background-color: #94a3b8;
	}

	.weekend .weekday,
	.weekend .date {
		opacity: 0.6;
	}

	.today .weekday,
	.today .date {
		color: var(--hwr-red);
		font-weight: 700;
		opacity: 1;
	}

	.legend {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.25rem 1rem;
		margin: 0.75rem 0 0;
		font-size: 0.9rem;
		color: var(--secondary);
	}

	.key {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
	}

	.swatch {
		width: 0.7rem;
		height: 0.7rem;
	}

	@media (max-width: 36rem) {
		.bars {
			gap: 0.1rem;
		}

		li.week {
			margin-left: 0.3rem;
		}
	}
</style>
