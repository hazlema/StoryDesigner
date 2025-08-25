<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { supabase, ensureUserProfile } from '$lib/supabase';
	import { onMount } from 'svelte';
 
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let username = $state('');
	let loading = $state(false);
	let error = $state('');
	let success = $state('');
	let bannerType = $state<'success' | 'error' | ''>('');
	let bannerMsg = $state('');

	// Check if user is already logged in
	onMount(async () => {
		const { data: { user } } = await supabase.auth.getUser();
		if (user) {
			goto('/community');
		}
	});

	const handleSignup = async () => {
		if (loading) return; // prevent double submit
		if (!email || !password || !confirmPassword || !username) {
			error = 'Please fill in all fields';
			return;
		}

		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}

		if (password.length < 6) {
			error = 'Password must be at least 6 characters';
			return;
		}

		// Basic username validation
		if (username.length < 3 || username.length > 50) {
			error = 'Username must be between 3-50 characters';
			return;
		}

		if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
			error = 'Username can only contain letters, numbers, underscores, and hyphens';
			return;
		}

		loading = true;
		error = '';
		success = '';
		console.log('[signup] starting signup flow')
		const startMs = Date.now()
		let timeoutId: number | undefined
		// Failsafe: never let the UI hang forever
		timeoutId = window.setTimeout(() => {
			if (loading) {
				console.warn('[signup] timeout reached, resetting UI')
				loading = false
				if (!error && !success) error = 'Request timed out. Please try again.'
			}
		}, 15000)

		try {
			console.log('[signup] checking username availability')
			const lower = username.toLowerCase()
			const usernameCheck = supabase
				.from('users' as const)
				.select('id')
				.eq('username', lower)
				.limit(1)
			// Per-request timeout so this step can’t hang indefinitely
			const { data: rows, error: nameError } = await Promise.race([
				usernameCheck,
				new Promise((resolve) => setTimeout(() => resolve({ data: null, error: new Error('username_check_timeout') }), 4000)) as any
			])
			if (nameError && (nameError as any).message !== 'username_check_timeout') {
				console.warn('[signup] username check error (continuing):', nameError)
			} else if (Array.isArray(rows) && rows.length > 0) {
				error = 'Username is already taken';
				loading = false;
				if (timeoutId) clearTimeout(timeoutId)
				return;
			} else if ((nameError as any)?.message === 'username_check_timeout') {
				console.warn('[signup] username check timed out (continuing)')
			}
		} catch (e) {
			console.warn('[signup] username check threw (continuing):', e)
		}

		// Sign up with Supabase Auth
		console.log('[signup] calling supabase.auth.signUp')
		const params = new URLSearchParams(window.location.search);
		const redirectTo = params.get('redirectTo') || '/community';
		const signUpPromise = supabase.auth.signUp({
			email,
			password,
			options: {
				data: {
					username: username.toLowerCase()
				}
			}
		})
		const timedSignUp = Promise.race([
			signUpPromise,
			new Promise((resolve) => setTimeout(() => resolve({ data: null, error: new Error('signup_timeout') }), 10000)) as any
		]) as Promise<typeof signUpPromise extends Promise<infer T> ? T : never>
		const { data: authData, error: authError } = await timedSignUp

		if (authError) {
			console.error('[signup] signUp error:', authError)
			error = (authError as any).message === 'signup_timeout'
				? 'Signup request timed out. Try disabling extensions/ad‑blockers, or use a private window.'
				: authError.message;
			loading = false;
			if (timeoutId) clearTimeout(timeoutId)
			return;
		}

		console.log('[signup] signUp returned in', Date.now() - startMs, 'ms', authData)
		// If email confirmation is enabled, there may be no session yet
		if (!authData.session) {
			console.log('[signup] no session (email confirmation likely required)')
			success = 'Account created! Check your email to verify your address.';
			loading = false;
			if (timeoutId) clearTimeout(timeoutId)
			return;
		}

		// Auto-confirmed: wait for session cookie, create profile, then redirect
		let attempts = 0;
		while (attempts < 20) { // ~2s max wait
			const { data: sessionData } = await supabase.auth.getSession();
			if (sessionData.session) break;
			await new Promise((r) => setTimeout(r, 100));
			attempts++;
		}

		if (authData.session) {
			const { data: { user: validated } } = await supabase.auth.getUser();
			if (validated) {
				await ensureUserProfile(validated)
			}
		}

		console.log('[signup] redirecting to', redirectTo)
		if (timeoutId) clearTimeout(timeoutId)
		goto(redirectTo);
	};

	const handleGoogleSignup = async () => {
		loading = true;
		error = '';

		const params = new URLSearchParams(window.location.search);
		const redirectTo = params.get('redirectTo') || '/community';
		const callback = `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`;
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

	// Remove global Enter key handler to avoid duplicate submissions
</script>

<form method="post" use:enhance={() => {
	return async ({ result, update }) => {
		if (result.type === 'success') {
			bannerType = 'success';
			bannerMsg = String(result.data?.message ?? 'Account created! Check your email.');
		} else if (result.type === 'failure') {
			bannerType = 'error';
			bannerMsg = String(result.data?.message ?? 'Signup failed.');
		}
		update();
	};
}} class="space-y-6">
	{#if bannerType}
		<div class={(bannerType === 'success')
			? 'bg-accent text-accent-foreground border rounded-lg px-4 py-3 text-sm'
			: 'bg-destructive text-foreground border rounded-lg px-4 py-3 text-sm'}>
			{bannerMsg}
		</div>
	{/if}

	<h2 class="text-2xl font-bold text-center text-foreground mb-6">Create Account</h2>

	{#if error}
		<div class="bg-destructive text-foreground border px-4 py-3 rounded-lg text-sm">
			{error}
		</div>
	{/if}

	{#if success}
		<div class="bg-accent text-accent-foreground border px-4 py-3 rounded-lg text-sm">
			{success}
		</div>
	{/if}

	<div class="space-y-4">
		<div>
			<label for="username" class="block text-sm font-medium text-foreground mb-1">
				Username
			</label>
			<input
				id="username"
				type="text"
				name="username"
				required
				disabled={loading}
				class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-muted disabled:text-muted-foreground"
				placeholder="Choose a username"
			/>
			<p class="text-xs text-muted-foreground mt-1">
				3-50 characters, letters, numbers, underscores, and hyphens only
			</p>
		</div>

		<div>
			<label for="email" class="block text-sm font-medium text-foreground mb-1">
				Email
			</label>
			<input
				id="email"
				type="email"
				name="email"
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
				required
				disabled={loading}
				class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-muted disabled:text-muted-foreground"
				placeholder="Create a password"
			/>
			<p class="text-xs text-muted-foreground mt-1">
				Must be at least 6 characters
			</p>
		</div>

		<div>
			<label for="confirmPassword" class="block text-sm font-medium text-foreground mb-1">
				Confirm Password
			</label>
			<input
				id="confirmPassword"
				type="password"
				name="confirmPassword"
				required
				disabled={loading}
				class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-muted disabled:text-muted-foreground"
				placeholder="Confirm your password"
			/>
		</div>
	</div>

	<button
		type="submit"
		disabled={loading}
		class="w-full bg-primary text-primary-foreground py-2 px-4 rounded-lg font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
	>
		{loading ? 'Creating account...' : 'Create Account'}
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

	<!-- Social Signup -->
	<button
		type="button"
		onclick={handleGoogleSignup}
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

	<!-- Terms of Service -->
	<p class="text-xs text-muted-foreground text-center">
		By creating an account, you agree to our
		<a href="/terms" class="text-primary hover:text-primary/90">Terms of Service</a>
		and
		<a href="/privacy" class="text-primary hover:text-primary/90">Privacy Policy</a>
	</p>
</form>