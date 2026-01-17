import { test, expect } from "./fixtures";

test('search for a movie', async ({ page }) => {
  await page.goto('/');
  await page.getByPlaceholder('Search for movies...').fill('The Adventures of ChatGPT');
  await page.getByRole('button', { name: 'Search' }).click();
  await expect(page.getByRole('heading', { name: 'Search results for "The Adventures of ChatGPT"' })).toBeVisible();

  // Verify at least one search result is found
  const searchResultCount = await page.getByTestId('movie-search-card').count();
  expect(searchResultCount).toBeGreaterThanOrEqual(1);

  // Click the first result and verify navigation
  await page.getByTestId('movie-search-card').first().getByText('View Showtimes').click();
  await expect(page).toHaveURL(/\/movies\/MOV1/);
});