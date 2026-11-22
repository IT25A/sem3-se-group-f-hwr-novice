<script lang="ts">
	import { resolve } from '$app/paths';

	const features = [
		{
			emoji: '📚',
			title: 'Pomodoro Timer',
			text: 'Konzentriert lernen in festen Zeitblöcken, mit Pausen und Auswertung pro Modul.',
			points: [
				'Fokuszeit und Pausen frei einstellbar',
				'Wochenübersicht im Vergleich zur Vorwoche',
				'Soll und Ist im Selbststudium pro Modul'
			]
		},
		{
			emoji: '🎓',
			title: 'Credits Tracker',
			text: 'Behalte ECTS, Module und Klausuren Deines Studiums im Blick.',
			points: [
				'ECTS-Ring auf dem Weg zu 210 Credits',
				'Klausurtermine mit Countdown',
				'Semesterverlauf auf einer Zeitleiste'
			]
		},
		{
			emoji: '💻',
			title: 'Stunden- und Eventplaner',
			text: 'Der Stundenplan Deines Kurses und eigene Termine in einem Kalender.',
			points: [
				'Stundenplan Deines Kurses automatisch übernommen',
				'Eigene Termine, privat oder für den Kurs sichtbar',
				'Agenda auf dem Dashboard inklusive Wegezeit'
			]
		}
	];
</script>

<svelte:head>
	<title>HWR Novice</title>
	<meta name="theme-color" content="#d82425" />
</svelte:head>

