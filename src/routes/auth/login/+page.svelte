<script lang="ts">
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase';
	import { onMount } from 'svelte';

	let email = $state('');
	let password = $state('');
	let loading = $state(false);
	let error = $state('');
	let sender : string | null= $state(null)

	$effect(() => {
		const url = new URL(window.location.href);
		sender = url.searchParams.get('sender') || null;
		console.log(sender);
	});

	// Check if user is already logged in
	onMount(async () => {
		const { data: { user } } = await supabase.auth.getUser();
		if (user) {
			if (sender) {
				goto(sender);
			} else {
				goto('/community');
			}
		}
	});

	const handleLogin = async () => {
		if (!email || !password) {
			error = 'Please fill in all fields';
			return;
		}

		loading = true;
		error = '';

		const { data, error: authError } = await supabase.auth.signInWithPassword({
			email,
			password
		});

		if (authError) {
			error = authError.message;
			loading = false;
			return;
		}

		// Wait until the session cookie is available (prevents SSR redirect loop)
		let attempts = 0;
		while (attempts < 20) { // ~2s max wait
			const { data: sessionData } = await supabase.auth.getSession();
			if (sessionData.session) break;
			await new Promise((r) => setTimeout(r, 100));
			attempts++;
		}

		// Respect redirect target if provided by guard
		const params = new URLSearchParams(window.location.search);
		const redirectTo = params.get('redirectTo') || '/community';
		goto(redirectTo);
	};

	const handleGoogleLogin = async () => {
		loading = true;
		error = '';

		const params = new URLSearchParams(window.location.search)
		const redirectTo = params.get('redirectTo') || '/community'
		const callback = `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`
		const { error: authError } = await supabase.auth.signInWithOAuth({
			provider: 'google',
			options: {
				redirectTo: callback
			}
		});

		if (authError) {
			error = authError.message;
			loading = false;
		}
	};

	const handleKeydown = (event: KeyboardEvent) => {
		if (event.key === 'Enter') {
			handleLogin();
		}
	};

	// Svelte 5 way to handle window events
	onMount(() => {
		window.addEventListener('keydown', handleKeydown);
		return () => window.removeEventListener('keydown', handleKeydown);
	});
</script>

<form method="post" class="space-y-6">
	{#if sender}
		<input type="hidden" name="sender" value={sender} />
	{/if}
	
	<h2 class="text-2xl font-bold text-center text-foreground mb-6">Sign In</h2>

	{#if error}
		<div class="bg-destructive text-foreground border px-4 py-3 rounded-lg text-sm">
			{error}
		</div>
	{/if}

	<div class="space-y-4">
		<div>
			<label for="email" class="block text-sm font-medium text-foreground mb-1">
				Email
			</label>
			<input
				id="email"
				type="email"
				name="email"
				bind:value={email}
				required
				disabled={loading}
				class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-muted disabled:text-muted-foreground"
				placeholder="Enter your email"
			/>
		</div>

		<div>
			<label for="password" class="block text-sm font-medium text-foreground mb-1">
				Password
			</label>
			<input
				id="password"
				type="password"
				name="password"
				bind:value={password}
				required
				disabled={loading}
				class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-muted disabled:text-muted-foreground"
				placeholder="Enter your password"
			/>
		</div>
	</div>

	<button
		type="submit"
		disabled={loading}
		class="w-full bg-primary text-primary-foreground py-2 px-4 rounded-lg font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
	>
		{loading ? 'Signing in...' : 'Sign In'}
	</button>

	<!-- Divider -->
	<div class="relative">
		<div class="absolute inset-0 flex items-center">
			<div class="w-full border-t border"></div>
		</div>
		<div class="relative flex justify-center text-sm">
			<span class="px-2 bg-background text-muted-foreground">Or continue with</span>
		</div>
	</div>

	<!-- Social Login -->
	<button
		type="button"
		onclick={handleGoogleLogin}
		disabled={loading}
		class="w-full bg-background border text-foreground py-2 px-4 rounded-lg font-medium hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
	>
		<svg class="w-5 h-5" viewBox="0 0 24 24">
			<path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
			<path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
			<path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
			<path fill="currentColor" d="M12 1C7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
		</svg>
		Continue with Google
	</button>

	<!-- Forgot Password Link -->
	<div class="text-center">
		<a href="/auth/forgot-password" class="text-sm text-primary hover:text-primary/90">
			Forgot your password?
		</a>
	</div>
</form>