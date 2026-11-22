<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';

	const TEXTS: Record<number, { title: string; text: string }> = {
		401: { title: 'Nicht angemeldet', text: 'Bitte melde Dich an, um diese Seite zu sehen.' },
		403: { title: 'Kein Zugriff', text: 'Für diese Seite fehlt Dir die Berechtigung.' },
		404: {
			title: 'Seite nicht gefunden',
			text: 'Diese Seite gibt es nicht (mehr). Vielleicht ist der Link veraltet oder hat einen Tippfehler.'
		}
	};

	const status = $derived(page.status);
	const info = $derived(
		TEXTS[status] ??
			(status >= 500
				? {
						title: 'Etwas ist schiefgelaufen',
						text: 'Auf unserer Seite ist ein Fehler aufgetreten. Bitte versuche es gleich noch einmal.'
					}
				: {
						title: 'Anfrage nicht möglich',
						text: 'Diese Anfrage konnte nicht verarbeitet werden.'
					})
	);
</script>

<svelte:head>
	<title>{status} · HWR Novice</title>
</svelte:head>

<div class="error">
	<div class="panel">
		<p class="code">{status}</p>
		<h1>{info.title}</h1>
		<p class="text">{info.text}</p>
		<div class="actions">
			<a class="button primary" href={resolve('/')}>Zur Startseite</a>
			{#if status >= 500}
				<button class="button" type="button" onclick={() => location.reload()}>
					Erneut versuchen
				</button>
			{:else}
				<button class="button" type="button" onclick={() => history.back()}>Zurück</button>
			{/if}
		</div>
	</div>
</div>

<style>
	.error {
		min-height: 100dvh;
		display: grid;
		place-items: center;
		padding: 2rem 1rem;
		background-color: var(--background);
		font-family: 'Inter', sans-serif;
	}

	.panel {
		width: 100%;
		max-width: 30rem;
		padding: 2.5rem 2rem;
		background-color: var(--surface);
		border: 1px solid var(--border);
		text-align: center;
	}

	.code {
		margin: 0 0 1rem;
		font-family: 'Cormorant Garamond', serif;
		font-size: 5rem;
		font-weight: 600;
		line-height: 1.1;
		font-variant-numeric: lining-nums;
		color: var(--hwr-red);
	}

	h1 {
		margin: 0 0 0.75rem;
		font-family: 'Cormorant Garamond', serif;
		font-size: 2rem;
		font-variant-numeric: lining-nums;
	}

	.text {
		margin: 0;
		color: var(--secondary);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.75rem;
		margin-top: 1.75rem;
	}

	.button {
		padding: 0.6rem 1.2rem;
		border: 1px solid var(--border);
		background-color: var(--surface);
		color: inherit;
		font: inherit;
		text-decoration: none;
		cursor: pointer;
	}

	.button.primary {
		border-color: var(--hwr-red);
		background-color: var(--hwr-red);
		color: #fff;
	}
</style>
