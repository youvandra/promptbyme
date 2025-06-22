import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['react-router-dom', 'lucide-react'],
  },
  build: {
    sourcemap: true
  },
  server: {
    host: true,
    port: 5173,
    fs: {
      // Allow serving files from one level up to the project root and node_modules
      allow: ['..', 'node_modules']
    }
  }
});
