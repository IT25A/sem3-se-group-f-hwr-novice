<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		width = '32rem',
		onclose,
		children
	}: {
		title: string;
		width?: string;
		onclose?: () => void;
		children: Snippet;
	} = $props();

	const titleId = $props.id();
	let dialog = $state<HTMLDialogElement>();

	// Opens the dialog.
	export function show() {
		dialog?.showModal();
	}

	// Closes the dialog.
	export function close() {
		dialog?.close();
	}
</script>

<dialog bind:this={dialog} {onclose} aria-labelledby={titleId} style:--width={width}>
	<div class="content">
		<h2 id={titleId}>{title}</h2>
		{@render children()}
	</div>
</dialog>

<style>
	dialog {
		width: min(var(--width), calc(100vw - 2rem));
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

	/* Shared styles for everything inside a dialog */
	.content :global(form) {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.content :global(label) {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-size: 0.95rem;
		font-weight: 600;
	}

	.content :global(input),
	.content :global(select),
	.content :global(textarea) {
		box-sizing: border-box;
		width: 100%;
		padding: 0.65rem 0.9rem;
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		background-color: white;
		font: inherit;
		font-weight: 400;
	}

	.content :global(textarea) {
		resize: vertical;
	}

	.content :global(input:focus-visible),
	.content :global(select:focus-visible),
	.content :global(textarea:focus-visible) {
		border-color: var(--hwr-red);
		outline: 2px solid var(--hwr-red);
		outline-offset: 1px;
	}

	.content :global(input::placeholder) {
		color: var(--secondary);
		font-style: italic;
		opacity: 0.7;
	}

	.content :global(.row) {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		align-items: end;
		gap: 1rem;
	}

	.content :global(.error) {
		margin: 0;
		padding: 0.75rem 1rem;
		border: 1px solid var(--hwr-red);
		border-radius: 0.5rem;
		background-color: #fdecec;
		color: #8f1a1b;
	}

	.content :global(.buttons) {
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: 1fr;
		align-self: flex-end;
		gap: 0.75rem;
		margin-top: 0.5rem;
	}

	.content :global(button) {
		padding: 0.7rem 1.1rem;
		border-radius: 0.5rem;
		font: inherit;
		font-weight: 700;
		cursor: pointer;
	}

	/* Two stacked labels keep the width the same while saving */
	.content :global(.primary) {
		display: inline-grid;
		justify-items: center;
		border: 0;
		background-color: var(--hwr-red);
		color: white;
	}

	.content :global(.primary span) {
		grid-area: 1 / 1;
	}

	.content :global(.primary:hover) {
		background-color: var(--hwr-red-darker);
	}

	.content :global(.primary:disabled) {
		opacity: 0.6;
		cursor: wait;
	}

	.content :global(.secondary) {
		border: 1px solid var(--border);
		background-color: white;
		color: var(--primary);
	}

	.content :global(.secondary:hover) {
		border-color: var(--secondary);
		background-color: var(--background);
	}

	@media (max-width: 36rem) {
		.content :global(.row) {
			grid-template-columns: 1fr;
		}
	}
</style>
