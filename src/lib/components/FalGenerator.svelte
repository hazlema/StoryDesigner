<script lang="ts">
  import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import { ImageIcon, VideoIcon, LoaderIcon, DownloadIcon, XIcon, WandIcon, SparklesIcon, PlusIcon, PlayIcon, ListIcon, ChevronDownIcon } from '@lucide/svelte';
  import { hub } from '$lib/events/eventsHub';
  import { PromptEnhancer, defaultTemplates } from '$lib/services/promptEnhancer';
  import { slide, fade } from 'svelte/transition';

  // Props
  let { open = $bindable(false) } = $props();

  // State
  let userInput = $state(''); // Store the raw user input
  let selectedModel = $state<'flux-kontext' | 'flux-pro' | 'veo3-text' | 'veo3-image'>('flux-kontext');
  let imageUrl = $state(''); // For image-to-video
  let isGenerating = $state(false);
  let result: { url: string; type: 'image' | 'video' } | null = $state(null);
  let error = $state('');
  let showPromptPopup = $state(false);
  let queue: Array<{ id: string; prompt: string; model: string; status: 'pending' | 'generating' | 'completed' | 'failed'; result?: string }> = $state([]);
  let selectedTemplate = $state('manual');
  let showTemplateDropdown = $state(false);
  let autoEnhance = $state(true); // Default ON - Toggle state for auto-enhancement
  let isProcessing = $state(false); // Prevents double-click during enhancement + generation
  let isPromptEnhanced = $state(false); // Track if current prompt has been enhanced

  // Initialize prompt enhancer
  const promptEnhancer = new PromptEnhancer();

  // Computed prompt that shows template preview
  let displayPrompt = $derived(() => {
    if (selectedTemplate === 'manual') return userInput;
    
    const template = promptEnhancer.getTemplate(selectedTemplate);
    if (!template) return userInput;
    
    // Show template structure even with empty input
    const inputText = userInput.trim() || '[Your prompt will go here]';
    return template.template.replace(/\[USER_INPUT\]/g, inputText);
  });

  // Show template preview only when not manual
  let showTemplatePreview = $derived(selectedTemplate !== 'manual');

  // Model configurations
  const models = {
    'flux-kontext': {
      name: 'Flux Kontext',
      description: 'High-quality text-to-image generation with character consistency',
      icon: ImageIcon,
      type: 'image' as const,
      params: {
       	aspect_ratio: '16:9' as const,
        num_images: 1
      }
    },
    'flux-pro': {
      name: 'Flux Pro',
      description: 'High-quality text-to-image generation',
      icon: ImageIcon,
      type: 'image' as const,
      params: {
        image_size: 'landscape_16_9' as const,
        num_images: 1
      }
    },
    'veo3-text': {
      name: 'VEO3 Text Video',
      description: 'Generate videos from text descriptions',
      icon: VideoIcon,
      type: 'video' as const,
      params: {
        aspect_ratio: '16:9' as const,
        duration: 8,
        resolution: '720p' as const
      }
    },
    'veo3-image': {
      name: 'VEO3 Image Video',
      description: 'Animate images into videos',
      icon: VideoIcon,
      type: 'video' as const,
      params: {
        duration: '8s',
        resolution: '720p' as const
      }
    }
  };

  async function enhancePrompt() {
    if (!userInput.trim()) return;
    
    try {
      let promptToEnhance = '';
      
      // If manual style, use the raw user input for enhancement
      if (selectedTemplate === 'manual') {
        console.log('🎨 MANUAL STYLE: Enhancing raw user input');
        promptToEnhance = userInput;
      } else {
        // Use the full template preview text for enhancement
        promptToEnhance = displayPrompt();
      }
      
      // Send the prompt to Claude for processing using the prompt-enhancer template
      const finalPrompt = promptEnhancer.enhancePrompt(promptToEnhance, 'prompt-enhancer');
      const response = await fetch('/api/ai/notebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze',
          content: finalPrompt
        })
      });

      const data = await response.json();
      if (data.success) {
        userInput = data.response;
        isPromptEnhanced = true; // Mark as enhanced
        console.log('🎨 PROMPT ENHANCED using template:', selectedTemplate);
      }
    } catch (err) {
      console.error('Prompt enhancement error:', err);
    }
  }

  function addToQueue() {
    if (!userInput.trim()) return;
    
    const queueItem = {
      id: Date.now().toString(),
      prompt: displayPrompt(),
      model: selectedModel,
      status: 'pending' as const
    };
    
    queue.push(queueItem);
    console.log('🔄 ADDED TO QUEUE:', queueItem.id);
  }

  async function generateContent(addToQueueAfter = false) {
    // Prevent double-clicks
    if (isProcessing || isGenerating) return;
    
    if (!userInput.trim()) return;
    if (selectedModel === 'veo3-image' && !imageUrl.trim()) {
      error = 'Image URL is required for image-to-video generation';
      return;
    }

    // Set processing flag immediately
    isProcessing = true;
    
    try {
      // Auto-enhance if toggle is enabled AND prompt hasn't been enhanced yet
      if (autoEnhance && !isPromptEnhanced) {
        await enhancePrompt();
      }
    } catch (err) {
      console.error('Enhancement error:', err);
      // Continue with generation even if enhancement fails
    }

    // Close prompt popup immediately when generation starts
    showPromptPopup = false;
    
    isGenerating = true;
    isProcessing = false; // Enhancement done, now generating
    error = '';
    result = null;

    try {
      let apiParams: any = { prompt: displayPrompt() };
      let action = '';

      switch (selectedModel) {

		case 'flux-kontext': 
          action = 'generateImageKontext';
          apiParams = { ...apiParams, ...models['flux-kontext'].params };
          break;

        case 'flux-pro':
          action = 'generateImage';
          apiParams = { ...apiParams, ...models['flux-pro'].params };
          break;
        case 'veo3-text':
          action = 'generateVideo';
          apiParams = { ...apiParams, ...models['veo3-text'].params };
          break;
        case 'veo3-image':
          action = 'generateVideoFromImage';
          apiParams = { 
            ...apiParams, 
            image_url: imageUrl.trim(),
            ...models['veo3-image'].params 
          };
          break;
      }

      const response = await fetch('/api/fal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...apiParams })
      });

      const data = await response.json();

      if (data.success) {
        const model = models[selectedModel];
        if (model.type === 'image') {
          result = {
            url: data.result.images[0].url,
            type: 'image'
          };
        } else {
          result = {
            url: data.result.video.url,
            type: 'video'
          };
        }

        // Emit event for potential integration
        hub.emit('fal.generation.complete', {
          model: selectedModel,
          prompt: displayPrompt(),
          result: result.url,
          type: result.type
        });

        console.log('🎨 FAL GENERATOR: Content generated successfully');
        
        // Add to queue if requested
        if (addToQueueAfter) {
          addToQueue();
        }
      } else {
        error = data.error || 'Generation failed';
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Fal generation error:', err);
    } finally {
      isGenerating = false;
      isProcessing = false; // Always reset both flags
    }
  }

  function clearAll() {
    userInput = '';
    imageUrl = '';
    result = null;
    error = '';
    isPromptEnhanced = false; // Reset enhanced flag
    console.log('🎨 FAL GENERATOR: Cleared');
  }

  function downloadContent() {
    if (!result) return;
    
    const link = document.createElement('a');
    link.href = result.url;
    link.download = `generated-${result.type}-${Date.now()}.${result.type === 'image' ? 'png' : 'mp4'}`;
    link.click();
    
    console.log('🎨 FAL GENERATOR: Downloaded', result.type);
  }

  // Keyboard shortcuts
  function handleKeydown(event: KeyboardEvent) {
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 'Enter':
          event.preventDefault();
          if (userInput.trim() && !isGenerating) {
            generateContent();
          }
          break;
        case 'k':
          event.preventDefault();
          clearAll();
          break;
      }
    }
  }

  // Close dropdown when clicking outside
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as Element;
    if (!target.closest('.template-dropdown-container')) {
      showTemplateDropdown = false;
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} on:click={handleClickOutside} />

