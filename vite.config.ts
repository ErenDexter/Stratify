import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	optimizeDeps: {
		include: ['three']
	},
	server: {
		host: '0.0.0.0', // Listen on all network interfaces
		port: 5173,
		strictPort: false,
		hmr: {
			clientPort: 5173
		}
	}
});
