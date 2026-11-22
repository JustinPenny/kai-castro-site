import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

// Preact (via its React-compatible layer) instead of React: same components,
// about a tenth of the JavaScript.
// https://vite.dev/config/
export default defineConfig({
  plugins: [preact()],
})
