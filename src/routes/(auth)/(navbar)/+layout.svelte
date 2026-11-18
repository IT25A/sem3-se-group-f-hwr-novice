<script lang="ts">
	import type { ResolvedPathname } from '$app/types';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { PHASE_NAMES, pomodoro } from '#lib/pomodoro.svelte.ts';
	import type { LayoutProps } from './$types';

	const title = $derived(
		pomodoro.status === 'running'
			? `${pomodoro.label} · ${PHASE_NAMES[pomodoro.phase]}`
			: 'HWR Novice'
	);

	let { children, data }: LayoutProps = $props();

	onMount(() => {
		pomodoro.init(data.user.id);
		return () => pomodoro.suspend();
	});

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
			path: '/calendar',
			display: 'Kalender'
		},
		{
			path: '/modules',
			display: 'Modulübersicht'
		},
		{
			path: '/pomodoro',
			display: 'Pomodoro'
		},
		{
			path: '/course',
			display: 'Kurs'
		},
		{
			path: '/logout',
			display: 'Ausloggen',
			preventPreload: true
		}
	];

	const activePage = $derived(page.url.pathname);
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<div class="wrapper">
	<nav>
		<p>HWR Novice</p>
		<ul>
			{#each pages as page (page.path)}
				<li>
					<a
						class={activePage === page.path ? 'active' : ''}
						href={page.path}
						data-sveltekit-preload-data={page.preventPreload ? false : undefined}
					>
						{page.display}{#if page.path === '/pomodoro' && pomodoro.status !== 'idle'}
							{' '}· {pomodoro.label}{/if}
					</a>
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
		background-color: var(--hwr-red);
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
		background-color: color-mix(var(--hwr-red), #ffffff60);
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

	* {
		font-family: 'Inter', sans-serif;
	}
</style>
