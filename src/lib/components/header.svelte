<script lang="ts">
	import { useSidebar } from "$lib/components/ui/sidebar";
	import { Separator } from "$lib/components/ui/separator";
	import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "$lib/components/ui/breadcrumb";
	import { PanelLeftIcon, BookOpenIcon, BrainIcon, WandIcon } from "@lucide/svelte";
	import ThemeSwitcher from '$lib/components/theme-switcher.svelte';
	import { browser } from '$app/environment';
	import { iStories } from '$lib/classes/iStory';
	import { iScenes } from '$lib/classes/iScene';
	import { onMount, onDestroy } from 'svelte';
	import { hub } from '$lib/events/eventsHub';
	import { useNavigationEvents, useStoryEvents } from '$lib/events/mindmapHandlers';
	import AINotebook from '$lib/components/AINotebook.svelte';
	import FalGenerator from '$lib/components/FalGenerator.svelte';

	// Props
	let { storySlug } = $props<{ storySlug: string }>();

	// Sidebar state management
	const sidebar = useSidebar();

	// Story and scene state
	let story: iStories | null = $state(null);
	let loading = $state(true);

	// Current scene state - updated via events instead of hash
	let currentSceneKey = $state('root');

	// Event cleanup functions
	let navigationCleanup: (() => void) | null = null;
	let storyCleanup: (() => void) | null = null;
	
	// AI Notebook state
	let showAINotebook = $state(false);
	
	// Fal Generator state
	let showFalGenerator = $state(false);


	// Handle slug loaded events
	async function handleSlugLoaded(event: any) {
		console.log('🍞 HEADER: Received slug.loaded event:', event);
		if (event.slug) {
			try {
				loading = true;
				const loadedStory = await iStories.load(event.slug);
				if (loadedStory) {
					story = loadedStory;
					console.log('Story loaded in header:', story.name);
				}
			} catch (error) {
				console.error('Error loading story for breadcrumbs:', error);
			} finally {
				loading = false;
			}
		}
	}


	// Dynamic breadcrumbs based on story data and current scene
	let breadcrumbs = $derived(() => {
		console.log('🍞 BREADCRUMBS DERIVED - Running breadcrumb calculation');
		console.log('🍞 BREADCRUMBS DERIVED - Loading:', loading, 'Story:', !!story, 'Current scene:', currentSceneKey);
		if (loading || !story) {
			console.log('🍞 BREADCRUMBS DERIVED - Returning loading state');
			return [
				{ label: "Loading...", href: "#", isActive: true }
			];
		}

		const scene = story.scenes.find(s => s.key === currentSceneKey);
		const sceneName = scene ? scene.key : currentSceneKey;
		console.log('🍞 BREADCRUMBS DERIVED - Found scene:', scene?.key, 'Scene name:', sceneName);

		const result = [
			{ label: story.name, href: "#project" },
			{ label: sceneName, href: "#scene", isActive: true }
		];
		console.log('🍞 BREADCRUMBS DERIVED - Final breadcrumbs:', result);
		return result;
	});

	onMount(() => {
		// Load story immediately with the provided slug
		if (storySlug) {
			console.log('🍞 HEADER: Loading story with slug:', storySlug);
			handleSlugLoaded({ slug: storySlug });
		}
		
		// Set up event listeners for navigation updates
		navigationCleanup = useNavigationEvents({
			onSceneActivate: ({ sceneKey }) => {
				console.log('🍞 SCENE ACTIVATED via event:', sceneKey);
				currentSceneKey = sceneKey;
			},
			onBreadcrumbUpdate: ({ sceneKey, scenePath }) => {
				console.log('🍞 BREADCRUMB UPDATE via event:', sceneKey, scenePath);
				currentSceneKey = sceneKey;
			}
		});
		
		// Set up story event listeners
		storyCleanup = useStoryEvents({
			onLoaded: ({ story: loadedStory, storySlug }) => {
				console.log('🍞 STORY LOADED via event:', storySlug, loadedStory.name);
				// Story is already loaded in loadStoryData, but we could sync here if needed
			},
			onSaved: ({ story: savedStory }) => {
				console.log('🍞 STORY SAVED via event:', savedStory.name);
				// Could show a toast notification or update UI state
			}
		});
	});
	
	onDestroy(() => {
		// Clean up event listeners
		if (navigationCleanup) {
			navigationCleanup();
		}
		if (storyCleanup) {
			storyCleanup();
		}
	});
</script>

<header class="sticky top-0 z-50 flex items-center gap-4 border-b bg-sidebar/50 backdrop-blur-sm px-4 h-16 w-full">
	<!-- Sidebar Toggle -->
	<button class="size-5 hover:text-muted-foreground rounded cursor-pointer transition-colors" onclick={() => sidebar.toggle()} title="Toggle Sidebar">
		<PanelLeftIcon size="100%" />
	</button>

	<Separator orientation="vertical" class="data-[orientation=vertical]:h-1/3" />

	<!-- Logo -->
	<div class="flex items-center gap-2">
		<div class="size-8 bg-gradient-to-br from-primary to-primary/70 rounded-lg flex items-center justify-center">
			<BookOpenIcon class="size-5 text-primary-foreground" />
		</div>
		<span class="font-bold text-lg bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">StoryDesigner</span>
	</div>

	<Separator orientation="vertical" class="data-[orientation=vertical]:h-1/3" />

	<!-- Breadcrumb Navigation -->
	<Breadcrumb>
		<BreadcrumbList>
			{#each breadcrumbs() as crumb, index (crumb.href)}
				<BreadcrumbItem>
					{#if crumb.isActive}
						<BreadcrumbPage class="font-medium">
							{crumb.label}
						</BreadcrumbPage>
					{:else}
						<BreadcrumbLink href={crumb.href} class="hover:text-primary transition-colors">
							{crumb.label}
						</BreadcrumbLink>
					{/if}
				</BreadcrumbItem>
				{#if index < breadcrumbs().length - 1}
					<BreadcrumbSeparator />
				{/if}
			{/each}
		</BreadcrumbList>
	</Breadcrumb>

	<!-- Spacer to push theme button to the right -->
	<div class="flex-1"></div>

	<!-- AI Notebook Button -->
	<button 
		class="size-8 hover:text-muted-foreground rounded cursor-pointer transition-colors flex items-center justify-center" 
		onclick={() => { showAINotebook = true; hub.emit('ai.notebook.open', {}); }}
		title="Open AI Story Notebook"
	>
		<BrainIcon size="18" />
	</button>

	<!-- Fal.ai Generator Button -->
	<button 
		class="size-8 hover:text-muted-foreground rounded cursor-pointer transition-colors flex items-center justify-center" 
		onclick={() => { showFalGenerator = true; hub.emit('fal.generator.open', {}); }}
		title="Open Fal.ai Image & Video Generator"
	>
		<WandIcon size="18" />
	</button>

	<!-- Theme Switcher -->
	<ThemeSwitcher />
</header>

<!-- AI Notebook Dialog -->
<AINotebook bind:open={showAINotebook} />

<!-- Fal.ai Generator Dialog -->
<FalGenerator bind:open={showFalGenerator} />
