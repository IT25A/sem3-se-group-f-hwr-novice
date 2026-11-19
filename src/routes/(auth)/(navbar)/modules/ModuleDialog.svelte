<script lang="ts">
	import { enhance } from '$app/forms';
	import Modal from '#lib/components/Modal.svelte';

	let modal = $state<ReturnType<typeof Modal>>();
	let formElement = $state<HTMLFormElement>();
	let error = $state('');
	let submitting = $state(false);

	// Opens the dialog.
	export function show() {
		error = '';
		modal?.show();
	}

	// Runs for every way of closing: start with an empty form next time.
	function onclose() {
		error = '';
		formElement?.reset();
	}
</script>

<Modal bind:this={modal} title="Modul anlegen" {onclose}>
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
					error = String(result.data?.error ?? 'Das Modul konnte nicht gespeichert werden.');
					return;
				}

				await update(); // reloads the modules
				if (result.type === 'success') modal?.close();
			};
		}}
	>
		{#if error}
			<p class="error" role="alert">{error}</p>
		{/if}

		<label>
			Name
			<input name="name" required maxlength="100" />
		</label>

		<div class="row">
			<label>
				Code
				<input name="code" maxlength="20" placeholder="optional, z. B. IT1234" />
			</label>
			<label>
				LP
				<input name="lp" type="number" min="0" max="30" required />
			</label>
		</div>

		<div class="row">
			<label>
				Präsenz (LE)
				<input name="presence_le" type="number" min="0" placeholder="optional" />
			</label>
			<label>
				Selbststudium (LE)
				<input name="self_study_le" type="number" min="0" placeholder="optional" />
			</label>
		</div>

		<div class="buttons">
			<button type="button" class="secondary" onclick={() => modal?.close()}>Abbrechen</button>
			<button type="submit" class="primary" disabled={submitting}>
				<span style:visibility={submitting ? 'hidden' : 'visible'}>Anlegen</span>
				<span style:visibility={submitting ? 'visible' : 'hidden'}>Anlegen …</span>
			</button>
		</div>
	</form>
</Modal>
