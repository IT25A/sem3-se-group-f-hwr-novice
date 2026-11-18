<script lang="ts">
	import { PHASE_NAMES, pomodoro } from '#lib/pomodoro.svelte.ts';
</script>

<h1>Pomodoro</h1>

<section class="timer">
	<p class="phase">{PHASE_NAMES[pomodoro.phase]}</p>
	<p class="time" role="timer">{pomodoro.label}</p>
	<progress value={pomodoro.progress} max="1"></progress>

	<p class="cycle">
		Fokuszeiten bis zur Langpause: {pomodoro.cycle} von {pomodoro.config.every}
	</p>

	{#if pomodoro.finished}
		<p class="notice">
			{#if pomodoro.finished === 'work'}
				Fokuszeit abgeschlossen. Zeit für eine {PHASE_NAMES[pomodoro.phase]}.
			{:else}
				{PHASE_NAMES[pomodoro.finished]} vorbei. Bereit für die nächste Fokuszeit?
			{/if}
		</p>
	{/if}

	<div class="buttons">
		{#if pomodoro.status === 'running'}
			<button onclick={() => pomodoro.pause()}>Pause</button>
		{:else}
			<button onclick={() => pomodoro.start()}>
				{pomodoro.status === 'paused' ? 'Fortsetzen' : 'Start'}
			</button>
		{/if}
		<button onclick={() => pomodoro.reset()} disabled={pomodoro.status === 'idle'}>
			Zurücksetzen
		</button>
		{#if pomodoro.phase !== 'work'}
			<button onclick={() => pomodoro.skipBreak()}>Pause überspringen</button>
		{/if}
	</div>
</section>

<section class="settings">
	<h2>Einstellungen</h2>
	<p>Die Dauern in Minuten. Änderungen sind nur möglich, solange kein Intervall läuft.</p>
	<div class="fields">
		<label>
			Fokuszeit
			<input
				type="number"
				min="1"
				max="180"
				bind:value={pomodoro.config.work}
				onchange={() => pomodoro.applyConfig()}
				disabled={pomodoro.status !== 'idle'}
			/>
		</label>
		<label>
			Kurzpause
			<input
				type="number"
				min="1"
				max="60"
				bind:value={pomodoro.config.short}
				onchange={() => pomodoro.applyConfig()}
				disabled={pomodoro.status !== 'idle'}
			/>
		</label>
		<label>
			Langpause
			<input
				type="number"
				min="1"
				max="60"
				bind:value={pomodoro.config.long}
				onchange={() => pomodoro.applyConfig()}
				disabled={pomodoro.status !== 'idle'}
			/>
		</label>
		<label>
			Langpause nach
			<input
				type="number"
				min="2"
				max="10"
				bind:value={pomodoro.config.every}
				onchange={() => pomodoro.applyConfig()}
				disabled={pomodoro.status !== 'idle'}
			/>
			Fokuszeiten
		</label>
	</div>
</section>

<style>
	h1 {
		font-family: 'Cormorant Garamond', serif;
		font-size: 4rem;
		font-weight: 600;
		margin: 0 0 0.4rem 0;
		padding-top: 2.5rem;
	}

	h2 {
		margin: 0 0 0.5rem;
	}

	p {
		font-size: 1rem;
		line-height: 1.75;
		margin: 0.5rem 0 0 0;
	}

	section {
		border: 1px solid var(--border);
		padding: 1rem 1.5rem;
		max-width: calc(40rem - 3rem);
		margin-bottom: 1.5rem;
	}

	.timer {
		text-align: center;
	}

	.phase {
		font-size: 1.2rem;
		font-weight: 600;
	}

	.time {
		font-size: 6rem;
		font-weight: 600;
		line-height: 1.2;
		font-variant-numeric: tabular-nums;
		margin: 0;
	}

	progress {
		width: 100%;
	}

	.notice {
		font-weight: 600;
		color: var(--hwr-red);
	}

	.buttons {
		display: flex;
		justify-content: center;
		gap: 0.5rem;
		margin-top: 1rem;
	}

	.fields {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}

	input[type='number'] {
		width: 5rem;
	}
</style>
