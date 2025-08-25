<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import { X, Send, User, Circle } from '@lucide/svelte';
	
	let { open, onClose } = $props<{
		open: boolean;
		onClose: () => void;
	}>();
	
	// Mock data for IRC-style interface
	let connectedUsers = $state([
		{ id: 1, name: 'AIServer', status: 'online', role: 'system' },
		{ id: 2, name: 'StoryBot', status: 'online', role: 'bot' },
		{ id: 3, name: 'ProcessMonitor', status: 'online', role: 'system' },
		{ id: 4, name: 'DataSync', status: 'away', role: 'bot' }
	]);
	
	let messages = $state([
		{ id: 1, user: 'AIServer', time: '12:58:31', type: 'system', content: '*** AI Server connected ***' },
		{ id: 2, user: 'StoryBot', time: '12:58:45', type: 'info', content: 'Processing story generation request...' },
		{ id: 3, user: 'AIServer', time: '12:59:12', type: 'data', content: 'Generated 1,247 words for "The Quantum Chronicles"' },
		{ id: 4, user: 'ProcessMonitor', time: '12:59:30', type: 'status', content: 'Memory usage: 67% | CPU: 23% | Active threads: 12' }
	]);
	
	let currentMessage = $state('');
	
	function sendMessage() {
		if (currentMessage.trim()) {
			messages.push({
				id: messages.length + 1,
				user: 'User',
				time: new Date().toLocaleTimeString('en-US', { hour12: false }),
				type: 'user',
				content: currentMessage
			});
			currentMessage = '';
		}
	}
	
	function getStatusColor(status: string) {
		switch (status) {
			case 'online': return 'text-accent';
			case 'away': return 'text-secondary';
			case 'offline': return 'text-destructive';
			default: return 'text-muted-foreground';
		}
	}
	
	function getMessageTypeStyle(type: string) {
		switch (type) {
			case 'system': return 'text-primary font-mono text-sm';
			case 'info': return 'text-accent-foreground font-mono text-sm';
			case 'data': return 'text-accent font-mono text-sm';
			case 'status': return 'text-secondary-foreground font-mono text-sm';
			case 'user': return 'text-foreground font-mono text-sm';
			default: return 'text-muted-foreground font-mono text-sm';
		}
	}
</script>

{#if open}
	<!-- Custom Dialog Overlay -->
	<div 
		class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
		onclick={onClose}
		onkeydown={(e) => e.key === 'Escape' && onClose()}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<!-- Dialog Content -->
		<div 
			class="w-[70vw] h-[80vh] bg-card border border-border rounded-lg overflow-hidden flex flex-col"
			onclick={(e) => e.stopPropagation()}
			role="document"
		>
			<!-- IRC-style Header -->
			<div class="flex items-center justify-between p-3 border-b border-border bg-muted shrink-0">
				<div class="flex items-center gap-2">
					<Circle class="h-3 w-3 fill-accent text-accent" />
					<span class="font-mono text-sm text-accent">#ai-server-monitor</span>
					<span class="text-xs text-muted-foreground">({connectedUsers.length} users)</span>
				</div>
				<Button variant="ghost" size="sm" onclick={onClose} class="text-muted-foreground hover:text-foreground">
					<X class="h-4 w-4" />
				</Button>
			</div>
			
			<!-- Main IRC Interface -->
			<div class="flex flex-1 min-h-0">
				<!-- Users List (Left Panel) -->
				<div class="w-48 bg-muted border-r border-border flex flex-col">
					<div class="p-3 border-b border-border shrink-0">
						<h3 class="font-mono text-sm text-muted-foreground">Users</h3>
					</div>
					<div class="flex-1 overflow-y-auto p-2 space-y-1">
						{#each connectedUsers as user (user.id)}
							<div class="flex items-center gap-2 px-2 py-1 rounded hover:bg-accent/20">
								<Circle class="h-2 w-2 fill-current {getStatusColor(user.status)}" />
								<span class="font-mono text-xs text-muted-foreground">{user.name}</span>
								{#if user.role === 'system'}
									<span class="text-xs text-primary">@</span>
								{:else if user.role === 'bot'}
									<span class="text-xs text-accent-foreground">+</span>
								{/if}
							</div>
						{/each}
					</div>
				</div>
				
				<!-- Main Chat Area (Right Panel) -->
				<div class="flex-1 flex flex-col bg-card min-w-0">
					<!-- Messages Area -->
					<div class="flex-1 overflow-y-auto p-4 space-y-2">
						{#each messages as message (message.id)}
							<div class="flex gap-2">
								<span class="font-mono text-xs text-muted-foreground/70 w-16 shrink-0">{message.time}</span>
								<span class="font-mono text-xs text-muted-foreground w-24 shrink-0">{message.user}:</span>
								<span class="{getMessageTypeStyle(message.type)} flex-1">{message.content}</span>
							</div>
						{/each}
					</div>
					
					<!-- Input Footer -->
					<div class="border-t border-border p-3 bg-muted shrink-0">
						<div class="flex gap-2">
							<input
								bind:value={currentMessage}
								onkeydown={(e) => {
									if (e.key === 'Enter' && !e.shiftKey) {
										e.preventDefault();
										sendMessage();
									}
								}}
								placeholder="Type a command or message..."
								class="flex-1 bg-card border border-input rounded px-3 py-2 text-sm font-mono text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
							/>
							<Button onclick={sendMessage} size="sm" class="bg-primary hover:bg-primary/90">
								<Send class="h-4 w-4" />
							</Button>
						</div>
						<div class="flex justify-between items-center mt-2 text-xs text-muted-foreground font-mono">
							<span>Connected to AI Server • Monitoring active</span>
							<span>Uptime: 23:42:15</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}