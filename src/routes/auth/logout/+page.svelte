<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase';

	let status = $state('processing');

	onMount(async () => {
		try {
			const { error } = await supabase.auth.signOut();
			
			if (error) {
				console.error('Logout error:', error);
			}
			
			status = 'success';
			
			// Redirect to home after a brief delay
			setTimeout(() => {
				goto('/');
			}, 1500);
		} catch (err) {
			console.error('Logout error:', err);
			status = 'success'; // Still redirect even if there's an error
			setTimeout(() => {
				goto('/');
			}, 1500);
		}
	});
</script>

<div class="text-center">
	{#if status === 'processing'}
		<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
		<h2 class="text-xl font-semibold text-gray-900 mb-2">Signing you out...</h2>
		<p class="text-gray-600">Please wait</p>
	{:else}
		<div class="text-green-600 mb-4">
			<svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
			</svg>
		</div>
		<h2 class="text-xl font-semibold text-gray-900 mb-2">Successfully signed out</h2>
		<p class="text-gray-600">Redirecting you to the home page...</p>
	{/if}
</div>