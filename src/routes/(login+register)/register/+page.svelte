<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';
	import Busy from '#lib/components/Busy.svelte';

	let { form }: PageProps = $props();

	let submitting = $state(false);
	let password = $state('');
	let repetition = $state('');
</script>

<svelte:head>
	<title>Registrieren – HWR Novice</title>
</svelte:head>

<h1>Registrieren</h1>

<form
	method="POST"
	use:enhance={() => {
		submitting = true;
		return async ({ result, update }) => {
			await update({ reset: false });
			if (result.type === 'failure') {
				password = '';
				repetition = '';
			}
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
			minlength="3"
			maxlength="32"
			required
			value={form?.username ?? ''}
		/>
	</label>

	<label>
		Passwort
		<input
			name="password"
			type="password"
			autocomplete="new-password"
			minlength="8"
			required
			bind:value={password}
		/>
	</label>

	<label>
		Passwort wiederholen
		<input
			name="repetition"
			type="password"
			autocomplete="new-password"
			minlength="8"
			required
			bind:value={repetition}
		/>
	</label>

	<button type="submit" disabled={submitting}>
		<Busy pending={submitting}>Registrieren</Busy>
	</button>
</form>

<p class="switch">
	Schon registriert? <a href={resolve('/(login+register)/login')}>Zum Einloggen</a>
</p>
