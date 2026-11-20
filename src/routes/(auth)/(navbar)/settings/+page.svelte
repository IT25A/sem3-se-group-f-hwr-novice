<script lang="ts">
	import { courseName } from '#lib/courses/label.ts';
	import { enhance } from '$app/forms';
	import { refreshAll } from '$app/navigation';
	import { pomodoro } from '#lib/pomodoro.svelte.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const fields = [
		{ key: 'work', label: 'Fokuszeit (Min.)', min: 1, max: 180 },
		{ key: 'short', label: 'Kurzpause (Min.)', min: 1, max: 60 },
		{ key: 'long', label: 'Langpause (Min.)', min: 1, max: 60 },
		{ key: 'every', label: 'Fokuszeit bis zur Langpause', min: 2, max: 10 }
	] as const;

	let retrying = $state(false);

	async function retry() {
		retrying = true;
		try {
			// keep the indicator visible for a moment, event if the retry fails instantly
			await Promise.all([refreshAll(), new Promise((resolve) => setTimeout(resolve, 600))]);
		} finally {
			retrying = false;
		}
	}
</script>

<h1>Einstellungen</h1>
<section>
	<h2>Kurs</h2>
	<p>
		Wähle deinen Studiengang und Kurs. Das Semester berechnen wir aus dem Studienbeginn, das ist das
		Jahr deines ersten Semesters (z. B. 2025).
	</p>

	{#if data.current}
		<div class="current">
			<span>Aktuell:</span>
			<span class="pill">{courseName(data.current.value)}</span>
			<span class="pill">Studienbeginn {data.current.cohort}</span>
			<span class="pill">Semester {data.current.semester}</span>
		</div>
	{/if}

	{#if data.optionsError}
		<div class="error" role="alert">
			<p>
				Die Kursliste konnte gerade nicht geladen werden. Der Stundenplan-Dienst ist vermutlich
				nicht erreichbar.
			</p>
			<button
				type="button"
				class="secondary"
				disabled={retrying}
				aria-busy={retrying}
				onclick={retry}
			>
				{#if retrying}
					<span class="spinner" aria-hidden="true"></span>
					Lade …
				{:else}
					Erneut versuchen
				{/if}
			</button>
		</div>
	{:else}
		<form method="POST" action="?/course" use:enhance>
			<label>
				Studiengang und Kurs
				<select name="course" required>
					<option value="none">Kein Stundenplan (nur eigene Module)</option>
					{#each data.options as option (option)}
						<option value={option} selected={option === (form?.value ?? data.current?.value)}>
							{courseName(option)}
						</option>
					{/each}
				</select>
			</label>

			<label>
				Studienbeginn (Jahr)
				<input
					type="number"
					name="cohort"
					min="2020"
					max={data.year}
					value={form?.cohort ?? data.current?.cohort ?? data.year}
					required
				/>
			</label>

			<button type="submit">Speichern</button>
		</form>
	{/if}
	{#if form?.error}
		<p class="error">{form.error}</p>
	{/if}
</section>

<section>
	<h2>Pomodoro-Standardwerte</h2>
	<p>
		Diese Werte gelten, wenn du auf der Pomodoro-Seite nichts anderes wählst. Sie werden sofort
		gespeichert, und zwar in diesem Browser.
	</p>
	{#if pomodoro.status !== 'idle'}
		<p class="hint">Änderungen sind nur möglich, solange kein Intervall läuft.</p>
	{/if}

	<div class="fields">
		{#each fields as field (field.key)}
			<label>
				{field.label}
				<input
					type="number"
					min={field.min}
					max={field.max}
					bind:value={pomodoro.config[field.key]}
					onchange={() => pomodoro.applyConfig()}
					disabled={pomodoro.status !== 'idle'}
				/>
			</label>
		{/each}
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
		background-color: var(--surface);
		padding: 1rem 1.5rem 1.5rem;
		max-width: 40rem;
		margin-bottom: 1.5rem;
	}

	.current {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 1rem;
		color: var(--secondary);
	}

	.pill {
		padding: 0.2rem 0.75rem;
		border: 1px solid var(--border);
		border-radius: 999px;
		background-color: var(--background);
		font-size: 0.9rem;
		color: var(--primary);
	}

	form,
	.fields {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-top: 1rem;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-size: 0.95rem;
		font-weight: 600;
	}

	select,
	input {
		padding: 0.65rem 0.9rem;
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

	.fields label {
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.fields input {
		width: 5rem;
	}

	button {
		align-self: flex-start;
		padding: 0.75rem 1.5rem;
		border: 0;
		border-radius: 0.5rem;
		background-color: var(--hwr-red);
		color: white;
		font: inherit;
		font-weight: 700;
		cursor: pointer;
	}

	button:hover {
		background-color: var(--hwr-red-darker);
	}

	.error {
		padding: 0.75rem 1rem;
		border: 1px solid var(--hwr-red);
		border-radius: 0.5rem;
		background-color: #fdecec;
		color: #8f1a1b;
		margin-top: 0.75rem;
	}

	.error p {
		margin: 0 0 0.75rem;
	}

	.error button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		min-width: 12rem;
	}

	.error button:disabled {
		cursor: default;
		opacity: 0.8;
	}

	.secondary {
		border: 1px solid var(--border);
		background-color: white;
		color: var(--primary);
	}

	.secondary:hover {
		border-color: var(--secondary);
		background-color: var(--background);
	}

	.spinner {
		width: 0.9rem;
		height: 0.9rem;
		border: 2px solid var(--border);
		border-top-color: var(--primary);
		border-radius: 50%;
		animation: spin 0.7s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.hint {
		color: var(--hwr-red);
	}
</style>
