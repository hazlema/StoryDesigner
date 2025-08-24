<script lang="ts">
	import Config from '$lib/config';
</script>

<div class="p-6 bg-background text-foreground">
	<h1 class="text-3xl font-bold mb-6">Config Test</h1>
	
	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
		<!-- Config Values -->
		<div class="border border-border rounded-lg p-4 bg-card text-card-foreground">
			<h2 class="text-xl font-semibold mb-4">Config Values</h2>
			<div class="space-y-2">
				<div class="flex justify-between">
					<span class="font-medium">isDevelopment:</span>
					<span class="font-mono">{Config.isDevelopment ? 'true' : 'false'}</span>
				</div>
				<div class="flex justify-between">
					<span class="font-medium">isProduction:</span>
					<span class="font-mono">{Config.isProduction ? 'true' : 'false'}</span>
				</div>
				<div class="flex justify-between">
					<span class="font-medium">isStoryDir:</span>
					<span class="font-mono">{Config.isStoryDir || 'undefined'}</span>
				</div>
				<div class="flex justify-between">
					<span class="font-medium">isDebug:</span>
					<span class="font-mono">{Config.isDebug ? 'true' : 'false'}</span>
				</div>
				<div class="flex justify-between">
					<span class="font-medium">hasDebugFilters:</span>
					<span class="font-mono">{JSON.stringify(Config.hasDebugFilters)}</span>
				</div>
			</div>
		</div>

		<!-- Environment Info -->
		<div class="border border-border rounded-lg p-4 bg-card text-card-foreground">
			<h2 class="text-xl font-semibold mb-4">Environment Info</h2>
			<div class="space-y-2">
				<div class="flex justify-between">
					<span class="font-medium">NODE_ENV:</span>
					<span class="font-mono">{import.meta.env.NODE_ENV}</span>
				</div>
				<div class="flex justify-between">
					<span class="font-medium">DEPLOY_TYPE:</span>
					<span class="font-mono">{import.meta.env.DEPLOY_TYPE}</span>
				</div>
				<div class="flex justify-between">
					<span class="font-medium">IS_DEBUG:</span>
					<span class="font-mono">{import.meta.env.IS_DEBUG}</span>
				</div>
				<div class="flex justify-between">
					<span class="font-medium">PUBLIC_STORIES:</span>
					<span class="font-mono">{import.meta.env.PUBLIC_STORIES}</span>
				</div>
				<div class="flex justify-between">
					<span class="font-medium">DEBUG_FILTERS:</span>
					<span class="font-mono">{import.meta.env.DEBUG_FILTERS}</span>
				</div>
			</div>
		</div>
	</div>

	<!-- Console Output -->
	<div class="mt-6 border border-border rounded-lg p-4 bg-card text-card-foreground">
		<h2 class="text-xl font-semibold mb-4">Console Output</h2>
		<div class="bg-card text-card-foreground border border-border p-4 rounded font-mono text-sm">
			<div>Config.isDevelopment: {Config.isDevelopment}</div>
			<div>Config.isProduction: {Config.isProduction}</div>
			<div>Config.isStoryDir: {Config.isStoryDir}</div>
			<div>Config.isDebug: {Config.isDebug}</div>
			<div>Config.hasDebugFilters: {JSON.stringify(Config.hasDebugFilters)}</div>
		</div>
	</div>
</div>
