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

<div class="dashboard">
	<header>
		<h1>Dashboard | Hello, {data.user.name}!</h1>
		<p>You got successfully forwarded to the official HWR Novice dashboard!</p>

		{#if data.scheduleError}
			<p>Der Stundenplan konnte gerade nicht geladen werden. Bitte versuche es später erneut.</p>
		{/if}
	</header>
	<div class="calendar-wrapper">
		<Calendar {events} view="week" locale="de" dayStartHour={7} dayEndHour={21} />
	</div>
</div>

<style>
	.dashboard {
		display: flex;
		flex-direction: column;
		height: 100dvh;
	}

	.calendar-wrapper {
		flex: 1;
		min-height: 28rem;
		padding-bottom: 1.5rem;
	}

	h1 {
		font-family: 'Cormorant Garamond', serif;
		font-size: 4rem;
		font-weight: 600;
		margin: 0 0 0.4rem 0;
		padding-top: 2.5rem;
	}

	p {
		font-size: 1rem;
		line-height: 1.75;
	}
</style>
