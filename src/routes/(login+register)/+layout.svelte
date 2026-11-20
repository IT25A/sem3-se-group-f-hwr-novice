<script lang="ts">
	import { resolve } from '$app/paths';

	let { children } = $props();
</script>

<svelte:head>
	<meta name="theme-color" content="#f7f5f3" />
</svelte:head>

<div class="page auth-page">
	<main>
		<a class="brand" href={resolve('/')}>HWR Novice</a>
		<div class="card">
			{@render children()}
		</div>
		<p class="tagline">Das Zeitmanagementtool für HWR Student*innen und&nbsp;Noviz*innen.</p>
	</main>
</div>

<style>
	/* The area behind the status bar takes the page background on iOS 26 */
	:global(html:has(.auth-page)) {
		background-color: var(--background);
	}

	.page {
		background-color: var(--background);
		font-family: 'Inter', sans-serif;
	}

	main {
		box-sizing: border-box;
		min-height: 100dvh;
		display: grid;
		grid-template-rows: 1fr auto 1.5fr;
		justify-items: center;
		padding: 2rem;
	}

	.brand {
		align-self: end;
		margin-bottom: 1.5rem;
		font-family: 'Cormorant Garamond', serif;
		font-size: 3.5rem;
		line-height: 1.1;
		color: var(--hwr-red);
		text-decoration: none;
	}

	.tagline {
		align-self: start;
		max-width: 26rem;
		margin: 1.25rem 0 0;
		text-align: center;
		line-height: 1.6;
		color: var(--secondary);
	}

	.card {
		box-sizing: border-box;
		width: 100%;
		max-width: 26rem;
		padding: 2rem 2.25rem;
		border: 1px solid var(--border);
		background-color: var(--surface);
	}

	/* Styles for both forms (login & register) */
	.card :global(h1) {
		margin: 0 0 1.5rem;
		font-family: 'Cormorant Garamond', serif;
		font-size: 2.2rem;
		font-weight: 600;
		text-align: center;
	}

	.card :global(form) {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.card :global(label) {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-size: 0.95rem;
		font-weight: 600;
	}

	.card :global(input) {
		padding: 0.65rem 0.9rem;
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		background-color: white;
		font: inherit;
		font-weight: 400;
	}

	.card :global(input:focus-visible) {
		border-color: var(--hwr-red);
		outline: 2px solid var(--hwr-red);
		outline-offset: 1px;
	}

	.card :global(button[type='submit']) {
		padding: 0.75rem 1rem;
		border: 0;
		border-radius: 0.5rem;
		background-color: var(--hwr-red);
		color: white;
		font: inherit;
		font-weight: 700;
		cursor: pointer;
	}

	.card :global(button[type='submit']:hover) {
		background-color: var(--hwr-red-darker);
	}

	.card :global(button[type='submit']:disabled) {
		opacity: 0.6;
		cursor: wait;
	}

	.card :global(.error) {
		margin: 0;
		padding: 0.75rem 1rem;
		border: 1px solid var(--hwr-red);
		border-radius: 0.5rem;
		background-color: #fdecec;
		color: #8f1a1b;
	}

	.card :global(.switch) {
		margin: 1.25rem 0 0;
		text-align: center;
	}

	.card :global(.switch a) {
		color: var(--hwr-red);
		font-weight: 600;
	}
</style>
