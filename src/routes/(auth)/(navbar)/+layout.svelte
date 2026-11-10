<script lang="ts">
	import type { ResolvedPathname } from '$app/types';
	import { page } from '$app/state';

	let { children } = $props();

	type Page = {
		path: ResolvedPathname;
		display: string;
		preventPreload?: boolean;
	};

	const pages: Page[] = [
		{
			path: '/dashboard',
			display: 'Dashboard'
		},
		{
			path: '/modules',
			display: 'Modulübersicht'
		},
		{
			path: '/logout',
			display: 'Ausloggen',
			preventPreload: true
		}
	];

	const activePage = $derived(page.url.pathname);
</script>

<div class="wrapper">
	<nav>
		<p>HWR Novice</p>
		<ul>
			{#each pages as page (page.path)}
				<li>
					<a
						class={activePage === page.path ? 'active' : ''}
						href={page.path}
						data-sveltekit-preload-data={page.preventPreload ? 'off' : undefined}>{page.display}</a
					>
				</li>
			{/each}
		</ul>
	</nav>

	<main>
		{@render children()}
	</main>
</div>

<style>
	nav {
		top: 0;
		position: sticky;
		display: block;
		height: 100dvh;
		min-width: max-content;
		width: 15%;
		background-color: #d82425;
		padding: 5rem 1rem;
		box-sizing: border-box;
	}

	nav p {
		font-family: 'Cormorant Garamond', serif;
		font-size: 3.5em;
		text-align: center;
		color: var(--background);
	}

	main {
		width: 85%;
		padding: 0 5rem;
		max-height: 100dvh;
		overflow-y: auto;
		box-sizing: border-box;
	}

	ul {
		display: flex;
		flex-flow: column;
		list-style: none;
		padding: 0;
		gap: 0.5rem;
	}

	li {
		display: inline-flex;
	}

	li a:hover,
	.active {
		background-color: #ed4141;
		cursor: pointer;
		margin-left: 1rem;
	}

	li a {
		text-align: center;
		padding: 1rem;
		border-radius: 0.5rem;

		transition:
			background-color 0.2s,
			margin-left 0.1s;

		width: 100%;
		font-family: 'Inter', sans-serif;
		color: var(--background);
		text-decoration: none;
		font-weight: bold;
		font-size: 1.2em;
	}

	.wrapper {
		display: flex;
	}
</style>
