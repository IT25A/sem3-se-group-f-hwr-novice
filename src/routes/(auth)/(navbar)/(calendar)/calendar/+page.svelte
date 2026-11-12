<script lang="ts">
	import { Calendar } from 'svelte5plus-calendar';

	let { data } = $props();

	let visibility = $state<Record<string, boolean>>({});

	let sources = $derived(
		data.sources.map((source) => ({
			...source,
			visible: visibility[source.id] ?? source.visible
		}))
	);
</script>

<h1>Kalender und Stundenplan</h1>

<div class="btn-wrapper">
	<div class="source-wrapper">
		{#each sources as source (source.id)}
			<div>
				<input
					type="checkbox"
					id="source-{source.id}"
					onclick={(e) => (visibility[source.id] = e.currentTarget.checked)}
					checked={source.visible ?? true}
				/>
				<label for="source-{source.id}">{source.name}</label>
			</div>
		{/each}
	</div>

	<button> Neuen Termin anlegen </button>
</div>

<Calendar
	events={data.events}
	{sources}
	editable
	view="week"
	locale="de"
	dayStartHour={7}
	dayEndHour={21}
	quickCreate={false}
	class="calendar"
/>

<style>
	h1 {
		font-family: 'Cormorant Garamond', serif;
		font-size: 4rem;
		font-weight: 600;
		margin: 0 0 0.4rem 0;
		padding-top: 2.5rem;
	}

	.btn-wrapper {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 0;
	}

	.btn-wrapper button {
		padding: 0.5rem;
		background-color: var(--hwr-red);
		border-radius: 0.5rem;
		color: var(--background);
		font-weight: bold;
		cursor: pointer;
		border: 0;
	}

	.source-wrapper {
		display: flex;
		gap: 1rem;
	}

	:global(.s5c) {
		--s5c-accent: var(--hwr-red); /* buttons, today, selection            */
		--s5c-today-num-bg: var(--hwr-red); /* the round "today" badge              */
		--s5c-now-color: var(--hwr-red); /* current-time line                    */
	}
</style>
