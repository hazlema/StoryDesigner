<script lang="ts">
	import '../app.css';
	import { invalidate } from '$app/navigation';
	import { supabase, ensureUserProfile } from '$lib/supabase';
	import type { LayoutData } from './$types';
	
	let { children, data }: { children: any, data: LayoutData } = $props();

	// Secure way to get the user data
	const serverUser = data.user; // came from +layout.server.ts (validated)
	console.log('user', serverUser?.user_metadata?.username);

	$effect(() => {
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange(async (event, session) => {
			if (event === 'SIGNED_IN') {
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
			if (user) ensureUserProfile(user).catch(() => {});
		};
		
		checkInitialUser();
		return () => subscription.unsubscribe()
	});
</script>

{@render children?.()}