<div class="page">
	<header class="hero">
		<div class="inner">
			<p class="subtitle">Akademische Zeitmanagement Applikation</p>
			<h1>Willkommen bei <span>HWR Novice</span></h1>
			<h2 class="subline">Das Zeitmanagementtool für HWR Student*innen und Noviz*innen!</h2>
			<p class="lead">
				Frei zugängliche webgestützte Funktionen für alle Student*innen der HWR bzw. der Hochschule
				für Wirtschaft und Recht in Berlin.
			</p>
			<div class="actions">
				<a class="button primary" href={resolve('/(login+register)/register')}>
					Jetzt registrieren
				</a>
				<a class="button" href={resolve('/(login+register)/login')}>Einloggen</a>
			</div>
		</div>
	</header>

	<main>
		<ul class="features">
			{#each features as feature (feature.title)}
				<li>
					<span class="emoji" aria-hidden="true">{feature.emoji}</span>
					<h3>{feature.title}</h3>
					<p>{feature.text}</p>
					<ul class="points">
						{#each feature.points as point (point)}
							<li>{point}</li>
						{/each}
					</ul>
				</li>
			{/each}
		</ul>
	</main>

	<section class="band">
		<div class="inner">
			<h2>Bereit für Dein nächstes Semester?</h2>
			<p>Registriere Dich und plane Lernen, Module und Termine an einem Ort.</p>
			<div class="actions">
				<a class="button primary" href={resolve('/(login+register)/register')}>
					Jetzt registrieren
				</a>
				<a class="button" href={resolve('/(login+register)/login')}>Einloggen</a>
			</div>
		</div>
	</section>

	<footer>HWR Novice · Ein Studierendenprojekt an der HWR Berlin</footer>
</div>

<style>
	.page {
		min-height: 100dvh;
		background-color: var(--background);
		font-family: 'Inter', sans-serif;
		color: var(--primary);
	}

	.inner {
		box-sizing: border-box;
		max-width: var(--max-width);
		margin: 0 auto;
		padding: 5rem 1.5rem;
	}

	/* ---------- Hero ---------- */
	.hero {
		background: linear-gradient(135deg, #ffffff 0%, #f9ecee 100%);
		border-top: 0.5rem solid var(--hwr-red);
		border-bottom: 1px solid var(--border);
	}

	.subtitle {
		margin: 0 0 1rem;
		font-size: 0.9rem;
		font-weight: 600;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: var(--hwr-red);
	}

	h1 {
		margin: 0 0 0.5rem;
		font-family: 'Cormorant Garamond', serif;
		font-size: clamp(2.75rem, 7vw, 4.5rem);
		font-weight: 600;
		line-height: 1.05;
	}

	h1 span {
		color: var(--hwr-red);
	}

	.subline {
		margin: 0 0 1.5rem;
		font-family: 'Cormorant Garamond', serif;
		font-size: clamp(1.5rem, 3.5vw, 2.2rem);
		font-weight: 500;
		line-height: 1.2;
		color: var(--secondary);
	}

	.lead {
		max-width: 44rem;
		margin: 0;
		font-size: 1.15rem;
		line-height: 1.75;
		color: var(--secondary);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-top: 2rem;
	}

	.button {
		padding: 0.75rem 1.5rem;
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		background-color: var(--surface);
		color: var(--primary);
		font-weight: 700;
		text-decoration: none;
		transition:
			background-color 0.2s,
			color 0.2s;
	}

	.button:hover {
		background-color: var(--background);
	}

	.button.primary {
		border-color: var(--hwr-red);
		background-color: var(--hwr-red);
		color: #fff;
	}

	.button.primary:hover {
		border-color: var(--hwr-red-darker);
		background-color: var(--hwr-red-darker);
	}

	/* ---------- Features ---------- */
	main {
		box-sizing: border-box;
		max-width: var(--max-width);
		margin: 0 auto;
		padding: 3rem 1.5rem 4rem;
	}

	.features {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1.5rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.features > li {
		padding: 1.5rem;
		border: 1px solid var(--border);
		border-top: 4px solid var(--hwr-red);
		background-color: var(--surface);
	}

	.emoji {
		display: grid;
		place-items: center;
		width: 3rem;
		height: 3rem;
		margin-bottom: 1rem;
		background-color: #f9ecee;
		font-size: 1.5rem;
	}

	h3 {
		margin: 0 0 0.4rem;
		font-family: 'Cormorant Garamond', serif;
		font-size: 1.6rem;
		font-weight: 600;
	}

	.features > li > p {
		margin: 0;
		line-height: 1.6;
		color: var(--secondary);
	}

	.points {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		margin: 1.25rem 0 0;
		padding: 1.25rem 0 0;
		border-top: 1px solid var(--border);
		list-style: none;
	}

	.points li {
		position: relative;
		padding-left: 1.25rem;
		line-height: 1.5;
	}

	.points li::before {
		content: '';
		position: absolute;
		top: 0.5em;
		left: 0;
		width: 0.5rem;
		height: 0.5rem;
		background-color: var(--hwr-red);
	}

	/* ---------- Closing band ---------- */
	.band {
		background-color: var(--hwr-red);
		color: var(--background);
		text-align: center;
	}

	.band .inner {
		padding: 4rem 1.5rem;
	}

	.band h2 {
		margin: 0 0 0.5rem;
		font-family: 'Cormorant Garamond', serif;
		font-size: clamp(2rem, 5vw, 3rem);
		font-weight: 600;
		line-height: 1.1;
	}

	.band p {
		margin: 0;
		font-size: 1.1rem;
		line-height: 1.6;
	}

	.band .actions {
		justify-content: center;
	}

	.band .button {
		border-color: rgb(255 255 255 / 0.7);
		background-color: transparent;
		color: #fff;
	}

	.band .button:hover {
		background-color: #fff;
		color: var(--hwr-red);
	}

	.band .button.primary {
		border-color: #fff;
		background-color: #fff;
		color: var(--hwr-red);
	}

	.band .button.primary:hover {
		border-color: var(--background);
		background-color: var(--background);
	}

	footer {
		padding: 1.5rem;
		text-align: center;
		font-size: 0.9rem;
		color: var(--secondary);
	}

	@media (max-width: 52rem) {
		.features {
			grid-template-columns: 1fr;
		}

		.inner,
		.band .inner {
			padding: 3rem 1.25rem;
		}
	}
</style>
