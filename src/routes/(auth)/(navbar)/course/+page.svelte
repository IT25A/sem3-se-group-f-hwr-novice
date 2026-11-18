<script lang="ts">
	import { courseName } from '#lib/courses/label.ts';
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<h1>Kurs</h1>
<p>
	Wähle deinen Studiengang und Kurs. Das Semester berechnen wir aus dem Studienbeginn, das ist das
	Jahr deines ersten Semesters (z. B. 2025);
</p>

{#if data.current}
	<p>
		Aktuell: {data.current.value}, Studienbeginn {data.current.cohort}, Semester {data.current
			.semester}
	</p>
{/if}

{#if data.optionsError}
	<p class="error">DIe Kursliste konnte gerade nicht geladen werden.</p>
{/if}
{#if form?.error}
	<p class="error">{form.error}</p>
{/if}

<form method="POST" action="?/save" use:enhance>
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

<style>
	label {
		display: block;
		margin: 1rem 0;
	}

	.error {
		color: #b00020;
	}
</style>
