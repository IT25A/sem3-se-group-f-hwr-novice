<script lang="ts">
	import { enhance } from '$app/forms';

	let dialog = $state<HTMLDialogElement>();
	let formElement = $state<HTMLFormElement>();
	let error = $state('');
	let submitting = $state(false);

	// Opens the dialog.
	export function show() {
		error = '';
		dialog?.showModal();
	}

	// Runs for every way of closing: start with an empty form next time.
	function onclose() {
		error = '';
		formElement?.reset();
	}
</script>

<dialog bind:this={dialog} {onclose} aria-labelledby="module-dialog-title">
	<div class="content">
		<h2 id="module-dialog-title">Modul anlegen</h2>

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
					if (result.type === 'success') dialog?.close();
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
				<button type="button" class="secondary" onclick={() => dialog?.close()}>Abbrechen</button>
				<button type="submit" class="primary" disabled={submitting}>
					<span style:visibility={submitting ? 'hidden' : 'visible'}>Anlegen</span>
					<span style:visibility={submitting ? 'visible' : 'hidden'}>Anlegen …</span>
				</button>
			</div>
		</form>
	</div>
</dialog>

<style>
	dialog {
		width: min(32rem, calc(100vw - 2rem));
		max-height: calc(100dvh - 2rem);
		padding: 0;
		border: 1px solid var(--border);
		background-color: var(--surface);
		color: var(--primary);
	}

	dialog::backdrop {
		background-color: rgb(0 0 0 / 0.45);
	}

	.content {
		padding: 2rem 2.25rem;
	}

	h2 {
		margin: 0 0 1.25rem;
		font-family: 'Cormorant Garamond', serif;
		font-size: 2.6rem;
		font-weight: 600;
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-size: 0.95rem;
		font-weight: 600;
	}

	input {
		box-sizing: border-box;
		width: 100%;
		padding: 0.65rem 0.9rem;
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		background-color: white;
		font: inherit;
		font-weight: 400;
	}

	input:focus-visible {
		border-color: var(--hwr-red);
		outline: 2px solid var(--hwr-red);
		outline-offset: 1px;
	}

	input::placeholder {
		color: var(--secondary);
		font-style: italic;
		opacity: 0.7;
	}

	.row {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		align-items: end;
		gap: 1rem;
	}

	.error {
		margin: 0;
		padding: 0.75rem 1rem;
		border: 1px solid var(--hwr-red);
		border-radius: 0.5rem;
		background-color: #fdecec;
		color: #8f1a1b;
	}

	.buttons {
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: 1fr;
		align-self: flex-end;
		gap: 0.75rem;
		margin-top: 0.5rem;
	}

	button {
		padding: 0.7rem 1.1rem;
		border-radius: 0.5rem;
		font: inherit;
		font-weight: 700;
		cursor: pointer;
	}

	.primary {
		display: inline-grid;
		justify-items: center;
		border: 0;
		background-color: var(--hwr-red);
		color: white;
	}

	.primary span {
		grid-area: 1 / 1;
	}

	.primary:hover {
		background-color: var(--hwr-red-darker);
	}

	.primary:disabled {
		opacity: 0.6;
		cursor: wait;
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

	@media (max-width: 36rem) {
		.row {
			grid-template-columns: 1fr;
		}
	}
</style>
