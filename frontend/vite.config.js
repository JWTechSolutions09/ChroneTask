import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  server: {
    proxy: {
      // Proxy para desarrollo local - evita problemas de CORS
      '/api': {
        target: 'https://chronetask-1.onrender.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
