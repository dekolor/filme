import { test, expect } from "@playwright/test";

test('search for a movie', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.getByPlaceholder('Search for movies...').fill('The Adventures of ChatGPT');
  await page.getByRole('button', { name: 'Search' }).click();
  await expect(page.getByRole('heading', { name: 'Search results for "The Adventures of ChatGPT"' })).toBeVisible();
  await expect(page.getByTestId('movie-search-card')).toHaveCount(1);

  await page.getByTestId('movie-search-card').getByText('View Showtimes').click();
  await expect(page).toHaveURL('http://localhost:3000/movies/MOV1');
});
