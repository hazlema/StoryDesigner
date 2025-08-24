<script lang="ts">
	import { PaletteIcon, ChevronDown } from '@lucide/svelte';
	import { browser } from '$app/environment';
	import Button from '$lib/components/ui/button/button.svelte';

	// Theme management
	type Theme = 'light' | 'dark' | 'forest';
	let currentTheme = $state<Theme>('light');
	let dropdownOpen = $state(false);

	function setTheme(theme: Theme) {
		currentTheme = theme;
		if (browser) {
			const html = document.documentElement;
			html.classList.remove('light', 'dark', 'forest');
			
			if (theme !== 'light') {
				html.classList.add(theme);
			}
			
			localStorage.setItem('theme', theme);
		}
		dropdownOpen = false;
	}

	// Initialize theme
	if (browser) {
		const stored = localStorage.getItem('theme') as Theme;
		if (stored && ['light', 'dark', 'forest'].includes(stored)) {
			setTheme(stored);
		}
	}

	// Close dropdown when clicking outside
	function handleOutsideClick(event: MouseEvent) {
		const target = event.target as Element;
		if (!target.closest('.theme-dropdown')) {
			dropdownOpen = false;
		}
	}

	// Add/remove outside click listener
	$effect(() => {
		if (dropdownOpen && browser) {
			document.addEventListener('click', handleOutsideClick);
			return () => document.removeEventListener('click', handleOutsideClick);
		}
	});
</script>

<div class="relative theme-dropdown">
	<Button 
		variant="ghost" 
		size="sm" 
		onclick={() => dropdownOpen = !dropdownOpen}
		class="flex items-center gap-2"
	>
		<PaletteIcon class="size-4" />
		<span class="capitalize">{currentTheme}</span>
		<ChevronDown class="size-3" />
	</Button>

	{#if dropdownOpen}
		<div class="absolute right-0 top-full mt-1 w-32 bg-background border rounded-md shadow-lg z-50">
			<div class="py-1">
				<button
					class="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors {currentTheme === 'light' ? 'bg-accent' : ''}"
					onclick={() => setTheme('light')}
				>
					Light
				</button>
				<button
					class="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors {currentTheme === 'dark' ? 'bg-accent' : ''}"
					onclick={() => setTheme('dark')}
				>
					Dark
				</button>
				<button
					class="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors {currentTheme === 'forest' ? 'bg-accent' : ''}"
					onclick={() => setTheme('forest')}
				>
					Forest
				</button>
			</div>
		</div>
	{/if}
</div>