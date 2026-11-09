<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<h1>Module</h1>
<ul>
	{#each data.modules as module (module.id)}
		<li>{module.code} {module.name} ({module.lp} LP)</li>
	{:else}
		<li>Keine Module gefunden.</li>
	{/each}
</ul>
