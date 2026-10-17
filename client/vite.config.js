import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/login": "http://localhost:5000",
      "/register": "http://localhost:5000",
      "/api": "http://localhost:5000",
    },
  },
})
