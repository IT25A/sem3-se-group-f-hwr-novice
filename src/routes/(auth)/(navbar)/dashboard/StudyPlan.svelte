<script lang="ts">
	type Row = {
		id: string;
		name: string;
		done: number;
		total: number;
		target: number | null;
		status: 'on-track' | 'behind' | null;
	};

	let { rows }: { rows: Row[] } = $props();

	const number = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 });
	const percent = (value: number, total: number) =>
		total > 0 ? Math.min(100, (value / total) * 100) : 0;

	// below this share the bar would look like a stray line
	const MIN_SHARE = 2;

	const fill = (done: number, total: number) => {
		const value = percent(done, total);
		return value >= MIN_SHARE ? value : 0;
	};
</script>

<ul class="plan">
	{#each rows as row (row.id)}
		<li>
			<div class="line">
				<p class="name">{row.name}</p>
				{#if row.status}
					<span class="status" class:behind={row.status === 'behind'}>
						{row.status === 'on-track' ? 'im Plan' : 'im Rückstand'}
					</span>
				{/if}
			</div>
			<div
				class="bar"
				role="progressbar"
				aria-valuemin="0"
				aria-valuemax={row.total}
				aria-valuenow={row.done}
			>
				<span class="fill" style:width="{fill(row.done, row.total)}%"></span>
				{#if row.target !== null}
					<span class="target" style:left="{percent(row.target, row.total)}%"></span>
				{/if}
			</div>
			<p class="numbers">
				{number.format(row.done)} von {number.format(row.total)} LE{#if row.target !== null}
					· Soll {number.format(row.target)}{/if}
			</p>
		</li>
	{/each}
</ul>

<p class="note">
	<span class="tick"></span>
	<span class="text">Soll bis zur Klausur, sonst bis zur letzten Veranstaltung</span>
</p>

<style>
	.plan {
		margin: 0.5rem 0 0;
		padding: 0;
		list-style: none;
	}

	li {
		padding: 0.6rem 0;
	}

	.line {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
	}

	.name {
		margin: 0;
		font-weight: 600;
	}

	.status {
		font-size: 0.8rem;
		white-space: nowrap;
		color: #0f766e;
	}

	.status.behind {
		color: var(--hwr-red);
	}

	.bar {
		position: relative;
		height: 0.6rem;
		margin-top: 0.4rem;
		border-radius: 999px;
		background-color: var(--border);
	}

	.fill {
		display: block;
		height: 100%;
		border-radius: 999px;
		background-color: #7c3aed;
		transition: width 0.3s;
	}

	.target {
		position: absolute;
		top: -0.2rem;
		bottom: -0.2rem;
		width: 2px;
		background-color: var(--primary);
		transform: translateX(-50%);
	}

	.numbers {
		margin: 0.3rem 0 0;
		font-size: 0.9rem;
		color: var(--secondary);
	}

	.note {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		margin: 0.5rem 0 0;
		font-size: 0.85rem;
		color: var(--secondary);
	}

	.tick {
		flex-shrink: 0;
		width: 2px;
		height: 0.9rem;
		margin-top: 0.15rem;
		background-color: var(--primary);
	}

	.text {
		text-wrap: balance;
	}
</style>
