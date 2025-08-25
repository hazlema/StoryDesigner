<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { supabase, ensureUserProfile } from '$lib/supabase';

	let status = $state('processing');
	let error = $state('');

	onMount(async () => {
		try {
			console.log('Auth callback mounted')
			console.log('Current URL:', window.location.href)
			const params = new URLSearchParams(window.location.search)
			console.log('URL params:', Object.fromEntries(params))
			const redirectTo = params.get('redirectTo') || '/community'

			// If PKCE code is present, exchange it for a session
			if (params.has('code')) {
				const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(window.location.href)
				if (exchangeError) {
					console.error('Code exchange error:', exchangeError)
				}
			}

			// If email verification link (token_hash) is present, verify it
			if (params.has('token_hash')) {
				const token_hash = params.get('token_hash') as string
				const rawType = params.get('type') || 'signup'
				const type = rawType as
					| 'signup'
					| 'email'
					| 'magiclink'
					| 'recovery'
					| 'invite'
					| 'email_change'
				const { error: verifyError } = await supabase.auth.verifyOtp({ type, token_hash })
				if (verifyError) {
					console.error('Email verification error:', verifyError)
				}
			}

			// Wait for session to materialize
			let attempts = 0
			while (attempts < 30) {
				const { data: { user } } = await supabase.auth.getUser();
				if (user) {
					ensureUserProfile(user).catch(() => {});
					status = 'success'
					goto(redirectTo)
					return
				}
				await new Promise((r) => setTimeout(r, 100))
				attempts++
			}

			error = 'No session found after callback'
			status = 'error'
		} catch (err) {
			console.error('Auth callback error:', err);
			error = 'Authentication failed';
			status = 'error';
		}
	});
</script>

<div class="text-center">
	{#if status === 'processing'}
		<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
		<h2 class="text-xl font-semibold text-foreground mb-2">Completing sign in...</h2>
		<p class="text-muted-foreground">Please wait while we set up your account</p>
	{:else if status === 'success'}
		<div class="text-foreground mb-4">
			<svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
			</svg>
		</div>
		<h2 class="text-xl font-semibold text-foreground mb-2">Welcome to StoryDesigner!</h2>
		<p class="text-muted-foreground">Redirecting you to the community...</p>
	{:else if status === 'error'}
		<div class="text-foreground mb-4">
			<svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
			</svg>
		</div>
		<h2 class="text-xl font-semibold text-foreground mb-2">Authentication Error</h2>
		<p class="text-muted-foreground mb-4">{error}</p>
		<a href="/auth/login" class="text-primary hover:text-primary/90 font-medium">
			Try signing in again
		</a>
	{/if}
</div>