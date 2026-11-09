<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}
	let { data }: Props = $props();
</script>

<h1>Module</h1>
<p>Hier kannst du deine Module verwalten.</p>
<ul>
	{#each data.modules as module (module.id)}
		<li>
			<form method="POST" action="?/delete-module" use:enhance>
				<input type="hidden" name="id" value={module.id} />
				<span>{module.name}</span>
				<button type="submit">Löschen</button>
			</form>
		</li>
	{:else}
		<li>Keine Module gefunden.</li>
	{/each}
</ul>

<form method="POST" action="?/add-module" use:enhance>
	<input type="text" name="name" placeholder="Name" />
	<button type="submit">Modul hinzufügen</button>
</form>

<style>
	li form {
		display: flex;
		width: 350px;
		justify-content: space-between;
		gap: 1rem;
		padding-bottom: 0.5rem;
	}
</style>
