<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<h1>Asta Events</h1>

{#if form?.error}
	<p style="color: red">{form.error}</p>
{/if}

{#if form?.success}
	<p style="color: green">Event erfolgreich hinzugefügt!</p>
{/if}

{#if form?.deleted}
	<p style="color: green">Event erfolgreich gelöscht!</p>
{/if}

<form method="POST" action="?/add-event" use:enhance>
	<input type="text" name="title" placeholder="Titel" value={form?.title ?? ''} />
	<input type="date" name="date" value={form?.date ?? ''} />
	<input type="time" name="time" value={form?.time ?? ''} />
	<input type="text" name="location" placeholder="Ort" value={form?.location ?? ''} />
	<button type="submit">Event hinzufügen</button>
</form>

<ul>
	{#each data.events as event (event.id)}
		<li>
			<form method="POST" action="?/delete-event" use:enhance>
				<input type="hidden" name="id" value={event.id} />
				<span>{event.title} - {event.date} {event.time} - {event.location}</span>
				<button type="submit">Löschen</button>
			</form>
		</li>
	{:else}
		<li>Keine Events gefunden.</li>
	{/each}
</ul>

<style>
	li form {
		display: flex;
		width: 350px;
		justify-content: space-between;
		gap: 1rem;
		padding-bottom: 0.5rem;
	}
</style>
