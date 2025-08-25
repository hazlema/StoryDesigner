<script lang="ts">
	import {iStories} from '$lib/classes/iStory';
	import {iEvents} from '$lib/classes/iEvent';
	import {iScenes} from '$lib/classes/iScene';
	import { generateFormattedId } from '$lib/utils';
	import { onMount } from 'svelte';
	import * as Dialog from '$lib/components/ui/dialog';

	let story: iStories;
	let storyInfo: any = $state({});
	let showLoadDialog = $state(false);
	let availableStories: Array<{slug: string, name: string, description: string}> = $state([]);
	let loadingStories = $state(false);

	function createNewStory() {
		story = new iStories(
			'Test Story', 
			'A test story for development',
			['test', 'development'], 
			false
		);

		// Add some test events
		story.addEvent(new iEvents(
			generateFormattedId(), 
			'autostart', 
			'', 
			'test.mp3', 
			{volume: 0.8}
		));

		story.addEvent(new iEvents(
			generateFormattedId(), 
			'after', 
			story.events[0].key, 
			'test.png', 
			{duration: 5000}
		));

		// Add some test scenes
		story.addScene(new iScenes(
			"intro",
			"This is the introduction scene.", 
			[], 
			["scene-2"]
		));

		story.addScene(new iScenes(
			"scene-2",
			"This is the second scene with some events.", 
			[story.events[1]], 
			["intro"]
		));

		// Add keywords
		story.addKeyword('adventure');
		story.addKeyword('fantasy');

		// Set some attributes
		story.setAttributes({
			author: 'Test Author',
			version: '1.0.0',
			created: new Date().toISOString()
		});

		updateStoryInfo();
	}

	function updateStoryInfo() {
		console.log('Updating story info for:', story);
		console.log('Story properties:', {
			name: story.name,
			description: story.description,
			keywords: story.keywords,
			isLocked: story.isLocked,
			eventsLength: story.events?.length || 0,
			scenesLength: story.scenes?.length || 0
		});
		
		try {
			storyInfo = {
				name: story.name,
				description: story.description,
				keywords: story.keywords,
				isLocked: story.isLocked,
				events: story.events?.map(e => ({
					key: e.key,
					event: e.event,
					source: e.source,
					media: e.media,
					attributes: e.attributes
				})) || [],
				scenes: story.scenes?.map(s => ({
					key: s.key,
					text: s.text,
					events: s.events?.length || 0,
					connections: s.connections || []
				})) || [],
				attributes: story.attributes || {},
				slug: story.slug,
				slugDir: story.slugDir,
				slugBase: story.slugBase
			};
			console.log('Updated storyInfo:', storyInfo);
		} catch (error) {
			console.error('Error updating story info:', error);
		}
	}

	function saveStory() {
		story.save().then(() => {
			console.log('Story saved successfully');
		}).catch(console.error);
	}

	function toggleLock() {
		story.setLocked(!story.isLocked);
		updateStoryInfo();
	}

	function addRandomEvent() {
		const event = new iEvents(
			generateFormattedId(),
			Math.random() > 0.5 ? 'autostart' : 'after',
			story.events.length > 0 ? story.events[0].key : '',
			`random-${Date.now()}.mp3`,
			{random: true}
		);
		story.addEvent(event);
		updateStoryInfo();
	}

	function addRandomScene() {
		const scene = new iScenes(
			`scene-${story.scenes.length + 1}`,
			`Random scene ${story.scenes.length + 1} created at ${new Date().toLocaleTimeString()}`,
			[],
			[]
		);
		story.addScene(scene);
		updateStoryInfo();
	}

	async function loadStory() {
		const loadedStory = await iStories.load('test-story');
		if (loadedStory) {
			story = loadedStory;
			updateStoryInfo();
			console.log('Story loaded successfully');
		} else {
			console.log('No saved story found, creating new one');
			createNewStory();
		}
	}

	async function openLoadDialog() {
		loadingStories = true;
		availableStories = await iStories.listStories();
		loadingStories = false;
		showLoadDialog = true;
	}

	async function loadSelectedStory(slug: string) {
		console.log('Loading story with slug:', slug);
		const loadedStory = await iStories.load(slug);
		if (loadedStory) {
			console.log('Loaded story object:', loadedStory);
			console.log('Story properties:', {
				name: loadedStory.name,
				description: loadedStory.description,
				events: loadedStory.events?.length || 0,
				scenes: loadedStory.scenes?.length || 0
			});
			story = loadedStory;
			updateStoryInfo();
			console.log(`Story "${loadedStory.name}" loaded successfully`);
		} else {
			console.error('Failed to load story with slug:', slug);
		}
		showLoadDialog = false;
	}

	onMount(() => {
		loadStory();
	});
</script>

