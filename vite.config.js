import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [],
	server: { host: '0.0.0.0', port: 4321 },
	clearScreen: false,
	base: './' // default "/" makes itch unhappy -- it wants relative links
})
