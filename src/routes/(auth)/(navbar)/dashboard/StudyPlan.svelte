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

	const hint = (row: Row) =>
		row.target === null ? row.name : `${row.name}: Soll ${number.format(row.target)} LE`;
</script>

<ul class="plan">
	{#each rows as row (row.id)}
		<li title={hint(row)}>
			<div class="line">
				<p class="name">
					<span
						class="state"
						class:ok={row.status === 'on-track'}
						class:behind={row.status === 'behind'}
						aria-hidden="true"
					></span>
					<span class="text">{row.name}</span>
					{#if row.status}
						<span class="sr">{row.status === 'on-track' ? '(im Plan)' : '(im Rückstand)'}</span>
					{/if}
				</p>
				<p class="numbers">{number.format(row.done)} von {number.format(row.total)} LE</p>
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
		</li>
	{/each}
</ul>

<ul class="legend">
	<li><span class="state ok"></span>im Plan</li>
	<li><span class="state behind"></span>im Rückstand</li>
	<li><span class="tick"></span>Soll bis zur Klausur, sonst bis zur letzten Veranstaltung</li>
</ul>

<style>
	.plan {
		margin: 0.5rem 0 0;
		padding: 0;
		list-style: none;
	}

	.plan li {
		position: relative;
		padding: 0.45rem 0;
	}

	.line {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
	}

	.name {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		min-width: 0;
		margin: 0;
		font-weight: 600;
	}

	.text {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.numbers {
		margin: 0;
		font-size: 0.9rem;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
		color: var(--secondary);
	}

	.state {
		flex-shrink: 0;
		width: 0.55rem;
		height: 0.55rem;
		border-radius: 50%;
		background-color: transparent;
	}

	.state.ok {
		background-color: #0f766e;
	}

	.state.behind {
		background-color: var(--hwr-red);
	}

	.bar {
		position: relative;
		height: 0.5rem;
		margin-top: 0.35rem;
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

	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem 1rem;
		margin: 0.75rem 0 0;
		padding: 0;
		list-style: none;
		font-size: 0.85rem;
		color: var(--secondary);
	}

	.legend li {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.tick {
		flex-shrink: 0;
		width: 2px;
		height: 0.9rem;
		background-color: var(--primary);
	}

	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
	}
</style>
