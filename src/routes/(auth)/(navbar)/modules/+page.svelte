<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const number = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 });
	const percent = (done: number, total: number) =>
		total > 0 ? Math.round((done / total) * 100) : 0;
</script>

<header>
	<h1>Module</h1>
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

			<ul>
				<li>
					Präsenz: {number.format(item.presence.done)} / {number.format(item.presence.total)} LE
				</li>
				{#if item.exam.total > 0}
					<li>
						Prüfung: {item.exam.taken ? 'abgelegt' : 'steht noch aus'} ({item.exam.total} LE)
					</li>
				{/if}
				<li>
					Selbststudium: {number.format(item.selfStudy.done)} / {number.format(
						item.selfStudy.total
					)} LE
				</li>
			</ul>
			<form method="POST" action="?/toggle" use:enhance>
				<input type="hidden" name="module_id" value={item.module.id} />
				<button type="submit">
					{item.passed ? 'Markierung entfernen' : 'Als bestanden markieren'}
				</button>
			</form>
		</section>
	{/each}
</div>

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
</style>
