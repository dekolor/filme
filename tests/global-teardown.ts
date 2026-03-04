/**
 * Playwright global teardown
 * Runs after all tests to clean up test environment
 */

import "dotenv/config";
import { config } from "dotenv";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

// Load test environment variables
config({ path: ".env.test" });

// Use dedicated test deployment, fall back to dev if not configured
const CONVEX_URL =
  process.env.CONVEX_TEST_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL;

async function globalTeardown() {
  console.log("Cleaning up test environment...");

  if (!CONVEX_URL) {
    console.warn(
      "No Convex URL configured — skipping test data cleanup.",
    );
    return;
  }

  const client = new ConvexHttpClient(CONVEX_URL);

  try {
    const clearResult = await client.mutation(api.testSeed.clearTestData, {});
    console.log(
      `   Deleted ${clearResult.deletedCinemas} cinemas, ${clearResult.deletedMovies} movies, ${clearResult.deletedEvents} events`,
    );
    console.log("Test environment cleaned up!");
  } catch (error) {
    console.error("Failed to clear test database:", error);
    throw error;
  }
}

export default globalTeardown;
