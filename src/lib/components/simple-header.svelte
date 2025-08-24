<script lang="ts">
	import { FileTextIcon } from '@lucide/svelte';
	import ThemeSwitcher from '$lib/components/theme-switcher.svelte';
</script>

<header class="sticky top-0 z-50 flex items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 h-16 w-full">
	<!-- Logo -->
	<div class="flex items-center gap-2">
		<div class="size-8 bg-gradient-to-br from-primary to-primary/70 rounded flex items-center justify-center">
			<FileTextIcon class="size-4 text-primary-foreground" />
		</div>
		<span class="font-semibold text-xl">StoryDesigner</span>
	</div>

	<!-- Theme Switcher -->
	<ThemeSwitcher />
</header>