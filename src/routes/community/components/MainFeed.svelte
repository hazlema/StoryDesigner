<script lang="ts">
	import Card from '$lib/components/ui/card/card.svelte';
	import CardContent from '$lib/components/ui/card/card-content.svelte';
	import CardHeader from '$lib/components/ui/card/card-header.svelte';
	import CardTitle from '$lib/components/ui/card/card-title.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Heart, MessageCircle, Share, BookOpen, Clock, User, Settings, CreditCard, Shield } from '@lucide/svelte';
	
	let { selectedCategory } = $props<{
		selectedCategory: string;
	}>();
	
	// Mock data for community posts - would come from API in real app
	let posts = $state([
		{
			id: 1,
			author: 'StoryMaster42',
			avatar: '/api/placeholder/32/32',
			time: '2h ago',
			category: 'general',
			title: 'Welcome to the StoryDesigner Community!',
			content: 'Just wanted to say how amazing this community is becoming. The collaborative features and AI integration are incredible for creative writing...',
			likes: 24,
			comments: 8,
			shares: 3,
			tags: ['community', 'welcome', 'ai-writing']
		},
		{
			id: 2,
			author: 'NarrativeGuru',
			avatar: '/api/placeholder/32/32',
			time: '4h ago',
			category: 'narrative-construction',
			title: 'The power of the three-act structure',
			content: 'Been experimenting with different story structures. The classic three-act still works wonders, but here are some modern variations that might surprise you...',
			likes: 18,
			comments: 12,
			shares: 2,
			tags: ['structure', 'three-act', 'storytelling']
		},
		{
			id: 3,
			author: 'WritingNinja',
			avatar: '/api/placeholder/32/32',
			time: '6h ago',
			category: 'tips-and-tricks',
			title: '5 productivity hacks for writers',
			content: 'Struggled with writer\'s block for months until I discovered these techniques. #3 will blow your mind - it doubled my daily word count!',
			likes: 31,
			comments: 15,
			shares: 7,
			tags: ['productivity', 'writing-tips', 'workflow']
		},
		{
			id: 4,
			author: 'NewAuthor2024',
			avatar: '/api/placeholder/32/32',
			time: '8h ago',
			category: 'new-stories',
			title: 'Just published my first story!',
			content: 'After months of work, "The Digital Dreamscape" is finally live! It\'s a cyberpunk thriller about AI consciousness. Would love your feedback!',
			likes: 45,
			comments: 23,
			shares: 5,
			tags: ['new-release', 'cyberpunk', 'ai-consciousness']
		}
	]);
	
	// Filter posts based on selected category
	let filteredPosts = $derived(
		selectedCategory === 'general' 
			? posts 
			: posts.filter(post => post.category === selectedCategory)
	);
	
	function handleLike(postId: number) {
		const post = posts.find(p => p.id === postId);
		if (post) {
			post.likes += 1;
		}
	}
	
	function handleComment(postId: number) {
		console.log('Comment on post:', postId);
	}
	
	function handleShare(postId: number) {
		const post = posts.find(p => p.id === postId);
		if (post) {
			post.shares += 1;
		}
	}
</script>

