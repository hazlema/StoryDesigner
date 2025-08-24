<script lang="ts">
  import { defaultTemplates, type PromptTemplate } from '$lib/services/promptEnhancer';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  
  let templates = $state([...defaultTemplates]);
  let selectedTemplate: PromptTemplate | null = $state(null);
  let editingTemplate: PromptTemplate | null = $state(null);
  
  function selectTemplate(template: PromptTemplate) {
    selectedTemplate = template;
    editingTemplate = { ...template }; // Create copy for editing
  }
  
  async function saveTemplate() {
    if (!editingTemplate) return;
    
    const index = templates.findIndex(t => t.id === editingTemplate?.id);
    if (index >= 0) {
      templates[index] = { ...editingTemplate };
      selectedTemplate = templates[index];
    }
    
    try {
      // Save the updated templates back to the file
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ templates })
      });
      
      if (response.ok) {
        console.log('Template saved successfully!');
      } else {
        console.error('Failed to save template');
      }
    } catch (error) {
      console.error('Error saving template:', error);
    }
  }
  
  function resetTemplate() {
    if (!selectedTemplate) return;
    editingTemplate = { ...selectedTemplate };
  }
  
  function addNewTemplate() {
    const newTemplate: PromptTemplate = {
      id: `template-${Date.now()}`,
      name: 'New Template',
      description: 'Enter description here',
      template: 'Enhance this prompt: "[USER_INPUT]"\n\nAdd your enhancement logic here.'
    };
    
    templates.push(newTemplate);
    selectTemplate(newTemplate);
  }
</script>

<div class="container mx-auto p-6">
  <h1 class="text-3xl font-bold mb-6">Prompt Template Editor</h1>
  
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
    <!-- Templates List -->
    <div class="lg:col-span-1">
      <Card class="h-full">
        <CardHeader>
          <CardTitle class="flex items-center justify-between">
            Templates
            <Button onclick={addNewTemplate} size="sm" class="bg-primary text-primary-foreground hover:opacity-90">
              + New
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent class="p-0">
          <div class="space-y-2 p-4 overflow-y-auto max-h-[calc(100vh-300px)]">
            {#each templates as template (template.id)}
              <button
                onclick={() => selectTemplate(template)}
                class="w-full text-left p-3 rounded border transition-colors {selectedTemplate?.id === template.id ? 'bg-muted border-border' : 'bg-card text-card-foreground border-border hover:bg-muted'}"
              >
                <div class="font-medium">{template.name}</div>
                <div class="text-sm text-muted-foreground truncate">{template.description}</div>
              </button>
            {/each}
          </div>
        </CardContent>
      </Card>
    </div>
    
    <!-- Template Editor -->
    <div class="lg:col-span-2">
      {#if editingTemplate}
        <Card class="h-full">
          <CardHeader>
            <CardTitle>Edit Template: {editingTemplate.name}</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <!-- Name -->
            <div>
              <label class="block text-sm font-medium mb-1">Name</label>
              <input
                bind:value={editingTemplate.name}
                class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <!-- Description -->
            <div>
              <label class="block text-sm font-medium mb-1">Description</label>
              <input
                bind:value={editingTemplate.description}
                class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <!-- Template -->
            <div class="flex-1">
              <label class="block text-sm font-medium mb-1">Template</label>
              <textarea
                bind:value={editingTemplate.template}
                class="w-full h-64 p-3 border rounded font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your template here..."
              ></textarea>
              <div class="text-xs text-muted-foreground mt-1">
                Use [USER_INPUT] to mark where the user's prompt should be inserted
              </div>
            </div>
            
            <!-- Buttons -->
            <div class="flex gap-2 pt-4">
              <Button onclick={saveTemplate} class="bg-primary text-primary-foreground hover:opacity-90">
                Save Template
              </Button>
              <Button onclick={resetTemplate} variant="outline">
                Reset Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      {:else}
        <Card class="h-full flex items-center justify-center">
          <CardContent>
            <div class="text-center text-muted-foreground">
              <div class="text-lg mb-2">Select a template to edit</div>
              <div class="text-sm">Choose a template from the list on the left to start editing</div>
            </div>
          </CardContent>
        </Card>
      {/if}
    </div>
  </div>
</div>