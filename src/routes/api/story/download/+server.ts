import { type RequestHandler } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import Config from '$lib/config';

export const GET: RequestHandler = async ({ url }) => {
	const slug = url.searchParams.get('slug');
	
	if (!slug) {
		return new Response('Slug parameter is required', { status: 400 });
	}
	
	try {
		const storiesDir = Config.isStoryDir;
		const storyDir = `${storiesDir}/${slug}`;
		
		if (!fs.existsSync(storyDir)) {
			return new Response('Story not found', { status: 404 });
		}
		
		console.log('Creating zip for story:', slug, 'from directory:', storyDir);
		
		// Create a zip archive
		const archive = archiver('zip', {
			zlib: { level: 9 }
		});
		
		// Set up the response as a stream
		const stream = new ReadableStream({
			start(controller) {
				const chunks: Uint8Array[] = [];
				
				archive.on('data', (chunk: Buffer) => {
					chunks.push(new Uint8Array(chunk));
				});
				
				archive.on('end', () => {
					// Concatenate all chunks
					const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
					const result = new Uint8Array(totalLength);
					let offset = 0;
					for (const chunk of chunks) {
						result.set(chunk, offset);
						offset += chunk.length;
					}
					controller.enqueue(result);
					controller.close();
				});
				
				archive.on('error', (err: Error) => {
					console.error('Archive error:', err);
					controller.error(err);
				});
				
				// Add directory contents to zip
				archive.directory(storyDir, slug);
				
				// Finalize the archive
				archive.finalize();
			}
		});
		
		return new Response(stream, {
			headers: {
				'Content-Type': 'application/zip',
				'Content-Disposition': `attachment; filename="${slug}.zip"`
			}
		});
		
	} catch (error) {
		console.error('Error creating download:', error);
		return new Response('Failed to create download', { status: 500 });
	}
};