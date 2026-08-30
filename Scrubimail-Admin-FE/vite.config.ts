import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
    server: {
        // Pinned and distinct from the customer app (3000): both send their own
        // origin as the OAuth redirect_uri, and each must be listed in the
        // backend's OAUTH_ALLOWED_REDIRECT_URIS or the login dead-ends.
        port: 3001,
        strictPort: true,
        host: true,
    },
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    build: {
        commonjsOptions: {
            include: [/node_modules/],
            transformMixedEsModules: true,
        },
        rollupOptions: {
            output: {
                manualChunks: {
                    antd: ['antd'],
                    'react-vendor': ['react', 'react-dom'],
                },
            },
        },
    },
    optimizeDeps: {
        include: ['antd'],
        esbuildOptions: {
            target: 'es2020',
        },
    },
});
