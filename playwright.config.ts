import { defineConfig, devices } from "@playwright/test";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
import "dotenv/config";
import { config } from "dotenv";

// Load test-specific environment
config({ path: ".env.test" });

// Test deployment URL (falls back to dev if not set)
const CONVEX_TEST_URL =
  process.env.CONVEX_TEST_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL;

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./tests",
  /* Only match .spec.ts files, ignore unit tests (run by Vitest) */
  testMatch: "**/*.spec.ts",
  testIgnore: "**/unit/**",
  /* Global setup to prepare test database */
  globalSetup: "./tests/global-setup.ts",
  /* Global teardown to restore production environment */
  globalTeardown: "./tests/global-teardown.ts",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    extraHTTPHeaders: {
      "x-vercel-protection-bypass": process.env.VERCEL_PROTECTION_BYPASS!,
    },

    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: "http://localhost:3001/",
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: "npm run dev -- --port 3001",
    url: "http://localhost:3001",
    reuseExistingServer: false,
    env: {
      SKIP_ENV_VALIDATION: "1",
      // Use test deployment for the app during E2E tests
      NEXT_PUBLIC_CONVEX_URL: CONVEX_TEST_URL!,
    },
  },
});
