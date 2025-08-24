<script lang="ts">
	import Card from '$lib/components/ui/card/card.svelte';
	import CardContent from '$lib/components/ui/card/card-content.svelte';
	import CardHeader from '$lib/components/ui/card/card-header.svelte';
	import CardTitle from '$lib/components/ui/card/card-title.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Home, BookOpen, Lightbulb, Trophy, PlusCircle, User, Users, Sparkles, Eye, ShoppingCart } from '@lucide/svelte';
	import WatchDialog from './WatchDialog.svelte';
	
	let { selectedCategory, onCategorySelect } = $props<{
		selectedCategory: string;
		onCategorySelect: (category: string) => void;
	}>();
	
	let showWatch = $state(false);
	
	const categories = [
		{ id: 'general', name: 'General', icon: Home, count: 234 },
		{ id: 'narrative-construction', name: 'Narrative Construction', icon: BookOpen, count: 156 },
		{ id: 'tips-and-tricks', name: 'Tips and Tricks', icon: Lightbulb, count: 89 },
		{ id: 'leaderboards', name: 'Leaderboards', icon: Trophy, count: 42 },
		{ id: 'new-stories', name: 'New Stories', icon: PlusCircle, count: 67 },
		{ id: 'profile', name: 'Profile', icon: User, count: 0 }
	];
</script>

<div class="sticky top-6">
	<Card>
		<CardHeader>
			<CardTitle class="text-lg">Categories</CardTitle>
		</CardHeader>
		<CardContent class="space-y-2">
			{#each categories as category}
				<Button
					variant={selectedCategory === category.id ? 'default' : 'ghost'}
					class="w-full justify-start gap-3 h-auto py-3"
					onclick={() => onCategorySelect(category.id)}
				>
					{@const IconComponent = category.icon}
					<IconComponent class="h-5 w-5" />
					<div class="flex-1 text-left">
						<div class="font-medium">{category.name}</div>
						{#if category.id !== 'profile'}
							<div class="text-xs text-muted-foreground">{category.count} posts</div>
						{:else}
							<div class="text-xs text-muted-foreground">Settings & subscription</div>
						{/if}
					</div>
				</Button>
			{/each}
		</CardContent>
	</Card>
	
	<!-- Quick Actions Card -->
	<Card class="mt-4">
		<CardHeader>
			<CardTitle class="text-lg">Quick Actions</CardTitle>
		</CardHeader>
		<CardContent class="space-y-2">
			<Button variant="outline" class="w-full justify-start">
				<Users class="h-4 w-4 mr-2" />
				Join Discussion
			</Button>
			<Button variant="outline" class="w-full justify-start">
				<Sparkles class="h-4 w-4 mr-2" />
				Share Story
			</Button>
			<Button variant="outline" class="w-full justify-start" onclick={() => showWatch = true}>
				<Eye class="h-4 w-4 mr-2" />
				Watch
			</Button>
			<Button variant="outline" class="w-full justify-start">
				<ShoppingCart class="h-4 w-4 mr-2" />
				Marketplace
			</Button>
		</CardContent>
	</Card>
</div>

<!-- Watch Dialog -->
{#if showWatch}
	<WatchDialog 
		open={showWatch} 
		onClose={() => showWatch = false} 
	/>
{/if}