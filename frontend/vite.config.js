import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@	css/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})