<script lang="ts">
	import { onMount } from 'svelte';

	let { directoryPath = '' }: { directoryPath?: string } = $props();

	let mediaFiles = $state<string[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function loadMediaFiles() {
		if (!directoryPath) {
			mediaFiles = [];
			loading = false;
			return;
		}

		try {
			loading = true;
			error = null;

			const response = await fetch(`/api/media?path=${encodeURIComponent(directoryPath)}`);
			const data = await response.json();

			if (response.ok) {
				mediaFiles = data.files || [];
			} else {
				error = data.error || 'Failed to load media files';
			}
		} catch (err) {
			error = `Error loading media files: ${err}`;
			console.error('Media list error:', err);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadMediaFiles();
	});

	let lastPath = '';
	$effect(() => {
		if (directoryPath !== lastPath && typeof window !== 'undefined') {
			lastPath = directoryPath;
			loadMediaFiles();
		}
	});
	
	function handleDragStart(event: DragEvent, filename: string) {
		if (event.dataTransfer) {
			event.dataTransfer.setData('text/plain', filename);
			event.dataTransfer.effectAllowed = 'copy';
		}
	}
</script>

<div class="media-list">
	<h3 class="text-lg font-semibold mb-3">Media Files</h3>
	
	{#if loading}
		<div class="text-sm text-muted-foreground">Loading media files...</div>
	{:else if error}
		<div class="text-sm text-destructive">{error}</div>
	{:else if mediaFiles.length === 0}
		<div class="text-sm text-muted-foreground">No media files found</div>
	{:else}
		<div class="space-y-2">
			{#each mediaFiles as filename}
				{@const ext = filename.split('.').pop()?.toLowerCase()}
				<div 
					class="media-item p-2 border rounded cursor-move hover:bg-accent transition-colors"
					draggable="true"
					role="button"
					tabindex="0"
					ondragstart={(e) => handleDragStart(e, filename)}
				>
					<div class="flex items-center gap-2">
						<div class="media-icon">
							{#if ['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(ext || '')}
								🎥
							{:else if ['mp3', 'wav', 'ogg', 'flac', 'aac'].includes(ext || '')}
								🎵
							{:else if ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext || '')}
								🖼️
							{:else if ['pdf', 'txt', 'md'].includes(ext || '')}
								📄
							{:else}
								📎
							{/if}
						</div>
						<span class="text-sm truncate">{filename}</span>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.media-list {
		padding: 1rem;
	}
	
	.media-item {
		user-select: none;
	}
	
	.media-item:hover {
		box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
	}
</style>
