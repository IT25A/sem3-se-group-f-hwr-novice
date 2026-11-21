<script lang="ts">
	type Phase = { from: Date; to: Date };

	let {
		start,
		end,
		phases,
		exams,
		now
	}: {
		start: Date;
		end: Date;
		phases: Phase[];
		exams: { at: Date; title: string }[];
		now: number;
	} = $props();

	const MONTHS = [
		'Jan',
		'Feb',
		'Mär',
		'Apr',
		'Mai',
		'Jun',
		'Jul',
		'Aug',
		'Sep',
		'Okt',
		'Nov',
		'Dez'
	];
	const dayMonth = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit' });

	const pct = (time: number) =>
		Math.min(
			100,
			Math.max(0, ((time - start.getTime()) / (end.getTime() - start.getTime())) * 100)
		);

	const months = $derived.by(() => {
		const list: { label: string; left: number }[] = [];
		const cursor = new Date(start.getFullYear(), start.getMonth() + 1, 1);
		while (cursor < end) {
			list.push({ label: MONTHS[cursor.getMonth()], left: pct(cursor.getTime()) });
			cursor.setMonth(cursor.getMonth() + 1);
		}
		// the month the semester starts in, unless the next one begins right away
		if (!list[0] || list[0].left >= 8) {
			list.unshift({ label: MONTHS[start.getMonth()], left: 0 });
		}
		return list;
	});
</script>

<div class="timeline">
	<div
		class="bar"
		role="img"
		aria-label="Semesterverlauf mit Theoriephasen, Klausuren und dem heutigen Tag"
	>
		{#each phases as phase (phase.from.getTime())}
			<span
				class="phase"
				style:left="{pct(phase.from.getTime())}%"
				style:width="{pct(phase.to.getTime()) - pct(phase.from.getTime())}%"
				title="Theoriephase {dayMonth.format(phase.from)} – {dayMonth.format(
					new Date(phase.to.getTime() - 1)
				)}"
			></span>
		{/each}
		{#each exams as exam (exam.at.getTime() + exam.title)}
			<span
				class="exam"
				style:left="{pct(exam.at.getTime())}%"
				title="{exam.title} · {dayMonth.format(exam.at)}"
			></span>
		{/each}
		<span class="today" style:left="{pct(now)}%"></span>
	</div>

	<div class="months" aria-hidden="true">
		{#each months as month (month.left)}
			<span class="month" style:left="{month.left}%">{month.label}</span>
		{/each}
	</div>
</div>

<p class="legend">
	<span class="key"><span class="swatch phase-swatch"></span>Theoriephase</span>
	<span class="key">
		<span class="swatch free-swatch"></span>Praxisphase / keine Veranstaltungen
	</span>
	<span class="key"><span class="swatch exam-swatch"></span>Klausur</span>
	<span class="key"><span class="swatch today-swatch"></span>Heute</span>
</p>

<style>
	.timeline {
		margin-top: 1rem;
	}

	.bar {
		position: relative;
		height: 1.5rem;
		border: 1px solid var(--border);
		background-color: var(--background);
	}

	.phase {
		position: absolute;
		top: 0;
		bottom: 0;
		background-color: #0d9488;
	}

	.exam {
		position: absolute;
		top: 50%;
		width: 0.6rem;
		height: 0.6rem;
		border: 1px solid white;
		background-color: var(--hwr-red);
		transform: translate(-50%, -50%) rotate(45deg);
	}

	.today {
		position: absolute;
		top: -0.3rem;
		bottom: -0.3rem;
		width: 2px;
		background-color: var(--hwr-red);
		transform: translateX(-50%);
	}

	.months {
		position: relative;
		height: 1.25rem;
		margin-top: 0.4rem;
		font-size: 0.75rem;
		color: var(--secondary);
	}

	.month {
		position: absolute;
		padding-left: 0.25rem;
		border-left: 1px solid var(--border);
		line-height: 1.25rem;
	}

	.legend {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.25rem 1rem;
		margin: 0.5rem 0 0;
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

	.phase-swatch {
		background-color: #0d9488;
	}

	.exam-swatch {
		width: 0.55rem;
		height: 0.55rem;
		background-color: var(--hwr-red);
		transform: rotate(45deg);
	}

	.today-swatch {
		width: 2px;
		height: 0.9rem;
		background-color: var(--hwr-red);
	}

	.free-swatch {
		border: 1px solid var(--border);
		background-color: var(--background);
	}
</style>
