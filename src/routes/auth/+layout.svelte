<script lang="ts">
	import { page as pageCtx } from '$app/state';
	let { children } = $props();
	const page = pageCtx; // use as plain object in expressions
</script>

<div class="min-h-screen bg-background flex items-center justify-center p-4">
	<div class="w-full max-w-md">
		<div class="bg-card text-card-foreground rounded-2xl shadow-xl p-8">
			<!-- Logo/Brand -->
			<div class="text-center mb-8">
				<h1 class="text-3xl font-bold text-foreground">StoryDesigner</h1>
				<p class="text-muted-foreground mt-2">Create, share, and discover interactive stories</p>
			</div>

			<!-- Auth Form Content -->
			{@render children?.()}

			<!-- Footer Links -->
			<div class="mt-8 text-center text-sm text-muted-foreground">
				{#if page.url.pathname === '/auth/login'}
					<p>
						Don't have an account?
						<a href="/auth/signup" class="text-primary hover:text-primary/90 font-medium">
							Sign up
						</a>
					</p>
				{:else if page.url.pathname === '/auth/signup'}
					<p>
						Already have an account?
						<a href="/auth/login" class="text-primary hover:text-primary/90 font-medium">
							Sign in
						</a>
					</p>
				{/if}
			</div>
		</div>

		<!-- Additional Links -->
		<div class="mt-6 text-center">
			<a href="/" class="text-muted-foreground hover:text-foreground text-sm">
				← Back to home
			</a>
		</div>
	</div>
</div>