import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // During development, requests to /api are forwarded to the Express backend.
    // This means the frontend can simply call "/api/..." with no CORS setup.
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
});
