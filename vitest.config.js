import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Frontend tests run in jsdom so components can actually be rendered. These
// exist because an earlier release shipped a staff dashboard that no admin
// account could open: the API contracts were all verified, but nothing ever
// rendered a route or followed a link. Role/route coverage lives in
// src/__tests__/.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.js'],
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    restoreMocks: true,
  },
});
