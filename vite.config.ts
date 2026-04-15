import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        '/api-proxy': {
          target: 'http://localhost',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api-proxy/, '/api-proxy'),
        },
      },
    },
    build: {
      // Code splitting for better caching
      rollupOptions: {
        output: {
          manualChunks: {
            // Split vendor libraries into separate chunks
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            // Large pages in their own chunks for lazy loading
            'admin-pages': [
              './src/pages/AdminApprovalPage.tsx',
              './src/pages/AdminDashboard.tsx',
              './src/pages/AdminManagementPage.tsx',
            ],
            'user-pages': [
              './src/pages/EvaluationPage.tsx',
              './src/pages/ProfilePage.tsx',
            ],
          },
        },
      },
      // Minify and compress
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true, // Remove console logs in production
        },
      },
      // Set chunk size warning threshold
      chunkSizeWarningLimit: 500,
      // Enable source maps for production debugging
      sourcemap: false,
      // Optimize CSS
      cssCodeSplit: true,
      // Preload important chunks
      reportCompressedSize: false,
    },
  };
});
