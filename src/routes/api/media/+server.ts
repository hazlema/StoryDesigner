/**
 * For security reasons, this endpoint must include the StoryDesigner and the static directories.
 */
import { json } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';
import Config from '$lib/config'



// Media file extensions to include
const mediaExtensions = [
	'.mp4', '.avi', '.mov', '.mkv', '.webm', // Video
	'.mp3', '.wav', '.ogg', '.flac', '.aac', // Audio
	'.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', // Images
	'.pdf', '.txt', '.md' // Documents
];

export async function GET({ url }: { url: URL }) {
	const directoryPath = Config.isStoryDir + '/' + url.searchParams.get('path');

	if (!fs.existsSync(directoryPath)) {
		return json({ files: [] });
	}
	
	if (!directoryPath) {
		return json({ error: 'Directory path is required' }, { status: 400 });
	}

	try {
		if (!fs.existsSync(directoryPath)) {
			return json({ files: [] });
		}

		const files = fs.readdirSync(directoryPath);
		const mediaFiles = files.filter(file => {
			const ext = path.extname(file).toLowerCase();
			return mediaExtensions.includes(ext) && !file.startsWith('.');
		});

		return json({ files: mediaFiles });
	} catch (error) {
		console.error('Error scanning directory:', error);
		return json({ error: 'Failed to scan directory' }, { status: 500 });
	}
}
