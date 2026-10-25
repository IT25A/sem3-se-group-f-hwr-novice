<script lang="ts">
    import {Calendar, type CalendarEvent} from "svelte5plus-calendar";
	import type { PageProps } from "./$types";

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

<div>
    <Calendar bind:events view="week" locale="de" />
</div>


<style>

    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Cormorant+Garamond:wght@400;500;600&display=swap');

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

</style>