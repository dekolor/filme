import { test, expect } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.goto("/movies");
});

test("has heading", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Now Showing" })).toBeVisible();
});

test("displays movie cards", async ({ page }) => {
  // MovieGrid renders each movie as a Link wrapping a Card with an h3 title.
  // Wait for at least one movie card to appear.
  const movieCards = page.locator("a[href^='/movies/']");
  await expect(movieCards.first()).toBeVisible();

  const count = await movieCards.count();
  expect(count).toBeGreaterThanOrEqual(1);
});

test("shows more than zero movies", async ({ page }) => {
  const movieCards = page.locator("a[href^='/movies/']");
  await expect(movieCards.first()).toBeVisible();

  const count = await movieCards.count();
  // There must be at least the seeded movies visible (MOV1-MOV4 have today's events)
  expect(count).toBeGreaterThan(0);
});

test("shows seeded movie name on the page", async ({ page }) => {
  // The seed creates MOV1 "The Adventures of ChatGPT" with today's showtimes,
  // so it should appear on the Now Showing page.
  const movieTitle = page.getByText('The Adventures of ChatGPT', { exact: false });
  await expect(movieTitle.first()).toBeVisible();
});

test("clicking a movie card navigates to the movie detail page", async ({ page }) => {
  // Wait for the grid to be populated
  const firstMovieLink = page.locator("a[href^='/movies/']").first();
  await expect(firstMovieLink).toBeVisible();

  // Capture the expected href before clicking
  const href = await firstMovieLink.getAttribute("href");
  expect(href).toMatch(/^\/movies\//);

  await firstMovieLink.click();

  await expect(page).toHaveURL(new RegExp(href!.replace("/", "\\/")));
});
