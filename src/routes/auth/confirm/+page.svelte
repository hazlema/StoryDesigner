<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	onMount(() => {
		const search = window.location.search || ''
		const hash = window.location.hash || ''
		// Use replace to avoid keeping an extra history entry
		const target = `/auth/callback${search}${hash}`
		goto(target, { replaceState: true })
	});
</script>

<div class="text-center">
	<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
	<h2 class="text-xl font-semibold text-gray-900 mb-2">Redirecting…</h2>
	<p class="text-gray-600">Taking you to the sign-in callback…</p>
</div>

