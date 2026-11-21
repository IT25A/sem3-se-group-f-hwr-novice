<script lang="ts">
	import type { Snippet } from 'svelte';

	// value is a percentage from 0 to 100. The color comes from --accent, the content is shown in the middle
	let { value, children }: { value: number; children?: Snippet } = $props();
</script>

<div class="ring" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={value}>
	<svg viewBox="0 0 100 100" aria-hidden="true">
		<circle class="track" cx="50" cy="50" r="42" pathLength="100" />
		<circle class="value" cx="50" cy="50" r="42" pathLength="100" stroke-dasharray="{value} 100" />
	</svg>
	<div class="center">{@render children?.()}</div>
</div>

<style>
	.ring {
		position: relative;
		flex-shrink: 0;
		width: 8rem;
		aspect-ratio: 1;
	}

	svg {
		width: 100%;
		height: 100%;
		transform: rotate(-90deg);
	}

	circle {
		fill: none;
		stroke-width: 9;
	}

	.track {
		stroke: var(--border);
	}

	.value {
		stroke: var(--accent, var(--hwr-red));
		transition: stroke-dasharray 0.3s;
	}

	.center {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}
</style>