<div class="space-y-4">
	{#if selectedCategory === 'profile'}
		<!-- Profile Management Section -->
		<Card>
			<CardHeader>
				<CardTitle class="text-xl">Profile & Settings</CardTitle>
			</CardHeader>
			<CardContent class="space-y-6">
				<!-- Account Settings -->
				<Card>
					<CardHeader class="pb-3">
						<CardTitle class="text-lg flex items-center gap-2">
							<Settings class="h-5 w-5" />
							Account Settings
						</CardTitle>
					</CardHeader>
					<CardContent class="space-y-3">
						<div class="flex justify-between items-center">
							<span>Username</span>
							<Button variant="outline" size="sm">Change</Button>
						</div>
						<div class="flex justify-between items-center">
							<span>Email Notifications</span>
							<Button variant="outline" size="sm">Configure</Button>
						</div>
						<div class="flex justify-between items-center">
							<span>Profile Visibility</span>
							<Button variant="outline" size="sm">Edit</Button>
						</div>
					</CardContent>
				</Card>
				
				<!-- Subscription Management -->
				<Card>
					<CardHeader class="pb-3">
						<CardTitle class="text-lg flex items-center gap-2">
							<CreditCard class="h-5 w-5" />
							Subscription & Billing
						</CardTitle>
					</CardHeader>
					<CardContent class="space-y-3">
						<div class="flex justify-between items-center">
							<div>
								<div class="font-medium">Current Plan: Free</div>
								<div class="text-sm text-muted-foreground">Basic features included</div>
							</div>
							<Button>Upgrade</Button>
						</div>
						<div class="flex justify-between items-center">
							<span>Billing History</span>
							<Button variant="outline" size="sm">View</Button>
						</div>
						<div class="flex justify-between items-center">
							<span>Payment Methods</span>
							<Button variant="outline" size="sm">Manage</Button>
						</div>
					</CardContent>
				</Card>
				
				<!-- Privacy Settings -->
				<Card>
					<CardHeader class="pb-3">
						<CardTitle class="text-lg flex items-center gap-2">
							<Shield class="h-5 w-5" />
							Privacy & Security
						</CardTitle>
					</CardHeader>
					<CardContent class="space-y-3">
						<div class="flex justify-between items-center">
							<span>Two-Factor Authentication</span>
							<Button variant="outline" size="sm">Enable</Button>
						</div>
						<div class="flex justify-between items-center">
							<span>Data Export</span>
							<Button variant="outline" size="sm">Request</Button>
						</div>
						<div class="flex justify-between items-center">
							<span>Account Deletion</span>
							<Button variant="destructive" size="sm">Delete</Button>
						</div>
					</CardContent>
				</Card>
			</CardContent>
		</Card>
	{:else}
		<!-- Create Post Card -->
		<Card>
			<CardContent class="pt-6">
				<div class="flex gap-3">
					<div class="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
						<User class="h-5 w-5 text-muted-foreground" />
					</div>
					<div class="flex-1">
						<textarea 
							class="w-full min-h-[100px] p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
							placeholder="Share your story ideas, ask for feedback, or start a discussion..."
						></textarea>
						<div class="flex justify-between items-center mt-3">
							<div class="flex gap-2">
								<span class="text-sm text-muted-foreground">Category: {selectedCategory}</span>
							</div>
							<Button>Post</Button>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	{/if}
	
	<!-- Posts Feed -->
	{#each filteredPosts as post (post.id)}
		<Card class="hover:bg-muted/50 transition-colors">
			<CardHeader class="pb-3">
				<div class="flex items-start gap-3">
					<div class="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
						<User class="h-5 w-5 text-muted-foreground" />
					</div>
					<div class="flex-1">
						<div class="flex items-center gap-2">
							<h3 class="font-semibold">{post.author}</h3>
							<span class="text-sm text-muted-foreground flex items-center gap-1">
								<Clock class="h-3 w-3" />
								{post.time}
							</span>
							<span class="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
								{post.category.replace('-', ' ')}
							</span>
						</div>
						<h4 class="font-medium mt-1">{post.title}</h4>
					</div>
				</div>
			</CardHeader>
			<CardContent class="pt-0">
				<p class="text-muted-foreground mb-3">{post.content}</p>
				
				<!-- Tags -->
				{#if post.tags.length > 0}
					<div class="flex flex-wrap gap-1 mb-3">
						{#each post.tags as tag}
							<span class="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
								#{tag}
							</span>
						{/each}
					</div>
				{/if}
				
				<!-- Action Buttons -->
				<div class="flex items-center gap-6 pt-3 border-t">
					<Button 
						variant="ghost" 
						size="sm" 
						class="gap-2 text-muted-foreground hover:text-red-500"
						onclick={() => handleLike(post.id)}
					>
						<Heart class="h-4 w-4" />
						{post.likes}
					</Button>
					<Button 
						variant="ghost" 
						size="sm" 
						class="gap-2 text-muted-foreground hover:text-blue-500"
						onclick={() => handleComment(post.id)}
					>
						<MessageCircle class="h-4 w-4" />
						{post.comments}
					</Button>
					<Button 
						variant="ghost" 
						size="sm" 
						class="gap-2 text-muted-foreground hover:text-green-500"
						onclick={() => handleShare(post.id)}
					>
						<Share class="h-4 w-4" />
						{post.shares}
					</Button>
					<Button 
						variant="ghost" 
						size="sm" 
						class="gap-2 text-muted-foreground hover:text-purple-500 ml-auto"
					>
						<BookOpen class="h-4 w-4" />
						Read Story
					</Button>
				</div>
			</CardContent>
		</Card>
	{/each}
	
	{#if filteredPosts.length === 0}
		<Card>
			<CardContent class="text-center py-12">
				<BookOpen class="h-16 w-16 text-muted-foreground mx-auto mb-4" />
				<h3 class="text-lg font-semibold mb-2">No posts in {selectedCategory}</h3>
				<p class="text-muted-foreground">Be the first to share something in this category!</p>
			</CardContent>
		</Card>
	{/if}
</div>