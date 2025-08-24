<script lang="ts">
	import { createClient } from '@supabase/supabase-js';
	
	let status = $state('Ready');
	let result = $state('');

	// Create a fresh client directly here to bypass any issues in our lib
	const testClient = createClient(
		'https://ffnacmihidxshsbtqdrx.supabase.co',
		'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmbmFjbWloaWR4c2hzYnRxZHJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4OTEyODYsImV4cCI6MjA3MTQ2NzI4Nn0.Qq2JgNfVHNareyP-rP4WYmTrJjCl9z6-nNL7BZVEQTs'
	);

	const testAuth = async () => {
		status = 'Testing auth...';
		result = '';
		
		try {
			// Simple timeout wrapper
			const timeoutPromise = new Promise((_, reject) => 
				setTimeout(() => reject(new Error('Timeout after 5 seconds')), 5000)
			);

			// Test getSession (local only)
			status = 'Testing getSession...';
			const sessionResult: any = await Promise.race([
				testClient.auth.getSession(),
				timeoutPromise
			]);
			result += `✅ getSession worked: ${sessionResult.data.session ? 'Has session' : 'No session'}\n`;

			// Test getUser (network call)
			status = 'Testing getUser...';
			const userResult: any = await Promise.race([
				testClient.auth.getUser(),
				timeoutPromise
			]);
			result += `✅ getUser worked: ${userResult.data.user ? 'Has user' : 'No user'}\n`;
			
			status = 'Tests completed successfully!';
			
		} catch (error) {
			const err = error as { message?: string };
			result += `❌ Error: ${err?.message ?? 'Unknown error'}\n`;
			status = 'Test failed';
		}
	};

	const testSignup = async () => {
		status = 'Testing signup...';
		result = '';
		
		try {
			const timeoutPromise = new Promise((_, reject) => 
				setTimeout(() => reject(new Error('Signup timeout after 10 seconds')), 10000)
			);

			const signupResult: any = await Promise.race([
				testClient.auth.signUp({
					email: 'test@example.com',
					password: 'testpassword123'
				}),
				timeoutPromise
			]);
			
			result += `✅ Signup attempt completed\n`;
			result += `Data: ${JSON.stringify(signupResult.data, null, 2)}\n`;
			if (signupResult.error) {
				result += `Error: ${signupResult.error.message}\n`;
			}
			
			status = 'Signup test completed';
			
		} catch (error) {
			const err = error as { message?: string };
			result += `❌ Signup error: ${err?.message ?? 'Unknown error'}\n`;
			status = 'Signup test failed';
		}
	};
</script>

<div class="p-8">
	<h1 class="text-2xl font-bold mb-4">Simple Auth Test</h1>
	
	<div class="space-y-4">
		<div>
			<strong>Status:</strong> {status}
		</div>
		
		<div class="space-x-4">
			<button 
				onclick={testAuth}
				class="bg-primary text-primary-foreground px-4 py-2 rounded"
			>
				Test Auth Methods
			</button>
			
			<button 
				onclick={testSignup}
				class="bg-secondary text-secondary-foreground px-4 py-2 rounded"
			>
				Test Signup
			</button>
		</div>
		
		{#if result}
			<div class="bg-card text-card-foreground border border-border p-4 rounded font-mono text-sm whitespace-pre-wrap">
				{result}
			</div>
		{/if}
	</div>
</div>