<script lang="ts">
	import { enhance } from '$app/forms';
	import Modal from '#lib/components/Modal.svelte';

	let { canPostGlobal = false }: { canPostGlobal?: boolean } = $props();

	let modal = $state<ReturnType<typeof Modal>>();
	let formElement = $state<HTMLFormElement>();
	let error = $state('');
	let submitting = $state(false);

	// Opens the dialog.
	export function show() {
		error = '';
		modal?.show();
	}

	// Runs for every way of closing (button, Escape, success): start with an empty form next time.
	function onclose() {
		error = '';
		formElement?.reset();
	}
</script>

<Modal bind:this={modal} title="Neuen Termin anlegen" width="34rem" {onclose}>
	<form
		method="POST"
		action="?/create"
		bind:this={formElement}
		use:enhance={() => {
			submitting = true;
			error = '';

			return async ({ result, update }) => {
				submitting = false;

				if (result.type === 'failure') {
					error = String(result.data?.error ?? 'Der Termin konnte nicht gespeichert werden.');
					return;
				}

				await update(); // reloads the calendar data and empties the form
				if (result.type === 'success') modal?.close();
			};
		}}
	>
		{#if error}
			<p class="error" role="alert">{error}</p>
		{/if}

		<label>
			Typ
			<select name="type">
				<option value="private">Privater Termin</option>
				<option value="public">Kursinterner Termin</option>
				{#if canPostGlobal}
					<hr />
					<option value="global">Öffentlicher Termin</option>
				{/if}
			</select>
		</label>

		<label>
			Titel
			<input name="title" required />
		</label>

		<label>
			Ort
			<input name="location" required />
		</label>

		<label>
			Beschreibung (optional)
			<textarea name="description" rows="3"></textarea>
		</label>

		<div class="row">
			<label>
				Start
				<input type="datetime-local" name="start" required />
			</label>

			<label>
				Ende (optional)
				<input type="datetime-local" name="end" />
			</label>
		</div>

		<div class="buttons">
			<button type="button" class="secondary" onclick={() => modal?.close()}>Abbrechen</button>
			<button type="submit" class="primary" disabled={submitting}>
				<span style:visibility={submitting ? 'hidden' : 'visible'}>Speichern</span>
				<span style:visibility={submitting ? 'visible' : 'hidden'}>Speichern …</span>
			</button>
		</div>
	</form>
</Modal>
