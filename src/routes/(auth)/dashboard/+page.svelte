<script lang="ts">
    import {Calendar, type CalendarEvent} from "svelte5plus-calendar";
	import type { PageProps } from "./$types";
    import { resolve } from '$app/paths';

    let { data }: PageProps = $props();

    let events = $state<CalendarEvent[]>(
        data.events.map((it, index) => ({
            id: index + "",
            title: it.title,
            start: it.start,
            end: it.end,
            location: it.location,
            description: it.description
        }))
    );
</script>


<h1>Dashboard | Hello, {data.user.name}!</h1>
<p>You got successfully forwarded to the official HWR Novice dashboard!</p>

<nav>
    <ul>
        <li><a href={resolve('/(auth)/modules')}>Pomodoro Timer</a></li>
        <li><a href={resolve('/(auth)/tracker')}>Credit Tracker</a></li>
        <li><a href={resolve('/(auth)/calendar')}>Event Calendar</a></li>
    </ul>
</nav>

<div>
    <Calendar bind:events view="week" locale="de" />
</div>


<style>
    :root {
        --background: #f7f5f3;
        --surface: #ffffff;
        --primary: #1f1f1f;
        --secondary: #5a5a5a;
        --accent: #A51C30;
        --accent-dark: #7E1525;
        --accent-light: #C74A5C;
        --border: #d8d3cf;
        --card-bg: #ffffff;
        --shadow: 0 8px 24px rgba(0, 0, 0, .08);
        --radius: 16px;
        --max-width: 1200px;
    }

    h1 {

        font-family: "Cormorant Garamond", serif;
        
        font-size: 4rem;
        
        font-weight: 600;
        
        margin-bottom: .4rem;

    }

    p {

        font-size: 1rem;

        font-family: "Inter", sans-serif;
        
        line-height: 1.75;

    }

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

</style>