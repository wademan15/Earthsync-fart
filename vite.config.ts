import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    hmr: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  worker: {
    format: 'es',
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-icons': ['lucide-react'],
          'vendor-motion': ['framer-motion'],
          'vendor-charts': ['recharts'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
