<script lang="ts">
    import { resolve } from '$app/paths';
</script>

<header>
    <div class="hero">
        <div class="hero-content">
            <p class="subtitle">Akademische Zeitmanagement Applikation</p>
            <br>
            <h1>Willkommen bei HWR Novice</h1>
            <br>
            <h2 class="subline">Das Zeitmanagementtool für HWR Student*innen und Noviz*innen!</h2>
            <div class="hero-badges">
                <span>📚 Pomodoro Timer</span>
                <span>🎓 Credits Tracker</span>
                <span>💻 Stunden- und Eventplaner</span>
            </div>
            <br>
            <p class="lead">Frei zugängliche webgestützte Funktionen für alle Student*innen der HWR bzw. der Hochschule
                für Wirtschaft und Recht in Berlin.</p>
        </div>
    </div>
</header>

<nav>
    <ul>
        <li><a href={resolve('/login')}>Einloggen</a></li>
        <li><a href={resolve('/register')}>Registrieren</a></li>
    </ul>
</nav>

<main></main>

<style>
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }

    h1 {
        font-family: "Cormorant Garamond", serif;
        font-size: 4rem;
        font-weight: 600;
        margin-bottom: .4rem;
    }

    h2 {
        font-family: "Cormorant Garamond", serif;
        font-size: 2.4rem;
        margin-bottom: 1rem;
    }

    p {
        margin-bottom: 1.25rem;
    }

    .lead {
        font-size: 1.2rem;
        color: var(--secondary);
        max-width: 800px;
        font-family: "Inter", sans-serif;
        line-height: 1.75;
    }

    .hero {
        padding: 120px 50px;
        background: linear-gradient(
                135deg,
                #ffffff 0%,
                #f9ecee 100%
        );
    }

    .hero-content {
        max-width: var(--max-width);
        margin: auto;
        font-family: "Inter", sans-serif;
    }

    .subtitle {
        letter-spacing: 4px;
        text-transform: uppercase;
        color: var(--accent);
        margin-bottom: 20px;
        font-weight: 600;
    }

    main {
        margin: auto;
        padding: 60px 30px;
        background: var(--background);
    }

    /* ==========================================================
      NAVIGATION
    ========================================================== */
    nav {
        background: white;
        border-bottom: 1px solid var(--border);
        position: sticky;
        top: 0;
        z-index: 1000;
    }

    nav ul {
        max-width: var(--max-width);
        margin: auto;
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        list-style: none;
    }

    nav li {
        margin: 0;
    }

    nav a {
        display: block;
        padding: 20px;
        color: var(--primary);
        text-decoration: none;
        transition: .25s;
        font-family: "Inter", sans-serif;
        line-height: 1.75;
    }

    nav a:hover {
        color: var(--accent);
        font-weight: 700;
    }

    .hero-badges {
        display: flex;
        flex-wrap: wrap;
        gap: 14px;
        margin-top: 30px;
        font-family: "Inter", sans-serif;
        line-height: 1.75;
    }

    .hero-badges span {
        background: white;
        padding: 10px 18px;
        border-radius: 40px;
        box-shadow: var(--shadow);
    }
</style>