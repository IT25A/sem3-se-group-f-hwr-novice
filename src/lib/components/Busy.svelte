<script lang="ts">
	import type { Snippet } from 'svelte';

	let { pending, children }: { pending: boolean; children: Snippet } = $props();
</script>

<span class="busy" class:pending>
	<span class="label">{@render children()}</span>
	<span class="spinner" aria-hidden="true"></span>
</span>

<style>
	.busy {
		display: inline-grid;
		place-items: center;
	}

	/* Label and spinner share one cell, so the button never changes its width */
	.label,
	.spinner {
		grid-area: 1 / 1;
	}

	.spinner {
		width: 1rem;
		height: 1rem;
		border: 2px solid currentColor;
		border-right-color: transparent;
		border-radius: 50%;
		opacity: 0;
	}

	/* Only show it when the answer takes longer than ~200 ms */
	.pending .label {
		animation: fade-out 0.15s 0.2s forwards;
	}

	.pending .spinner {
		animation:
			fade-in 0.15s 0.2s forwards,
			spin 0.7s linear infinite;
	}

	@keyframes fade-in {
		to {
			opacity: 1;
		}
	}

	@keyframes fade-out {
		to {
			opacity: 0;
		}
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
