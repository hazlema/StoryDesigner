<script lang="ts">
	import { Separator } from "$lib/components/ui/separator";
	import { Badge } from "$lib/components/ui/badge";
	import { HeartIcon, GithubIcon, TwitterIcon } from "@lucide/svelte";
</script>

<footer class="border-t bg-sidebar/30 backdrop-blur-sm">
	<div class="px-4 py-3">
		<div class="flex items-center justify-between text-sm">
			<!-- Left side - Copyright and status -->
			<div class="flex items-center gap-4">
				<span class="text-muted-foreground">© 2024 StoryDesigner</span>
				<Separator orientation="vertical" class="h-4" />
				<div class="flex items-center gap-2">
					<Badge variant="outline" class="text-xs">
						<div class="size-2 bg-green-500 rounded-full mr-1"></div>
						Online
					</Badge>
					<span class="text-muted-foreground">Auto-save enabled</span>
				</div>
			</div>

			<!-- Right side - Links and credits -->
			<div class="flex items-center gap-4">
				<div class="flex items-center gap-1 text-muted-foreground">
					<span>Made with</span>
					<HeartIcon class="size-3 text-red-500 fill-current" />
					<span>for storytellers</span>
				</div>
				<Separator orientation="vertical" class="h-4" />
				<div class="flex items-center gap-2">
					<button class="text-muted-foreground hover:text-primary transition-colors">
						<GithubIcon class="size-4" />
					</button>
					<button class="text-muted-foreground hover:text-primary transition-colors">
						<TwitterIcon class="size-4" />
					</button>
				</div>
			</div>
		</div>
	</div>
</footer>
