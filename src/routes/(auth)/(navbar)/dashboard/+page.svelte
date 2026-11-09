<script lang="ts">
	import { Calendar, type CalendarEvent } from 'svelte5plus-calendar';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let events = $derived<CalendarEvent[]>(
		data.events.map((it, index) => ({
			id: index + '',
			title: it.title,
			start: it.start,
			end: it.end,
			location: it.location,
			description: it.description
		}))
	);
</script>

<h1>Dashboard | Hello, {data.user.name}!</h1>
<p>You got successfully forwarded to the official HWR Novice dashboard!</p>

{#if data.scheduleError}
	<p>Der Stundenplan konnte gerade nicht geladen werden. Bitte versuche es später erneut.</p>
{/if}

<div>
	<Calendar {events} view="week" locale="de" />
</div>

<style>
	h1 {
		font-family: 'Cormorant Garamond', serif;
		font-size: 4rem;
		font-weight: 600;
		margin-bottom: 0.4rem;
	}

	p {
		font-size: 1rem;
		font-family: 'Inter', sans-serif;
		line-height: 1.75;
	}
</style>
