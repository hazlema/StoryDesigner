import type { iEvent } from '$lib/classes/iEvent';
import type { iScene } from '$lib/classes/iScene';
import { iEvents } from '$lib/classes/iEvent';
import { iScenes } from '$lib/classes/iScene';

export interface iStory {
	name        : string;
	description : string;
	keywords    : string[];
	isLocked    : boolean;
	events      : iEvent[];
	scenes      : iScene[];
	mindmap		: Record<string, any>;
	attributes	: Record<string, any>;
}

/** Concrete Story class with defaults */
export class iStories implements iStory {
	name: string;
	description: string;
	keywords: string[];
	isLocked: boolean;
	events: iEvent[];
	scenes: iScene[];
	mindmap: Record<string, any>;
	attributes: Record<string, any>;

	/**
	 * Create a Story.
	 * - name: story title
	 * - description: story description
	 * - keywords: array of story keywords
	 * - isLocked: whether story is locked for editing
	 */
	constructor(name: string, description: string, keywords: string[] = [], isLocked: boolean = false) {
		this.name = name;
		this.description = description;
		this.keywords = keywords;
		this.isLocked = isLocked;
		this.events = [];
		this.scenes = [];
		this.mindmap = {};
		this.attributes = {};
	}

	/**Folder-safe name derived from `name` */
	get slug() {
		return this.name
			.toLowerCase()
			.trim()
			.replace(/ /g, '-')
			.replace(/[^0-9a-z-]/, '');
	}

	/** Base directory where stories live, defined in Vite config */
	get workingDir() {
		return import.meta.env.PUBLIC_STORIES;
	}

	/** Absolute path to the story directory */
	get slugDir() {
		return `${import.meta.env.PUBLIC_STORIES}/${this.slug}`;
	}

	/** Absolute path to the story directory */
	get slugBase() {
		return `/stories/${this.slug}`;
	}

	/** Make a relative path to the story directory */
	slugURL(path: string) {
		return `${this.slugBase}/${path}`;
	}

	/** Make a relative path to the story directory */
	slugAbsPath(path: string) {
		return `${this.slugDir}/${path}`;
	}
	
	/** Add an event to the story */
	addEvent(event: iEvent): iStories {
		this.events.push(event);
		return this;
	}

	/** Remove an event from the story */
	removeEvent(eventKey: string): void {
		this.events = this.events.filter(e => e.key !== eventKey);
	}

	/** Add a scene to the story */
	addScene(scene: iScene): iStories {
		// Check if scene with this key already exists
		const existingSceneIndex = this.scenes.findIndex(s => s.key === scene.key);
		if (existingSceneIndex >= 0) {
			// Replace existing scene instead of adding duplicate
			this.scenes[existingSceneIndex] = scene;
		} else {
			this.scenes.push(scene);
		}
		return this;
	}

	/** Remove a scene from the story */
	removeScene(sceneKey: string): void {
		this.scenes = this.scenes.filter(s => s.key !== sceneKey);
	}

	/** Add a keyword to the story */
	addKeyword(keyword: string): iStories {
		if (!this.keywords.includes(keyword)) {
			this.keywords.push(keyword);
		}
		return this;
	}

	/** Remove a keyword from the story */
	removeKeyword(keyword: string): void {
		this.keywords = this.keywords.filter(k => k !== keyword);
	}

	/** Set mindmap data */
	setMindmap(data: Record<string, any>): iStories {
		this.mindmap = data;
		return this;
	}

	/** Set story attributes */
	setAttributes(attributes: Record<string, any>): iStories {
		this.attributes = attributes;
		return this;
	}

	/** Lock/unlock the story */
	setLocked(locked: boolean): iStories {
		this.isLocked = locked;
		return this;
	}

	async save(): Promise<boolean> {
		try {
			const response = await fetch('/api/story', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(this)
			});
			
			const result = await response.json();
			
			if (!response.ok) {
				throw new Error(result.error || 'Failed to save story');
			}
			
			console.log('Story saved successfully:', result.path);
			return true;
		} catch (error) {
			console.error('Error saving story:', error);
			return false;
		}
	}

	static async load(slug: string): Promise<iStories | null> {
		try {
			const response = await fetch(`/api/story?slug=${encodeURIComponent(slug)}`);
			
			if (!response.ok) {
				return null;
			}
			
			const storyData = await response.json();
			
			// Create new story instance
			const story = new iStories(
				storyData.name,
				storyData.description,
				storyData.keywords || [],
				storyData.isLocked || false
			);
			
			// Restore all properties
			story.events = (storyData.events || []).map((eventData: any) => 
				new iEvents(eventData.key, eventData.event, eventData.source, eventData.media, eventData.attributes || {})
			);
			story.scenes = (storyData.scenes || []).map((sceneData: any) => 
				new iScenes(sceneData.key, sceneData.text, sceneData.events || [], sceneData.connections || [])
			);
			story.mindmap = storyData.mindmap || {};
			story.attributes = storyData.attributes || {};
			
			return story;
		} catch (error) {
			console.error('Error loading story:', error);
			return null;
		}
	}

	static async listStories(): Promise<Array<{slug: string, name: string, description: string}>> {
		try {
			const response = await fetch('/api/story?action=list');
			
			if (!response.ok) {
				return [];
			}
			
			const data = await response.json();
			return data.stories || [];
		} catch (error) {
			console.error('Error listing stories:', error);
			return [];
		}
	}


}