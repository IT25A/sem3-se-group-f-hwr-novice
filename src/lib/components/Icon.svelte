<script lang="ts">
	let { name }: { name: 'eye' | 'eye-off' | 'copy' | 'check' | 'arrow-left' } = $props();
</script>

<svg
	viewBox="0 0 24 24"
	width="20"
	height="20"
	fill="none"
	stroke="currentColor"
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
>
	{#if name === 'eye'}
		<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
		<circle cx="12" cy="12" r="3" />
	{:else if name === 'eye-off'}
		<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
		<circle cx="12" cy="12" r="3" />
		<path d="M4 4l16 16" />
	{:else if name === 'copy'}
		<rect x="8" y="8" width="14" height="14" rx="2" />
		<path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
	{:else if name === 'arrow-left'}
		<path d="M19 12H5M12 19l-7-7 7-7" />
	{:else}
		<path d="M4 12l5 5L20 6" />
	{/if}
</svg>
