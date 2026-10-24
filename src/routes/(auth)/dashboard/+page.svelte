<script lang="ts">
	import type { PageProps } from "./$types";

    let { data }: PageProps = $props();
</script>


<h1>Dashboard | Hello: {data.user.name}</h1>
<p>You got successfully forwarded to the official HWR Novice dashboard!</p>