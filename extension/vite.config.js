import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Extensions load via chrome-extension://, not a web server — asset
  // paths must be relative, not absolute.
  base: './',
})
