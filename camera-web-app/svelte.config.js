import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// Determine base path
const basePath = process.env.BASE_PATH || '';
console.log('==========================================');
console.log('SvelteKit Configuration');
console.log('==========================================');
console.log('BASE_PATH env var:', process.env.BASE_PATH);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Resolved base path:', basePath || '(empty - development mode)');
console.log('==========================================');

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: 'index.html',
			precompress: false,
			strict: true
		}),
		paths: {
			base: basePath
		}
	}
};

export default config;