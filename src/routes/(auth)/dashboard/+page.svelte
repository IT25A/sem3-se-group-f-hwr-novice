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


<h1>Dashboard | Hello: {data.user.name}</h1>
<p>You got successfully forwarded to the official HWR Novice dashboard!</p>

<div>
    <Calendar bind:events view="week" locale="de" />
</div>