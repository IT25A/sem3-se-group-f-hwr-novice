<script lang="ts">
	import favicon from '#lib/assets/favicon.svg';
	import "@fontsource/inter/latin.css"
	import "@fontsource/cormorant-garamond/latin.css"
	import "../app.css"
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
