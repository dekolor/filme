import { test, expect } from "./fixtures";

// Cinema externalId=1 is "AFI Palace Cotroceni" (seeded in testSeed.ts)
test.beforeEach(async ({ page }) => {
  await page.goto("/cinemas/1");
});

test("shows cinema name", async ({ page }) => {
  await expect(
    page.getByRole("heading", { name: "AFI Palace Cotroceni" }),
  ).toBeVisible();
});

test("shows Movies and Showtimes heading", async ({ page }) => {
  await expect(
    page.getByRole("heading", { name: "Movies & Showtimes" }),
  ).toBeVisible();
});

test("shows Today tab", async ({ page }) => {
  await expect(page.getByRole("tab", { name: "Today" })).toBeVisible();
});

test("shows at least one movie with showtimes", async ({ page }) => {
  // Seed creates MOV1-MOV4 events for cinemaExternalId=1 today.
  // Each movie is rendered as a Link inside the TabsContent.
  const movieLinks = page.locator("a[href^='/movies/']");
  await expect(movieLinks.first()).toBeVisible();

  const count = await movieLinks.count();
  expect(count).toBeGreaterThanOrEqual(1);
});

test("shows at least one seeded movie name", async ({ page }) => {
  // The seed creates events for MOV1 "The Adventures of ChatGPT" at cinema 1.
  // The movie title is rendered as a link inside the TabsContent for Today.
  const movieLink = page.getByRole("link", { name: "The Adventures of ChatGPT" });
  await expect(movieLink).toBeVisible();
});

test("Today tab is active by default", async ({ page }) => {
  // Verify the Today tab is selected (has aria-selected=true)
  const todayTab = page.getByRole("tab", { name: "Today" });
  await expect(todayTab).toBeVisible();
  await expect(todayTab).toHaveAttribute("data-state", "active");
});

test("shows showtime time text for seeded events", async ({ page }) => {
  // The seed creates events at 10:00, 15:00, 20:00.
  // The cinema component renders times like "d MMM, HH:mm" via DateTime.fromISO().toFormat().
  // We look for the time patterns 10:00, 15:00, or 20:00 anywhere on the page.
  const timePatterns = ["10:00", "15:00", "20:00"];
  let found = false;
  for (const time of timePatterns) {
    const matches = page.getByText(time, { exact: false });
    const count = await matches.count();
    if (count > 0) {
      found = true;
      break;
    }
  }
  expect(found, "At least one seeded showtime (10:00, 15:00, or 20:00) should be visible").toBe(true);
});
