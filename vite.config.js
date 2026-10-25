import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfig from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tsconfig(), tailwindcss()],
  server: {
    // The Hono server (`pnpm dev:server`) answers `/api` in dev.
    proxy: {
      '/api': `http://localhost:${process.env.PORT ?? 3000}`,
    },
  },
})
