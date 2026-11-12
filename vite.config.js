import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';
import { resolve } from 'node:path';

export default defineConfig({
    plugins: [
        legacy({
            targets: ['defaults', 'ie>=11'],
            additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
            modernPolyfills: true,
        })
    ],

    publicDir: 'public',

    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
        }
    },

    server: {
        port: 5173,
        strictPort: true,
        open: false,
    },

    optimizeDeps: {
        include: ['pixi.js'],
    },

    build: {
        outDir: 'dist',
        sourcemap: true,
        chunkSizeWarningLimit: 1500
    }
})