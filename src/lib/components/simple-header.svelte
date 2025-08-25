<script lang="ts">
    import { FileTextIcon } from "@lucide/svelte"
    import ThemeSwitcher from "$lib/components/theme-switcher.svelte"
    import DevAuthHelper from "$lib/components/dev-auth-helper.svelte"
    import UserProfile from "$lib/components/UserProfile.svelte"
    import Config from "$lib/config"
    import { page } from "$app/state"
    import { goto } from "$app/navigation"


	const redirect = (url: string) => {
		goto(url);
	}
</script>

<header
    class="sticky top-0 z-50 flex items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 h-16 w-full"
>
    <!-- Logo -->
    <div class="flex items-center gap-2">
        <button 
            onclick={() => redirect("/")} 
            class="flex items-center gap-2 font-semibold text-xl text-primary hover:text-primary/80 transition-colors px-3 py-2 rounded-md hover:bg-primary/10"
        >
            <FileTextIcon class="size-5 text-primary" />
            <span class="text-primary">StoryDesigner</span>
        </button>
    </div>

    <!-- Theme Switcher -->
    <div class="flex items-center gap-2">
        <ThemeSwitcher />
        <UserProfile />
    </div>
</header>

<!-- Development Auth Helper (only shown in dev mode) -->
{#if Config.isDevelopment}
    <DevAuthHelper user={page.data.user} />
{/if}
