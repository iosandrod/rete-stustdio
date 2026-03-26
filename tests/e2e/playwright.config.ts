import { defineConfig } from '@playwright/test';

// Simple Playwright config for end-to-end tests against the Vue Rete Studio app
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  use: {
    headless: true,
    baseURL: 'http://localhost:5173',
  },
});
