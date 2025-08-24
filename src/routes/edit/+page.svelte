<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import Card from '$lib/components/ui/card/card.svelte';
	import SimpleHeader from '$lib/components/simple-header.svelte';
	import SimpleFooter from '$lib/components/simple-footer.svelte';
	import CardContent from '$lib/components/ui/card/card-content.svelte';
	import CardDescription from '$lib/components/ui/card/card-description.svelte';
	import CardHeader from '$lib/components/ui/card/card-header.svelte';
	import CardTitle from '$lib/components/ui/card/card-title.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { BookOpen, Plus, Download, Trash2, Loader2, ChevronLeft, ChevronRight } from '@lucide/svelte';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle,
	} from '$lib/components/ui/dialog';

	let allStories = $state<Array<{name: string, slug: string}>>([]);
	let stories = $state<Array<{name: string, slug: string}>>([]);
	let loading = $state(true);
	let deleteDialogOpen = $state(false);
	let storyToDelete = $state<{name: string, slug: string} | null>(null);
	let deleting = $state(false);
	let downloadDialogOpen = $state(false);
	let downloadingStory = $state<string | null>(null);
	
	// Pagination
	let currentPage = $state(1);
	let storiesPerPage = $state(6); // Show 6 stories per page (2x3 grid)
	let totalPages = $derived(Math.ceil(allStories.length / storiesPerPage));
	
	// Update displayed stories when page changes
	$effect(() => {
		const startIndex = (currentPage - 1) * storiesPerPage;
		const endIndex = startIndex + storiesPerPage;
		stories = allStories.slice(startIndex, endIndex);
	});

	onMount(async () => {
		try {
			const response = await fetch('/api/story?action=list');
			if (response.ok) {
				const data = await response.json();
				allStories = data.stories || [];
			}
		} catch (error) {
			console.error('Failed to load stories:', error);
		} finally {
			loading = false;
		}
	});

	function openStory(slug: string) {
		goto(`/edit/${slug}`);
	}

	function createNewStory() {
		goto('/edit/new');
	}

	function confirmDeleteStory(story: {name: string, slug: string}) {
		storyToDelete = story;
		deleteDialogOpen = true;
	}

	async function deleteStory() {
		if (!storyToDelete) return;
		
		deleting = true;
		try {
			const response = await fetch(`/api/story?slug=${storyToDelete.slug}`, {
				method: 'DELETE'
			});
			
			if (response.ok) {
				// Remove from both stories lists
				allStories = allStories.filter(s => s.slug !== storyToDelete?.slug);
				deleteDialogOpen = false;
				storyToDelete = null;
				
				// Adjust page if current page is now empty
				if (stories.length === 1 && currentPage > 1) {
					currentPage--;
				}
			} else {
				const error = await response.json();
				console.error('Failed to delete story:', error);
				alert('Failed to delete story: ' + (error.error || 'Unknown error'));
			}
		} catch (err) {
			console.error('Error deleting story:', err);
			alert('Error deleting story');
		} finally {
			deleting = false;
		}
	}

	async function downloadStory(slug: string) {
		// Show loading dialog
		downloadingStory = slug;
		downloadDialogOpen = true;
		
		try {
			// Small delay to show the loading state
			await new Promise(resolve => setTimeout(resolve, 500));
			
			// Create a temporary link to trigger download
			const link = document.createElement('a');
			link.href = `/api/story/download?slug=${slug}`;
			link.download = `${slug}.zip`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			
			// Wait a bit for the download to start, then close dialog
			setTimeout(() => {
				downloadDialogOpen = false;
				downloadingStory = null;
			}, 2000);
			
		} catch (error) {
			console.error('Download error:', error);
			downloadDialogOpen = false;
			downloadingStory = null;
		}
	}
</script>

