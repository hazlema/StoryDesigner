<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Card } from "$lib/components/ui/card";
	import { Button } from "$lib/components/ui/button";
	import { ZoomInIcon, ZoomOutIcon, MaximizeIcon, DownloadIcon, PlusIcon, RefreshCwIcon } from "@lucide/svelte";
	import { iStories } from '$lib/classes/iStory';
	import { iScenes } from '$lib/classes/iScene';
	import SceneEditor from '$lib/components/sceneEditor.svelte';
	import type { iScene } from '$lib/classes/iScene';
	import { hub } from '$lib/events/eventsHub';
	import { useSceneEditor, useSidebarSceneSelection } from '$lib/events/mindmapHandlers';

	// Props
	let { storySlug } = $props<{ storySlug: string }>();

	// Cytoscape instance
	let cy: cytoscape.Core | null = $state(null);
	let containerElement: HTMLElement;
	
	// Story data
	let story: iStories | null = $state(null);
	let loading = $state(true);
	let error: string | null = $state(null);

	// Mindmap controls
	let zoomLevel = $state(100);

	// Scene editor state
	let showSceneEditor = $state(false);
	let selectedScene: iScene | null = $state(null);
	let sceneEditorKey = $state(0);

	function handleSceneSaved() {
		// Refresh the mindmap after scene is saved
		if (cy && story) {
			// Update node data if needed
			console.log('Scene saved, refreshing mindmap data');
		}
	}

	// Handle sidebar scene selection
	function handleSidebarSceneSelect(sceneKey: string) {
		console.log('🎯 MINDMAP: Received sidebar selection for:', sceneKey);
		
		if (cy) {
			// Deselect all nodes first
			cy.nodes().unselect();
			
			// Select the specific node
			const targetNode = cy.getElementById(sceneKey);
			if (targetNode.length > 0) {
				targetNode.select();
				
				// Center the view on the selected node
				cy.center(targetNode);
				
				console.log('🎯 MINDMAP: Node selected and centered:', sceneKey);
				
				// Emit navigation events to update breadcrumbs and other components
				hub.emit('navigation.scene.activate', { sceneKey });
			} else {
				console.warn('🎯 MINDMAP: Node not found:', sceneKey);
			}
		}
	}

	// Smart positioning function for nodes without saved positions
	function calculateSmartPositions(nodesWithoutPositions: any[], nodesWithPositions: any[], cy: cytoscape.Core) {
		if (nodesWithoutPositions.length === 0) return [];

		// Get viewport dimensions and extent
		const extent = cy.extent();
		const containerWidth = cy.width();
		const containerHeight = cy.height();
		
		// Define node spacing based on actual node dimensions (100px x 50px from CSS)
		const nodeWidth = 100;
		const nodeHeight = 50;
		const minSpacingX = nodeWidth + 50; // Add 50px gap between nodes horizontally
		const minSpacingY = nodeHeight + 75; // Add 75px gap between nodes vertically
		const minDistance = Math.max(minSpacingX, minSpacingY); // Minimum distance for collision detection
		
		// Get positions of existing nodes to avoid collisions
		const existingPositions = nodesWithPositions.map(node => node.position).filter(Boolean);
		
		// Helper function to check if a position collides with existing nodes
		function hasCollision(x: number, y: number, existingPositions: {x: number, y: number}[]) {
			return existingPositions.some(pos => {
				const dx = Math.abs(x - pos.x);
				const dy = Math.abs(y - pos.y);
				// Check both x and y spacing separately for rectangular nodes
				return dx < minSpacingX && dy < minSpacingY;
			});
		}
		
		// Add randomization helper
		function randomOffset(base: number, variance: number): number {
			return base + (Math.random() - 0.5) * variance;
		}
		
		// Calculate positions for nodes without saved positions
		const newPositions: {x: number, y: number}[] = [];
		
		// If we have existing positioned nodes, place new nodes around them
		if (existingPositions.length > 0) {
			// Find the bounding box of existing nodes
			const minX = Math.min(...existingPositions.map(p => p.x));
			const maxX = Math.max(...existingPositions.map(p => p.x));
			const minY = Math.min(...existingPositions.map(p => p.y));
			const maxY = Math.max(...existingPositions.map(p => p.y));
			
			// Try to place new nodes in a randomized spiral pattern
			let radius = minDistance * 1.5;
			let angle = Math.random() * Math.PI * 2; // Start at random angle
			const centerX = (minX + maxX) / 2;
			const centerY = (minY + maxY) / 2;
			
			for (let i = 0; i < nodesWithoutPositions.length; i++) {
				let placed = false;
				let attempts = 0;
				
				while (!placed && attempts < 100) {
					// Add randomization to the spiral placement
					const x = centerX + Math.cos(angle) * randomOffset(radius, radius * 0.3);
					const y = centerY + Math.sin(angle) * randomOffset(radius, radius * 0.3);
					
					if (!hasCollision(x, y, [...existingPositions, ...newPositions])) {
						newPositions.push({ x, y });
						placed = true;
					}
					
					angle += (Math.PI / 3) + Math.random() * (Math.PI / 6); // 60-90 degree increments
					if (angle >= 2 * Math.PI) {
						angle = Math.random() * Math.PI * 0.5; // Random restart angle
						radius += minDistance * 0.7;
					}
					attempts++;
				}
				
				// If we couldn't place it in spiral, use randomized grid fallback
				if (!placed) {
					const gridCol = i % 4; // Use 4 columns instead of 3
					const gridRow = Math.floor(i / 4);
					const gridX = centerX + (gridCol - 1.5) * minSpacingX + randomOffset(0, 30);
					const gridY = centerY + (gridRow - 1) * minSpacingY + randomOffset(0, 30);
					newPositions.push({ x: gridX, y: gridY });
				}
			}
		} else {
			// No existing nodes - use force-directed inspired random placement
			const centerX = extent.x1 + (extent.w / 2);
			const centerY = extent.y1 + (extent.h / 2);
			
			// Place nodes using a more organic, random approach
			for (let i = 0; i < nodesWithoutPositions.length; i++) {
				let placed = false;
				let attempts = 0;
				let bestPosition = { x: centerX, y: centerY };
				let maxAttempts = 200;
				
				while (!placed && attempts < maxAttempts) {
					// Generate random position within reasonable bounds
					const angle = Math.random() * Math.PI * 2;
					const distance = Math.random() * Math.min(containerWidth, containerHeight) * 0.3 + minDistance;
					
					const x = centerX + Math.cos(angle) * distance;
					const y = centerY + Math.sin(angle) * distance;
					
					// Check collision with already placed nodes
					if (!hasCollision(x, y, newPositions)) {
						bestPosition = { x, y };
						placed = true;
					} else if (attempts === 0) {
						// Save first attempt as fallback
						bestPosition = { x, y };
					}
					
					attempts++;
				}
				
				// If we couldn't find a collision-free spot, try a different strategy
				if (!placed) {
					// Use golden ratio spiral for fallback - creates nice organic patterns
					const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // Golden angle ~137.5°
					const angle = i * goldenAngle;
					const radius = Math.sqrt(i) * minDistance * 0.8;
					
					bestPosition = {
						x: centerX + Math.cos(angle) * radius + randomOffset(0, 40),
						y: centerY + Math.sin(angle) * radius + randomOffset(0, 40)
					};
				}
				
				newPositions.push(bestPosition);
			}
		}
		
		return newPositions;
	}

	// Event cleanup functions
	let eventCleanup: (() => void) | null = null;
	let sidebarCleanup: (() => void) | null = null;
	async function loadStory() {
		try {
			loading = true;
			error = null;
			
			// Load story by slug
			const loadedStory = await iStories.load(storySlug);
			if (loadedStory) {
				story = loadedStory;
				console.log('Story loaded for mindmap:', story.name);
				
				// Emit story loaded event
				hub.emit('story.loaded', {
					story: loadedStory,
					storySlug: storySlug
				});
				
				// Initialize Cytoscape after story is loaded
				if (containerElement) {
					await initializeCytoscape();
				}
			} else {
				error = "Failed to load story";
			}
		} catch (err) {
			error = `Error loading story: ${err}`;
			console.error('Mindmap story loading error:', err);
		} finally {
			loading = false;
		}
	}

	async function initializeCytoscape() {
		console.log('🎯 MINDMAP: Initializing Cytoscape, story:', !!story, 'container:', !!containerElement);
		if (!story || !containerElement) {
			console.log('🎯 MINDMAP: Cannot initialize - missing story or container');
			return;
		}

		// Import Cytoscape dynamically
		const cytoscape = (await import('cytoscape')).default;

		// Separate scenes with and without saved positions
		const scenesWithPositions: any[] = [];
		const scenesWithoutPositions: any[] = [];
		
		console.log('🎯 MINDMAP: Processing scenes, mindmap data:', story.mindmap);
		
		story.scenes.forEach(scene => {
			const savedPosition = story.mindmap[scene.key];
			const nodeData = {
				scene,
				data: { 
					id: scene.key, 
					label: scene.key,
					description: scene.text.substring(0, 100) + (scene.text.length > 100 ? '...' : ''),
					eventCount: scene.events.length
				},
				position: savedPosition ? { x: savedPosition.x, y: savedPosition.y } : undefined
			};
			
			if (savedPosition) {
				console.log(`🎯 MINDMAP: Scene ${scene.key} has saved position:`, savedPosition);
				scenesWithPositions.push(nodeData);
			} else {
				console.log(`🎯 MINDMAP: Scene ${scene.key} needs positioning`);
				scenesWithoutPositions.push(nodeData);
			}
		});

		console.log('🎯 MINDMAP: Scenes with positions:', scenesWithPositions.length);
		console.log('🎯 MINDMAP: Scenes without positions:', scenesWithoutPositions.length);

		// For initial Cytoscape setup, we need ALL nodes with some position
		// Nodes without saved positions will get temporary positions that will be recalculated
		const nodes = [
			...scenesWithPositions,
			...scenesWithoutPositions.map((nodeData, index) => ({
				...nodeData,
				position: { x: 100 + index * 50, y: 100 + index * 50 } // Temporary positions
			}))
		];

		// Create edges from scene connections
		const edges = story.scenes.flatMap(scene => 
			scene.connections.map(connectionKey => ({
				data: { 
					id: `${scene.key}-${connectionKey}`,
					source: scene.key, 
					target: connectionKey 
				}
			}))
		);

		// Initialize Cytoscape
		console.log('🎯 MINDMAP: Creating Cytoscape instance');
		cy = cytoscape({
			container: containerElement,
			elements: [...nodes, ...edges],
			style: [
				{
					selector: 'node',
					style: {
						'background-color': '#ffffff',
						'background-opacity': 1,
						'label': 'data(label)',
						'text-valign': 'center',
						'text-halign': 'center',
						'color': '#1f2937',
						'font-size': '10px',
						'font-weight': 'bold',
						'width': '100px',
						'height': '50px',
						'shape': 'roundrectangle',
						'border-width': '2px',
						'border-color': '#3b82f6',
						'text-wrap': 'wrap',
						'text-max-width': '90px'
					}
				},
				{
					selector: 'node:selected',
					style: {
						'background-color': '#93c5fd',
						'background-opacity': 1,
						'color': '#1e3a8a',
						'border-color': '#3b82f6',
						'border-width': '3px'
					}
				},
				{
					selector: 'edge',
					style: {
						'width': 2,
						'line-color': '#6b7280',
						'target-arrow-color': '#6b7280',
						'target-arrow-shape': 'triangle',
						'curve-style': 'bezier',
						'source-endpoint': 'outside-to-node',
						'target-endpoint': 'outside-to-node'
					}
				},
				{
					selector: 'edge:selected',
					style: {
						'line-color': '#3b82f6',
						'target-arrow-color': '#3b82f6',
						'width': 3
					}
				}
			],
			layout: {
				name: 'preset', // Use preset positions if available
				fit: false,
				padding: 50
			},
			// Enable panning and zooming
			zoomingEnabled: true,
			userZoomingEnabled: true,
			panningEnabled: true,
			userPanningEnabled: true,
			boxSelectionEnabled: true,
			selectionType: 'single',
			zoom: 1.0,
			pan: { x: 0, y: 0 }
		});

		// Apply smart positioning or use Cytoscape layout
		if (scenesWithoutPositions.length > 0 && scenesWithPositions.length === 0) {
			// All nodes need positioning - use Cytoscape's random layout for organic placement
			console.log('🎯 MINDMAP: Using random layout for all nodes');
			// Use a much smaller bounding box for tighter positioning
			const viewportWidth = cy.width() || 800;
			const viewportHeight = cy.height() || 600;
			cy.layout({
				name: 'random',
				animate: false,
				fit: false,
				padding: 50,
				boundingBox: { 
					x1: viewportWidth * 0.1, 
					y1: viewportHeight * 0.1, 
					x2: viewportWidth * 0.9, 
					y2: viewportHeight * 0.7 
				}
			}).run();
			
			// Save the positions after layout and fix overlaps
			requestAnimationFrame(() => {
				// Get all nodes and their positions
				const nodePositions = [];
				if (cy) {
					cy.nodes().forEach(node => {
					const pos = node.position();
					nodePositions.push({
						node: node,
						x: pos.x,
						y: pos.y,
						id: node.id()
					});
					});
				}
				
				// Fix overlaps with minimum spacing
				const minSpacing = 120; // Minimum distance between nodes (node width + gap)
				
				for (let i = 0; i < nodePositions.length; i++) {
					for (let j = i + 1; j < nodePositions.length; j++) {
						const node1 = nodePositions[i];
						const node2 = nodePositions[j];
						
						const dx = node1.x - node2.x;
						const dy = node1.y - node2.y;
						const distance = Math.sqrt(dx * dx + dy * dy);
						
						if (distance < minSpacing) {
							// Nodes are too close, separate them
							const overlap = minSpacing - distance;
							const angle = Math.atan2(dy, dx);
							
							// Move both nodes apart by half the overlap distance
							const moveDistance = overlap / 2 + 10; // Extra 10px buffer
							
							node1.x += Math.cos(angle) * moveDistance;
							node1.y += Math.sin(angle) * moveDistance;
							node2.x -= Math.cos(angle) * moveDistance;
							node2.y -= Math.sin(angle) * moveDistance;
							
							// Update the actual node positions
							node1.node.position({ x: node1.x, y: node1.y });
							node2.node.position({ x: node2.x, y: node2.y });
						}
					}
				}
				
				// Save the final positions
				if (cy) {
					cy.nodes().forEach(node => {
					const pos = node.position();
						if (story) {
							story.mindmap[node.id()] = { x: pos.x, y: pos.y };
						}
					});
				}
				
				if (story) {
					story.save().then(() => {
						console.log('🎯 MINDMAP: Random layout with overlap fix positions saved');
						hub.emit('story.saved', { story });
					});
				}
			});
		} else if (scenesWithoutPositions.length > 0) {
			// Some nodes need positioning - use smart positioning around existing nodes
			requestAnimationFrame(() => {
				console.log('🎯 MINDMAP: Calculating smart positions for new nodes');
				const smartPositions = calculateSmartPositions(scenesWithoutPositions, scenesWithPositions, cy);
				
				scenesWithoutPositions.forEach((nodeData, index) => {
					const position = smartPositions[index] || { x: 0, y: 0 };
					if (cy) {
						const node = cy.getElementById(nodeData.scene.key);
					
						if (node.length > 0) {
							node.position(position);
							if (story) {
								story.mindmap[nodeData.scene.key] = position;
							}
						}
					}
				});
				
				if (story) {
					story.save().then(() => {
						console.log('🎯 MINDMAP: Smart positions saved');
						hub.emit('story.saved', { story });
					});
				}
			});
		}

		// Set zoom level and auto-center if only one node
		if (story.scenes.length === 1) {
			console.log('🎯 MINDMAP: Single node detected, centering and resetting zoom');
			cy.fit(); // Center the node
			cy.zoom(1.0); // Reset to normal zoom level
		} else {
			cy.zoom(1.0);
		}

		// Add event listeners for position changes
		cy.on('dragfree', 'node', async (event: cytoscape.EventObject) => {
			const node = event.target;
			const position = node.position();
			const nodeId = node.id();
			
			console.log(`Node ${nodeId} moved to:`, position);
			
			// Update story mindmap data
			if (story) {
				story.mindmap[nodeId] = { x: position.x, y: position.y };
				
				// Emit node moved event
				hub.emit('mindmap.node.moved', {
					sceneKey: nodeId,
					position: { x: position.x, y: position.y }
				});
				
				// Save the story
				try {
					await story.save();
					hub.emit('story.saved', { story });
					console.log('Node position saved successfully');
				} catch (error) {
					console.error('Failed to save node position:', error);
				}
			}
		});

		// Add click listener for node selection
		cy.on('tap', 'node', (event: cytoscape.EventObject) => {
			const node = event.target;
			const sceneKey = node.id();
			const nodeData = node.data();
			
			console.log('🎯 NODE SELECTED:', sceneKey, nodeData);
			
			// Emit node selection event instead of hash manipulation
			hub.emit('mindmap.node.selected', {
				sceneKey,
				nodeData
			});
			
			// Emit navigation event for breadcrumb updates
			hub.emit('navigation.scene.activate', { sceneKey });
		});

		// Add double-click listener to open scene editor
		cy.on('dbltap', 'node', (event: cytoscape.EventObject) => {
			const node = event.target;
			const sceneKey = node.id();
			const scene = story?.scenes.find(s => s.key === sceneKey);
			
			if (scene) {
				console.log('🔥 SCENE DOUBLE-CLICKED:', sceneKey);
				
				// Emit events instead of direct manipulation
				hub.emit('mindmap.node.doubleClick', { sceneKey, scene });
				hub.emit('scene.editor.open', { scene, sceneKey });
				hub.emit('navigation.scene.activate', { sceneKey });
			}
		});

		// Update zoom level when user zooms
		if (cy) {
			cy.on('zoom', () => {
				const zoom = cy.zoom();
				const newZoomLevel = Math.round(zoom * 100);
				zoomLevel = newZoomLevel;
				
				// Emit zoom change event
				hub.emit('mindmap.zoom.changed', { zoomLevel: newZoomLevel });
			});
		}

		console.log('🎯 MINDMAP: Cytoscape initialized with', nodes.length, 'nodes and', edges.length, 'edges');
		console.log('🎯 MINDMAP: cy instance:', !!cy);
	}

	function zoomIn() {
		console.log('🔍 Zoom In clicked');
		if (cy) {
			const newZoom = cy.zoom() * 1.25;
			cy.zoom(newZoom);
			zoomLevel = Math.round(newZoom * 100);
			console.log('🔍 New zoom level:', zoomLevel);
		}
	}

	function zoomOut() {
		console.log('🔍 Zoom Out clicked');
		if (cy) {
			const newZoom = cy.zoom() * 0.8;
			cy.zoom(newZoom);
			zoomLevel = Math.round(newZoom * 100);
			console.log('🔍 New zoom level:', zoomLevel);
		}
	}

	function resetZoom() {
		console.log('🔍 Reset Zoom clicked');
		if (cy) {
			cy.zoom(1.0);
			zoomLevel = 100;
			console.log('🔍 Zoom reset to 100%');
		}
	}

	function fitToScreen() {
		console.log('🔍 Fit to Screen clicked');
		if (cy) {
			cy.fit();
			zoomLevel = Math.round(cy.zoom() * 100);
			console.log('🔍 Fitted to screen, zoom level:', zoomLevel);
		}
	}

	function exportMindmap() {
		if (cy) {
			const png = cy.png({
				output: 'blob',
				bg: 'white',
				full: true,
				scale: 2
			});
			
			// Create download link
			const url = URL.createObjectURL(png);
			const a = document.createElement('a');
			a.href = url;
			a.download = `${story?.name || 'mindmap'}-mindmap.png`;
			a.click();
			URL.revokeObjectURL(url);
		}
	}

	async function addNode() {
		if (!story) return;

		const newSceneKey = `scene-${story.scenes.length + 1}`;
		const newScene = new iScenes(
			newSceneKey,
			`New scene created at ${new Date().toLocaleTimeString()}`,
			[],
			[]
		);

		// Add scene to story
		story.addScene(newScene);

		// Add node to Cytoscape
		if (cy) {
			const centerPosition = {
				x: cy.width() / 2 + (Math.random() - 0.5) * 200,
				y: cy.height() / 2 + (Math.random() - 0.5) * 200
			};

			cy.add({
				data: { 
					id: newSceneKey, 
					label: newSceneKey,
					description: newScene.text
				},
				position: centerPosition
			});

			// Save position to mindmap
			story.mindmap[newSceneKey] = centerPosition;
		}

		// Emit node added event
		hub.emit('mindmap.node.added', {
			sceneKey: newSceneKey,
			scene: newScene
		});

		// Save story
		try {
			await story.save();
			hub.emit('story.saved', { story });
			console.log('New scene added and saved');
		} catch (error) {
			console.error('Failed to save new scene:', error);
		}
	}

	onMount(() => {
		// Load story immediately with the provided slug
		if (storySlug) {
			console.log('🎯 MINDMAP: Loading story with slug:', storySlug);
			loadStory();
		}
		
		// Set up event handlers
		eventCleanup = useSceneEditor({
			onOpen: ({ scene, sceneKey }) => {
				console.log('📝 Scene editor opening via event:', sceneKey);
				
				// 1. Close dialog and reset state
				showSceneEditor = false;
				selectedScene = null;
				
				// 2. Set the new scene data
				selectedScene = scene;
				sceneEditorKey++;
				
				// 3. Open dialog after ensuring state is set
				requestAnimationFrame(() => {
					showSceneEditor = true;
				});
			},
			onClose: ({ sceneKey }) => {
				console.log('📝 Scene editor closing via event:', sceneKey);
				showSceneEditor = false;
				selectedScene = null;
			},
			onSaved: ({ sceneKey }) => {
				console.log('💾 Scene saved via event:', sceneKey);
				handleSceneSaved();
			}
		});

		// Set up sidebar scene selection handler
		sidebarCleanup = useSidebarSceneSelection(({ sceneKey }) => {
			handleSidebarSceneSelect(sceneKey);
		});
	});

	onDestroy(() => {
		if (cy) {
			cy.destroy();
		}
		
		// Clean up event listeners
		if (eventCleanup) {
			eventCleanup();
		}
		if (sidebarCleanup) {
			sidebarCleanup();
		}
	});
