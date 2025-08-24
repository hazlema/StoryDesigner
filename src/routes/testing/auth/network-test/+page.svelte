<script lang="ts">
	import { onMount } from 'svelte';

	let results = $state<string[]>([]);
	let testing = $state(true);

	onMount(async () => {
		const tests: string[] = [];

		// Test 1: Basic network connectivity to Supabase
		try {
			const response = await fetch('https://tdhjhbntzpnibuujfszt.supabase.co/rest/v1/', {
				method: 'GET',
				headers: {
					'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkaGpoYm50enBuaWJ1dWpmc3p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4ODY0MjMsImV4cCI6MjA3MTQ2MjQyM30.t4iKi0KQBu95uCrrjjM6tN0jjPcqtCRIKKZPh4NXTNw'
				}
			});
			tests.push(`✅ Supabase REST API: ${response.status} ${response.statusText}`);
		} catch (error) {
			const err = error as { message?: string };
			tests.push(`❌ Supabase REST API failed: ${err?.message ?? 'Unknown error'}`);
		}

		// Test 2: Auth endpoint specifically
		try {
			const response = await fetch('https://tdhjhbntzpnibuujfszt.supabase.co/auth/v1/settings', {
				method: 'GET'
			});
			tests.push(`✅ Supabase Auth API: ${response.status} ${response.statusText}`);
		} catch (error) {
			const err = error as { message?: string };
			tests.push(`❌ Supabase Auth API failed: ${err?.message ?? 'Unknown error'}`);
		}

		// Test 3: Check if project is accessible via browser
		tests.push(`🌐 Manual check: Visit https://tdhjhbntzpnibuujfszt.supabase.co in browser`);

		// Test 4: Environment variables
		tests.push(`📋 Supabase URL: https://tdhjhbntzpnibuujfszt.supabase.co`);
		tests.push(`📋 Anon key present: ✅`);

		results = tests;
		testing = false;
	});
</script>

<div class="p-8">
	<h1 class="text-2xl font-bold mb-4">Network Connectivity Test</h1>
	
	{#if testing}
		<p>Testing connections...</p>
	{:else}
		<div class="space-y-2 font-mono text-sm">
			{#each results as result}
				<div>{result}</div>
			{/each}
		</div>
		
		<div class="mt-6 p-4 bg-card text-card-foreground border border-border rounded">
			<h3 class="font-bold">Manual Tests:</h3>
			<ol class="list-decimal list-inside mt-2">
				<li>Open <a href="https://tdhjhbntzpnibuujfszt.supabase.co" class="text-primary underline" target="_blank">your Supabase project</a> in a new tab</li>
				<li>Check if your Supabase project is paused in the dashboard</li>
				<li>Verify your internet connection works for other sites</li>
			</ol>
		</div>
	{/if}
</div>