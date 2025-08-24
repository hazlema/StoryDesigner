<script lang="ts">
	import SimpleHeader from '$lib/components/simple-header.svelte';
	import SimpleFooter from '$lib/components/simple-footer.svelte';
	import CommunityLayout from './components/CommunityLayout.svelte';
</script>

<div class="min-h-screen flex flex-col">
	<SimpleHeader />
	
	<main class="flex-1">
		<CommunityLayout />
	</main>
	
	<SimpleFooter />
</div>