</script>

<div class="flex-1 flex flex-col p-4 gap-4 min-w-0">
	<!-- Mindmap Controls -->
	<div class="flex items-center justify-between min-w-0">
		<div class="flex items-center gap-2">
			<h2 class="text-lg font-semibold">Story Mindmap</h2>
			{#if !loading && story}
				<span class="text-sm text-muted-foreground whitespace-nowrap">
					{story.name} - Zoom: {zoomLevel}%
				</span>
			{/if}
		</div>

		<div class="flex items-center gap-2 flex-shrink-0">
			<Button variant="outline" size="sm" onclick={addNode} disabled={loading || !story}>
				<PlusIcon class="size-4 mr-1" />
				Add Scene
			</Button>
			<div class="flex items-center border rounded-md">
				<Button variant="ghost" size="sm" onclick={zoomOut} disabled={!cy} class="rounded-r-none border-r">
					<ZoomOutIcon class="size-4" />
				</Button>
				<Button variant="ghost" size="sm" onclick={resetZoom} disabled={!cy} class="rounded-none border-r">
					<RefreshCwIcon class="size-4" />
				</Button>
				<Button variant="ghost" size="sm" onclick={zoomIn} disabled={!cy} class="rounded-l-none">
					<ZoomInIcon class="size-4" />
				</Button>
			</div>
			<Button variant="outline" size="sm" onclick={fitToScreen} disabled={!cy}>
				<MaximizeIcon class="size-4 mr-1" />
				Fit
			</Button>
			<Button variant="outline" size="sm" onclick={exportMindmap} disabled={!cy}>
				<DownloadIcon class="size-4 mr-1" />
				Export
			</Button>
		</div>
	</div>

	<!-- Mindmap Container -->
	<Card class="flex-1 relative overflow-hidden">
		<div bind:this={containerElement} class="w-full h-full min-h-[600px]">
			{#if loading}
				<div class="flex items-center justify-center h-full text-muted-foreground">
					<div class="text-center space-y-4">
						<div class="size-16 mx-auto bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center animate-pulse">
							<svg class="size-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
							</svg>
						</div>
						<div>
							<h3 class="text-lg font-medium mb-2">Loading Story...</h3>
							<p class="text-sm text-muted-foreground">Preparing your mindmap visualization</p>
						</div>
					</div>
				</div>
			{:else if error}
				<div class="flex items-center justify-center h-full text-destructive">
					<div class="text-center space-y-4">
						<div class="size-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
							<svg class="size-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
						<div>
							<h3 class="text-lg font-medium mb-2">Error Loading Story</h3>
							<p class="text-sm text-muted-foreground">{error}</p>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</Card>
</div>

<!-- Scene Editor Dialog -->
{#key sceneEditorKey}
	<SceneEditor 
		bind:open={showSceneEditor}
		bind:scene={selectedScene}
		bind:story={story}
		onSave={handleSceneSaved}
	/>
{/key}

<style>
	/* Ensure Cytoscape container has proper dimensions */
	:global(.mindmap-container) {
		width: 100%;
		height: 100%;
	}
</style>