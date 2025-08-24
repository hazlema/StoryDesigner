<script lang="ts">
	import CategoriesSidebar from './CategoriesSidebar.svelte';
	import MainFeed from './MainFeed.svelte';
	import TrendingSidebar from './TrendingSidebar.svelte';
	
	// Community-wide state management
	let selectedCategory = $state<string>('general');
	let trendingTopics = $state<Record<string, Array<{name: string, count: number}>>>({
		general: [
			{ name: 'AI Storytelling', count: 42 },
			{ name: 'Character Development', count: 38 },
			{ name: 'Community Guidelines', count: 29 }
		],
		'narrative-construction': [
			{ name: 'Three Act Structure', count: 31 },
			{ name: 'Character Arcs', count: 27 },
			{ name: 'Plot Devices', count: 22 }
		],
		'tips-and-tricks': [
			{ name: 'Writing Productivity', count: 24 },
			{ name: 'Dialogue Tips', count: 18 },
			{ name: 'World Building Hacks', count: 15 }
		],
		'leaderboards': [
			{ name: 'Top Writers', count: 19 },
			{ name: 'Story Rankings', count: 14 },
			{ name: 'Community Challenges', count: 12 }
		],
		'new-stories': [
			{ name: 'Latest Releases', count: 35 },
			{ name: 'Featured Stories', count: 28 },
			{ name: 'Rising Authors', count: 21 }
		],
		'profile': [
			{ name: 'Account Settings', count: 8 },
			{ name: 'Subscription Plans', count: 5 },
			{ name: 'Privacy Options', count: 3 }
		]
	});
	
	// Derived state for current trending topics
	let currentTrending = $derived(trendingTopics[selectedCategory] || trendingTopics.general);
	
	function onCategoryChange(category: string) {
		selectedCategory = category;
	}
</script>

<div class="container mx-auto px-4 py-6">
	<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
		<!-- Categories Sidebar - Left Column -->
		<div class="lg:col-span-3">
			<CategoriesSidebar 
				{selectedCategory} 
				onCategorySelect={onCategoryChange} 
			/>
		</div>
		
		<!-- Main Feed - Center Column -->
		<div class="lg:col-span-6">
			<MainFeed {selectedCategory} />
		</div>
		
		<!-- Trending Sidebar - Right Column -->
		<div class="lg:col-span-3">
			<TrendingSidebar 
				trendingTopics={currentTrending}
				category={selectedCategory}
			/>
		</div>
	</div>
</div>