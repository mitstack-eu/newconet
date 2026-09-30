import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

export default defineConfig({
  testDir: 'site',
  testMatch: '**/*.spec.js',
  reporter: 'list',
  timeout: 15000,
  expect: { timeout: 3000 },
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `python3 -m http.server ${PORT} --bind 127.0.0.1 --directory site`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
  },
});
