<script lang="ts">
    import { onMount, onDestroy } from "svelte"
    import {
        Sidebar,
        SidebarContent,
        SidebarFooter,
        SidebarHeader,
        SidebarRail,
        SidebarGroup,
        SidebarGroupLabel,
        SidebarGroupContent,
        SidebarMenu,
        SidebarMenuItem,
        SidebarMenuButton,
    } from "$lib/components/ui/sidebar"
    import { Badge } from "$lib/components/ui/badge"
    import { FileTextIcon, ImageIcon, VideoIcon, MusicIcon, FileIcon, LayersIcon, ChevronDownIcon, ChevronRightIcon } from "@lucide/svelte"
    import { iStories } from "$lib/classes/iStory"
    import { iScenes } from "$lib/classes/iScene"
    import { useNavigationEvents } from '$lib/events/mindmapHandlers';
    import { hub } from '$lib/events/eventsHub';
    import { goto } from "$app/navigation"


	const redirect = (url: string) => {
		goto(url);
	}
	
    // Props
    let { storySlug } = $props<{ storySlug: string }>();

    // State for story data – enchanted variables ready for reactivity spells!
    let story: iStories | null = $state(null)
    let mediaFiles: string[] = $state([])
    let loading: boolean = $state(true)
    let error: string | null = $state(null)

    // Collapsible state – because every sidebar needs a plot twist!
    let scenesExpanded = $state(true)
    let mediaExpanded = $state(true)

    // Active scene tracking via events (no more hash dependency!)
    let activeSceneKey = $state('root') // Default to root scene
    
    // Event cleanup function
    let navigationCleanup: (() => void) | null = null;

    // Load media files for a story
    async function loadMediaForStory(storySlug: string) {
        try {
            console.log("Loading media for story slug:", storySlug)
            const response = await fetch(`/api/media?path=${encodeURIComponent(storySlug)}`)
            const data = await response.json()

            if (response.ok) {
                mediaFiles = data.files || []
                console.log("Media files loaded:", mediaFiles)
            } else {
                console.warn("Failed to load media files:", data.error)
                mediaFiles = []
            }
        } catch (mediaError) {
            console.error("Media API error:", mediaError)
            mediaFiles = []
        }
    }

    // Handle slug loaded events - load the story
    async function handleSlugLoaded(event: any) {
        console.log("Sidebar received slug.loaded event:", event)
        if (event.slug) {
            loading = true
            try {
                const loadedStory = await iStories.load(event.slug)
                if (loadedStory) {
                    story = loadedStory
                    console.log("Story loaded in sidebar:", story.name)
                    
                    // Load media files for this story
                    if (story.slug) {
                        await loadMediaForStory(story.slug)
                    }
                } else {
                    console.error("Failed to load story:", event.slug)
                    story = null
                    mediaFiles = []
                }
            } catch (err) {
                console.error("Error loading story in sidebar:", err)
                error = `Failed to load story: ${err}`
            } finally {
                loading = false
            }
        }
    }

    // Get appropriate icon for media file – icon roulette for file types!
    function getMediaIcon(filename: string) {
        const ext = filename.split(".").pop()?.toLowerCase()
        if (["mp4", "avi", "mov", "mkv", "webm"].includes(ext || "")) {
            return VideoIcon
        } else if (["mp3", "wav", "ogg", "flac", "aac"].includes(ext || "")) {
            return MusicIcon
        } else if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext || "")) {
            return ImageIcon
        } else {
            return FileIcon
        }
    }

    // Handle sidebar scene click – emit event to select node in mindmap
    function handleSceneClick(sceneKey: string) {
        console.log('🎯 SIDEBAR: Scene clicked:', sceneKey);
        hub.emit('sidebar.scene.select', { sceneKey });
    }

    onMount(() => {
        // Load story immediately with the provided slug
        if (storySlug) {
            console.log('📁 SIDEBAR: Loading story with slug:', storySlug);
            handleSlugLoaded({ slug: storySlug });
        }
        
        // Set up event listeners for navigation updates
        navigationCleanup = useNavigationEvents({
            onSceneActivate: ({ sceneKey }) => {
                console.log('🎯 SIDEBAR: Scene activated via event:', sceneKey);
                console.log('🎯 SIDEBAR: Previous activeSceneKey:', activeSceneKey);
                activeSceneKey = sceneKey;
                console.log('🎯 SIDEBAR: New activeSceneKey:', activeSceneKey);
            },
            onBreadcrumbUpdate: ({ sceneKey }) => {
                console.log('🎯 SIDEBAR: Breadcrumb update via event:', sceneKey);
                activeSceneKey = sceneKey;
            }
        });
    })
    
    onDestroy(() => {
        // Clean up event listeners
        if (navigationCleanup) {
            navigationCleanup();
        }
    });
