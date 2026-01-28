import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseURL = process.env.BASE_URL;
const browserChannel = process.env.PW_BROWSER_CHANNEL || undefined;

// Path to the authenticated storage state
// Keep it inside `automation/` so it stays grouped with automation artifacts.
const authDir = path.join(__dirname, 'automation', '.auth');
export const STORAGE_STATE = path.join(authDir, 'user.json');

// Ensure .auth directory and empty state file exist at config load time
// This prevents the "file not found" error before setup runs
try {
  fs.mkdirSync(authDir, { recursive: true });
  if (!fs.existsSync(STORAGE_STATE)) {
    fs.writeFileSync(STORAGE_STATE, JSON.stringify({ cookies: [], origins: [] }), 'utf-8');
  }
} catch (e) {
  // Ignore errors - setup will create the file
}

export default defineConfig({
  testDir: './automation',
  // Global per-test timeout. Increase if your app loads slowly (SSO, heavy dashboards, etc).
  timeout: 300_000,
  expect: { timeout: 30_000 },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL,
    ...(browserChannel ? { channel: browserChannel } : {}),
    // Keep default actionTimeout (0 = no limit), but give navigations more room.
    navigationTimeout: 120_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    // Setup project - runs first to authenticate (no storageState)
    {
      name: 'setup',
      testDir: './automation/auth',
      testMatch: /auth\.setup\.ts/,
    },
    // Main test project - uses authenticated state
    {
      name: 'chromium',
      testDir: './automation/tests',
      use: {
        ...devices['Desktop Chrome'],
        // Use the authenticated state from setup
        storageState: STORAGE_STATE,
      },
      dependencies: ['setup'],
    }
  ]
});
