<script lang="ts">
	import SimpleHeader from '$lib/components/simple-header.svelte';
	import SimpleFooter from '$lib/components/simple-footer.svelte';
	
	let { children } = $props();
</script>

<SimpleHeader />

<main class="min-h-screen">
	{@render children?.()}
</main>

<SimpleFooter />