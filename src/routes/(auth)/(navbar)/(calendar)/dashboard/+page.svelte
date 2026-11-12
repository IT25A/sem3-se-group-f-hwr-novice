<script lang="ts">
	import { Calendar } from 'svelte5plus-calendar';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
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
		<Calendar
			events={data.events}
			sources={data.sources}
			editable
			view="week"
			locale="de"
			dayStartHour={7}
			dayEndHour={21}
			quickCreate={false}
		/>
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

	:global(.s5c) {
		--s5c-accent: var(--hwr-red); /* buttons, today, selection            */
		--s5c-today-num-bg: var(--hwr-red); /* the round "today" badge              */
		--s5c-now-color: var(--hwr-red); /* current-time line                    */
	}
</style>
