<script lang="ts">
	// value is a percentage from 0 to 100. The color comes from --accent, the gap above from --bar-gap
	let { value }: { value: number } = $props();
</script>

<div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={value}>
	<span style:width="{value}%"></span>
</div>

<style>
	.bar {
		height: 0.6rem;
		margin-top: var(--bar-gap, 0.75rem);
		border-radius: 999px;
		background-color: var(--border);
		overflow: hidden;
	}

	span {
		display: block;
		height: 100%;
		border-radius: 999px;
		background-color: var(--accent, var(--hwr-red));
		transition: width 0.3s;
	}
</style>
