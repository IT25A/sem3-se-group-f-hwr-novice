<script lang="ts">
	import type { PageProps } from './$types';
	import { PHASE_NAMES, pomodoro, type Phase } from '#lib/pomodoro.svelte.ts';
	import { resolve } from '$app/paths';
	import HistoryPanel from './HistoryPanel.svelte';

	// "Kurze Pause" -> "kurze Pause" (for use inside a sentence)
	const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);

	let history = $state<ReturnType<typeof HistoryPanel>>();

	const PHASES: Phase[] = ['work', 'short', 'long'];
	const PRESETS = [15, 25, 45, 60];

	// progress ring
	const RADIUS = 110;
	const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

	let { data }: PageProps = $props();

	const dateTime = new Intl.DateTimeFormat('de-DE', {
		day: '2-digit',
		month: '2-digit',
		hour: '2-digit',
		minute: '2-digit'
	});

	const dots = $derived(Array.from({ length: pomodoro.config.every }, (_, i) => i));
	const locked = $derived(pomodoro.moduleLocked);
	const untilLong = $derived(pomodoro.config.every - pomodoro.cycle);

	// moves once per second, in step with the displayed time.
	const progress = $derived.by(() => {
		const total = pomodoro.duration(pomodoro.phase);
		return total > 0 ? 1 - (Math.ceil(pomodoro.remaining / 1000) * 1000) / total : 0;
	});

	// A remembered module may have been deleted in the meantime.
	$effect(() => {
		const id = pomodoro.moduleId;
		if (id && !pomodoro.moduleLocked && !data.modules.some((module) => module.id === id)) {
			pomodoro.moduleId = null;
			pomodoro.saveModule();
		}
	});
</script>

<h1>Pomodoro</h1>