<div class="min-h-screen flex flex-col">
	<SimpleHeader />
	
	<main class="flex-1">
		<div class="container mx-auto p-6">
	<div class="mb-8">
		<h1 class="text-3xl font-bold mb-2">Story Editor</h1>
		<p class="text-muted-foreground">Select a story to edit or create a new one</p>
	</div>

	{#if loading}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each [1, 2, 3] as _}
				<Card>
					<CardHeader>
						<div class="h-6 bg-muted animate-pulse rounded"></div>
					</CardHeader>
					<CardContent>
						<div class="h-4 bg-muted animate-pulse rounded"></div>
					</CardContent>
				</Card>
			{/each}
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			<Card class="border-dashed hover:border-primary transition-colors cursor-pointer" onclick={() => createNewStory()}>
				<CardHeader class="text-center">
					<div class="mx-auto mb-2">
						<Plus class="h-12 w-12 text-muted-foreground" />
					</div>
					<CardTitle>Create New Story</CardTitle>
					<CardDescription>Start a new story from scratch</CardDescription>
				</CardHeader>
			</Card>

			{#each stories as story}
				<Card class="hover:border-primary transition-colors">
					<CardHeader>
						<div class="flex items-start justify-between">
							<BookOpen class="h-5 w-5 text-muted-foreground" />
							<div class="flex gap-1">
								<Button variant="ghost" size="sm" onclick={() => downloadStory(story.slug)}>
									<Download class="h-4 w-4" />
								</Button>
								<Button variant="ghost" size="sm" onclick={() => confirmDeleteStory(story)} class="text-red-600 hover:text-red-700">
									<Trash2 class="h-4 w-4" />
								</Button>
							</div>
						</div>
						<button class="text-left w-full" onclick={() => openStory(story.slug)}>
							<CardTitle>{story.name}</CardTitle>
							<CardDescription>/{story.slug}</CardDescription>
						</button>
					</CardHeader>
					<CardContent>
						<Button variant="outline" class="w-full" onclick={() => openStory(story.slug)}>
							Edit Story
						</Button>
					</CardContent>
				</Card>
			{/each}
		</div>

		<!-- Pagination -->
		{#if totalPages > 1}
			<div class="flex items-center justify-center gap-2 mt-8">
				<Button 
					variant="outline" 
					size="sm" 
					onclick={() => currentPage--} 
					disabled={currentPage <= 1}
				>
					<ChevronLeft class="h-4 w-4" />
					Previous
				</Button>
				
				<div class="flex items-center gap-1">
					{#each Array(totalPages) as _, i}
						{@const pageNum = i + 1}
						<Button 
							variant={currentPage === pageNum ? "default" : "outline"} 
							size="sm" 
							onclick={() => currentPage = pageNum}
						>
							{pageNum}
						</Button>
					{/each}
				</div>
				
				<Button 
					variant="outline" 
					size="sm" 
					onclick={() => currentPage++} 
					disabled={currentPage >= totalPages}
				>
					Next
					<ChevronRight class="h-4 w-4" />
				</Button>
			</div>
			
			<div class="text-center mt-4 text-sm text-muted-foreground">
				Showing {((currentPage - 1) * storiesPerPage) + 1}-{Math.min(currentPage * storiesPerPage, allStories.length)} of {allStories.length} stories
			</div>
		{/if}

		{#if allStories.length === 0 && !loading}
			<div class="text-center py-12">
				<BookOpen class="h-16 w-16 text-muted-foreground mx-auto mb-4" />
				<h2 class="text-xl font-semibold mb-2">No stories yet</h2>
				<p class="text-muted-foreground mb-4">Create your first story to get started</p>
				<Button onclick={() => createNewStory()}>
					<Plus class="h-4 w-4 mr-2" />
					Create First Story
				</Button>
			</div>
		{/if}
	{/if}
		</div>
	</main>
	
	<SimpleFooter />
</div>

<!-- Delete Confirmation Dialog -->
<Dialog bind:open={deleteDialogOpen}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Delete Story</DialogTitle>
			<DialogDescription>
				Are you sure you want to delete "<strong>{storyToDelete?.name}</strong>"? 
				This action cannot be undone and will permanently remove the story and all its content.
			</DialogDescription>
		</DialogHeader>
		<DialogFooter>
			<Button variant="outline" onclick={() => deleteDialogOpen = false}>Cancel</Button>
			<Button variant="destructive" onclick={deleteStory} disabled={deleting}>
				{#if deleting}
					Deleting...
				{:else}
					Delete Story
				{/if}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>

<!-- Download Loading Dialog -->
<Dialog bind:open={downloadDialogOpen}>
	<DialogContent class="sm:max-w-md">
		<DialogHeader>
			<DialogTitle class="flex items-center gap-2">
				<Loader2 class="h-4 w-4 animate-spin" />
				Preparing Download
			</DialogTitle>
			<DialogDescription>
				Creating ZIP file for "<strong>{downloadingStory}</strong>"...
				<br />
				Your download will start shortly.
			</DialogDescription>
		</DialogHeader>
		<div class="flex items-center justify-center py-4">
			<div class="flex items-center gap-2 text-sm text-muted-foreground">
				<Loader2 class="h-5 w-5 animate-spin" />
				Please wait while we package your story
			</div>
		</div>
	</DialogContent>
</Dialog>