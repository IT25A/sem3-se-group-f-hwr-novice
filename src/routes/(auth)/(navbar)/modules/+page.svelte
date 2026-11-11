<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const number = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 });
	const percent = (done: number, total: number) =>
		total > 0 ? Math.round((done / total) * 100) : 0;
</script>

<header>
	<h1>Module</h1>
	<p>Dein Fortschritt im Theorieteil dieses Semesters.</p>
</header>

<div class="modules">
	{#each data.progress as item (item.module.id)}
		<section>
			<h2>
				{item.module.code}
				{item.module.name} <small>({item.module.lp} LP)</small>
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
</style>
