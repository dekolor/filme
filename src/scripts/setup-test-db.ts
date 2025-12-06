/**
 * Sets up a fresh SQLite test database for Playwright tests.
 * This script:
 * 1. Removes any existing test database
 * 2. Pushes the schema to create tables
 * 3. Seeds the database with test data
 */

import { execSync } from "child_process";
import { existsSync, unlinkSync } from "fs";
import { join } from "path";

const TEST_DB_PATH = join(process.cwd(), "prisma", "test.db");
const TEST_DB_URL = `file:${TEST_DB_PATH}`;

async function main() {
  console.log("🧪 Setting up test database...\n");

  // Remove existing test database if it exists
  if (existsSync(TEST_DB_PATH)) {
    console.log("🗑️  Removing existing test database...");
    unlinkSync(TEST_DB_PATH);
  }

  // Also remove journal file if it exists
  const journalPath = `${TEST_DB_PATH}-journal`;
  if (existsSync(journalPath)) {
    unlinkSync(journalPath);
  }

  // Push schema to test database
  // Note: We skip generate to keep the PostgreSQL Prisma client intact
  // The routers handle SQLite differences at runtime
  console.log("🏗️  Pushing schema to test database...");
  execSync(
    `npx prisma db push --schema=prisma/schema.test.prisma --skip-generate --accept-data-loss`,
    { stdio: "inherit", env: { ...process.env, DATABASE_URL: TEST_DB_URL } },
  );

  // Seed the database
  console.log("🌱 Seeding test database...");
  execSync(`npx tsx src/scripts/seed.ts`, {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: TEST_DB_URL },
  });

  console.log("\n✅ Test database setup complete!");
  console.log(`   Database: ${TEST_DB_PATH}`);
}

main().catch((e) => {
  console.error("❌ Test database setup failed:", e);
  process.exit(1);
});
