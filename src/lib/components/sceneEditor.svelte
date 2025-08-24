<script lang="ts">
	import { 
		Root as Dialog, 
		Content as DialogContent, 
		Header as DialogHeader, 
		Title as DialogTitle, 
		Description as DialogDescription 
	} from "$lib/components/ui/dialog";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
	import { Badge } from "$lib/components/ui/badge";
	import MarkdownEdit from "$lib/components/markdownEdit.svelte";
	import { SaveIcon, XIcon, PlusIcon, TrashIcon, EditIcon, SettingsIcon, PlayIcon, LinkIcon } from "@lucide/svelte";
	import type { iScene } from "$lib/classes/iScene";
	import type { iStory } from "$lib/classes/iStory";
	import type { iEvent } from "$lib/classes/iEvent";
	import { iEvents } from "$lib/classes/iEvent";
	import { generateFormattedId } from "$lib/utils";

	// Props
	let { 
		open = $bindable(false),
		scene = $bindable(null),
		story = $bindable(null),
		onSave = () => {}
	}: {
		open?: boolean;
		scene?: iScene | null;
		story?: iStory | null;
		onSave?: () => void;
	} = $props();

	// Local state for editing
	let editingScene: iScene | null = $state(null);
	let sceneText = $state("");
	let sceneKey = $state("");
	let events: iEvent[] = $state([]);
	let connections: string[] = $state([]);
	let mediaFiles: string[] = $state([]);
	let loadingMedia = $state(false);
	let activeTab = $state('settings');

	// Available scenes for connections
	let availableScenes = $derived(() => {
		if (!story) return [];
		return story.scenes
			.filter(s => s.key !== sceneKey)
			.map(s => s.key);
	});

	// Helper function to get display name for events
	function getEventDisplayName(event: iEvent, index: number): string {
		const mediaName = event.media;
		
		// Count how many events before this one use the same media
		const duplicateCount = events.slice(0, index).filter(e => e.media === mediaName).length;
		
		if (duplicateCount > 0) {
			return `${mediaName} (${duplicateCount + 1})`;
		}
		
		return mediaName;
	}

	// Get available source events for a given event index
	function getAvailableSourceEvents(currentIndex: number) {
		return events.slice(0, currentIndex).map((event, index) => ({
			key: event.key,
			displayName: getEventDisplayName(event, index)
		}));
	}

	// Watch for scene changes and initialize editing state
	$effect(() => {
		if (scene && open) {
			editingScene = scene;
			sceneText = scene.text;
			sceneKey = scene.key;
			events = [...scene.events];
			connections = [...scene.connections];
			activeTab = 'settings';
			loadMediaFiles();
		} else if (!scene && open) {
			// Reset state when no scene is provided but dialog is open
			editingScene = null;
			sceneText = "";
			sceneKey = "";
			events = [];
			connections = [];
			activeTab = 'settings';
		}
	});

	// Additional effect to handle scene changes when dialog is already open
	$effect(() => {
		if (scene && open && editingScene && editingScene.key !== scene.key) {
			console.log('Scene changed from', editingScene.key, 'to', scene.key);
			editingScene = scene;
			sceneText = scene.text;
			sceneKey = scene.key;
			events = [...scene.events];
			connections = [...scene.connections];
			activeTab = 'settings';
			loadMediaFiles();
		}
	});
	async function loadMediaFiles() {
		if (!story) return;
		
		try {
			loadingMedia = true;
			const response = await fetch(`/api/media?path=${encodeURIComponent(story.slug)}`);
			const data = await response.json();
			
			if (response.ok) {
				mediaFiles = [...new Set(data.files || [])];
			} else {
				console.warn('Failed to load media files:', data.error);
				mediaFiles = [];
			}
		} catch (error) {
			console.error('Media API error:', error);
			mediaFiles = [];
		} finally {
			loadingMedia = false;
		}
	}

	function handleSave() {
		if (editingScene && story) {
			editingScene.text = sceneText;
			editingScene.events = events;
			editingScene.connections = connections;
			
			story.save().then(() => {
				console.log('Scene saved successfully');
				onSave();
				open = false;
				open = false;
			}).catch(console.error);
		}
	}

	function handleCancel() {
		if (scene) {
			sceneText = scene.text;
			sceneKey = scene.key;
			events = [...scene.events];
			connections = [...scene.connections];
		}
		open = false;
	}

	function addEvent() {
		const newEvent = new iEvents(
			generateFormattedId(),
			'autostart',
			'',
			mediaFiles[0] || 'new-media.mp3',
			{}
		);
		events = [...events, newEvent];
	}

	function removeEvent(index: number) {
		events = events.filter((_, i) => i !== index);
	}

	function updateEventType(index: number, value: string) {
		events = events.map((event, i) => {
			if (i === index) {
				return { ...event, event: value, source: value === 'autostart' ? '' : event.source };
			}
			return event;
		});
	}

	function updateEventMedia(index: number, value: string) {
		events = events.map((event, i) => {
			if (i === index) {
				return { ...event, media: value };
			}
			return event;
		});
	}

	function updateEventSource(index: number, value: string) {
		events = events.map((event, i) => {
			if (i === index) {
				return { ...event, source: value };
			}
			return event;
		});
	}

	function addConnection() {
		if (availableScenes.length > 0) {
			const newConnection = availableScenes[0];
			if (!connections.includes(newConnection)) {
				connections = [...connections, newConnection];
			}
		}
	}

	function removeConnection(index: number) {
		connections = connections.filter((_, i) => i !== index);
	}

	function updateConnection(index: number, value: string) {
		connections = connections.map((conn, i) => i === index ? value : conn);
	}
