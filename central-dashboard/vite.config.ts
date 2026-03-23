import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // base مهم حتى تكون الأصول (assets) تحت /central-dashboard
  base: "/central-dashboard/",
  plugins: [react()],
})