</script>

<Sidebar collapsible="offcanvas" class="border-r">
    <!-- Sidebar Header – the crown jewel of your enchanted UI! -->
    <SidebarHeader class="border-b border-sidebar-border h-16 flex-row items-center px-4">
    <div class="flex items-center gap-2">
        <button 
            onclick={() => redirect("/")} 
            class="flex items-center gap-2 font-semibold text-xl text-primary hover:text-primary/80 transition-colors px-3 py-2 rounded-md hover:bg-primary/10"
        >
            <FileTextIcon class="size-5 text-primary" />
            <span class="text-primary">StoryDesigner</span>
        </button>
    </div>
    </SidebarHeader>

    <!-- Sidebar Content – where the story magic unfolds! -->
    <SidebarContent class="px-2">
        {#if loading}
            <div class="p-3 text-center text-muted-foreground">
                <div class="animate-spin size-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                Loading...
            </div>
        {:else if error}
            <div class="p-3 text-center text-destructive text-sm">
                {error}
            </div>
        {:else if story}
            <!-- Project Information – spotlight on your tale's essentials! -->
            <div class="p-3 space-y-2 bg-sidebar-accent/10 border-b border-sidebar-border/90">
                <h2 class="text-sm font-semibold text-sidebar-foreground">{story.name}</h2>
                <p class="text-xs text-muted-foreground leading-relaxed">{story.description}</p>
                <div class="flex flex-wrap gap-1 mt-2">
                    {#each story.keywords as keyword (keyword)}
                        <Badge
                            variant="outline"
                            class="text-xs px-1.5 py-0 bg-sidebar-accent/30 border-sidebar-border/60 hover:bg-sidebar-accent/40 transition-colors"
                            >{keyword}</Badge
                        >
                    {/each}
                </div>
            </div>

            <!-- Scene List – collapsible chapters of adventure! -->
            <SidebarGroup class="px-2 py-2 bg-sidebar-accent/5 border-b border-sidebar-border/85">
                <SidebarGroupLabel
                    class="text-xs font-medium text-sidebar-foreground/80 mb-1.5 flex items-center gap-2 hover:text-sidebar-foreground transition-colors cursor-pointer select-none p-1 rounded hover:bg-sidebar-accent/20"
                    onclick={() => (scenesExpanded = !scenesExpanded)}
                >
                    {@const ChevronIcon = scenesExpanded ? ChevronDownIcon : ChevronRightIcon}
                    <ChevronIcon class="size-3 transition-transform duration-200" />
                    <LayersIcon class="size-3" />
                    <span>Scenes</span>
                    <Badge variant="secondary" class="text-xs px-1.5 py-0 ml-auto bg-primary/10 text-primary border-primary/20"
                        >{story.scenes.length}</Badge
                    >
                </SidebarGroupLabel>
                {#if scenesExpanded}
                    <SidebarGroupContent class="transition-all duration-200 ease-in-out">
                        <SidebarMenu>
                            {#each story.scenes as scene (scene.key)}
                                <!-- Debug: activeSceneKey = {activeSceneKey}, scene.key = {scene.key}, match = {scene.key === activeSceneKey} -->
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        class="gap-2 text-xs hover:bg-sidebar-accent/40 transition-all duration-200 group border-l-2 border-transparent hover:border-primary/30 ml-1"
                                        style="{scene.key === activeSceneKey ? 'background-color: rgba(59, 130, 246, 0.1); border-left-color: rgb(59, 130, 246); border-left-width: 3px; font-weight: 600;' : ''}"
                                    >
                                        {#snippet child({ props })}
                                            <button {...props} class="flex items-start gap-2 w-full text-left p-1.5 rounded-md" onclick={() => handleSceneClick(scene.key)}>
                                                <div
                                                    class="size-1.5 rounded-full mt-2 flex-shrink-0 transition-colors {scene.key === activeSceneKey ? 'bg-primary animate-pulse' : 'bg-primary/70 group-hover:bg-primary'}"
                                                ></div>
                                                <div class="min-w-0 flex-1">
                                                    <div
                                                        class="truncate transition-colors {scene.key === activeSceneKey ? 'font-bold text-sidebar-accent-foreground' : 'font-medium text-sidebar-foreground group-hover:text-sidebar-accent-foreground'}"
                                                    >
                                                        {scene.key}
                                                    </div>
                                                    <div class="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-tight">
                                                        {scene.text.substring(0, 60)}{scene.text.length > 60 ? "..." : ""}
                                                    </div>
                                                </div>
                                            </button>
                                        {/snippet}
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            {/each}
                        </SidebarMenu>
                    </SidebarGroupContent>
                {/if}
            </SidebarGroup>

            <!-- Media List – your asset arsenal, dynamically iconified! -->
            <SidebarGroup class="px-2 py-2 bg-sidebar-accent/5">
                <SidebarGroupLabel
                    class="text-xs font-medium text-sidebar-foreground/80 mb-1.5 flex items-center gap-2 hover:text-sidebar-foreground transition-colors cursor-pointer select-none p-1 rounded hover:bg-sidebar-accent/20"
                    onclick={() => (mediaExpanded = !mediaExpanded)}
                >
                    {@const ChevronIcon = mediaExpanded ? ChevronDownIcon : ChevronRightIcon}
                    <ChevronIcon class="size-3 transition-transform duration-200" />
                    <ImageIcon class="size-3" />
                    <span>Media Files</span>
                    <Badge variant="secondary" class="text-xs px-1.5 py-0 ml-auto bg-primary/10 text-primary border-primary/20"
                        >{mediaFiles.length}</Badge
                    >
                </SidebarGroupLabel>
                {#if mediaExpanded}
                    <SidebarGroupContent class="transition-all duration-200 ease-in-out">
                        <SidebarMenu>
                            {#each mediaFiles as filename (filename)}
                                {@const IconComponent = getMediaIcon(filename)}
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        class="gap-2 text-xs hover:bg-sidebar-accent/40 transition-all duration-200 group border-l-2 border-transparent hover:border-primary/30 ml-1"
                                    >
                                        {#snippet child({ props })}
                                            <button {...props} class="flex items-center gap-2 w-full text-left p-1.5 rounded-md">
                                                <IconComponent
                                                    class="size-3 flex-shrink-0 text-muted-foreground group-hover:text-sidebar-accent-foreground transition-colors"
                                                />
                                                <span
                                                    class="truncate text-sidebar-foreground group-hover:text-sidebar-accent-foreground transition-colors"
                                                    >{filename}</span
                                                >
                                            </button>
                                        {/snippet}
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            {/each}
                            {#if mediaFiles.length === 0}
                                <SidebarMenuItem>
                                    <div class="px-1.5 py-1.5 text-xs text-muted-foreground italic">No media files found</div>
                                </SidebarMenuItem>
                            {/if}
                        </SidebarMenu>
                    </SidebarGroupContent>
                {/if}
            </SidebarGroup>
        {:else}
            <div class="p-3 text-center text-muted-foreground text-sm">No story loaded</div>
        {/if}
    </SidebarContent>

    <!-- Sidebar Footer – credits roll for your creative epic! -->
    <SidebarFooter class="border-t border-sidebar-border p-3 bg-sidebar-accent/5">
        <div class="text-xs text-muted-foreground text-center space-y-0.5">
            <p>StoryDesigner v1.0</p>
            <p class="opacity-75">Creative writing made visual</p>
        </div>
    </SidebarFooter>

    <!-- Sidebar Rail for toggling – the offcanvas enchanter! -->
    <SidebarRail />
</Sidebar>

<style>
    .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
</style>