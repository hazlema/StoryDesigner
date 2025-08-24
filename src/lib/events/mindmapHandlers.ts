import { hub } from './eventsHub.js';
import type { iScene } from '$lib/classes/iScene';
import type { iStories } from '$lib/classes/iStory';

// Handler for mindmap node selection
export function useMindmapNodeSelection(onNodeSelected: (data: { sceneKey: string; nodeData: any }) => void) {
  const handleNodeSelect = (e: CustomEvent) => {
    const { sceneKey, nodeData } = e.detail;
    onNodeSelected({ sceneKey, nodeData });
  };

  hub.addEventListener('mindmap.node.selected', handleNodeSelect);

  return () => {
    hub.removeEventListener('mindmap.node.selected', handleNodeSelect);
  };
}

// Handler for mindmap node double-click (scene editor opening)
export function useMindmapNodeDoubleClick(onNodeDoubleClick: (data: { sceneKey: string; scene: iScene }) => void) {
  const handleNodeDoubleClick = (e: CustomEvent) => {
    const { sceneKey, scene } = e.detail;
    onNodeDoubleClick({ sceneKey, scene });
  };

  hub.addEventListener('mindmap.node.doubleClick', handleNodeDoubleClick);

  return () => {
    hub.removeEventListener('mindmap.node.doubleClick', handleNodeDoubleClick);
  };
}

// Handler for scene editor events
export function useSceneEditor(handlers: {
  onOpen?: (data: { scene: iScene; sceneKey: string }) => void;
  onClose?: (data: { sceneKey?: string }) => void;
  onSaved?: (data: { sceneKey: string; scene: iScene }) => void;
}) {
  const cleanupFunctions: Array<() => void> = [];

  if (handlers.onOpen) {
    const handleOpen = (e: CustomEvent) => handlers.onOpen!(e.detail);
    hub.addEventListener('scene.editor.open', handleOpen);
    cleanupFunctions.push(() => hub.removeEventListener('scene.editor.open', handleOpen));
  }

  if (handlers.onClose) {
    const handleClose = (e: CustomEvent) => handlers.onClose!(e.detail);
    hub.addEventListener('scene.editor.close', handleClose);
    cleanupFunctions.push(() => hub.removeEventListener('scene.editor.close', handleClose));
  }

  if (handlers.onSaved) {
    const handleSaved = (e: CustomEvent) => handlers.onSaved!(e.detail);
    hub.addEventListener('scene.saved', handleSaved);
    cleanupFunctions.push(() => hub.removeEventListener('scene.saved', handleSaved));
  }

  return () => {
    cleanupFunctions.forEach(cleanup => cleanup());
  };
}

// Handler for story events
export function useStoryEvents(handlers: {
  onLoaded?: (data: { story: iStories; storySlug: string }) => void;
  onSaved?: (data: { story: iStories }) => void;
}) {
  const cleanupFunctions: Array<() => void> = [];

  if (handlers.onLoaded) {
    const handleLoaded = (e: CustomEvent) => handlers.onLoaded!(e.detail);
    hub.addEventListener('story.loaded', handleLoaded);
    cleanupFunctions.push(() => hub.removeEventListener('story.loaded', handleLoaded));
  }

  if (handlers.onSaved) {
    const handleSaved = (e: CustomEvent) => handlers.onSaved!(e.detail);
    hub.addEventListener('story.saved', handleSaved);
    cleanupFunctions.push(() => hub.removeEventListener('story.saved', handleSaved));
  }

  return () => {
    cleanupFunctions.forEach(cleanup => cleanup());
  };
}

// Handler for navigation events
export function useNavigationEvents(handlers: {
  onSceneActivate?: (data: { sceneKey: string }) => void;
  onBreadcrumbUpdate?: (data: { sceneKey: string; scenePath: string[] }) => void;
}) {
  const cleanupFunctions: Array<() => void> = [];

  if (handlers.onSceneActivate) {
    const handleActivate = (e: CustomEvent) => handlers.onSceneActivate!(e.detail);
    hub.addEventListener('navigation.scene.activate', handleActivate);
    cleanupFunctions.push(() => hub.removeEventListener('navigation.scene.activate', handleActivate));
  }

  if (handlers.onBreadcrumbUpdate) {
    const handleBreadcrumb = (e: CustomEvent) => handlers.onBreadcrumbUpdate!(e.detail);
    hub.addEventListener('navigation.breadcrumb.update', handleBreadcrumb);
    cleanupFunctions.push(() => hub.removeEventListener('navigation.breadcrumb.update', handleBreadcrumb));
  }

  return () => {
    cleanupFunctions.forEach(cleanup => cleanup());
  };
}

// Handler for sidebar scene selection (for mindmap to listen to)
export function useSidebarSceneSelection(onSceneSelected: (data: { sceneKey: string }) => void) {
  const handleSceneSelect = (e: CustomEvent) => {
    const { sceneKey } = e.detail;
    onSceneSelected({ sceneKey });
  };

  hub.addEventListener('sidebar.scene.select', handleSceneSelect);

  return () => {
    hub.removeEventListener('sidebar.scene.select', handleSceneSelect);
  };
}