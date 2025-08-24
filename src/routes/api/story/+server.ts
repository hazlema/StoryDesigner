import { json, type RequestHandler } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';
import Config from '$lib/config';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const storyData = await request.json();
		
		// Extract story properties
		const { name, description, keywords, isLocked, events, scenes, mindmap, attributes } = storyData;
		
		// Create story directory path
		const storySlug = name
			.toLowerCase()
			.trim()
			.replace(/ /g, '-')
			.replace(/[^0-9a-z-]/g, '');
		
		const storiesDir = Config.isStoryDir;
		const storyDir = `${storiesDir}/${storySlug}`;
		const storyJSON = `${storyDir}/story.json`;
		
		// Ensure directory exists
		if (!fs.existsSync(storyDir)) {
			fs.mkdirSync(storyDir, { recursive: true });
		}
		
		// Save story data
		fs.writeFileSync(storyJSON, JSON.stringify(storyData, null, 2));
		
		return json({ success: true, path: storyJSON });
	} catch (error) {
		console.error('Error saving story:', error);
		return json({ error: 'Failed to save story' }, { status: 500 });
	}
}

export const GET: RequestHandler = async ({ url }) => {
	const action = url.searchParams.get('action');
	
	if (action === 'list') {
		// List all stories
		try {
			const storiesDir = Config.isStoryDir;
			
			if (!storiesDir || !fs.existsSync(storiesDir)) {
				return json({ stories: [] });
			}
			
			const storyFolders = fs.readdirSync(storiesDir, { withFileTypes: true })
				.filter(dirent => dirent.isDirectory())
				.map(dirent => dirent.name);
			
			const stories = [];
			
			for (const folder of storyFolders) {
				const storyPath = `${storiesDir}/${folder}/story.json`;
				if (fs.existsSync(storyPath)) {
					try {
						const storyData = JSON.parse(fs.readFileSync(storyPath, 'utf8'));
						stories.push({
							slug: folder,
							name: storyData.name || folder,
							description: storyData.description || ''
						});
					} catch (error) {
						console.error(`Error reading story ${folder}:`, error);
					}
				}
			}
			
			return json({ stories });
		} catch (error) {
			console.error('Error listing stories:', error);
			return json({ error: 'Failed to list stories' }, { status: 500 });
		}
	} else if (action === 'exists') {
		// Check if a story slug exists
		const slug = url.searchParams.get('slug');
		
		if (!slug) {
			return json({ error: 'Slug parameter is required' }, { status: 400 });
		}
		
		try {
			const storiesDir = Config.isStoryDir;
			const storyPath = `${storiesDir}/${slug}/story.json`;
			const exists = fs.existsSync(storyPath);
			
			return json({ exists });
		} catch (error) {
			console.error('Error checking story existence:', error);
			return json({ error: 'Failed to check story existence' }, { status: 500 });
		}
	} else {
		// Load specific story by slug
		const slug = url.searchParams.get('slug');
		
		if (!slug) {
			return json({ error: 'Slug parameter is required' }, { status: 400 });
		}
		
		try {
			const storiesDir = Config.isStoryDir;
			const storyJSON = `${storiesDir}/${slug}/story.json`;
			
			console.log('Loading story:', { slug, storiesDir, storyJSON });
			
			if (!fs.existsSync(storyJSON)) {
				console.log('Story file not found:', storyJSON);
				return json({ error: 'Story not found' }, { status: 404 });
			}
			
			const storyData = fs.readFileSync(storyJSON, 'utf8');
			const story = JSON.parse(storyData);
			
			console.log('Story data loaded:', { 
				name: story.name, 
				eventsCount: story.events?.length || 0,
				scenesCount: story.scenes?.length || 0 
			});
			
			return json(story);
		} catch (error) {
			console.error('Error loading story:', error);
			return json({ error: 'Failed to load story' }, { status: 500 });
		}
	}
}

export const DELETE: RequestHandler = async ({ url }) => {
	const slug = url.searchParams.get('slug');
	
	if (!slug) {
		return json({ error: 'Slug parameter is required' }, { status: 400 });
	}
	
	try {
		const storiesDir = Config.isStoryDir;
		const storyDir = `${storiesDir}/${slug}`;
		
		if (!fs.existsSync(storyDir)) {
			return json({ error: 'Story not found' }, { status: 404 });
		}
		
		// Recursively delete the entire story directory
		fs.rmSync(storyDir, { recursive: true, force: true });
		
		return json({ success: true, message: 'Story deleted successfully' });
	} catch (error) {
		console.error('Error deleting story:', error);
		return json({ error: 'Failed to delete story' }, { status: 500 });
	}
}
