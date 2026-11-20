<script lang="ts">
	import { enhance } from '$app/forms';
	import Modal from '#lib/components/Modal.svelte';
	import Busy from '#lib/components/Busy.svelte';
	import { Pending } from '#lib/pending.ts';

	const pending = new Pending();

	type Group = { title: string; count: number; next: Date | null };
	type Rule = { title: string; module: string };
	type Option = { id: string; name: string };

	let { unassigned, manual, modules }: { unassigned: Group[]; manual: Rule[]; modules: Option[] } =
		$props();

	let modal = $state<ReturnType<typeof Modal>>();

	// Opens the dialog.
	export function show() {
		modal?.show();
	}
</script>

<Modal
	bind:this={modal}
	title="Termine zuordnen"
	width={unassigned.length == 0 && manual.length === 0 ? '28rem' : '52rem'}
>
	<section>
		{#if unassigned.length > 0}
			<h3>Nicht zugeordnet</h3>
			<p class="note">
				Diese Termine gehören noch zu keinem Modul und zählen deshalb nirgends mit.
			</p>
			<ul class="rows">
				{#each unassigned as group (group.title)}
					{@const assigning = pending.has(`assign:${group.title}`)}
					<li>
						<form
							method="POST"
							action="?/assign"
							use:enhance={pending.submit(`assign:${group.title}`)}
						>
							<input type="hidden" name="title" value={group.title} />
							<span class="info">
								<strong>{group.title}</strong>
								<small>
									{group.count}
									{group.count === 1 ? 'Termin' : 'Termine'}{group.next
										? `, nächster am ${group.next.toLocaleDateString('de-DE')}`
										: ''}
								</small>
							</span>
							<select name="module_id" required aria-label="Modul für {group.title}">
								<option value="" disabled selected>Modul wählen</option>
								{#each modules as module (module.id)}
									<option value={module.id}>{module.name}</option>
								{/each}
							</select>
							<button type="submit" class="secondary" disabled={assigning}>
								<Busy pending={assigning}>Zuordnen</Busy>
							</button>
						</form>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="note done">Alle Termine sind einem Modul zugeordnet.</p>
		{/if}
	</section>

	{#if manual.length > 0}
		<section>
			<h3>Manuelle Zuordnungen</h3>
			<ul class="rows manual">
				{#each manual as rule (rule.title)}
					{@const unassigning = pending.has(`unassign:${rule.title}`)}
					<li>
						<form
							method="POST"
							action="?/unassign"
							use:enhance={pending.submit(`unassign:${rule.title}`)}
						>
							<input type="hidden" name="title" value={rule.title} />
							<span class="line">
								<strong>{rule.title}</strong>
								<span class="module">→ {rule.module}</span>
							</span>
							<button type="submit" class="quiet" disabled={unassigning}>
								<Busy pending={unassigning}>Aufheben</Busy>
							</button>
						</form>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	<div class="footer">
		<button type="button" class="secondary" onclick={() => modal?.close()}>Schließen</button>
	</div>
</Modal>

<style>
	section + section {
		margin-top: 2rem;
	}

	h3 {
		margin: 0;
		font-size: 1.15rem;
	}

	.note {
		margin: 0.5rem 0 0;
		font-size: 0.9rem;
		color: var(--secondary);
	}

	.note:first-child {
		margin: top;
	}

	.done {
		padding: 0.5rem 0;
	}

	.rows {
		margin: 0.75rem 0 0;
		padding: 0;
		list-style: none;
	}

	.rows li {
		padding: 0.75rem 0;
		border-top: 1px solid var(--border);
	}

	.rows form {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 13rem auto;
		align-items: center;
		gap: 0.5rem 0.75rem;
	}

	.rows button {
		min-width: 7rem;
	}

	.rows .quiet {
		border: 1px solid transparent;
		background: none;
		color: var(--secondary);
		font-weight: 400;
	}

	.rows .quiet:hover {
		color: var(--hwr-red);
	}

	/* only a title and one button */
	.manual form {
		grid-template-columns: minmax(0, 1fr) auto;
	}

	.rows select {
		min-width: 0;
		text-overflow: ellipsis;
	}

	.info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-width: 0;
		overflow-wrap: anywhere;
	}

	.info small {
		color: var(--secondary);
	}

	.line {
		min-width: 0;
	}

	.module {
		color: var(--secondary);
	}

	section:only-of-type + .footer {
		margin-top: 1.25rem;
	}

	.rows li:last-child {
		padding-bottom: 0;
	}

	.footer {
		display: flex;
		justify-content: flex-end;
		margin-top: 0.75rem;
		padding-top: 1rem;
		border-top: 1px solid var(--border);
	}

	@media (max-width: 46rem) {
		.rows form {
			grid-template-columns: minmax(0, 1fr) auto;
		}

		/* title on its own line, dropdown and button below */
		.rows:not(.manual) .info {
			grid-column: 1 / -1;
		}
	}
</style>
