<script lang="ts">
	import '../app.css';
	import { invalidate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { supabase, ensureUserProfile } from '$lib/supabase';
	import type { LayoutData } from './$types';
	
	let { children, data }: { children: any, data: LayoutData } = $props();

	onMount(() => {
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange(async (event, session) => {
			if (event === 'SIGNED_IN') {
				// Ensure user profile exists whenever someone signs in
				if (session?.user) {
					await ensureUserProfile(session.user);
				}
				invalidate('supabase:auth')
			} else if (event === 'SIGNED_OUT') {
				invalidate('supabase:auth')
			}
		})

		// Also check on initial load if user is already signed in
		const checkInitialUser = async () => {
			const { data: { user } } = await supabase.auth.getUser();
			if (user) {
				await ensureUserProfile(user);
			}
		};
		
		checkInitialUser();

		return () => subscription.unsubscribe()
	});
</script>

{@render children?.()}
