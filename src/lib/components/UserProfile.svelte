<script lang="ts">
	import { page } from '$app/state';

	// Profile popup state
	let showProfilePopup = $state(false);
	let profileContainer: HTMLElement | null = $state(null);

	// Click-outside logic to close popup
	$effect(() => {
		if (!showProfilePopup) return;

		const onClick = (e: MouseEvent) => {
			if (!profileContainer?.contains(e.target as Node)) {
				showProfilePopup = false;
			}
		};
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") showProfilePopup = false;
		};

		document.addEventListener("click", onClick);
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("click", onClick);
			document.removeEventListener("keydown", onKey);
		};
	});
</script>

<!-- User Profile -->
{#if page.data.user}
	<div class="relative" bind:this={profileContainer}>
		<button class="flex items-center gap-2" onclick={() => (showProfilePopup = !showProfilePopup)}>
			{#if page.data.user.user_metadata?.avatar_url}
				<img src={page.data.user.user_metadata.avatar_url} alt="User Avatar" class="size-8 rounded-full" />
			{:else}
				<img src="/images/blank-avatar.jpg" alt="User Avatar" class="size-8 rounded-full" />
			{/if}
		</button>
		{#if showProfilePopup}
			<div class="absolute right-0 top-full mt-2 bg-accent text-accent-foreground border rounded-lg shadow-lg p-4 z-50 min-w-[10rem]">
				<h2 class="text-sm font-bold">Edit Avatar</h2>
				<h2 class="text-sm font-bold">Edit Username</h2>
				<h2 class="text-sm font-bold">Edit Email</h2>
				<h2 class="text-sm font-bold">Edit Password</h2>
				<h2 class="text-sm font-bold">Edit Profile</h2>
			</div>
		{/if}
	</div>
{/if}