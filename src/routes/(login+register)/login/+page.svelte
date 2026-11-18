<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();

	let submitting = $state(false);
	let password = $state('');
</script>

<svelte:head>
	<title>Einloggen – HWR Novice</title>
</svelte:head>

<h1>Einloggen</h1>

<form
	method="POST"
	use:enhance={() => {
		submitting = true;
		return async ({ result, update }) => {
			await update({ reset: false });
			if (result.type === 'failure') password = '';
			submitting = false;
		};
	}}
>
	{#if form?.error}
		<p class="error" role="alert">{form.error}</p>
	{/if}
	<label>
		Benutzername
		<input
			name="username"
			type="text"
			autocomplete="username"
			required
			value={form?.username ?? ''}
		/>
	</label>
	<label>
		Passwort
		<input
			name="password"
			type="password"
			autocomplete="current-password"
			required
			bind:value={password}
		/>
	</label>

	<button type="submit" disabled={submitting}>
		{submitting ? 'Einloggen …' : 'Einloggen'}
	</button>
</form>

<p class="switch">
	Noch kein Konto? <a href={resolve('/(login+register)/register')}>Jetzt registrieren</a>
</p>
