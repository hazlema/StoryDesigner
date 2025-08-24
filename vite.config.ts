import devtoolsJson from 'vite-plugin-devtools-json';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'node:path';
import { spawn } from 'node:child_process';

const DEPLOY_TYPE = process.env.DEPLOY_TYPE  ?? (process.env.NODE_ENV !== 'production' ? 'dev'  : 'prod');
const IS_DEBUG    = process.env.IS_DEBUG     ?? (process.env.NODE_ENV !== 'production' ? 'true' : 'false');
const STORIES_DIR = path.resolve(process.cwd(), 'static', 'stories');

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		devtoolsJson(),
		// Dev-only plugin to spawn the AI sidecar server and clean it up gracefully
		{
			name: 'ai-sidecar-dev',
			apply: 'serve',
			configureServer(server) {
				const aiCwd = path.resolve(process.cwd(), 'ai-story-interface');
				const aiEntry = path.resolve(aiCwd, 'server.js');
				const aiProcess = spawn('node', [aiEntry], {
					cwd: aiCwd,
					stdio: 'inherit',
					env: { ...process.env, NODE_ENV: process.env.NODE_ENV ?? 'development' }
				});

				const shutdown = () => {
					if (!aiProcess.killed) {
						try {
							aiProcess.kill(process.platform === 'win32' ? undefined : 'SIGTERM');
						} catch {}
					}
				};

				server.httpServer?.once('close', shutdown);
				process.once('SIGINT', shutdown);
				process.once('SIGTERM', shutdown);
			}
		}
	],
	define: {
		'import.meta.env.DEPLOY_TYPE':    JSON.stringify(DEPLOY_TYPE),
		'import.meta.env.IS_DEBUG':       JSON.stringify(IS_DEBUG),
		'import.meta.env.PUBLIC_STORIES': JSON.stringify(STORIES_DIR),
		'import.meta.env.DEBUG_FILTERS':  JSON.stringify(["info"])
	}});
