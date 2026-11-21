<script lang="ts">
	type Day = { label: string; minutes: number; title: string };

	// today is the index (Monday = 0) of the day to highlight
	let { days, today }: { days: Day[]; today: number } = $props();

	const MIN_FULL = 120; // a bar this high stands for two hours at least
	const full = $derived(Math.max(MIN_FULL, ...days.map((day) => day.minutes)));
</script>

<ol class="bars" aria-label="Fokuszeit pro Tag dieser Woche">
	{#each days as day, index (day.label)}
		<li
			class:today={index === today}
			class:weekend={index >= 5}
			title={day.title}
			aria-label={day.title}
		>
			<div class="track">
				<div
					class="fill"
					style:height="{(day.minutes / full) * 100}%"
					style:min-height={day.minutes > 0 ? '2px' : undefined}
				></div>
			</div>
			<span class="label">{day.label}</span>
		</li>
	{/each}
</ol>

<style>
	.bars {
		display: flex;
		gap: 0.3rem;
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

	.track {
		display: flex;
		align-items: flex-end;
		width: 100%;
		height: 3.5rem;
		border-bottom: 1px solid var(--border);
	}

	.fill {
		width: 100%;
		background-color: #7c3aed;
	}

	.weekend .label {
		opacity: 0.6;
	}

	.today .label {
		color: var(--hwr-red);
		font-weight: 700;
		opacity: 1;
	}
</style>
