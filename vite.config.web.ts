import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Web-only Vite config (no Electron plugins)
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@renderer': path.resolve(__dirname, 'src/renderer'),
      '@shared': path.resolve(__dirname, 'src/shared')
    }
  },
  build: {
    outDir: 'dist/web'
  },
  server: {
    port: 5173,
    host: true, // Expose to network for Tailnet access
    proxy: {
      // Proxy API requests to the Express server during development
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      // Proxy WebSocket connections
      '/ws': {
        target: 'ws://localhost:3000',
        ws: true,
        changeOrigin: true
      }
    }
  }
})
