import { defineConfig } from 'vite';

export default defineConfig({
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
                main: './public/index.html',
            },
        },
    },
});
