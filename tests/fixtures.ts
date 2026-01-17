/**
 * Playwright test fixtures with database seeding
 */

import { test as base } from "@playwright/test";

// Export test and expect from base (seeding happens in global setup)
export const test = base;
export { expect } from "@playwright/test";
