import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/music-app/',
  plugins: [
    react(),
  ],
  server: {
    proxy: {
      '/audius': {
        target: 'https://discoveryprovider.audius.co',
        changeOrigin: true,
        secure: true,
        rewrite: function(path) { return path.replace(/^\/audius/, '/v1') }
      }
    }
  }
})