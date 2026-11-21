<script lang="ts">
	import { courseName } from '#lib/courses/label.ts';
	import { enhance, type SubmitFunction } from '$app/forms';
	import { refreshAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { pomodoro } from '#lib/pomodoro.svelte.ts';
	import Busy from '#lib/components/Busy.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import type { PageProps } from './$types';
	import { Pending } from '#lib/pending.ts';

	let { data, form }: PageProps = $props();

	const fields = [
		{ key: 'work', label: 'Fokuszeit (Min.)', min: 1, max: 180 },
		{ key: 'short', label: 'Kurzpause (Min.)', min: 1, max: 60 },
		{ key: 'long', label: 'Langpause (Min.)', min: 1, max: 60 },
		{ key: 'every', label: 'Fokuszeit bis zur Langpause', min: 2, max: 10 }
	] as const;

	let retrying = $state(false);
	let saving = $state(false);
	let saved = $state(false); // shows the dashboard link
	let confirmed = $state(false); // shows "Gespeichert" on the button for a moment
	let confirmedTimer: ReturnType<typeof setTimeout>;
	let defaultsSaved = $state(false);
	let defaultsTimer: ReturnType<typeof setTimeout>;
	let revealed = $state(false);

	// the link without the secret, so the page can be shown on a shared screen
	const masked = $derived(
		data.ical.url?.replace(/\/ical\/[^/]+\.ics$/, `/ical/${'•'.repeat(26)}.ics`)
	);

	// a new link starts hidden again
	$effect(() => {
		if (data.ical.url) revealed = false;
	});

	async function retry() {
		retrying = true;
		try {
			// keep the indicator visible for a moment, even if the retry fails instantly
			await Promise.all([refreshAll(), new Promise((resolve) => setTimeout(resolve, 800))]);
		} finally {
			retrying = false;
		}
	}

	// Saves the defaults and shows a short confirmation.
	function saveDefaults() {
		pomodoro.applyConfig();
		defaultsSaved = true;
		clearTimeout(defaultsTimer);
		defaultsTimer = setTimeout(() => (defaultsSaved = false), 2000);
	}

	const pending = new Pending();

	let notice = $state<string | null>(null);
	let fresh = $state(false);
	let opening = $state(false);
	let noticeTimer: ReturnType<typeof setTimeout>;

	function flash(message: string, highlight = false) {
		notice = message;
		fresh = highlight;
		clearTimeout(noticeTimer);
		noticeTimer = setTimeout(() => {
			notice = null;
			fresh = false;
		}, 2500);
	}

	function openCalendarApp() {
		opening = true;
		setTimeout(() => (opening = false), 2000);
		location.href = webcalUrl ?? '';
	}

	// Saves the checkboxes and shows a short confirmation.
	const saveSources: SubmitFunction = () => {
		return async ({ result, update }) => {
			await update({ reset: false });
			if (result.type === 'success') {
				flash('✓ Gespeichert');
			}
		};
	};

	let copied = $state(false);
	let copiedTimer: ReturnType<typeof setTimeout>;

	async function copyLink() {
		if (!data.ical.url) return;
		try {
			await navigator.clipboard.writeText(data.ical.url);
			copied = true;
			clearTimeout(copiedTimer);
			copiedTimer = setTimeout(() => (copied = false), 2000);
		} catch {
			// no access to the clipboard, the field can still be selected by hand
		}
	}

	// webcal:// opens the "subscribe" dialog of the calendar app directly
	const webcalUrl = $derived(data.ical.url?.replace(/^https?:/, 'webcal:'));
</script>

<h1>Einstellungen</h1>
<section>
	<h2>Kurs</h2>
	<p>
		Wähle deinen Studiengang und Kurs. Das Semester berechnen wir aus dem Studienbeginn, das ist das
		Jahr deines ersten Semesters (z. B. 2025).
	</p>

	{#if data.current}
		<div class="current">
			<span>Aktuell:</span>
			<span class="pill">{courseName(data.current.value)}</span>
			<span class="pill">Studienbeginn {data.current.cohort}</span>
			<span class="pill">Semester {data.current.semester}</span>
		</div>
	{/if}

	{#if data.optionsError}
		<div class="error" role="alert">
			<p>
				Die Kursliste konnte gerade nicht geladen werden. Der Stundenplan-Dienst ist vermutlich
				nicht erreichbar.
			</p>
			<button
				type="button"
				class="secondary"
				disabled={retrying}
				aria-busy={retrying}
				onclick={retry}
			>
				<Busy pending={retrying}>Erneut versuchen</Busy>
			</button>
		</div>
	{:else}
		<form
			method="POST"
			action="?/course"
			oninput={() => {
				saved = false;
				confirmed = false;
			}}
			use:enhance={() => {
				saving = true;
				saved = false;
				confirmed = false;

				return async ({ result, update }) => {
					await update({ reset: false });
					saving = false;
					saved = result.type === 'success';

					if (saved) {
						confirmed = true;
						clearTimeout(confirmedTimer);
						confirmedTimer = setTimeout(() => (confirmed = false), 2000);
					}
				};
			}}
		>
			<label>
				Studiengang und Kurs
				<select name="course" required>
					<option value="none">Kein Stundenplan (nur eigene Module)</option>
					{#each data.options as option (option)}
						<option value={option} selected={option === (form?.value ?? data.current?.value)}>
							{courseName(option)}
						</option>
					{/each}
				</select>
			</label>

			<label>
				Studienbeginn (Jahr)
				<input
					type="number"
					name="cohort"
					min="2020"
					max={data.year}
					value={form?.cohort ?? data.current?.cohort ?? data.year}
					required
				/>
			</label>

			<div class="save">
				<button type="submit" disabled={saving}>
					<Busy pending={saving}>
						<span class="labels">
							<span class:invisible={confirmed}>Speichern</span>
							<span class:invisible={!confirmed}>✓ Gespeichert</span>
						</span>
					</Busy>
				</button>
				<p class="next" role="status">
					{#if saved}
						<span class="sr-only">Gespeichert</span>
						<a href={resolve('/(auth)/(navbar)/(calendar)/dashboard')}>Weiter zum Dashboard</a>
					{/if}
				</p>
			</div>
		</form>
	{/if}
	{#if form?.error}
		<p class="error">{form.error}</p>
	{/if}
</section>

<section>
	<div class="head">
		<h2>Kalender-Link</h2>
		<span class="saved" role="status">
			{#if notice}<span class="saved" role="status">{notice}</span>{/if}
		</span>
	</div>
	<p>
		Über diesen Link kann eine Kalender-App auf Handy oder Computer deinen Stundenplan und deine
		Termine abrufen und regelmäßig aktualisieren. Bearbeiten kannst du sie weiterhin hier in HWR
		Novice.
	</p>

	{#if data.ical.url}
		<form
			method="POST"
			action="?/icalSources"
			onchange={(event) => event.currentTarget.requestSubmit()}
			use:enhance={saveSources}
		>
			<fieldset>
				<legend>Der Link enthält</legend>
				<label class="check">
					<input
						type="checkbox"
						name="lessons"
						checked={data.ical.lessons}
						disabled={!data.current}
					/>
					HWR Berlin - Stundenplan
					{#if !data.current}<small>(kein Kurs gewählt)</small>{/if}
				</label>
				<label class="check">
					<input type="checkbox" name="private" checked={data.ical.privateEvents} />
					Private Termine
				</label>
				<label class="check">
					<input type="checkbox" name="public" checked={data.ical.publicEvents} />
					Öffentliche Termine
				</label>
			</fieldset>
		</form>

		<div class="link">
			<div class="field" class:fresh>
				<input
					readonly
					class:masked={!revealed}
					value={revealed ? data.ical.url : masked}
					aria-label="Link zum Kalender"
					onfocus={(event) => revealed && event.currentTarget.select()}
				/>
				<button
					type="button"
					aria-label={revealed ? 'Link verbergen' : 'Link anzeigen'}
					title={revealed ? 'Verbergen' : 'Anzeigen'}
					onclick={() => (revealed = !revealed)}
				>
					<Icon name={revealed ? 'eye-off' : 'eye'} />
				</button>
				<button type="button" aria-label="Link kopieren" title="Kopieren" onclick={copyLink}>
					<Icon name={copied ? 'check' : 'copy'} />
				</button>
			</div>

			<div class="actions">
				<button type="button" onclick={openCalendarApp}>
					<Busy pending={opening}>In Kalender-App öffnen</Busy>
				</button>

				<div class="manage">
					<form
						method="POST"
						action="?/icalToken"
						use:enhance={pending.submit(
							'rotate',
							'Neuen Link erzeugen? Der bisherige Link funktioniert danach nicht mehr.',
							() => flash('✓ Neuer Link erzeugt', true)
						)}
					>
						<button type="submit" class="secondary" disabled={pending.has('rotate')}>
							<Busy pending={pending.has('rotate')}>Neu erzeugen</Busy>
						</button>
					</form>
					<form
						method="POST"
						action="?/icalOff"
						use:enhance={pending.submit(
							'off',
							'Link löschen? Kalender-Apps, die ihn nutzen, erhalten danach keine Termine mehr.',
							() => flash('✓ Link gelöscht')
						)}
					>
						<button type="submit" class="secondary danger" disabled={pending.has('off')}>
							<Busy pending={pending.has('off')}>Link löschen</Busy>
						</button>
					</form>
				</div>
			</div>
		</div>

		<p class="hint-text">
			Da jeder mit dem Link die ausgewählten Termine sehen kann, solltest du ihn wie ein Passwort
			behandeln. Deshalb bleibt er verborgen, bis du ihn anzeigst. Gerät er in falsche Hände,
			erzeugst du mit „Neu erzeugen“ einen neuen Link, und der alte wird ungültig.
		</p>
		<p class="hint-text">
			Auf iPhone und Mac öffnet „In Kalender-App öffnen“ direkt den Dialog zum Hinzufügen. In Google
			Kalender kopierst du den Link und fügst ihn am Computer unter „Weitere Kalender“ und dort bei
			„Per URL“ hinzu, danach erscheint er meist auch in der App auf dem Handy. Bei anderen Apps
			suchst du nach einer Option wie „Kalender per URL hinzufügen“. Änderungen werden je nach App
			nicht sofort sichtbar, bei Google dauert es oft mehrere Stunden.
		</p>
	{:else}
		<form
			method="POST"
			action="?/icalToken"
			use:enhance={pending.submit('create', undefined, () => flash('✓ Link erzeugt', true))}
		>
			<button type="submit" disabled={pending.has('create')}>
				<Busy pending={pending.has('create')}>Link erzeugen</Busy>
			</button>
		</form>
	{/if}
</section>

<section>
	<div class="head">
		<h2>Pomodoro-Standardwerte</h2>
		<span class="saved" role="status">
			{#if defaultsSaved}✓ Gespeichert{/if}
		</span>
	</div>
	<p>
		Diese Werte gelten, wenn du auf der Pomodoro-Seite nichts anderes wählst. Sie werden sofort
		gespeichert, und zwar in diesem Browser.
	</p>
	{#if pomodoro.status !== 'idle'}
		<p class="hint">Änderungen sind nur möglich, solange kein Intervall läuft.</p>
	{/if}

	<div class="fields">
		{#each fields as field (field.key)}
			<label>
				{field.label}
				<input
					type="number"
					min={field.min}
					max={field.max}
					bind:value={pomodoro.config[field.key]}
					onchange={saveDefaults}
					disabled={pomodoro.status !== 'idle'}
				/>
			</label>
		{/each}
	</div>
</section>

<style>
	h1 {
		font-family: 'Cormorant Garamond', serif;
		font-size: 4rem;
		font-weight: 600;
		margin: 0 0 0.4rem 0;
		padding-top: 2.5rem;
	}

	.head {
		display: flex;
		align-items: center;
		justify-content: flex-start;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
	}

	h2 {
		margin: 0;
	}

	p {
		font-size: 1rem;
		line-height: 1.75;
		margin: 0.5rem 0 0 0;
	}

	section {
		border: 1px solid var(--border);
		background-color: var(--surface);
		padding: 1rem 1.5rem 1.5rem;
		max-width: 40rem;
		margin-bottom: 1.5rem;
	}

	fieldset {
		margin: 0;
		padding: 0;
		border: 0;
	}

	legend {
		margin-bottom: 0.6rem;
		padding: 0;
		font-size: 0.95rem;
		font-weight: 600;
	}

	.check {
		flex-direction: row;
		align-items: center;
		gap: 0.6rem;
		font-weight: 400;
	}

	.check + .check {
		margin-top: 0.6rem;
	}

	.check input {
		width: 1.1rem;
		height: 1.1rem;
		padding: 0;
		accent-color: var(--hwr-red);
	}

	.check small {
		color: var(--secondary);
	}

	/* Field and the two icon buttons form one control */
	.field {
		display: flex;
		border-radius: 0.5rem;
	}

	/* Short green glow after a new link was created */
	.field.fresh {
		animation: highlight 1.2s ease-out;
	}

	@keyframes highlight {
		from {
			box-shadow: 0 0 0 3px rgb(46 125 50 / 0.45);
		}
		to {
			box-shadow: 0 0 0 3px transparent;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.field.fresh {
			animation: none;
		}
	}

	.field input {
		flex: 1;
		min-width: 0;
		box-sizing: border-box;
		border-radius: 0.5rem 0 0 0.5rem;
		background-color: var(--background);
		text-overflow: ellipsis;
		font-size: 0.95rem;
	}

	.field input.masked {
		user-select: none;
	}

	.field button {
		display: grid;
		place-items: center;
		align-self: stretch;
		width: 2.75rem;
		padding: 0;
		border: 1px solid var(--border);
		border-left: 0;
		border-radius: 0;
		background-color: white;
		color: var(--primary);
	}

	.field button:last-child {
		border-radius: 0 0.5rem 0.5rem 0;
	}

	.field button:hover {
		background-color: var(--background);
	}

	/* Main action on the left, rarely used ones on the right */
	.actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem 1rem;
		margin-top: 0.75rem;
	}

	.actions button {
		min-height: 2.6rem;
		padding: 0 1.25rem;
	}

	.manage {
		display: flex;
		gap: 0.5rem;
	}

	.manage form {
		margin: 0;
	}

	.manage .danger {
		color: var(--hwr-red);
	}

	.manage .danger:hover {
		border-color: var(--hwr-red);
		background-color: #fdecec;
	}

	.link {
		margin-top: 1rem;
	}

	.link + .hint-text {
		margin-top: 1.25rem;
	}

	.hint-text {
		font-size: 0.9rem;
		line-height: 1.6;
		color: var(--secondary);
	}

	.current {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 1rem;
		color: var(--secondary);
	}

	form,
	.fields {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-top: 1rem;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-size: 0.95rem;
		font-weight: 600;
	}

	select,
	input {
		padding: 0.65rem 0.9rem;
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

	.fields label {
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.fields input {
		width: 5rem;
	}

	button {
		align-self: flex-start;
		padding: 0.75rem 1.5rem;
		border: 0;
		border-radius: 0.5rem;
		background-color: var(--hwr-red);
		color: white;
		font: inherit;
		font-weight: 700;
		cursor: pointer;
		line-height: 1.25;
	}

	button:hover {
		background-color: var(--hwr-red-darker);
	}

	.error {
		padding: 0.75rem 1rem;
		border: 1px solid var(--hwr-red);
		border-radius: 0.5rem;
		background-color: #fdecec;
		color: #8f1a1b;
		margin-top: 0.75rem;
	}

	.error p {
		margin: 0 0 0.75rem;
	}

	.error button {
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	button:disabled {
		opacity: 0.6;
		cursor: wait;
	}

	.secondary {
		border: 1px solid var(--border);
		background-color: white;
		color: var(--primary);
	}

	.secondary:hover {
		border-color: var(--secondary);
		background-color: var(--background);
	}

	.hint {
		color: var(--hwr-red);
	}

	.save {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.save button {
		align-self: center;
	}

	.saved {
		margin: 0;
		color: #1a7f37;
		font-weight: 600;
		line-height: 1.25;
	}

	.next a {
		color: var(--hwr-red);
		font-weight: 600;
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

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}

	@media (max-width: 36rem) {
		.actions > button {
			flex: 1 1 100%;
		}
	}
</style>
