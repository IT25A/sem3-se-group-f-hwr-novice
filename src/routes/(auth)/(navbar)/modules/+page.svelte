<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';
	import ModuleDialog from './ModuleDialog.svelte';
	import AssignDialog from './AssignDialog.svelte';
	import Busy from '#lib/components/Busy.svelte';
	import ProgressBar from '#lib/components/ProgressBar.svelte';
	import { Pending } from '#lib/pending.ts';

	const pending = new Pending();

	let { data }: PageProps = $props();

	let moduleDialog = $state<ReturnType<typeof ModuleDialog>>();
	let assignDialog = $state<ReturnType<typeof AssignDialog>>();

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
		<div class="toolbar-actions">
			{#if data.header}
				<button type="button" class="secondary" onclick={() => assignDialog?.show()}>
					Termine zuordnen
					{#if data.unassigned.length > 0}
						<span class="count">{data.unassigned.length}</span>
					{/if}
				</button>
			{/if}
			<button type="button" class="primary" onclick={() => moduleDialog?.show()}>
				Modul anlegen
			</button>
		</div>
	</div>

	<section class="panel overall">
		<div class="overall-head">
			<h2>Gesamtfortschritt</h2>
			<p class="ects">
				<strong>{data.ects.earned}</strong> / <strong>{data.ects.total}</strong> ECTS
				<span class="percent">{percent(data.ects.earned, data.ects.total)}&nbsp;%</span>
			</p>
		</div>
		<ProgressBar value={percent(data.ects.earned, data.ects.total)} />
		{#if data.ects.earlier > 0}
			<p class="note">
				Inklusive {data.ects.earlier} ECTS aus früheren Semestern (als bestanden angenommen).
			</p>
		{/if}
	</section>

	{#if data.progress.length > 0}
		<div class="modules">
			{#each data.progress as item (item.module.id)}
				{@const toggling = pending.has(`toggle:${item.module.id}`)}
				{@const removing = pending.has(`remove:${item.module.id}`)}
				<article class="module panel" class:passed={item.passed}>
					<p class="tags">
						{#if item.module.code}<span class="pill">{item.module.code}</span>{/if}
						<span class="pill">{item.module.lp} LP</span>
						{#if item.passed}<span class="pill done">bestanden</span>{/if}
					</p>
					<h2>{item.module.name}</h2>

					<ProgressBar value={percent(item.done, item.total)} />
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

					{#if !item.includedInTotal}
						<p class="excluded">
							Zählt nicht zum Gesamtfortschritt, da das Modul nicht zum aktuellen Semester gehört.
						</p>
					{/if}
					<div class="actions">
						<form
							method="POST"
							action="?/toggle"
							use:enhance={pending.submit(`toggle:${item.module.id}`)}
						>
							<input type="hidden" name="module_id" value={item.module.id} />
							<button type="submit" class="secondary" disabled={toggling}>
								<Busy pending={toggling}>
									<span class="labels">
										<span class:invisible={!item.passed}>Markierung entfernen</span>
										<span class:invisible={item.passed}>Als bestanden markieren</span>
									</span>
								</Busy>
							</button>
						</form>
						<form
							method="POST"
							action="?/remove"
							use:enhance={pending.submit(
								`remove:${item.module.id}`,
								`Modul „${item.module.name}“ löschen?`
							)}
						>
							<input type="hidden" name="module_id" value={item.module.id} />
							<button type="submit" class="danger" disabled={removing}>
								<Busy pending={removing}>Löschen</Busy>
							</button>
						</form>
					</div>
				</article>
			{/each}
		</div>
	{:else}
		<section class="panel empty">
			<h2>Noch keine Module</h2>
			{#if data.header}
				<p>Du hast aktuell keine Module. Lege sie mit „Modul anlegen“ selbst an.</p>
			{:else}
				<p>
					Du hast noch keinen Kurs gewählt.
					<a href={resolve('/(auth)/(navbar)/settings')}>Wähle ihn in den Einstellungen</a>, um
					deinen Stundenplan einzubinden. Bei einigen Kursen werden die Module deines Semesters dann
					automatisch angelegt, sonst legst du sie selbst an.
				</p>
			{/if}
		</section>
	{/if}
</div>

<ModuleDialog bind:this={moduleDialog} />
<AssignDialog
	bind:this={assignDialog}
	unassigned={data.unassigned}
	manual={data.manual}
	modules={data.progress.map((item) => item.module)}
/>

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

	.toolbar-actions {
		display: flex;
		gap: 0.5rem;
		margin-left: auto;
	}

	.count {
		margin-left: 0.5rem;
		padding: 0.05rem 0.5rem;
		border-radius: 999px;
		background-color: var(--hwr-red);
		color: white;
		font-size: 0.8rem;
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

	.empty {
		text-align: center;
	}

	.empty p {
		margin-top: 0.5rem;
		color: var(--secondary);
		text-wrap: balance;
	}

	.empty a {
		color: var(--hwr-red);
		font-weight: 600;
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
		--bar-gap: 1.25rem;
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

	.excluded {
		margin: 0.75rem 0 0;
		font-size: 0.85rem;
		color: var(--secondary);
		font-style: italic;
	}

	.actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		margin-top: auto;
		padding-top: 1rem;
	}

	/* Form, buttons */
	input {
		padding: 0.55rem 0.8rem;
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		background-color: white;
		font: inherit;
		font-weight: 400;
	}

	button {
		padding: 0.55rem 1rem;
		border-radius: 0.5rem;
		font: inherit;
		font-weight: 700;
		cursor: pointer;
	}

	button:disabled {
		opacity: 0.6;
		cursor: wait;
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

	.labels {
		display: inline-grid;
		justify-items: center;
	}

	.labels span {
		grid-area: 1 / 1;
	}

	.invisible {
		visibility: hidden;
	}
</style>
