import {defineConfig, loadEnv} from 'vite';
import legacy from '@vitejs/plugin-legacy';
import {resolve} from 'node:path';

export default defineConfig(({mode}) => {
    const {
        VITE_GAME_MODE,
        VITE_GAME_API_URL,
        VITE_GAME_API_BASE_URL,
    } = loadEnv(mode, process.cwd());

    return {
        plugins: [
            legacy({
                targets: ['defaults', 'ie>=11'],
                additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
                modernPolyfills: true,
            }),
        ],

        publicDir: 'public',

        resolve: {
            alias: {
                '@': resolve(__dirname, 'src'),
            },
        },

        server: {
            port: 5173,
            strictPort: true,
            open: false,
            ...(VITE_GAME_MODE === 'local' ? {} : {
                proxy: {
                    [VITE_GAME_API_BASE_URL]: {
                        target: VITE_GAME_API_URL,
                        changeOrigin: true,
                    },
                },
            }),
        },

        optimizeDeps: {
            include: ['pixi.js'],
        },

        build: {
            outDir: 'dist',
            sourcemap: true,
            chunkSizeWarningLimit: 1500,
        },
    };
});