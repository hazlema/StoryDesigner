import type { iScene } from '$lib/classes/iScene';
import type { iStory } from '$lib/classes/iStory';

// Event type definitions
interface EventMap {
  // Legacy demo event
  bookSelect: { title: string; reverse: boolean };
  
  // Mindmap events
  'mindmap.node.selected': { sceneKey: string; nodeData: Record<string, unknown> };
  'mindmap.node.doubleClick': { sceneKey: string; scene: iScene };
  'mindmap.node.moved': { sceneKey: string; position: { x: number; y: number } };
  'mindmap.node.added': { sceneKey: string; scene: iScene };
  'mindmap.zoom.changed': { zoomLevel: number };
  
  // Scene editor events
  'scene.editor.open': { scene: iScene; sceneKey: string };
  'scene.editor.close': { sceneKey?: string };
  'scene.saved': { sceneKey: string; scene: iScene };
  
  // Story events
  'story.loaded': { story: iStory; storySlug: string };
  'story.saved': { story: iStory };
  
  // Navigation events
  'navigation.scene.activate': { sceneKey: string };
  'navigation.breadcrumb.update': { sceneKey: string; scenePath: string[] };
  'sidebar.scene.select': { sceneKey: string };
  
  // AI Notebook events
  'ai.notebook.open': Record<string, never>;
  'ai.notebook.response': { action: string; userInput: string; aiResponse: string };
  'scene.create.from.notebook': { content: string; aiSuggestions: string };
  
  // Fal.ai events
  'fal.generator.open': Record<string, never>;
  'fal.generation.complete': { model: string; prompt: string; result: string; type: 'image' | 'video' };
}

export class EventBus extends EventTarget {
  private enableLogging: boolean;
  private originalDispatch: (event: Event) => boolean;

  constructor() {
    super(); 
    this.enableLogging = true; 
    this.originalDispatch = this.dispatchEvent;            // Change the event name so we can
    this.dispatchEvent = this.loggedDispatch.bind(this);   // Create a wrapper
  }

  private loggedDispatch(event: Event): boolean {
    if (this.enableLogging && event instanceof CustomEvent) {
      const timestamp = new Date().toISOString();
      const detailStr = event.detail ? JSON.stringify(event.detail, null, 2) : 'none';
      console.log(`[Hub Log] ${timestamp} - Event: "${event.type}" | Detail: ${detailStr}`);
    }
    return this.originalDispatch(event);
  }

  emit<K extends keyof EventMap>(eventName: K, props: EventMap[K]): void {
    this.dispatchEvent(new CustomEvent(eventName, { 
      detail: {
        ...props
      } 
    }));
  }

  // Type-safe event listener methods (renamed to avoid EventTarget conflicts)
  on<K extends keyof EventMap>(
    type: K, 
    listener: (event: CustomEvent<EventMap[K]>) => void,
    options?: boolean | AddEventListenerOptions
  ): void {
    super.addEventListener(type as string, listener as EventListener, options);
  }

  off<K extends keyof EventMap>(
    type: K, 
    listener: (event: CustomEvent<EventMap[K]>) => void,
    options?: boolean | EventListenerOptions
  ): void {
    super.removeEventListener(type as string, listener as EventListener, options);
  }

  // Method to enable/disable logging
  setLogging(enabled: boolean): void {
    this.enableLogging = enabled;
  }
}

export const hub = new EventBus();