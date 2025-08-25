<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Get redirect target from URL
	const redirectTo = typeof window !== 'undefined' 
		? new URLSearchParams(window.location.search).get('redirectTo') || '/community'
		: '/community';

	// If server says user is authenticated, redirect immediately
	if (data.user && typeof window !== 'undefined') {
		console.log('[callback] server-validated user found, redirecting to', redirectTo);
		window.location.href = redirectTo;
	}
</script>

<div class="text-center">
	{#if data.user}
		<div class="text-foreground mb-4">
			<svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
			</svg>
		</div>
		<h2 class="text-xl font-semibold text-foreground mb-2">Welcome to StoryDesigner!</h2>
		<p class="text-muted-foreground">Redirecting you...</p>
	{:else}
		<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
		<h2 class="text-xl font-semibold text-foreground mb-2">Completing sign in...</h2>
		<p class="text-muted-foreground">Please wait while we set up your account</p>
		<div class="mt-4">
			<a href="/auth/login" class="text-primary hover:text-primary/90 font-medium">
				Try signing in again
			</a>
		</div>
	{/if}
</div>