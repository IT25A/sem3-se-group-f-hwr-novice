<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<h1>Neuen Termin anlegen</h1>

{#if form?.error}
	<p class="error" role="alert">{form.error}</p>
{/if}

<form method="POST" use:enhance>
    <div>
        <label for="type">Typ:
            <select id="type" name="type">
                <option value="private" selected={(form?.type ?? 'private') === 'private'}>Privater Termin</option>
                <option value="public" selected={(form?.type ?? '') === 'public'}>Kursinterner-Termin</option>

                {#if data.user.asta_member}
                    <hr>
                    <option value="global" selected={(form?.type ?? '') === 'global'}>Öffentlicher Termin</option>
                {/if}
            </select>
        </label>
    </div>

    <label>
        Titel:
        <input name="title" required value={form?.title ?? ''}>
    </label>

    <label>
        Ort:
        <input name="location" required value={form?.location ?? ''}>
    </label>

    <label>
        Beschreibung:<br>
        (optional)
        <textarea name="description" cols="50" rows="4">{form?.description ?? ''}</textarea>
    </label>

    <label>
        Start:
        <input type="datetime-local" name="start" required value={form?.start ?? ''}>
    </label>

    <label>
        Ende: (optional)
        <input type="datetime-local" name="end" value={form?.end ?? ''}>
    </label>

    <input type="submit">
</form>

<style>
    form {
        width: 40%;
        display: flex;
        gap: 1rem;
        flex-direction: column;
    }

    label {
        width: 100%;
        display: flex;
        justify-content: space-between;
    }
</style>
