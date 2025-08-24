<script lang="ts">
	import { onMount } from 'svelte';

	let mediaFiles: string[] = [];
	let loading = true;
	let error: string | null = null;
	let testPath = 'the-enchanted-forest';

	async function testMediaAPI() {
		try {
			loading = true;
			error = null;

			const response = await fetch(`/api/media?path=${encodeURIComponent(testPath)}`);
			const data = await response.json();

			if (response.ok) {
				mediaFiles = data.files || [];
			} else {
				error = data.error || 'Failed to load media files';
			}

		} catch (err) {
			error = `Error testing media API: ${err}`;
			console.error('Media API test error:', err);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		testMediaAPI();
	});

	function handlePathChange() {
		testMediaAPI();
	}
</script>

<div class="p-6 max-w-4xl mx-auto">
	<h1 class="text-3xl font-bold mb-6">Media API Test</h1>
	
	<div class="mb-6">
		<label for="path" class="block text-sm font-medium mb-2">Directory Path:</label>
		<input 
			id="path"
			type="text" 
			bind:value={testPath}
			class="w-full p-2 border rounded"
			placeholder="Enter directory path to scan"
		/>
		<button 
			onclick={handlePathChange}
			class="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90"
		>
			Test Path
		</button>
	</div>

	<div class="mb-4">
		<h2 class="text-xl font-semibold mb-2">Results:</h2>
		
		{#if loading}
			<div class="text-muted-foreground">Loading...</div>
		{:else if error}
			<div class="text-red-400 bg-card p-3 rounded">{error}</div>
		{:else if mediaFiles.length === 0}
			<div class="bg-card text-muted-foreground">No media files found</div>
		{:else}
			<div class="bg-card text-muted-foreground p-3 rounded mb-4">
				<strong>Success!</strong> Found {mediaFiles.length} media files
			</div>
			
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each mediaFiles as filename}
					{@const ext = filename.split('.').pop()?.toLowerCase()}
					<div class="border border-border rounded p-3 bg-card text-card-foreground">
						<div class="flex items-center gap-2">
							<div class="text-lg">
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
							<span class="text-sm font-mono">{filename}</span>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<div class="mt-8 p-4 bg-card text-card-foreground border border-border rounded">
		<h3 class="font-semibold mb-2">API Endpoint:</h3>
		<code class="text-sm bg-card text-card-foreground border border-border p-2 rounded block">GET /api/media?path={encodeURIComponent(testPath)}</code>
	</div>
</div>