<div class="p-6 bg-background text-foreground">
	<h1 class="text-3xl font-bold mb-6">Story Classes Test</h1>
	
	<!-- Controls -->
	<div class="mb-6 flex gap-2 flex-wrap">
		<button 
			onclick={createNewStory}
			class="px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90"
		>
			New Story
		</button>
		<button 
			onclick={saveStory}
			class="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:opacity-90"
		>
			Save Story
		</button>
		<button 
			onclick={toggleLock}
			class="px-4 py-2 bg-accent text-accent-foreground rounded hover:opacity-90"
		>
			Toggle Lock
		</button>
		<button 
			onclick={addRandomEvent}
			class="px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90"
		>
			Add Event
		</button>
		<button 
			onclick={addRandomScene}
			class="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:opacity-90"
		>
			Add Scene
		</button>
		<button 
			onclick={openLoadDialog}
			class="px-4 py-2 bg-accent text-accent-foreground rounded hover:opacity-90"
		>
			Load Story
		</button>
	</div>

	<!-- Story Info -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Basic Info -->
		<div class="border border-border rounded-lg p-4 bg-card text-card-foreground">
			<h2 class="text-xl font-semibold mb-4">Story Info</h2>
			<div class="space-y-2">
				<div><strong>Name:</strong> {storyInfo.name}</div>
				<div><strong>Description:</strong> {storyInfo.description}</div>
				<div><strong>Keywords:</strong> {storyInfo.keywords?.join(', ')}</div>
				<div><strong>Locked:</strong> {storyInfo.isLocked ? 'Yes' : 'No'}</div>
				<div><strong>Slug:</strong> {storyInfo.slug}</div>
				<div><strong>Directory:</strong> {storyInfo.slugDir}</div>
			</div>
		</div>

		<!-- Events -->
		<div class="border border-border rounded-lg p-4 bg-card text-card-foreground">
			<h2 class="text-xl font-semibold mb-4">Events ({storyInfo.events?.length || 0})</h2>
			<div class="space-y-2 max-h-60 overflow-y-auto">
				{#each storyInfo.events || [] as event (event.key)}
					<div class="border border-border rounded p-2 text-sm">
						<div><strong>Key:</strong> {event.key}</div>
						<div><strong>Type:</strong> {event.event}</div>
						<div><strong>Media:</strong> {event.media}</div>
						<div><strong>Attributes:</strong> {JSON.stringify(event.attributes)}</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Scenes -->
		<div class="border border-border rounded-lg p-4 bg-card text-card-foreground">
			<h2 class="text-xl font-semibold mb-4">Scenes ({storyInfo.scenes?.length || 0})</h2>
			<div class="space-y-2 max-h-60 overflow-y-auto">
				{#each storyInfo.scenes || [] as scene (scene.key)}
					<div class="border border-border rounded p-2 text-sm">
						<div><strong>Key:</strong> {scene.key}</div>
						<div><strong>Text:</strong> {scene.text.substring(0, 50)}...</div>
						<div><strong>Events:</strong> {scene.events}</div>
						<div><strong>Connections:</strong> {scene.connections.join(', ')}</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Attributes -->
		<div class="border border-border rounded-lg p-4 bg-card text-card-foreground">
			<h2 class="text-xl font-semibold mb-4">Attributes</h2>
			<pre class="text-sm bg-card text-card-foreground border border-border p-2 rounded overflow-x-auto">{JSON.stringify(storyInfo.attributes, null, 2)}</pre>
		</div>
	</div>

	<!-- Load Story Dialog -->
	<Dialog.Root bind:open={showLoadDialog}>
		<Dialog.Content class="sm:max-w-[425px]">
			<Dialog.Header>
				<Dialog.Title>Load Story</Dialog.Title>
				<Dialog.Description>
					Select a story to load from the list below.
				</Dialog.Description>
			</Dialog.Header>
			
			<div class="py-4">
				{#if loadingStories}
					<div class="text-center py-4">Loading stories...</div>
				{:else if availableStories.length === 0}
					<div class="text-center py-4 text-muted-foreground">No stories found</div>
				{:else}
					<div class="space-y-2 max-h-60 overflow-y-auto">
						{#each availableStories as storyItem (storyItem.slug)}
							<button
								onclick={() => loadSelectedStory(storyItem.slug)}
								class="w-full text-left p-3 border border-border rounded-lg bg-card text-card-foreground hover:bg-muted transition-colors"
							>
								<div class="font-semibold">{storyItem.name}</div>
								<div class="text-sm text-muted-foreground">{storyItem.description}</div>
								<div class="text-xs text-muted-foreground">Slug: {storyItem.slug}</div>
							</button>
						{/each}
					</div>
				{/if}
			</div>
			
			<Dialog.Footer>
				<Dialog.Close class="btn btn-secondary">Cancel</Dialog.Close>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
</div>
