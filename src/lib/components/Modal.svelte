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
	let closing = $state(false);
	let timer: ReturnType<typeof setTimeout>;

	// Opens the dialog.
	export function show() {
		clearTimeout(timer);
		closing = false;
		dialog?.showModal();
	}

	// Plays the closing animation and then closes the dialog.
	export function close() {
		if (!dialog?.open || closing) return;
		closing = true;
		timer = setTimeout(finish, 400); // safety net, normally animationend comes first
	}

	function finish() {
		clearTimeout(timer);
		closing = false;
		if (dialog?.open) dialog.close();
	}
</script>

<dialog
	bind:this={dialog}
	class:closing
	{onclose}
	aria-labelledby={titleId}
	style:--width={width}
	oncancel={(event) => {
		event.preventDefault(); // Escape: close with the animation
		close();
	}}
	onanimationend={(event) => event.target === dialog && closing && finish()}
>
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

	dialog[open] {
		animation: pop-in 0.2s ease;
	}

	dialog[open]::backdrop {
		animation: fade-in 0.2s ease;
	}

	dialog.closing {
		animation: pop-out 0.15s ease forwards;
	}

	dialog.closing::backdrop {
		animation: fade-out 0.15s ease forwards;
	}

	@keyframes pop-in {
		from {
			opacity: 0;
			transform: translateY(0.75rem) scale(0.98);
		}
	}

	@keyframes pop-out {
		to {
			opacity: 0;
			transform: translateY(0.75rem) scale(0.98);
		}
	}

	@keyframes fade-in {
		from {
			opacity: 0;
		}
	}

	@keyframes fade-out {
		to {
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		dialog[open],
		dialog.closing,
		dialog[open]::backdrop,
		dialog.closing::backdrop {
			animation-duration: 0.01s;
		}
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
		border: 0;
		background-color: var(--hwr-red);
		color: white;
	}

	.content :global(.primary:hover) {
		background-color: var(--hwr-red-darker);
	}

	.content :global(button:disabled) {
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
