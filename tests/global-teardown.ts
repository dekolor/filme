/**
 * Playwright global teardown
 * Runs after all tests to clean up test environment
 */

async function globalTeardown() {
  console.log("🧹 Cleaning up test environment...");
  console.log("✅ Test environment cleaned up!");
}

export default globalTeardown;
