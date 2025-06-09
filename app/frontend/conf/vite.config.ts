import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
export default defineConfig({
	root: '.',
	plugins: [    tailwindcss(),  ],
	optimizeDeps: {
    	include: ['./main.ts'],
	},
	server: {
		hmr: true,
		host: true,             // permet l'accès réseau
    	watch: {
      		usePolling: true,     // fiable sur FS distants (Docker, WSL, etc.)
			interval: 100,
		},
	},
	logLevel: 'info',
})