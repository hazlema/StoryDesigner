<script lang="ts">
    import { onMount } from 'svelte';

    type MessageKind = 'system' | 'command' | 'response' | 'error';
    interface MessageItem {
        type: MessageKind;
        content: string;
        timestamp: string;
    }

    let socket: any = $state(null);
    let connectionStatus = $state('Disconnected');
    let messages = $state([] as MessageItem[]);
    let commandInput = $state('');
    let serverUrl = $state('http://localhost:3000');
    let messageContainer: HTMLDivElement | null;
    
    // Pre-defined test commands for quick access
    const testCommands = [
        '/system-help',
        '/system-status',
        '/profile-name "Test User"',
        '/profile-emoji "🧪"',
        '/community-post "Hello from test interface!"',
        '/community-list',
        '/chat-broadcast "Testing broadcast feature"',
        '/story-create "Story.create(\\"Test Story\\").addScene(\\"intro\\").setText(\\"Hello world!\\");"',
        '/story-list',
        '/system-whoami'
    ];

    const addMessage = (type: MessageKind, content: string, timestamp = new Date()) => {
        messages = [...messages, {
            type,
            content,
            timestamp: timestamp.toLocaleTimeString()
        }];
        
        // Auto-scroll to bottom after message is added
        setTimeout(() => {
            if (messageContainer) {
                messageContainer.scrollTop = messageContainer.scrollHeight;
            }
        }, 10);
    };

    const connect = async () => {
        if (socket) {
            socket.disconnect();
        }
        
        addMessage('system', `Connecting to ${serverUrl}...`);
        // Lazy-load socket.io-client to avoid pulling it in during route prefetch
        const { io } = await import('socket.io-client');
        socket = io(serverUrl);
        
        socket.on('connect', () => {
            connectionStatus = 'Connected';
            addMessage('system', `✅ Connected to AI Story Interface server`);
        });
        
        socket.on('disconnect', () => {
            connectionStatus = 'Disconnected';
            addMessage('system', '🔌 Disconnected from server');
        });
        
        socket.on('response', (data: string) => {
            addMessage('response', data);
        });
        
        socket.on('connect_error', (error: Error) => {
            connectionStatus = 'Connection Failed';
            addMessage('error', `❌ Connection failed: ${error.message}`);
        });
    };

    const disconnect = () => {
        if (socket) {
            socket.disconnect();
            socket = null;
        }
    };

    const sendCommand = (command: string = commandInput) => {
        if (!socket || !socket.connected) {
            addMessage('error', '❌ Not connected to server');
            return;
        }
        
        if (!command.trim()) {
            addMessage('error', '❌ Command cannot be empty');
            return;
        }
        
        addMessage('command', command);
        socket.emit('command', command);
        
        if (command === commandInput) {
            commandInput = '';
        }
    };

    const clearMessages = () => {
        messages = [];
    };

    const handleKeydown = (event: KeyboardEvent) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendCommand();
        }
    };

    onMount(() => {
        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
    });
</script>

<svelte:head>
    <title>AI Story Interface Tester</title>
</svelte:head>

