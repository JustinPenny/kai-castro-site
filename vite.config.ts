import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Two pages: the handheld (index.html) and the original (original.html).
    rollupOptions: {
      input: { main: 'index.html', original: 'original.html' },
    },
  },
})
