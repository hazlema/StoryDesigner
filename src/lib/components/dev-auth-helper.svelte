<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { supabase } from '$lib/supabase';
	import { goto, invalidate } from '$app/navigation';
	import { Trash2, LogOut, UserPlus, LogIn, RefreshCw } from '@lucide/svelte';

	let { user } = $props<{
		user: any;
	}>();

	let loading = $state(false);
	let message = $state('');

	// DONT CHANGE THIS!! GOTO DOESN'T WORK HERE
	function quickLogout() {
		document.location.href = "/auth/logout"
	}

	async function deleteCurrentUser() {
		if (!user) return;
		
		const confirmed = confirm(`🚨 PERMANENTLY DELETE USER: ${user.email}?\n\nThis will completely remove the user from Supabase and cannot be undone!`);
		if (!confirmed) return;

		loading = true;
		message = '';
		try {
			// Call our server endpoint to actually delete the user
			const response = await fetch('/api/dev/delete-user', {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ userId: user.id })
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to delete user');
			}

			message = '✅ User permanently deleted from Supabase';
			
			// Sign out and redirect after short delay
			await supabase.auth.signOut();
			await invalidate('supabase:auth');
			setTimeout(() => redirect('/auth/signup'), 2000);
			
		} catch (error) {
			message = `❌ Delete failed: ${error instanceof Error ? error.message : error}`;
		} finally {
			loading = false;
		}
	}

	function clearSession() {
		// Use the proper logout route instead of handling it manually
		goto('/auth/logout');
	}

</script>

<div class="fixed bottom-4 right-4 bg-card border border-border rounded-lg shadow-lg p-3 max-w-sm z-50">
	<div class="flex items-center gap-2 mb-2">
		<div class="w-2 h-2 bg-yellow-500 rounded-full"></div>
		<span class="text-xs font-mono text-muted-foreground">DEV AUTH HELPER</span>
	</div>
	
	{#if message}
		<div class="text-xs p-2 mb-2 bg-muted rounded text-muted-foreground whitespace-pre-line">
			{message}
		</div>
	{/if}
	
	<div class="flex flex-wrap gap-1">
		{#if user}
			<Button
				variant="outline"
				size="sm"
				onclick={quickLogout}
				disabled={loading}
				class="text-xs h-7"
			>
				<LogOut class="w-3 h-3 mr-1" />
				Quick Logout
			</Button>
			
			<Button
				variant="outline"
				size="sm"
				onclick={deleteCurrentUser}
				disabled={loading}
				class="text-xs h-7 text-destructive hover:text-destructive"
			>
				<Trash2 class="w-3 h-3 mr-1" />
				Delete User
			</Button>
		{:else}
			<Button
				variant="outline"
				size="sm"
				onclick={() => goto('/auth/login')}
				class="text-xs h-7"
			>
				<LogIn class="w-3 h-3 mr-1" />
				Login
			</Button>
			
			<Button
				variant="outline"
				size="sm"
				onclick={() => goto('/auth/signup')}
				class="text-xs h-7"
			>
				<UserPlus class="w-3 h-3 mr-1" />
				Signup
			</Button>
		{/if}
		
		<Button
			variant="outline"
			size="sm"
			onclick={clearSession}
			disabled={loading}
			class="text-xs h-7"
		>
			<RefreshCw class="w-3 h-3 mr-1" />
			Clear Session
		</Button>
		
		<Button
			variant="outline"
			size="sm"
			onclick={() => redirect("/auth/signup")}
			class="text-xs h-7"
		>
			Sign Up
		</Button>
	</div>
	
	{#if user}
		<div class="text-xs text-muted-foreground mt-2 truncate">
			👤 {user.email}
		</div>
	{/if}
</div>