<Dialog bind:open>
  <DialogContent class="p-0 border-0 shadow-none bg-transparent max-w-none" showCloseButton={false}>
    <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-4xl h-[85vh] bg-background border border-border rounded-lg shadow-lg flex flex-col overflow-hidden">
      <DialogHeader class="p-4 flex-shrink-0 relative border-b">
        <DialogTitle class="flex items-center gap-2 pr-16">
          <WandIcon class="size-5 text-primary" />
          Fal.ai Content Generator
          <Badge variant="secondary" class="ml-2">
            ✨ AI-Powered
          </Badge>
        </DialogTitle>
        <DialogDescription>
          Generate high-quality images and videos for your stories using Fal.ai models
        </DialogDescription>
        
        <!-- Removed Generate New button - moved to footer as Change Prompt -->
        
        <!-- Close button -->
        <button
          class="absolute top-4 right-4 opacity-70 hover:opacity-100 transition-opacity p-1 rounded-sm hover:bg-muted"
          onclick={() => open = false}
        >
          <XIcon class="size-4" />
          <span class="sr-only">Close</span>
        </button>
      </DialogHeader>

      <!-- Main Gallery Viewer -->
      <div class="flex-1 overflow-hidden flex flex-col">
        <div class="flex-1 flex items-center justify-center p-6">
          {#if isGenerating}
            <div class="text-center space-y-4">
              <LoaderIcon class="size-16 mx-auto animate-spin text-primary" />
              <div class="space-y-2">
                <p class="text-lg font-medium">Generating your {models[selectedModel].type}...</p>
                <p class="text-sm text-muted-foreground">Using {models[selectedModel].name}</p>
                <p class="text-xs text-muted-foreground">This may take 30-60 seconds</p>
              </div>
            </div>
          {:else if result}
            <div class="w-full h-full flex flex-col">
              <div class="flex-1 flex items-center justify-center">
                {#if result.type === 'image'}
                  <img 
                    src={result.url} 
                    alt="Generated content"
                    class="max-w-full max-h-full object-contain rounded-lg border"
                  />
                {:else}
                  <video 
                    src={result.url} 
                    controls
                    class="max-w-full max-h-full object-contain rounded-lg border"
                  >
                    Your browser doesn't support video playback.
                  </video>
                {/if}
              </div>
              <div class="mt-4 flex gap-3 justify-center">
                <Button 
                  variant="outline"
                  onclick={() => {
                    if (result) {
                      navigator.clipboard.writeText(result.url);
                      console.log('📋 IMAGE URL COPIED');
                    }
                  }}
                >
                  Copy Image URL
                </Button>
                <Button 
                  variant="outline"
                  onclick={downloadContent}
                >
                  <DownloadIcon class="size-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          {:else}
            <div class="text-center space-y-4 text-muted-foreground">
              <div class="size-24 mx-auto rounded-full bg-muted flex items-center justify-center">
                <WandIcon class="size-12" />
              </div>
              <div class="space-y-2">
                <p class="text-lg font-medium">Ready to create amazing content!</p>
                <p class="text-sm">Click "Generate New" to start creating images and videos</p>
              </div>
            </div>
          {/if}
        </div>

        {#if error}
          <div class="mx-6 mb-6 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p class="text-sm text-destructive">{error}</p>
          </div>
        {/if}
      </div>

      <!-- Bottom Actions -->
      <div class="border-t bg-background p-4">
        <div class="flex gap-3 justify-between items-center">
          <div class="text-sm text-muted-foreground">
            {#if queue.length > 0}
              {queue.length} item{queue.length !== 1 ? 's' : ''} in queue
            {:else}
              Ready to generate
            {/if}
          </div>
          
          <div class="flex gap-3 items-center">
            {#if userInput.trim() && !isGenerating}
              <Button 
                variant="default"
                class="bg-sky-400 hover:bg-sky-500 text-white"
                onclick={() => {
                  // For re-generation, disable auto-enhance if prompt was already enhanced
                  const wasAutoEnhance = autoEnhance;
                  if (isPromptEnhanced) {
                    autoEnhance = false;
                  }
                  generateContent(false).then(() => {
                    // Restore auto-enhance setting
                    autoEnhance = wasAutoEnhance;
                  });
                }}
              >
                <WandIcon class="size-4 mr-2" />
                Regenerate
              </Button>
            {/if}
            
            <Button 
              variant="outline"
              onclick={() => {
                showPromptPopup = true;
                // Reset ALL flags when opening prompt popup (failsafe)
                isProcessing = false;
                isGenerating = false;
                error = '';
                // Note: userInput and isPromptEnhanced preserved for potential re-use
              }}
              disabled={isGenerating}
            >
              Change Prompt
            </Button>
            
            <Button variant="outline" onclick={() => open = false}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  </DialogContent>
</Dialog>

<!-- Prompt Popup Dialog -->
{#if showPromptPopup}
  <Dialog bind:open={showPromptPopup}>
    <DialogContent class="p-0 border-0 shadow-none bg-transparent max-w-none" showCloseButton={false}>
      <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[70vw] max-w-2xl bg-background border border-border rounded-lg shadow-lg overflow-visible">
        
        <!-- Popup Header -->
        <div class="p-4 border-b">
          <h3 class="text-lg font-medium">Choose your generator:</h3>
          <div class="flex flex-wrap gap-2 mt-3">
            {#each Object.entries(models) as [key, model]}
              <Button
                variant={selectedModel === key ? "default" : "outline"}
                size="sm"
                class="flex items-center gap-2"
                onclick={() => selectedModel = key as typeof selectedModel}
              >
                <model.icon class="size-4" />
                {model.name}
              </Button>
            {/each}
          </div>
          <p class="text-sm text-muted-foreground mt-2">{models[selectedModel].description}</p>
        </div>
        
        <!-- Prompt Content -->
        <div class="p-4 space-y-4">
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <label for="popup-prompt" class="text-sm font-medium">Prompt / Image URL:</label>
              <div class="flex items-center gap-3">
                <!-- Template Selector -->
                <div class="relative template-dropdown-container">
                  <Button
                    variant="outline"
                    size="sm"
                    class="flex items-center gap-2 min-w-[140px] justify-between"
                    onclick={() => showTemplateDropdown = !showTemplateDropdown}
                  >
                    <span class="text-xs truncate">
                      {promptEnhancer.getTemplate(selectedTemplate)?.name || 'Select Template'}
                    </span>
                    <ChevronDownIcon class="size-3" />
                  </Button>
                  
                  {#if showTemplateDropdown}
                    <div class="absolute top-full mt-1 right-0 z-50 min-w-[220px] max-w-[300px] bg-background border border-border rounded-md shadow-lg max-h-[300px] overflow-y-auto" transition:slide={{ duration: 400 }}>
                      {#each promptEnhancer.getTemplates().filter(t => t.id !== 'prompt-enhancer') as template}
                        <button
                          class="w-full text-left px-3 py-2 text-sm hover:bg-muted border-b border-border/50 last:border-b-0"
                          onclick={() => {
                            selectedTemplate = template.id;
                            showTemplateDropdown = false;
                            // Auto-enable enhancement when selecting a template
                            if (template.id !== 'manual') {
                              autoEnhance = true;
                            }
                            // Reset enhanced flag when changing templates
                            isPromptEnhanced = false;
                          }}
                        >
                          <div class="font-medium">{template.name}</div>
                          <div class="text-xs text-muted-foreground truncate">{template.description}</div>
                        </button>
                      {/each}
                    </div>
                  {/if}
                </div>
                
                <!-- Auto-Enhance Toggle -->
                <label class="flex items-center gap-2 cursor-pointer">
                  <div class="relative">
                    <input
                      type="checkbox"
                      bind:checked={autoEnhance}
                      class="sr-only peer"
                    />
                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-300 dark:peer-focus:ring-sky-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-sky-400 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                  </div>
                  <span class="text-sm font-medium flex items-center gap-1">
                    <SparklesIcon class="size-4" />
                    Auto-Enhance
                  </span>
                </label>
              </div>
            </div>
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <label class="text-xs text-muted-foreground">Your Input:</label>
                  {#if userInput.trim()}
                    <button
                      class="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
                      onclick={() => {
                        userInput = '';
                        isPromptEnhanced = false;
                      }}
                    >
                      clear
                    </button>
                  {/if}
                </div>
                {#if autoEnhance}
                  <span class="text-xs text-sky-400 flex items-center gap-1">
                    <SparklesIcon class="size-3" />
                    Auto-enhance enabled {selectedTemplate !== 'manual' ? `with ${promptEnhancer.getTemplate(selectedTemplate)?.name}` : '(AI will improve your prompt)'}
                  </span>
                {/if}
              </div>
              <textarea
                id="user-input"
                bind:value={userInput}
                placeholder="Describe what you want to generate... Be detailed and creative!"
                class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                disabled={isGenerating}
                oninput={() => isPromptEnhanced = false}
              ></textarea>
              
              {#if showTemplatePreview}
                <div transition:slide={{ duration: 500 }}>
                  <label class="text-xs text-muted-foreground">Template Preview:</label>
                  <textarea
                    id="template-preview"
                    value={displayPrompt()}
                    placeholder="Template preview will appear here..."
                    class="flex min-h-[100px] w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground resize-none"
                    readonly
                  ></textarea>
                </div>
              {/if}
            </div>
          </div>

          {#if selectedModel === 'veo3-image'}
            <div class="space-y-2">
              <Input
                bind:value={imageUrl}
                placeholder="https://example.com/image.jpg (for image-to-video)"
                disabled={isGenerating}
                class="w-full"
              />
            </div>
          {/if}
        </div>
        
        <!-- Popup Actions -->
        <div class="border-t bg-background p-4">
          <div class="flex gap-3 justify-center">
            <Button 
              onclick={() => generateContent(false)}
              disabled={isProcessing || isGenerating || !userInput.trim() || (selectedModel === 'veo3-image' && !imageUrl.trim())}
              class="bg-sky-400 hover:bg-sky-500 text-white"
            >
              {#if isProcessing || isGenerating}
                <LoaderIcon class="size-4 mr-2 animate-spin" />
              {/if}
              {isProcessing ? 'Enhancing...' : isGenerating ? 'Generating...' : 'Generate Now'}
            </Button>
            
            <Button 
              variant="outline"
              onclick={addToQueue}
              disabled={!userInput.trim() || (selectedModel === 'veo3-image' && !imageUrl.trim())}
            >
              Add to Queue
            </Button>
            
            <Button 
              variant="outline" 
              onclick={() => {
                showPromptPopup = false;
                isProcessing = false; // Reset when closing
              }}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
{/if}