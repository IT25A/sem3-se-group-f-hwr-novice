<script lang="ts">
	type Session = { id: string; ended_at: Date | null; minutes: number; module: string | null };
	type Day = { key: string; label: string; minutes: number; items: Session[] };

	let { sessions }: { sessions: Session[] } = $props();

	let dialog = $state<HTMLDialogElement>();
	let closing = $state(false);
	let timer: ReturnType<typeof setTimeout>;

	// Opens the panel.
	export function show() {
		clearTimeout(timer);
		closing = false;
		dialog?.showModal();
	}

	// Slides the panel out and then closes it.
	function close() {
		if (!dialog?.open || closing) return;
		closing = true;
		timer = setTimeout(finish, 400); // safety net, normally animationend comes first
	}

	function finish() {
		clearTimeout(timer);
		closing = false;
		if (dialog?.open) dialog.close();
	}

	const time = new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit' });
	const weekday = new Intl.DateTimeFormat('de-DE', {
		weekday: 'long',
		day: '2-digit',
		month: '2-digit'
	});

	const dayStart = (date: Date) =>
		new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

	function dayLabel(date: Date) {
		const days = Math.round((dayStart(new Date()) - dayStart(date)) / 86_400_000);
		if (days === 0) return 'Heute';
		if (days === 1) return 'Gestern';
		return weekday.format(date);
	}

	// Newest first, so the sessions of one day are next to each other.
	const days = $derived.by(() => {
		const result: Day[] = [];
		for (const session of sessions) {
			if (!session.ended_at) continue;
			const key = session.ended_at.toDateString();
			let day = result.at(-1);
			if (!day || day.key !== key) {
				day = { key, label: dayLabel(session.ended_at), minutes: 0, items: [] };
				result.push(day);
			}
			day.minutes += session.minutes;
			day.items.push(session);
		}
		return result;
	});
</script>

<dialog
	bind:this={dialog}
	class:closing
	aria-labelledby="history-title"
	onclick={(event) => event.target === dialog && close()}
	oncancel={(event) => {
		event.preventDefault(); // Escape: close with the animcation
		close();
	}}
	onanimationend={(event) => event.target === dialog && closing && finish()}
>
	<header>
		<h2 id="history-title">Verlauf</h2>
		<button type="button" onclick={close}>Schließen</button>
	</header>

	<div class="list">
		<p class="caption">Die Uhrzeit zeigt das Ende der Fokuszeit.</p>
		{#each days as day (day.key)}
			<section>
				<h3>
					<span>{day.label}</span>
					<span>{day.minutes} Min.</span>
				</h3>
				<ul>
					{#each day.items as session (session.id)}
						<li>
							<span class="time">{session.ended_at ? time.format(session.ended_at) : ''}</span>
							<span class="module">{session.module ?? 'Ohne Modul'}</span>
							<span>{session.minutes} Min.</span>
						</li>
					{/each}
				</ul>
			</section>
		{:else}
			<p>Noch keine abgeschlossenen Fokuszeiten.</p>
		{/each}
	</div>
</dialog>

<style>
	dialog {
		inset: 0 0 0 auto;
		width: min(26rem, 100vw);
		max-width: 100vw;
		height: 100dvh;
		max-height: none;
		margin: 0;
		padding: 0;
		border: 0;
		border-left: 1px solid var(--border);
		background-color: var(--surface);
		color: var(--primary);
	}

	dialog[open] {
		display: flex;
		flex-direction: column;
		animation: slide-in 0.25s ease-out;
	}

	dialog::backdrop {
		background-color: rgb(0 0 0 / 0.35);
	}

	dialog[open]::backdrop {
		animation: fade-in 0.25s ease;
	}

	dialog.closing {
		animation: slide-out 0.2s ease-in forwards;
	}

	dialog.closing::backdrop {
		animation: fade-out 0.2s ease forwards;
	}

	@keyframes slide-in {
		from {
			transform: translateX(100%);
		}
	}

	@keyframes slide-out {
		to {
			transform: translateX(100%);
		}
	}

	@keyframes fade-in {
		from {
			opacity: 0;
		}
	}

	@keyframes fade-out {
		to {
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		dialog[open],
		dialog.closing,
		dialog[open]::backdrop,
		dialog.closing::backdrop {
			animation-duration: 0.01s;
		}
	}

	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.5rem 1.5rem 1rem;
	}

	h2 {
		margin: 0;
		font-family: 'Cormorant Garamond', serif;
		font-size: 2.6rem;
		font-weight: 600;
	}

	header button {
		padding: 0.5rem 1rem;
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		background-color: white;
		font: inherit;
		font-weight: 700;
		cursor: pointer;
	}

	.list {
		flex: 1;
		overflow-y: auto;
		padding: 0 1.5rem 1.5rem;
	}

	.caption {
		margin: 0 0 1rem;
		font-size: 0.9rem;
		color: var(--secondary);
	}

	section {
		margin-bottom: 1.5rem;
	}

	h3 {
		display: flex;
		justify-content: space-between;
		margin: 0 0 0.25rem;
		padding-bottom: 0.4rem;
		border-bottom: 1px solid var(--border);
		font-size: 1rem;
	}

	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		display: grid;
		grid-template-columns: 3.5rem 1fr auto;
		gap: 0.75rem;
		padding: 0.4rem 0;
	}

	.time {
		color: var(--secondary);
		font-variant-numeric: tabular-nums;
	}
</style>
