<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
</script>

<h1>{page.status === 404 ? 'Seite nicht gefunden' : 'Etwas ist schiefgegangen'}</h1>

{#if page.status === 404}
	<p>Diese Seite gibt es nicht.</p>
{:else}
	<p>
		Die Seite konnte gerade nicht geladen werden (Fehler {page.status}). Bitte versuche es gleich
		noch einmal.
	</p>
{/if}

<div class="buttons">
	<button type="button" onclick={() => location.reload()}>Seite neu laden</button>
	<a href={resolve('/(auth)/(navbar)/dashboard')}>Zum Dashboard</a>
</div>

<style>
	h1 {
		font-family: 'Cormorant Garamond', serif;
		font-size: 4rem;
		font-weight: 600;
		margin: 0 0 0.4rem 0;
		padding-top: 2.5rem;
	}

	p {
		margin: 0.5rem 0 0;
		line-height: 1.6;
		max-width: 40rem;
	}

	.buttons {
		display: flex;
		align-items: center;
		gap: 1.25rem;
		margin-top: 1.5rem;
	}

	button {
		padding: 0.7rem 1.1rem;
		border: 0;
		border-radius: 0.5rem;
		background-color: var(--hwr-red);
		color: white;
		font: inherit;
		font-weight: 700;
		cursor: pointer;
	}

	button:hover {
		background-color: var(--hwr-red-darker);
	}

	a {
		color: var(--hwr-red);
		font-weight: 600;
	}
</style>
