import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  base: './', // ✅ relative paths needed for extensions
  build: {
    outDir: 'dist', // optional; default is "dist"
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        popup: resolve(__dirname, 'popup.html')
      }
    }
  },
  plugins: [react()],
})