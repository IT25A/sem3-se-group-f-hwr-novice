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
			path: '/settings',
			display: 'Einstellungen'
		},
		{
			path: '/logout',
			display: 'Ausloggen',
			preventPreload: true
		}
	];

	const activePage = $derived(page.url.pathname);

	let open = $state(false);
	const close = () => (open = false);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="theme-color" content="#d82425" media="(max-width: 70rem)" />
</svelte:head>

<svelte:window onkeydown={(event) => event.key === 'Escape' && close()} />

<div class="wrapper">
	<header class="topbar">
		<button
			type="button"
			class="menu"
			aria-label={open ? 'Menü schließen' : 'Menü öffnen'}
			aria-expanded={open}
			aria-controls="menu"
			onclick={() => (open = !open)}
		>
			<svg
				viewBox="0 0 24 24"
				width="24"
				height="24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				aria-hidden="true"
			>
				{#if open}
					<path d="M6 6l12 12M18 6L6 18" />
				{:else}
					<path d="M4 7h16M4 12h16M4 17h16" />
				{/if}
			</svg>
		</button>
		<span class="brand">HWR Novice</span>
		{#if pomodoro.status !== 'idle'}
			<span class="timer">{pomodoro.label}</span>
		{/if}
	</header>

	{#if open}
		<button type="button" class="backdrop" tabindex="-1" aria-label="Menü schließen" onclick={close}
		></button>
	{/if}

	<nav id="menu" class:open>
		<p>HWR Novice</p>
		<ul>
			{#each pages as page (page.path)}
				<li>
					<a
						class={activePage === page.path ? 'active' : ''}
						href={page.path}
						onclick={close}
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
		max-height: calc(100dvh - var(--topbar));
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
		--topbar: 0rem;
	}

	* {
		font-family: 'Inter', sans-serif;
	}

	.topbar,
	.backdrop {
		display: none;
	}

	@media (max-width: 70rem) {
		.wrapper {
			flex-direction: column;
			--topbar: 3.5rem;
			padding-top: var(--topbar);
		}

		.topbar {
			display: flex;
			align-items: center;
			gap: 0.75rem;
			position: fixed;
			inset: 0 0 auto 0;
			z-index: 30;
			height: var(--topbar);
			padding: 0 0.75rem;
			box-sizing: border-box;
			background-color: var(--hwr-red);
			color: var(--background);
		}

		.menu {
			display: grid;
			place-items: center;
			width: 2.5rem;
			height: 2.5rem;
			border: 0;
			border-radius: 0.5rem;
			background: none;
			color: inherit;
			cursor: pointer;
		}

		.menu:hover {
			background-color: color-mix(in srgb, white 20%, transparent);
		}

		.brand {
			font-family: 'Cormorant Garamond', serif;
			font-size: 1.9rem;
			font-weight: 600;
		}

		.timer {
			margin-left: auto;
			font-weight: 700;
			font-variant-numeric: tabular-nums;
		}

		/* The menu slides in below the bar; closed, it is hidden for keyboard and screen readers too */
		nav {
			position: fixed;
			top: 3.5rem;
			bottom: 0;
			left: 0;
			z-index: 20;
			width: min(18rem, 85vw);
			min-width: 0;
			height: auto;
			padding: 1.5rem 1rem;
			overflow-y: auto;
			transform: translateX(-100%);
			visibility: hidden;
			transition:
				transform 0.25s ease,
				visibility 0s 0.25s;
		}

		nav.open {
			transform: none;
			visibility: visible;
			transition: transform 0.25s ease;
		}

		nav p {
			display: none;
		}

		.backdrop {
			display: block;
			position: fixed;
			inset: var(--topbar) 0 0 0;
			z-index: 10;
			border: 0;
			background-color: rgb(0 0 0 / 0.4);
		}

		main {
			width: 100%;
			padding: 0 1rem;
		}
	}
</style>