</script>

<Dialog bind:open>
	<DialogContent class="p-0 border-0 shadow-none bg-transparent max-w-none" showCloseButton={false}>
		<div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[50vw] h-[80vh] bg-white text-black border border-gray-300 rounded-lg shadow-lg flex flex-col overflow-hidden">
		<DialogHeader class="p-5 flex-shrink-0 relative bg-white text-black border-b border-gray-300">
			<DialogTitle class="flex items-center gap-2">
				<EditIcon class="size-5" />
				<span>Edit Scene</span>
				{#if editingScene}
					<Badge variant="outline" class="bg-gray-100 text-black border-gray-400">{editingScene.key}</Badge>
				{/if}
			</DialogTitle>
			<DialogDescription class="text-gray-600">
				Edit scene content, events, and connections
			</DialogDescription>
			<!-- Close button positioned in header -->
			<button
				class="absolute top-4 right-4 opacity-70 hover:opacity-100 transition-opacity p-1 rounded-sm hover:bg-gray-100 text-black hover:text-black"
				onclick={() => open = false}
			>
				<XIcon class="size-4" />
				<span class="sr-only">Close</span>
			</button>
		</DialogHeader>

		{#if editingScene && story}
			<!-- Tab Navigation -->
			<div class="flex-shrink-0 border-b border-gray-300 bg-white">
				<nav class="flex pl-5 pr-5 space-x-8" aria-label="Tabs">
					<button
						class="py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors {activeTab === 'settings' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-600 hover:text-black hover:border-gray-300'}"
						onclick={() => activeTab = 'settings'}
					>
						<SettingsIcon class="size-4" />
						Settings & Content
					</button>
					<button
						class="py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors {activeTab === 'media' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-600 hover:text-black hover:border-gray-300'}"
						onclick={() => activeTab = 'media'}
					>
						<PlayIcon class="size-4" />
						Media Events ({events.length})
					</button>
					<button
						class="py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors {activeTab === 'connections' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-600 hover:text-black hover:border-gray-300'}"
						onclick={() => activeTab = 'connections'}
					>
						<LinkIcon class="size-4" />
						Connections ({connections.length})
					</button>
				</nav>
			</div>

			<!-- Tab Content -->
			<div class="flex-1 overflow-hidden bg-white text-black">
				{#if activeTab === 'settings'}
					<!-- Settings & Content Tab -->
					<div class="h-full flex flex-col gap-4 p-4">
						<!-- Scene Key Input -->
						<div>
							<label for="scene-key" class="block text-sm font-medium mb-1 text-black">Scene Key</label>
							<Input 
								id="scene-key"
								bind:value={sceneKey}
								placeholder="Enter scene key..."
								class="font-mono max-w-md bg-white text-black border-gray-300"
								disabled
							/>
							<p class="text-xs text-gray-600 mt-1">Scene key cannot be changed after creation</p>
						</div>

						<!-- Markdown Editor -->
						<div class="flex-1 overflow-hidden">
							<label class="block text-sm font-medium mb-2 text-black">Scene Content</label>
							<div class="h-full border border-gray-300 rounded-lg overflow-hidden">
								<MarkdownEdit bind:markdown={sceneText} />
							</div>
						</div>
					</div>

				{:else if activeTab === 'media'}
					<!-- Media Events Tab -->
					<div class="h-full flex flex-col p-4">
						<div class="flex items-center justify-between mb-4">
							<h3 class="text-lg font-semibold text-black">Media Events ({events.length})</h3>
							<Button size="sm" variant="outline" onclick={addEvent} class="bg-white text-black border-gray-300 hover:bg-gray-100">
								<PlusIcon class="size-4 mr-1" />
								Add Event
							</Button>
						</div>

						<div class="flex-1 overflow-y-auto">
							{#if events.length === 0}
								<div class="text-center text-gray-600 py-8">
									<PlayIcon class="size-12 mx-auto mb-4 opacity-50" />
									<p class="text-lg font-medium mb-2 text-black">No events yet</p>
									<p class="text-sm">Click "Add Event" to create your first media event</p>
								</div>
							{:else}
								<div class="overflow-x-auto">
									<table class="w-full border-collapse border border-gray-300 bg-white">
										<thead>
											<tr class="bg-gray-50">
												<th class="border border-gray-300 px-4 py-2 text-left font-medium text-black">#</th>
												<th class="border border-gray-300 px-4 py-2 text-left font-medium text-black">Type</th>
												<th class="border border-gray-300 px-4 py-2 text-left font-medium text-black">Source</th>
												<th class="border border-gray-300 px-4 py-2 text-left font-medium text-black">Media</th>
												<th class="border border-gray-300 px-4 py-2 text-center font-medium text-black">Actions</th>
											</tr>
										</thead>
										<tbody>
											{#each events as event, index}
												<tr class="hover:bg-gray-50 text-black">
													<td class="border border-gray-300 px-4 py-2 font-medium text-black">{index + 1}</td>
													<td class="border border-gray-300 px-4 py-2">
														<select 
															class="w-full h-8 px-2 border border-gray-300 rounded text-sm bg-white text-black"
															value={event.event}
															onchange={(e) => updateEventType(index, e.target.value)}
														>
															<option value="autostart">autostart</option>
															<option value="after">after</option>
														</select>
													</td>
													<td class="border border-gray-300 px-4 py-2">
														{#if event.event === 'autostart'}
															<input 
																class="w-full h-8 px-2 border border-gray-300 rounded text-sm bg-gray-50 text-black"
																value="Auto-triggered"
																disabled
															/>
														{:else}
															<select 
																class="w-full h-8 px-2 border border-gray-300 rounded text-sm bg-white text-black"
																value={events[index].source}
																onchange={(e) => updateEventSource(index, e.target.value)}
															>
																<option value="">Select source event...</option>
																{#each getAvailableSourceEvents(index) as sourceEvent}
																	<option value={sourceEvent.key}>{sourceEvent.displayName}</option>
																{/each}
															</select>
														{/if}
													</td>
													<td class="border border-gray-300 px-4 py-2">
														<select 
															class="w-full h-8 px-2 border border-gray-300 rounded text-sm bg-white text-black"
															value={event.media}
															onchange={(e) => updateEventMedia(index, e.target.value)}
														>
															{#if loadingMedia}
																<option value="">Loading...</option>
															{:else if mediaFiles.length === 0}
																<option value="">No media files</option>
															{:else}
																{#each mediaFiles as mediaFile}
																	<option value={mediaFile}>{mediaFile}</option>
																{/each}
															{/if}
														</select>
													</td>
													<td class="border border-gray-300 px-4 py-2 text-center">
														<Button 
															size="sm" 
															variant="ghost" 
															onclick={() => removeEvent(index)}
															class="h-8 w-8 p-0 hover:bg-red-100 text-red-600"
														>
															<TrashIcon class="size-4" />
														</Button>
													</td>
												</tr>
											{/each}
										</tbody>
									</table>
								</div>
							{/if}
						</div>
					</div>

				{:else if activeTab === 'connections'}
					<!-- Connections Tab -->
					<div class="h-full flex flex-col p-4">
						<div class="flex items-center justify-between mb-4">
							<h3 class="text-lg font-semibold text-black">Scene Connections ({connections.length})</h3>
							<Button 
								size="sm" 
								variant="outline" 
								onclick={addConnection}
								disabled={availableScenes.length === 0}
								class="bg-white text-black border-gray-300 hover:bg-gray-100"
							>
								<PlusIcon class="size-4 mr-1" />
								Add Connection
							</Button>
						</div>

						<div class="flex-1 overflow-y-auto">
							{#if connections.length === 0}
								<div class="text-center text-gray-600 py-8">
									<LinkIcon class="size-12 mx-auto mb-4 opacity-50" />
									<p class="text-lg font-medium mb-2 text-black">No connections yet</p>
									<p class="text-sm">Click "Add Connection" to link this scene to other scenes</p>
								</div>
							{:else}
								<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
									{#each connections as connection, index}
										<Card class="bg-white border-gray-300">
											<CardContent class="p-4 bg-white">
												<div class="flex items-center gap-2">
													<div class="flex-1">
														<label class="block text-sm font-medium mb-1 text-black">Connected Scene</label>
														<select 
															class="w-full h-9 px-3 border border-gray-300 rounded-md text-sm bg-white text-black"
															value={connection}
															onchange={(e) => updateConnection(index, e.target.value)}
														>
															{#each availableScenes as sceneKey}
																<option value={sceneKey}>{sceneKey}</option>
															{/each}
														</select>
													</div>
													<Button 
														size="sm" 
														variant="ghost" 
														onclick={() => removeConnection(index)}
														class="h-8 w-8 p-0 mt-6 hover:bg-red-100 text-red-600"
													>
														<TrashIcon class="size-4" />
													</Button>
												</div>
											</CardContent>
										</Card>
									{/each}
								</div>
							{/if}
						</div>
					</div>
				{/if}
			</div>

			<!-- Footer Actions -->
			<div class="flex-shrink-0 flex items-center justify-end gap-2 p-4 border-t border-gray-300 bg-gray-50">
				<Button variant="outline" onclick={handleCancel} class="bg-white text-black border-gray-300 hover:bg-gray-100">
					<XIcon class="size-4 mr-1" />
					Close
				</Button>
				<Button onclick={handleSave} class="bg-blue-600 text-white hover:bg-blue-700">
					<SaveIcon class="size-4 mr-1" />
					Save Changes
				</Button>
			</div>
		{/if}
		</div>
	</DialogContent>
</Dialog>