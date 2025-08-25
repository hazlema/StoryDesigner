<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/ui/button/button.svelte';
	import SimpleHeader from '$lib/components/simple-header.svelte';
	import SimpleFooter from '$lib/components/simple-footer.svelte';

	let { data } = $props();
	console.log(data.user?.user_metadata?.username);
	
	function goToEdit() {
		goto('/edit');
	}

	function goToTesting() {
		goto('/testing');
	}

	function goToCommunity() {
		goto('/community');
	}
</script>

<div class="min-h-screen flex flex-col">
	<SimpleHeader />
	
	<main class="flex-1 flex items-center justify-center p-6">
		<div class="text-center">
			<!-- Logo -->
			<div class="mb-8">
				<img 
					src="/stories/storydesigner.jpg" 
					alt="StoryDesigner Logo" 
					class="mx-auto h-[70vh] w-auto rounded-lg shadow-lg"
				/>
			</div>
			
			<!-- Navigation Buttons -->
			<div class="flex gap-4 justify-center flex-wrap">
				<Button onclick={goToEdit} size="lg" class="min-w-32">
					Story Editor
				</Button>
				<Button onclick={goToCommunity} size="lg" class="min-w-32">
					Community
				</Button>
				<Button onclick={goToTesting} variant="outline" size="lg" class="min-w-32">
					Testing
				</Button>
			</div>
		</div>
	</main>
	
	<SimpleFooter />
</div>