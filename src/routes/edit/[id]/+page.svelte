<script lang="ts">
	import Sidebar from "$lib/components/sidebar.svelte";
	import Header from "$lib/components/header.svelte";
	import Footer from "$lib/components/footer.svelte";
	import Mindmap from "$lib/components/mindmap.svelte";
	import { SidebarInset, SidebarProvider } from "$lib/components/ui/sidebar";
	
	let { data } = $props();
	let storySlug = $derived(data.storyId);
</script>

<div class="bg-background text-foreground min-h-screen">
	<SidebarProvider>
		<Sidebar {storySlug} />
		<SidebarInset class="flex flex-col min-w-0">
			<Header {storySlug} />
			<main class="flex-1 flex flex-col min-w-0">
				<Mindmap {storySlug} />
			</main>
			<Footer />
		</SidebarInset>
	</SidebarProvider>
</div>