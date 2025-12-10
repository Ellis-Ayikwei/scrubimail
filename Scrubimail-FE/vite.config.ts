import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig({
    server: {
        // port: 3000,
        host: true,
    },
    plugins: [
        react(),
        // Uncomment to analyze bundle size
        // visualizer({ open: true, gzipSize: true, brotliSize: true })
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    build: {
        // Enable minification
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true, // Remove console.log in production
                drop_debugger: true,
            },
        },
        // Optimize chunk size
        chunkSizeWarningLimit: 1000,
        // Enable CSS code splitting
        cssCodeSplit: true,
        // Source maps for debugging (disable in production)
        sourcemap: false,
        // Rollup options for code splitting
        rollupOptions: {
            output: {
                // Manual chunks for better caching
                manualChunks: {
                    // React core
                    'react-vendor': ['react', 'react-dom', 'react-router-dom'],
                    // UI libraries
                    'antd': ['antd'],
                    // Redux
                    'redux': ['redux', '@reduxjs/toolkit', 'react-redux'],
                    // Charts/heavy components (if used)
                    // 'charts': ['recharts', 'apexcharts'],
                },
                // Asset file naming for better caching
                assetFileNames: (assetInfo) => {
                    const info = assetInfo.name.split('.');
                    const ext = info[info.length - 1];
                    if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
                        return `assets/images/[name]-[hash][extname]`;
                    }
                    if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
                        return `assets/fonts/[name]-[hash][extname]`;
                    }
                    return `assets/[name]-[hash][extname]`;
                },
                chunkFileNames: 'assets/js/[name]-[hash].js',
                entryFileNames: 'assets/js/[name]-[hash].js',
            },
        },
        commonjsOptions: {
            include: [/node_modules/],
            transformMixedEsModules: true,
        },
    },
    optimizeDeps: {
        include: ['antd', 'react', 'react-dom', 'react-router-dom'],
        esbuildOptions: {
            target: 'es2020',
        },
    },
});
