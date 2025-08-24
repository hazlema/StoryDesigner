<script lang="ts">
	import Card from '$lib/components/ui/card/card.svelte';
	import CardContent from '$lib/components/ui/card/card-content.svelte';
	import CardHeader from '$lib/components/ui/card/card-header.svelte';
	import CardTitle from '$lib/components/ui/card/card-title.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { TrendingUp, Hash, Users, Calendar, Award } from '@lucide/svelte';
	
	let { trendingTopics, category } = $props<{
		trendingTopics: Array<{name: string, count: number}>;
		category: string;
	}>();
	
	// Mock data for additional sidebar content
	let activeWriters = $state([
		{ name: 'StoryMaster42', stories: 12, online: true },
		{ name: 'FantasyWriter', stories: 8, online: true },
		{ name: 'MysteryFan', stories: 15, online: false },
		{ name: 'RomanceAuthor', stories: 20, online: true }
	]);
	
	let upcomingEvents = $state([
		{ name: 'Writing Sprint', date: 'Today 8 PM', participants: 24 },
		{ name: 'Story Review Session', date: 'Tomorrow 2 PM', participants: 18 },
		{ name: 'World Building Workshop', date: 'Friday 6 PM', participants: 31 }
	]);
</script>

<div class="sticky top-6 space-y-4">
	<!-- Trending Topics -->
	<Card>
		<CardHeader>
			<CardTitle class="text-lg flex items-center gap-2">
				<TrendingUp class="h-5 w-5" />
				Trending in {category === 'all' ? 'All Categories' : category.replace('-', ' ')}
			</CardTitle>
		</CardHeader>
		<CardContent class="space-y-3">
			{#each trendingTopics as topic, index}
				<Button 
					variant="ghost" 
					class="w-full justify-start gap-3 h-auto py-2 hover:bg-muted/80"
				>
					<span class="text-sm font-mono text-muted-foreground w-4">
						{index + 1}
					</span>
					<div class="flex-1 text-left">
						<div class="font-medium flex items-center gap-1">
							<Hash class="h-3 w-3" />
							{topic.name}
						</div>
						<div class="text-xs text-muted-foreground">
							{topic.count} posts
						</div>
					</div>
				</Button>
			{/each}
		</CardContent>
	</Card>
	
	<!-- Active Writers -->
	<Card>
		<CardHeader>
			<CardTitle class="text-lg flex items-center gap-2">
				<Users class="h-5 w-5" />
				Active Writers
			</CardTitle>
		</CardHeader>
		<CardContent class="space-y-3">
			{#each activeWriters as writer}
				<div class="flex items-center gap-3">
					<div class="relative">
						<div class="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
							<span class="text-xs font-medium">
								{writer.name.slice(0, 2).toUpperCase()}
							</span>
						</div>
						{#if writer.online}
							<div class="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
						{/if}
					</div>
					<div class="flex-1">
						<div class="font-medium text-sm">{writer.name}</div>
						<div class="text-xs text-muted-foreground">
							{writer.stories} stories
						</div>
					</div>
				</div>
			{/each}
		</CardContent>
	</Card>
	
	<!-- Upcoming Events -->
	<Card>
		<CardHeader>
			<CardTitle class="text-lg flex items-center gap-2">
				<Calendar class="h-5 w-5" />
				Upcoming Events
			</CardTitle>
		</CardHeader>
		<CardContent class="space-y-3">
			{#each upcomingEvents as event}
				<div class="border rounded-lg p-3 hover:bg-muted/50 transition-colors cursor-pointer">
					<div class="font-medium text-sm">{event.name}</div>
					<div class="text-xs text-muted-foreground mt-1">
						{event.date}
					</div>
					<div class="flex items-center gap-1 mt-2">
						<Users class="h-3 w-3 text-muted-foreground" />
						<span class="text-xs text-muted-foreground">
							{event.participants} joining
						</span>
					</div>
				</div>
			{/each}
		</CardContent>
	</Card>
	
	<!-- Featured Story -->
	<Card>
		<CardHeader>
			<CardTitle class="text-lg flex items-center gap-2">
				<Award class="h-5 w-5" />
				Story of the Week
			</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="space-y-3">
				<div class="font-medium">The Quantum Badger Chronicles</div>
				<div class="text-sm text-muted-foreground">
					A mind-bending time travel adventure that explores the paradoxes of quantum mechanics through the eyes of an unlikely hero.
				</div>
				<div class="flex items-center gap-2 text-xs text-muted-foreground">
					<span>by StoryMaster42</span>
					<span>•</span>
					<span>4.8★ (127 reviews)</span>
				</div>
				<Button variant="outline" size="sm" class="w-full">
					Read Story
				</Button>
			</div>
		</CardContent>
	</Card>
</div>