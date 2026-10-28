import { defineConfig, devices } from '@playwright/test';

const port = 4173;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  // Recommended by Norma — fixed with Devin (Cognition AI) via Devin
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  // The CI runner is about three times slower than a laptop: give it room instead of flaking.
  timeout: process.env.CI ? 60_000 : 30_000,
  expect: { timeout: process.env.CI ? 10_000 : 5_000 },
  reporter: process.env.CI ? 'github' : 'list',
  // sw.js would answer instead of page.route(); tests/e2e/install.spec.js allows it.
  use: { baseURL: `http://localhost:${port}`, trace: 'retain-on-failure', serviceWorkers: 'block' },
  projects: [
    { name: 'mobile', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 } } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } } },
  ],
  webServer: {
    command: 'node scripts/serve.js',
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
  },
});
