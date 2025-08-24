<script lang="ts">
  /* eslint-disable @typescript-eslint/no-unused-vars */
  import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import { BrainIcon, SparklesIcon, BarChart3Icon, MessageSquareIcon, LoaderIcon, XIcon } from '@lucide/svelte';
  import { hub } from '$lib/events/eventsHub';

  // Props
  let { open = $bindable(false) } = $props();

  // State
  let userInput = $state('');
  let aiResponse = $state('');
  let isLoading = $state(false);
  let activeAction = $state<'brainstorm' | 'analyze' | 'business' | null>(null);

  // Conversation history for context
  let conversation: Array<{ role: 'user' | 'assistant'; content: string }> = $state([]);

  async function sendToAI(action: 'brainstorm' | 'analyze' | 'business', content: string) {
    if (!content.trim()) return;

    isLoading = true;
    activeAction = action;
    
    try {
      const response = await fetch('/api/ai/notebook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          content: content.trim()
        })
      });

      const result = await response.json();

      if (result.success) {
        aiResponse = result.response;
        
        // Add to conversation history
        conversation.push(
          { role: 'user', content: content.trim() },
          { role: 'assistant', content: result.response }
        );

        // Emit event for potential integration
        hub.emit('ai.notebook.response', {
          action,
          userInput: content.trim(),
          aiResponse: result.response
        });

        console.log('🤖 AI NOTEBOOK: Response generated for', action);
      } else {
        aiResponse = `Error: ${result.error}`;
      }
    } catch (error) {
      aiResponse = `Error: ${error}`;
      console.error('AI Notebook error:', error);
    } finally {
      isLoading = false;
      activeAction = null;
    }
  }

  function clearNotebook() {
    userInput = '';
    aiResponse = '';
    conversation = [];
    console.log('🤖 AI NOTEBOOK: Cleared');
  }

  function exportToScene() {
    if (!userInput.trim()) return;
    
    // Emit event to create new scene with notebook content
    hub.emit('scene.create.from.notebook', {
      content: userInput.trim(),
      aiSuggestions: aiResponse
    });
    
    console.log('🤖 AI NOTEBOOK: Exported to scene editor');
    // Could close the dialog or show success message
  }

  // Keyboard shortcuts
  function handleKeydown(event: KeyboardEvent) {
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 'Enter':
          event.preventDefault();
          if (userInput.trim()) {
            sendToAI('brainstorm', userInput);
          }
          break;
        case 'k':
          event.preventDefault();
          clearNotebook();
          break;
      }
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<Dialog bind:open>
  <DialogContent class="p-0 border-0 shadow-none bg-transparent max-w-none" showCloseButton={false}>
    <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[85vh] bg-background border border-border rounded-lg shadow-lg flex flex-col overflow-hidden">
      <DialogHeader class="p-4 flex-shrink-0 relative border-b">
        <DialogTitle class="flex items-center gap-2 pr-10">
          <BrainIcon class="size-5 text-primary" />
          AI Story Notebook
          <Badge variant="secondary" class="ml-auto">
            💡 Powered by Claude
          </Badge>
        </DialogTitle>
        <DialogDescription>
          Brainstorm, analyze, and develop your story ideas with AI assistance
        </DialogDescription>
        <!-- Close button positioned in header -->
        <button
          class="absolute top-4 right-4 opacity-70 hover:opacity-100 transition-opacity p-1 rounded-sm hover:bg-muted"
          onclick={() => open = false}
        >
          <XIcon class="size-4" />
          <span class="sr-only">Close</span>
        </button>
      </DialogHeader>

    <!-- Chat Messages -->
    <div class="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
      {#if conversation.length === 0}
        <div class="text-center text-muted-foreground py-8">
          <BrainIcon class="size-12 mx-auto mb-3 opacity-50" />
          <p class="text-sm">Start a conversation with your AI writing assistant!</p>
          <p class="text-xs mt-1">Type your ideas below and choose how you'd like help.</p>
        </div>
      {/if}

      {#each conversation as message, index (index)}
        <div class="flex {message.role === 'user' ? 'justify-end' : 'justify-start'}">
          <div class="max-w-[80%] {message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-foreground'} rounded-2xl px-4 py-2">
            <div class="text-sm whitespace-pre-wrap leading-relaxed">
              {message.content}
            </div>
          </div>
        </div>
      {/each}

      {#if isLoading}
        <div class="flex justify-start">
          <div class="bg-gray-200 dark:bg-gray-700 rounded-2xl px-4 py-2">
            <div class="flex items-center gap-2 text-muted-foreground">
              <LoaderIcon class="size-4 animate-spin" />
              <span class="text-sm">AI is thinking...</span>
            </div>
          </div>
        </div>
      {/if}
    </div>

    <!-- Input Area -->
    <div class="border-t bg-background p-4 space-y-3">
      <textarea
        bind:value={userInput}
        placeholder="Describe your story idea, character, plot point, or presentation concept..."
        class="w-full p-3 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[80px] max-h-[120px]"
        disabled={isLoading}
      ></textarea>

      <!-- Action Buttons -->
      <div class="flex gap-2 justify-between">
        <div class="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onclick={() => sendToAI('brainstorm', userInput)}
            disabled={isLoading || !userInput.trim()}
            class="flex items-center gap-1"
          >
            {#if isLoading && activeAction === 'brainstorm'}
              <LoaderIcon class="size-3 animate-spin" />
            {:else}
              <SparklesIcon class="size-3" />
            {/if}
            Brainstorm
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onclick={() => sendToAI('analyze', userInput)}
            disabled={isLoading || !userInput.trim()}
            class="flex items-center gap-1"
          >
            {#if isLoading && activeAction === 'analyze'}
              <LoaderIcon class="size-3 animate-spin" />
            {:else}
              <MessageSquareIcon class="size-3" />
            {/if}
            Analyze
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onclick={() => sendToAI('business', userInput)}
            disabled={isLoading || !userInput.trim()}
            class="flex items-center gap-1"
          >
            {#if isLoading && activeAction === 'business'}
              <LoaderIcon class="size-3 animate-spin" />
            {:else}
              <BarChart3Icon class="size-3" />
            {/if}
            Business
          </Button>
        </div>

        <div class="flex gap-2">
          <Button variant="ghost" size="sm" onclick={clearNotebook} disabled={isLoading}>
            Clear
          </Button>
          <Button 
            onclick={exportToScene}
            disabled={!userInput.trim()}
            size="sm"
          >
            Export to Scene
          </Button>
          <Button variant="outline" size="sm" onclick={() => open = false}>
            Close
          </Button>
        </div>
      </div>
    </div>

      <!-- Footer with shortcuts -->
      <div class="text-xs text-muted-foreground text-center pt-2 border-t">
        <kbd class="px-1.5 py-0.5 bg-muted rounded text-xs">Ctrl+Enter</kbd> to brainstorm •
        <kbd class="px-1.5 py-0.5 bg-muted rounded text-xs">Ctrl+K</kbd> to clear
      </div>
    </div>
  </DialogContent>
</Dialog>

<style>
  textarea:focus {
    outline: none;
  }
</style>