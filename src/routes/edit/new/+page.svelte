<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import Card from '$lib/components/ui/card/card.svelte';
	import CardContent from '$lib/components/ui/card/card-content.svelte';
	import CardDescription from '$lib/components/ui/card/card-description.svelte';
	import CardHeader from '$lib/components/ui/card/card-header.svelte';
	import CardTitle from '$lib/components/ui/card/card-title.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import { AlertCircle, ArrowLeft, Loader2 } from '@lucide/svelte';
	import { iStories } from '$lib/classes/iStory';
	import { iScenes } from '$lib/classes/iScene';
	import SimpleHeader from '$lib/components/simple-header.svelte';
	import SimpleFooter from '$lib/components/simple-footer.svelte';

	let storyName = $state('');
	let storyDescription = $state('');
	let generatedSlug = $state('');
	let slugAvailable = $state<boolean | null>(null);
	let checking = $state(false);
	let creating = $state(false);
	let error = $state('');

	// Generate slug from name
	function generateSlug(name: string): string {
		return name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-|-$/g, '');
	}

	// Check if slug is available
	async function checkSlugAvailability(slug: string) {
		if (!slug) {
			slugAvailable = null;
			return;
		}

		checking = true;
		try {
			const response = await fetch(`/api/story?action=exists&slug=${slug}`);
			const data = await response.json();
			slugAvailable = !data.exists;
		} catch (err) {
			console.error('Error checking slug:', err);
			slugAvailable = null;
		} finally {
			checking = false;
		}
	}

	// Update slug when name changes
	$effect(() => {
		if (storyName) {
			const newSlug = generateSlug(storyName);
			if (newSlug !== generatedSlug) {
				generatedSlug = newSlug;
				checkSlugAvailability(newSlug);
			}
		} else {
			generatedSlug = '';
			slugAvailable = null;
		}
	});

	async function createStory() {
		if (!storyName || !generatedSlug || !slugAvailable) {
			error = 'Please enter a valid story name';
			return;
		}

		creating = true;
		error = '';

		try {
			// Create new story with root node
			const newStory = new iStories(storyName, storyDescription || 'A new story', []);
			
			// Create the root node (non-renamable)
			const rootNode = new iScenes('root', 'Your story begins here...', [], []);
			newStory.addScene(rootNode);
			
			// Set initial mindmap position for root node at center
			newStory.mindmap['root'] = { x: 0, y: 0 };
			
			// Save the story using the class save method
			const saved = await newStory.save();
			
			if (saved) {
				// Redirect to the editor using the story's slug
				goto(`/edit/${newStory.slug}`);
			} else {
				error = 'Failed to create story';
			}
		} catch (err) {
			console.error('Error creating story:', err);
			error = 'An error occurred while creating the story';
		} finally {
			creating = false;
		}
	}

	function cancel() {
		goto('/edit');
	}
</script>

<div class="min-h-screen flex flex-col">
	<SimpleHeader />
	
	<main class="flex-1 flex items-center justify-center p-6">
		<div class="w-full max-w-2xl">
	<Card>
		<CardHeader>
			<CardTitle>Create New Story</CardTitle>
			<CardDescription>Give your story a name and description to get started</CardDescription>
		</CardHeader>
		<CardContent class="space-y-4">
			<div class="space-y-2">
				<Label for="name">Story Name *</Label>
				<Input
					id="name"
					bind:value={storyName}
					placeholder="Enter your story name..."
					disabled={creating}
					autocomplete="off"
				/>
				{#if generatedSlug}
					<p class="text-sm text-muted-foreground">
						URL slug: <code class="bg-muted px-1 py-0.5 rounded">{generatedSlug}</code>
						{#if checking}
							<Loader2 class="inline-block size-3 ml-2 animate-spin" />
						{:else if slugAvailable === true}
							<span class="text-green-600 ml-2">✓ Available</span>
						{:else if slugAvailable === false}
							<span class="text-red-600 ml-2">✗ Already exists</span>
						{/if}
					</p>
				{/if}
			</div>

			<div class="space-y-2">
				<Label for="description">Description (optional)</Label>
				<Input
					id="description"
					bind:value={storyDescription}
					placeholder="Brief description of your story..."
					disabled={creating}
				/>
			</div>

			{#if error}
				<div class="flex items-center gap-2 text-red-600 text-sm">
					<AlertCircle class="size-4" />
					{error}
				</div>
			{/if}

			<div class="flex gap-2 pt-4">
				<Button
					onclick={createStory}
					disabled={!storyName || !slugAvailable || creating || checking}
				>
					{#if creating}
						<Loader2 class="size-4 mr-2 animate-spin" />
						Creating...
					{:else}
						Create Story
					{/if}
				</Button>
				<Button variant="outline" onclick={cancel} disabled={creating}>
					<ArrowLeft class="size-4 mr-2" />
					Cancel
				</Button>
			</div>

			<div class="text-sm text-muted-foreground pt-4 border-t">
				<p class="font-medium mb-1">Your story will start with:</p>
				<ul class="space-y-1 ml-4">
					<li>• A root node (the starting point of your story)</li>
					<li>• Empty scenes list ready for your content</li>
					<li>• Automatic save to <code class="bg-muted px-1 rounded">/stories/{generatedSlug || '[slug]'}/</code></li>
				</ul>
			</div>
		</CardContent>
	</Card>
		</div>
	</main>
	
	<SimpleFooter />
</div>