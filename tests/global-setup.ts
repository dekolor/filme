/**
 * Playwright global setup
 * Runs before all tests to prepare the test environment
 *
 * Seeds the Convex database with test data using HTTP API
 */

import { ConvexHttpClient } from "convex/browser";
import { config } from "dotenv";
import { api } from "../convex/_generated/api";

// Load test environment variables
config({ path: ".env.test" });

// Use dedicated test deployment, fall back to dev if not configured
const CONVEX_URL =
  process.env.CONVEX_TEST_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL;

async function globalSetup() {
  if (!CONVEX_URL) {
    throw new Error(
      "No Convex URL configured. Set CONVEX_TEST_URL in .env.test or NEXT_PUBLIC_CONVEX_URL in .env.local",
    );
  }

  console.log("🔧 Setting up test environment...");
  console.log(`   Using Convex deployment: ${CONVEX_URL}`);

  const client = new ConvexHttpClient(CONVEX_URL);

  try {
    // Clear existing test data
    console.log("  🗑️  Clearing existing test data...");
    const clearResult = await client.mutation(api.testSeed.clearTestData, {});
    console.log(
      `     Deleted ${clearResult.deletedCinemas} cinemas, ${clearResult.deletedMovies} movies, ${clearResult.deletedEvents} events`,
    );

    // Seed test data
    console.log("  🌱 Seeding test data...");
    const seedResult = await client.mutation(api.testSeed.seedTestData, {});
    console.log(
      `     Created ${seedResult.createdCinemas} cinemas, ${seedResult.createdMovies} movies, ${seedResult.createdEvents} events`,
    );

    console.log("✅ Test environment prepared!");
  } catch (error) {
    console.error("❌ Failed to seed test database:", error);
    throw error;
  }
}

export default globalSetup;
