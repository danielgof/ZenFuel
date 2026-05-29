import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
    plugins: [
        react(),
        viteStaticCopy({
            targets: [
                {
                    src: 'public/manifest.json',
                    dest: '.',
                },
            ],
        }),
    ],
    server: {
        proxy: {
            '/api': {
                target: 'https://www.fueleconomy.gov/ws/rest',
                changeOrigin: true,

                rewrite: (path) => path.replace(/^\/api/, ''),
            },
        },
    },
    build: {
        outDir: 'build',
        rollupOptions: {
            input: {
                main: './index.html',
            },
        },
    },
});
