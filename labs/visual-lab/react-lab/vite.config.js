import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'next/image': fileURLToPath(new URL('./src/lib/next-image.jsx', import.meta.url)),
      'next/link': fileURLToPath(new URL('./src/lib/next-link.jsx', import.meta.url)),
    },
  },
  plugins: [react(), tailwindcss()],
  build: {
    outDir: '../showcase',
    emptyOutDir: true,
  },
});