<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';
	import ModuleDialog from './ModuleDialog.svelte';

	let { data }: PageProps = $props();

	let moduleDialog = $state<ReturnType<typeof ModuleDialog>>();

	const number = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 });
	const dateTime = new Intl.DateTimeFormat('de-DE', {
		weekday: 'short',
		day: '2-digit',
		month: '2-digit',
		hour: '2-digit',
		minute: '2-digit'
	});
	const percent = (done: number, total: number) =>
		total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;

	const focus = (minutes: number) =>
		minutes < 60 ? `${minutes} Min.` : `${Math.floor(minutes / 60)} Std. ${minutes % 60} Min.`;
</script>

{#snippet bar(value: number)}
	<div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={value}>
		<span style:width="{value}%"></span>
	</div>
{/snippet}

<div class="page">
	<h1>Module</h1>
	<div class="toolbar">
		{#if data.header}
			<p class="pills">
				<span class="pill">{data.header.course}</span>
				<span class="pill">Studienbeginn {data.header.cohort}</span>
				{#if data.header.semester}<span class="pill">Semester {data.header.semester}</span>{/if}
			</p>
		{/if}
		<button type="button" class="primary" onclick={() => moduleDialog?.show()}>
			Modul anlegen
		</button>
	</div>

	<section class="panel overall">
		<div class="overall-head">
			<h2>Gesamtfortschritt</h2>
			<p class="ects">
				<strong>{data.ects.earned}</strong> / <strong>{data.ects.total}</strong> ECTS
				<span class="percent">{percent(data.ects.earned, data.ects.total)}&nbsp;%</span>
			</p>
		</div>
		{@render bar(percent(data.ects.earned, data.ects.total))}
		{#if data.ects.earlier > 0}
			<p class="note">
				Inklusive {data.ects.earlier} ECTS aus früheren Semestern (als bestanden angenommen).
			</p>
		{/if}
	</section>

	{#if data.progress.length > 0}
		<div class="modules">
			{#each data.progress as item (item.module.id)}
				<article class="module" class:passed={item.passed}>
					<p class="tags">
						{#if item.module.code}<span class="pill">{item.module.code}</span>{/if}
						<span class="pill">{item.module.lp} LP</span>
						{#if item.passed}<span class="pill done">bestanden</span>{/if}
					</p>
					<h2>{item.module.name}</h2>

					{@render bar(percent(item.done, item.total))}
					<p class="progress-text">
						<span>{number.format(item.done)} von {number.format(item.total)} LE</span>
						<strong>{percent(item.done, item.total)}&nbsp;%</strong>
					</p>

					<dl class="facts">
						<div>
							<dt>Präsenz</dt>
							<dd>{number.format(item.presence.done)} / {number.format(item.presence.total)} LE</dd>
						</div>
						<div>
							<dt>Selbststudium</dt>
							<dd>
								{number.format(item.selfStudy.done)} / {number.format(item.selfStudy.total)} LE
							</dd>
						</div>
						{#if item.exam.total > 0}
							<div>
								<dt>Prüfung</dt>
								<dd class:ok={item.exam.taken}>
									{item.exam.taken ? 'Abgelegt' : 'Ausstehend'} ({number.format(item.exam.total)} LE)
								</dd>
							</div>
						{/if}
						<div>
							<dt>Fokuszeit</dt>
							<dd>{focus(item.focusMinutes)}</dd>
						</div>
					</dl>

					<dl class="facts">
						{#if item.next}
							<div>
								<dt>Nächster Termin</dt>
								<dd>{dateTime.format(item.next)}</dd>
							</div>
						{/if}
						{#if item.examAt}
							<div>
								<dt>Klausur</dt>
								<dd>{dateTime.format(item.examAt)}</dd>
							</div>
						{/if}
						{#if !item.next && !item.examAt}
							<p class="none">Keine anstehenden Termine</p>
						{/if}
					</dl>

					<div class="actions">
						<form method="POST" action="?/toggle" use:enhance>
							<input type="hidden" name="module_id" value={item.module.id} />
							<button type="submit" class="secondary">
								{item.passed ? 'Markierung entfernen' : 'Als bestanden markieren'}
							</button>
						</form>
						<form
							method="POST"
							action="?/remove"
							use:enhance={({ cancel }) => {
								if (!confirm(`Modul „${item.module.name}“ löschen?`)) cancel();
							}}
						>
							<input type="hidden" name="module_id" value={item.module.id} />
							<button type="submit" class="danger">Löschen</button>
						</form>
					</div>
				</article>
			{/each}
		</div>
	{/if}

	{#if data.unassigned.length > 0}
		<section class="panel">
			<h2>Nicht zugeordnete Termine</h2>
			<p class="note">
				Diese Termine gehören noch zu keinem Modul und zählen deshalb nirgends mit.
			</p>
			<ul class="rows">
				{#each data.unassigned as group (group.title)}
					<li>
						<form method="POST" action="?/assign" use:enhance>
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
								{#each data.progress as item (item.module.id)}
									<option value={item.module.id}>{item.module.name}</option>
								{/each}
							</select>
							<button type="submit" class="secondary">Zuordnen</button>
						</form>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if data.manual.length > 0}
		<details class="panel">
			<summary>Manuelle Zuordnungen ({data.manual.length})</summary>
			<ul class="rows">
				{#each data.manual as rule (rule.title)}
					<li>
						<form method="POST" action="?/unassign" use:enhance>
							<input type="hidden" name="title" value={rule.title} />
							<span class="info">{rule.title} → {rule.module}</span>
							<button type="submit" class="secondary">Aufheben</button>
						</form>
					</li>
				{/each}
			</ul>
		</details>
	{/if}
</div>

<ModuleDialog bind:this={moduleDialog} />

<style>
	.page {
		max-width: 60rem;
		padding-bottom: 2rem;
	}

	h1 {
		font-family: 'Cormorant Garamond', serif;
		font-size: 4rem;
		font-weight: 600;
		margin: 0 0 0.4rem 0;
		padding-top: 2.5rem;
	}

	.toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem 1rem;
		margin: 0.75rem 0 1.5rem;
	}

	.toolbar .primary {
		margin-left: auto;
	}

	h2 {
		margin: 0;
		font-size: 1.15rem;
	}

	p {
		margin: 0;
		line-height: 1.6;
	}

	/* Pills */
	.pills,
	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.pills {
		margin: 0;
	}

	.pill {
		padding: 0.2rem 0.75rem;
		border: 1px solid var(--border);
		border-radius: 999px;
		background-color: var(--background);
		font-size: 0.9rem;
	}

	.pill.done {
		border-color: var(--accent);
		background-color: color-mix(in srgb, var(--accent) 10%, white);
		color: var(--primary);
		font-weight: 600;
	}

	/* Cards */
	.panel,
	.module {
		border: 1px solid var(--border);
		background-color: var(--surface);
		padding: 1.25rem 1.5rem;
	}

	.panel {
		margin-bottom: 1.5rem;
	}

	.note {
		margin-top: 0.5rem;
		font-size: 0.85rem;
		color: var(--secondary);
	}

	/* Progress bar */
	.bar {
		height: 0.6rem;
		margin-top: 0.75rem;
		border-radius: 999px;
		background-color: var(--border);
		overflow: hidden;
	}

	.bar span {
		display: block;
		height: 100%;
		border-radius: 999px;
		background-color: var(--accent, var(--hwr-red));
		transition: width 0.3s;
	}

	/* Overall progress */
	.overall-head {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.25rem 1rem;
	}

	.ects {
		font-size: 1.25rem;
		color: var(--secondary);
	}

	.ects strong {
		color: var(--primary);
		font-weight: 700;
	}

	.percent {
		margin-left: 0.75rem;
		font-size: 1rem;
	}

	/* Modules */
	.modules {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(22rem, 1fr));
		gap: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.module {
		--accent: var(--hwr-red);
		display: flex;
		flex-direction: column;
	}

	.module.passed {
		--accent: #0d9488;
		border-color: var(--accent);
	}

	.module h2 {
		margin-top: 1rem;
	}

	.module .bar {
		margin-top: 1.25rem;
	}

	.progress-text {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		margin-top: 0.5rem;
		font-size: 0.9rem;
		color: var(--secondary);
	}

	.progress-text strong {
		color: var(--primary);
	}

	.facts {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		margin: 1rem 0 0;
	}

	.facts > div {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
	}

	dt {
		color: var(--secondary);
	}

	dd {
		margin: 0;
		font-weight: 600;
		white-space: nowrap;
		font-variant-numeric: tabular-nums;
	}

	dd.ok {
		color: #0d9488;
	}

	.none {
		color: var(--secondary);
	}

	.actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		margin-top: auto;
		padding-top: 1rem;
	}

	/* Rows (unassigned, manual) */
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
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem 0.75rem;
	}

	.info {
		flex: 1 1 14rem;
		display: flex;
		flex-direction: column;
	}

	.info small {
		color: var(--secondary);
	}

	summary {
		cursor: pointer;
		font-weight: 700;
	}

	/* Form, buttons */
	select,
	input {
		padding: 0.55rem 0.8rem;
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		background-color: white;
		font: inherit;
		font-weight: 400;
	}

	select:focus-visible,
	input:focus-visible {
		border-color: var(--hwr-red);
		outline: 2px solid var(--hwr-red);
		outline-offset: 1px;
	}

	button {
		padding: 0.55rem 1rem;
		border-radius: 0.5rem;
		font: inherit;
		font-weight: 700;
		cursor: pointer;
	}

	.primary {
		border: 0;
		background-color: var(--hwr-red);
		color: white;
	}

	.primary:hover {
		background-color: var(--hwr-red-darker);
	}

	.secondary {
		border: 1px solid var(--border);
		background-color: white;
		color: var(--primary);
	}

	.secondary:hover {
		background-color: var(--background);
	}

	.danger {
		padding-inline: 0;
		border: 0;
		background: none;
		color: var(--secondary);
		font-weight: 400;
	}

	.danger:hover {
		color: var(--hwr-red);
	}
</style>