<div class="layout">
	<section class="timer" class:break={pomodoro.phase !== 'work'}>
		<ol class="phases" aria-label="Phase">
			{#each PHASES as phase (phase)}
				<li
					class:active={pomodoro.phase === phase}
					aria-current={pomodoro.phase === phase ? 'step' : undefined}
				>
					{PHASE_NAMES[phase]}
				</li>
			{/each}
		</ol>

		<div class="ring">
			<svg viewBox="0 0 240 240" aria-hidden="true">
				<circle class="track" cx="120" cy="120" r={RADIUS} />
				<circle
					class="bar"
					cx="120"
					cy="120"
					r={RADIUS}
					stroke-dasharray={CIRCUMFERENCE}
					stroke-dashoffset={CIRCUMFERENCE * (1 - progress)}
				/>
			</svg>
			<p class="time" role="timer">{pomodoro.label}</p>
		</div>

		<div
			class="cycle"
			role="img"
			aria-label="{pomodoro.cycle} von {pomodoro.config.every} Fokuszeiten bis zur langen Pause"
		>
			{#each dots as dot (dot)}
				<span class="dot" class:filled={dot < pomodoro.cycle}></span>
			{/each}
		</div>
		<p class="status" class:notice={pomodoro.finished} aria-live="polite">
			{#if pomodoro.finished === 'work'}
				Fokuszeit abgeschlossen. Zeit für eine {lowerFirst(PHASE_NAMES[pomodoro.phase])}.
			{:else if pomodoro.finished}
				Die {lowerFirst(PHASE_NAMES[pomodoro.finished])} ist vorbei. Bereit für die nächste Fokuszeit?
			{:else if untilLong > 0}
				Noch {untilLong} {untilLong === 1 ? 'Fokuszeit' : 'Fokuszeiten'} bis zur langen Pause
			{:else}
				Zeit für die lange Pause
			{/if}
		</p>

		<div class="buttons">
			{#if pomodoro.status === 'running'}
				<button type="button" class="primary" onclick={() => pomodoro.pause()}>Pause</button>
			{:else}
				<button type="button" class="primary" onclick={() => pomodoro.start()}>
					{pomodoro.status === 'paused' ? 'Fortsetzen' : 'Start'}
				</button>
			{/if}
			<div class="secondary-buttons">
				<button
					type="button"
					class="secondary"
					onclick={() => pomodoro.reset()}
					disabled={pomodoro.status === 'idle'}
				>
					Zurücksetzen
				</button>
				{#if pomodoro.phase !== 'work'}
					<button type="button" class="secondary" onclick={() => pomodoro.skipBreak()}>
						Pause überspringen
					</button>
				{/if}
			</div>
		</div>
		{#if pomodoro.error}<p class="error">{pomodoro.error}</p>{/if}
	</section>

	<div class="side">
		<section>
			<h2>Diese Session</h2>

			<label class="module">
				Modul
				<select
					bind:value={pomodoro.moduleId}
					onchange={() => pomodoro.saveModule()}
					disabled={locked}
				>
					<option value={null}>Ohne Modul</option>
					{#each data.modules as module (module.id)}
						<option value={module.id}>{module.code ? `${module.code} ` : ''}{module.name}</option>
					{/each}
				</select>
			</label>

			<fieldset disabled={locked}>
				<legend>
					Dauer der nächsten Fokuszeit
					{#if locked}<span class="locked"> · gesperrt </span>{/if}
				</legend>
				<div class="chips">
					{#each PRESETS as minutes (minutes)}
						<button
							type="button"
							class="chip"
							class:selected={pomodoro.workMinutes === minutes}
							aria-pressed={pomodoro.workMinutes === minutes}
							onclick={() => pomodoro.setNext(minutes)}
						>
							{minutes} Min.
						</button>
					{/each}
					<input
						type="number"
						min="1"
						max="180"
						placeholder="Eigene"
						aria-label="Eigene Dauer in Minuten"
						class:selected={!PRESETS.includes(pomodoro.workMinutes)}
						value={PRESETS.includes(pomodoro.workMinutes) ? '' : pomodoro.workMinutes}
						onchange={(event) => {
							const input = event.currentTarget;
							pomodoro.setNext(Number.isNaN(input.valueAsNumber) ? null : input.valueAsNumber);
							input.value = PRESETS.includes(pomodoro.workMinutes)
								? ''
								: String(pomodoro.workMinutes);
						}}
					/>
				</div>
			</fieldset>

			<p class="hint">
				Gilt nur für die nächste Fokuszeit, danach wieder der Standard ({pomodoro.config.work}
				Min.).
				<a href={resolve('/(auth)/(navbar)/settings')}>Standardwerte&nbsp;ändern</a>
			</p>
		</section>

		<section>
			<h2>Heute</h2>
			<p class="stats">
				<strong>{data.today.minutes}</strong> Min. in <strong>{data.today.count}</strong>
				{data.today.count === 1 ? 'Fokuszeit' : 'Fokuszeiten'}
			</p>
			<button type="button" class="secondary" onclick={() => history?.show()}>
				Verlauf anzeigen
			</button>
		</section>
	</div>
</div>

<HistoryPanel bind:this={history} sessions={data.history} />

<style>
	h1 {
		font-family: 'Cormorant Garamond', serif;
		font-size: 4rem;
		font-weight: 600;
		margin: 0 0 0.4rem 0;
		padding-top: 2.5rem;
	}

	h2 {
		margin: 0 0 0.75rem;
		font-size: 1.15rem;
	}

	p {
		margin: 0.5rem 0 0;
		line-height: 1.6;
	}

	.layout {
		display: grid;
		grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
		gap: 1.5rem;
		align-items: stretch;
		max-width: 56rem;
		margin-top: 1rem;
		padding-bottom: 1.5rem;
	}

	.side {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.side section:last-child {
		display: flex;
		flex: 1;
		flex-direction: column;
	}

	.side section:last-child button {
		align-self: flex-start;
		margin-top: auto;
	}

	section {
		border: 1px solid var(--border);
		background-color: var(--surface);
		padding: 1.25rem 1.5rem;
	}

	.timer {
		text-align: center;
		--phase: var(--hwr-red);
	}

	.timer.break {
		--phase: #0d9488;
	}

	/* Phases */
	.phases {
		display: flex;
		justify-content: center;
		gap: 0.4rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.phases li {
		padding: 0.3rem 0.8rem;
		border: 1px solid var(--border);
		border-radius: 999px;
		font-size: 0.9rem;
		color: var(--secondary);
	}

	.phases li.active {
		border-color: var(--phase);
		background-color: color-mix(in srgb, var(--phase) 10%, white);
		color: var(--primary);
		font-weight: 600;
	}

	/* Ring */
	.ring {
		position: relative;
		width: min(15rem, 100%);
		margin: 1.25rem auto 0.75rem;
	}

	.ring svg {
		display: block;
		width: 100%;
		transform: rotate(-90deg);
	}

	.ring circle {
		fill: none;
		stroke-width: 10;
	}

	.track {
		stroke: var(--border);
	}

	.bar {
		stroke: var(--phase);
		stroke-linecap: round;
	}

	.time {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		margin: 0;
		font-size: 3.5rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	/* Cycle */
	.cycle {
		display: flex;
		justify-content: center;
		gap: 0.4rem;
	}

	.dot {
		width: 0.7rem;
		height: 0.7rem;
		border: 1px solid var(--secondary);
		border-radius: 50%;
	}

	.dot.filled {
		border-color: var(--hwr-red);
		background-color: var(--hwr-red);
	}

	.status {
		min-height: 1.6rem;
		margin: 0.4rem 0 0;
		font-size: 0.85rem;
		line-height: 1.6rem;
		color: var(--secondary);
	}

	.status.notice {
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--hwr-red);
	}

	.error {
		padding: 0.75rem 1rem;
		border: 1px solid var(--hwr-red);
		border-radius: 0.5rem;
		background-color: #fdecec;
		color: #8f1a1b;
	}

	/* Buttons */
	.buttons {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-top: 1rem;
	}

	.secondary-buttons {
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: 1fr;
		gap: 0.5rem;
	}

	button {
		padding: 0.7rem 1.1rem;
		border-radius: 0.5rem;
		font: inherit;
		font-weight: 700;
		cursor: pointer;
	}

	.primary {
		border: 0;
		background-color: var(--hwr-red);
		color: white;
		font-size: 1.1rem;
	}

	.primary:hover {
		background-color: var(--hwr-red-darker);
	}

	.secondary {
		border: 1px solid var(--border);
		background-color: white;
		color: var(--primary);
	}

	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* This session */
	.module {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-size: 0.95rem;
		font-weight: 600;
	}

	select,
	input {
		padding: 0.55rem 0.8rem;
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		background-color: white;
		font: inherit;
		font-weight: 400;
	}

	select:focus-visible,
	input:focus-visible {
		border-color: var(--hwr-red);
		outline: 2px solid var(--hwr-red);
		outline-offset: 1px;
	}

	fieldset {
		margin: 1rem 0 0;
		padding: 0;
		border: 0;
	}

	legend {
		margin-bottom: 0.35rem;
		padding: 0;
		font-size: 0.95rem;
		font-weight: 600;
	}

	.locked {
		font-weight: 400;
		color: var(--secondary);
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.chip {
		padding: 0.4rem 0.8rem;
		border: 1px solid var(--border);
		background-color: white;
		color: var(--secondary);
		font-weight: 400;
	}

	.chip.selected,
	input.selected {
		border-color: var(--hwr-red);
		background-color: color-mix(in srgb, var(--hwr-red) 10%, white);
		color: var(--primary);
	}

	.chips input {
		width: 6rem;
		padding: 0.4rem 0.6rem;
	}

	.hint {
		font-size: 0.85rem;
		color: var(--secondary);
	}

	.hint a {
		color: var(--hwr-red);
		font-weight: 600;
	}

	/* Today */
	.stats {
		margin: 0 0 0.75rem;
	}

	.stats strong {
		font-size: 1.4rem;
	}

	@media (max-width: 73rem) {
		.layout {
			grid-template-columns: 1fr;
			max-width: 32rem;
		}
	}
</style>
