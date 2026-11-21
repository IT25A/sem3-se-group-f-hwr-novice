<script lang="ts">
	import { Calendar, type CalendarEvent } from 'svelte5plus-calendar';
	import EventDialog from './EventDialog.svelte';
	import { json } from '@sveltejs/kit';

	let { data } = $props();

	let eventDialog = $state<ReturnType<typeof EventDialog>>();

	let visibility = $state<Record<string, boolean>>({});

	let sources = $derived(
		data.sources.map((source) => ({
			...source,
			visible: visibility[source.id] ?? source.visible
		}))
	);

	const PALETTE: Record<string, string> = {
		teal: '#0d9488',
		graphite: '#4b5563',
		blue: '#2563eb'
	};
	const colorOf = (color?: string) => PALETTE[color ?? ''];

	function deleteEvent(event: CalendarEvent) {
		fetch('', {
			method: 'DELETE',
			body: JSON.stringify({
				eventId: event.id
			})
		});
	}
</script>

<div class="page">
	<h1>Kalender und Stundenplan</h1>

	<header>
		<div class="sources" role="group" aria-label="Sichtbare Kalender">
			{#each sources as source (source.id)}
				<label class="source" style:--source={colorOf(source.color)}>
					<input
						type="checkbox"
						onchange={(e) => (visibility[source.id] = e.currentTarget.checked)}
						checked={source.visible ?? true}
					/>
					{source.name}
				</label>
			{/each}
		</div>

		<button onclick={() => eventDialog?.show()}>Neuen Termin anlegen</button>
	</header>

	<div class="calendar-wrapper">
		<Calendar
			events={data.events}
			{sources}
			editable
			view="week"
			locale="de"
			dayStartHour={7}
			dayEndHour={21}
			quickCreate={false}
			onEventDelete={deleteEvent}
		/>
	</div>
</div>

<EventDialog bind:this={eventDialog} canPostGlobal={data.user.asta_member} />

<style>
	.page {
		display: flex;
		flex-direction: column;
		height: calc(100dvh - var(--topbar));
	}

	h1 {
		font-family: 'Cormorant Garamond', serif;
		font-size: 4rem;
		font-weight: 600;
		margin: 0 0 0.4rem 0;
		padding-top: 2.5rem;
	}

	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 0.5rem 1rem;
		padding: 0.75rem 0;
	}

	.sources {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.source {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.3rem 0.7rem;
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		background-color: var(--surface);
		font-size: 0.9rem;
		color: var(--secondary);
		cursor: pointer;
		user-select: none;
		transition:
			border-color 0.15s,
			background-color 0.15s;
	}

	.source:has(input:checked) {
		background-color: var(--source);
		background-color: color-mix(in srgb, var(--source) 10%, white);
		color: var(--primary);
	}

	.source input {
		width: 1rem;
		height: 1rem;
		margin: 0;
		accent-color: var(--source);
		cursor: pointer;
	}

	header button {
		margin-right: 0.75rem;
		padding: 0.4rem 1rem;
		border: 0;
		border-radius: 0.5rem;
		background-color: var(--hwr-red);
		color: white;
		font: inherit;
		font-weight: 700;
		cursor: pointer;
	}

	header button:hover {
		background-color: var(--hwr-red-darker);
	}

	.calendar-wrapper {
		flex: 1;
		min-height: 28rem;
		padding-bottom: 1rem;
	}

	:global(.s5c) {
		--s5c-accent: var(--hwr-red); /* buttons, today, selection */
		--s5c-today-num-bg: var(--hwr-red); /* the round "today" badge */
		--s5c-now-color: var(--hwr-red); /* current-time line */
	}
</style>