<div class="container mx-auto p-6 max-w-6xl">
    <h1 class="text-3xl font-bold mb-6">🤖 AI Story Interface Tester</h1>
    
    <!-- Connection Panel -->
    <div class="bg-card text-card-foreground rounded-lg p-4 mb-6 border border-border">
        <div class="flex items-center gap-4 mb-4">
            <div class="flex items-center gap-2">
                <span class="font-medium">Server:</span>
                <input
                    bind:value={serverUrl}
                    class="border rounded px-3 py-1 text-sm"
                    placeholder="http://localhost:3000"
                    disabled={connectionStatus === 'Connected'}
                />
            </div>
            <div class="flex items-center gap-2">
                <div class="font-medium">Status:</div>
                <span class="px-2 py-1 rounded text-sm font-medium" 
                      class:bg-accent={connectionStatus === 'Connected'}
                      class:text-accent-foreground={connectionStatus === 'Connected'}
                      class:bg-destructive={connectionStatus === 'Connection Failed'}
                      class:text-foreground={connectionStatus === 'Connection Failed'}
                      class:bg-muted={connectionStatus === 'Disconnected'}
                      class:text-muted-foreground={connectionStatus === 'Disconnected'}>
                    {connectionStatus}
                </span>
            </div>
        </div>
        
        <div class="flex gap-2">
            <button 
                onclick={connect}
                disabled={connectionStatus === 'Connected'}
                class="px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">
                Connect
            </button>
            <button 
                onclick={disconnect}
                disabled={connectionStatus === 'Disconnected'}
                class="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">
                Disconnect
            </button>
        </div>
    </div>

    <!-- Quick Commands -->
    <div class="bg-card text-card-foreground rounded-lg p-4 mb-6 border border-border">
        <h3 class="font-bold mb-3">🚀 Quick Test Commands</h3>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {#each testCommands as command (command)}
                <button
                    onclick={() => sendCommand(command)}
                    disabled={connectionStatus !== 'Connected'}
                    class="px-3 py-2 text-sm bg-card border border-border rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed text-left">
                    <code class="text-xs">{command}</code>
                </button>
            {/each}
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Command Input -->
        <div class="space-y-4">
            <div>
                <label for="command-input" class="block font-medium mb-2">💬 Send Command</label>
                <div class="flex gap-2">
                    <input
                        id="command-input"
                        bind:value={commandInput}
                        onkeydown={handleKeydown}
                        placeholder="Enter command (e.g., /system-help)"
                        class="flex-1 border border-input rounded px-3 py-2 bg-background text-foreground"
                        disabled={connectionStatus !== 'Connected'}
                    />
                    <button
                        onclick={() => sendCommand()}
                        disabled={connectionStatus !== 'Connected' || !commandInput.trim()}
                        class="px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">
                        Send
                    </button>
                </div>
                <p class="text-sm text-muted-foreground mt-1">Press Enter to send, or click the Send button</p>
            </div>

            <!-- Command Reference -->
            <div class="bg-card text-card-foreground rounded-lg p-4 border border-border">
                <h4 class="font-bold mb-2">📋 Available Commands</h4>
                <div class="text-sm space-y-1">
                    <div><strong>System:</strong> /help, /status, /whoami, /quit</div>
                    <div><strong>Profile:</strong> /profile-name &lt;name&gt;, /profile-emoji &lt;emoji&gt;</div>
                    <div><strong>Community:</strong> /community-post &lt;message&gt;, /community-list, /community-search &lt;term&gt;</div>
                    <div><strong>Chat:</strong> /chat-broadcast &lt;message&gt;</div>
                    <div><strong>Story:</strong> /story-create &lt;code&gt;, /story-list, /story-search &lt;term&gt;</div>
                </div>
            </div>
        </div>

        <!-- Message Log -->
        <div class="space-y-4">
            <div class="flex items-center justify-between">
                <div class="block font-medium">📜 Message Log</div>
                <button
                    onclick={clearMessages}
                    class="px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded hover:opacity-90">
                    Clear Log
                </button>
            </div>
            
            <div bind:this={messageContainer} class="border border-border rounded-lg h-96 overflow-y-auto bg-card text-foreground font-mono text-sm p-4">
                {#if messages.length === 0}
                    <div class="text-muted-foreground">No messages yet. Connect to server and send a command to get started.</div>
                {:else}
                    {#each messages as message (message)}
                        <div class="mb-2 flex">
                            <span class="text-muted-foreground mr-2">[{message.timestamp}]</span>
                            <span class="mr-2"
                                  class:text-primary={message.type === 'system'}
                                  class:text-accent={message.type === 'command'}
                                  class:text-foreground={message.type === 'response'}
                                  class:text-destructive={message.type === 'error'}>
                                {message.type.toUpperCase()}:
                            </span>
                            <span class="flex-1 whitespace-pre-wrap">{message.content}</span>
                        </div>
                    {/each}
                {/if}
            </div>
        </div>
    </div>
</div>

<!-- Removed global body style to prevent prefetch hover from affecting the whole app -->