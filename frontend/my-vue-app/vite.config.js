import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
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