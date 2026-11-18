<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const number = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 });
	const dateTime = new Intl.DateTimeFormat('de-DE', {
		weekday: 'short',
		day: '2-digit',
		month: '2-digit',
		hour: '2-digit',
		minute: '2-digit'
	});
	const percent = (done: number, total: number) =>
		total > 0 ? Math.round((done / total) * 100) : 0;

	const focus = (minutes: number) =>
		minutes < 60 ? `${minutes} Min.` : `${Math.floor(minutes / 60)} Std. ${minutes % 60} Min.`;
</script>

<header>
	<h1>Module</h1>
	{#if data.header}<p>{data.header}</p>{/if}
	<p>Dein Fortschritt im Theorieteil dieses Semesters.</p>
	<section class="overall">
		<h2>Gesamtfortschritt</h2>
		<progress value={data.ects.earned} max={data.ects.total}></progress>
		<p>
			<strong>{data.ects.earned} von {data.ects.total} ECTS</strong>
			({percent(data.ects.earned, data.ects.total)}&nbsp;%)
		</p>
		<p>
			<small>
				Enthalten sind {data.ects.earlier} ECTS aus den früheren Semestern (als bestanden angenommen)
				und die als bestanden markierten Module dieses Semesters.
			</small>
		</p>
	</section>
</header>

<div class="modules">
	{#each data.progress as item (item.module.id)}
		<section class:passed={item.passed}>
			<h2>
				{item.module.code}
				{item.module.name}
				<small>({item.module.lp} LP)</small>
				{#if item.passed}<small class="badge">bestanden</small>{/if}
			</h2>

			<progress value={item.done} max={item.total}></progress>
			<p>
				{percent(item.done, item.total)}&nbsp;% ({number.format(item.done)} von {number.format(
					item.total
				)} LE)
			</p>
			<p class="dates">
				{#if item.next}Nächster Termin: {dateTime.format(item.next)}{/if}
				{#if item.examAt}{item.next ? ' · ' : ''}Klausur: {dateTime.format(item.examAt)}{/if}
				{#if !item.next && !item.exam}Keine anstehenden Termine{/if}
			</p>

			<ul>
				<li>
					Präsenz: {number.format(item.presence.done)} / {number.format(item.presence.total)} LE
				</li>
				{#if item.exam.total > 0}
					<li>
						Prüfung: {item.exam.taken ? 'abgelegt' : 'steht noch aus'} ({number.format(
							item.exam.total
						)} LE)
					</li>
				{/if}
				<li>
					Selbststudium: {number.format(item.selfStudy.done)} / {number.format(
						item.selfStudy.total
					)} LE
				</li>
				<li>
					Fokuszeit (Pomodoro): {focus(item.focusMinutes)}
				</li>
			</ul>
			<form method="POST" action="?/toggle" use:enhance>
				<input type="hidden" name="module_id" value={item.module.id} />
				<button type="submit">
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
				<button type="submit">Löschen</button>
			</form>
		</section>
	{/each}
</div>
{#if data.unassigned.length > 0}
	<section class="unassigned">
		<h2>Nicht zugeordnete Termine</h2>
		<p>Diese Termine gehören noch zu keinem Modul und zählen deshalb nirgends mit.</p>
		{#each data.unassigned as group (group.title)}
			<form method="POST" action="?/assign" use:enhance>
				<input type="hidden" name="title" value={group.title} />
				<strong>{group.title}</strong>
				({group.count} Termine{group.next
					? `, nächster am ${group.next.toLocaleDateString('de-DE')}`
					: ''})
				<select name="module_id" required>
					<option value="" disabled selected>Modul wählen</option>
					{#each data.progress as item (item.module.id)}
						<option value={item.module.id}>{item.module.name}</option>
					{/each}
				</select>
				<button type="submit">Zuordnen</button>
			</form>
		{/each}
	</section>
{/if}

{#if data.manual.length > 0}
	<section class="manual">
		<h2>Manuelle Zuordnungen</h2>
		{#each data.manual as rule (rule.title)}
			<form method="POST" action="?/unassign" use:enhance>
				<input type="hidden" name="title" value={rule.title} />
				{rule.title} → {rule.module}
				<button type="submit">Aufheben</button>
			</form>
		{/each}
	</section>
{/if}
<section class="add">
	<h2>Modul anlegen</h2>
	<form method="POST" action="?/create" use:enhance>
		<label>Name <input name="name" required maxlength="100" /></label>
		<label>Code (optional) <input name="code" maxlength="20" placeholder="IT1234" /></label>
		<label>LP <input name="lp" type="number" min="0" max="30" required /></label>
		<label>Präsenz in LE (optional) <input name="presence_le" type="number" min="0" /></label>
		<label
			>Selbststudium in LE (optional) <input name="self_study_le" type="number" min="0" /></label
		>
		<button type="submit">Anlegen</button>
		{#if form?.error}<p class="error">{form.error}</p>{/if}
	</form>
</section>

<style>
	header {
		position: sticky;
		top: 0;
		background-color: white;
		padding: 2.5rem 0 1rem;
	}

	.overall {
		box-sizing: border-box;
		max-width: 40rem;
		margin-bottom: 1.5rem;
	}

	.modules {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		max-width: 40rem;
		padding-bottom: 1.5rem;
	}

	section {
		border: 1px solid var(--border);
		padding: 1rem 1.5rem;
	}

	section.passed {
		border-color: green;
	}

	.badge {
		color: green;
		font-weight: 600;
	}

	h1 {
		font-family: 'Cormorant Garamond', serif;
		font-size: 4rem;
		font-weight: 600;
		margin: 0 0 0.4rem 0;
	}

	h2 {
		margin: 0 0 0.5rem;
	}

	h2 small {
		font-size: 1rem;
		font-weight: 400;
	}

	progress {
		width: 100%;
	}

	.dates {
		font-size: 0.9em;
		opacity: 0.8;
	}

	ul {
		margin: 0.5rem 0 0 0;
	}

	p {
		font-size: 1rem;
		line-height: 1.75;
		margin: 0.5rem 0 0 0;
	}
	li {
		line-height: 1.5;
	}

	form button {
		margin-top: 0.5rem;
	}

	.add,
	.unassigned,
	.manual {
		max-width: calc(40rem - 3rem);
		margin-bottom: 2rem;
	}

	.add form {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
</style>
