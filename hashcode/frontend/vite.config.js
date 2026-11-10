
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  // Required for GitHub Pages
  base: '/hashcode/',

  server: {
    port: 5173,

    // Development proxy for Express backend
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
});
