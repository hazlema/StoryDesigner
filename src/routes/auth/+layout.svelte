<script lang="ts">
	import { page } from '$app/stores';
	let { children } = $props();
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
	<div class="w-full max-w-md">
		<div class="bg-white rounded-2xl shadow-xl p-8">
			<!-- Logo/Brand -->
			<div class="text-center mb-8">
				<h1 class="text-3xl font-bold text-gray-900">StoryDesigner</h1>
				<p class="text-gray-600 mt-2">Create, share, and discover interactive stories</p>
			</div>

			<!-- Auth Form Content -->
			{@render children?.()}

			<!-- Footer Links -->
			<div class="mt-8 text-center text-sm text-gray-600">
				{#if $page.url.pathname === '/auth/login'}
					<p>
						Don't have an account?
						<a href="/auth/signup" class="text-indigo-600 hover:text-indigo-500 font-medium">
							Sign up
						</a>
					</p>
				{:else if $page.url.pathname === '/auth/signup'}
					<p>
						Already have an account?
						<a href="/auth/login" class="text-indigo-600 hover:text-indigo-500 font-medium">
							Sign in
						</a>
					</p>
				{/if}
			</div>
		</div>

		<!-- Additional Links -->
		<div class="mt-6 text-center">
			<a href="/" class="text-gray-500 hover:text-gray-700 text-sm">
				← Back to home
			</a>
		</div>
	</div>
</div>