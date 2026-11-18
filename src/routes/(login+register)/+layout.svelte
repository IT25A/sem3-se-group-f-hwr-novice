<script lang="ts">
	import { resolve } from '$app/paths';

	let { children } = $props();
</script>

<div class="page">
	<aside>
		<a class="brand" href={resolve('/')}>HWR Novice</a>
		<p>Das Zeitmanagementtool für HWR Student*innen und Noviz*innen.</p>
	</aside>
	<main>
		<div class="card">
			{@render children()}
		</div>
	</main>
</div>

<style>
	.page {
		display: flex;
		min-height: 100dvh;
		font-family: 'Inter', sans-serif;
	}

	aside {
		box-sizing: border-box;
		width: 30%;
		min-width: 18rem;
		padding: 5rem 2.5rem;
		background-color: var(--hwr-red);
		color: var(--background);
	}

	.brand {
		display: block;
		font-family: 'Cormorant Garamond', serif;
		font-size: 3.5rem;
		line-height: 1.1;
		color: inherit;
		text-decoration: none;
	}

	aside p {
		margin: 1.5rem 0 0;
		font-size: 1.1rem;
		line-height: 1.75;
	}

	main {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
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
		margin: 0 0 1.25rem;
		font-family: 'Cormorant Garamond', serif;
		font-size: 3rem;
		font-weight: 600;
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

	@media (max-width: 48rem) {
		.page {
			flex-direction: column;
		}

		aside {
			width: auto;
			min-width: 0;
			padding: 1.25rem 1.5rem;
		}

		.brand {
			font-size: 2.5rem;
		}

		aside p {
			display: none;
		}

		main {
			align-items: flex-start;
		}
	}
</style>
