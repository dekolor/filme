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

test.describe('Search edge cases', () => {
  test('empty query shows all movies or empty state', async ({ page }) => {
    // Navigate directly with an empty query string
    await page.goto('/search?query=');

    // The search component renders "All Movies" when query is falsy
    // (see search.tsx: query ? `Search results for "${query}"` : "All Movies")
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();

    // The heading should be either "All Movies" or a search results heading —
    // either way the page must render some content (not a blank page).
    const headingText = await heading.textContent();
    expect(headingText).toBeTruthy();
    expect(headingText!.length).toBeGreaterThan(0);

    // The results count paragraph should also be present
    const resultsParagraph = page.locator('main p').first();
    await expect(resultsParagraph).toBeVisible();
  });

  test('no-results search shows empty state message', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('Search for movies...').fill('xyznonexistentmovieabc');
    await page.getByRole('button', { name: 'Search' }).click();

    // Wait for the results heading to appear
    await expect(
      page.getByRole('heading', { name: 'Search results for "xyznonexistentmovieabc"' })
    ).toBeVisible();

    // The search component renders a "No movies found" heading when results are empty
    await expect(
      page.getByRole('heading', { name: 'No movies found' })
    ).toBeVisible();

    // No movie-search-card elements should be present
    const searchResultCount = await page.getByTestId('movie-search-card').count();
    expect(searchResultCount).toBe(0);
  });

  test('multi-word search "The Adventures" returns MOV1', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('Search for movies...').fill('The Adventures');
    await page.getByRole('button', { name: 'Search' }).click();

    // Wait for the results heading
    await expect(
      page.getByRole('heading', { name: 'Search results for "The Adventures"' })
    ).toBeVisible();

    // MOV1 "The Adventures of ChatGPT" should appear in results
    const searchCards = page.getByTestId('movie-search-card');
    await expect(searchCards.first()).toBeVisible();

    // The movie name link should be present within one of the cards
    const movieLink = page.getByRole('link', { name: 'The Adventures of ChatGPT' });
    await expect(movieLink).toBeVisible();
  });
});
