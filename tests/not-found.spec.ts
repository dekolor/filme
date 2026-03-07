import { test, expect } from './fixtures';

// The app's not-found.tsx renders:
//   <h1>404 - Page Not Found</h1>
//   <p>The page you are looking for might have been removed...</p>
//   <Link href="/">Return to Home</Link>
//
// Next.js calls notFound() from the Cinema component when the cinema ID is not
// found in the database, which triggers the nearest not-found boundary.
// For an unknown movie route (/movies/NONEXISTENT999) the page simply renders
// with no data — the Movie component fetches via useQuery and if the movie is
// undefined it stays in a loading/empty state, but the shell page is still served.
// The global not-found.tsx is shown for completely unmatched routes.

test.describe('404 / not-found pages', () => {
  test('navigating to a non-existent movie shows not-found state', async ({ page }) => {
    await page.goto('/movies/NONEXISTENT999');

    // The client component calls notFound() after useQuery confirms the movie doesn't exist.
    // Wait for either the 404 page or verify the page isn't blank.
    await expect(
      page.getByRole('heading', { name: '404 - Page Not Found' })
    ).toBeVisible({ timeout: 10000 });

    await expect(
      page.getByText('The page you are looking for might have been removed', { exact: false })
    ).toBeVisible();

    await expect(page.getByRole('link', { name: 'Return to Home' })).toBeVisible();
  });

  test('navigating to a non-existent cinema shows not-found state', async ({ page }) => {
    // Cinema ID 99999 does not exist in the seed (only IDs 1, 2, 3 are seeded).
    // The Cinema component calls notFound() when the Convex query returns null,
    // so Next.js renders the closest not-found boundary (the global not-found.tsx).
    await page.goto('/cinemas/99999');

    // Wait for the page to finish loading
    await page.waitForLoadState('networkidle');

    // The page must not be blank
    await expect(page.locator('body')).not.toBeEmpty();

    // The Cinema component calls notFound() when the cinema is not found,
    // which triggers not-found.tsx showing "404 - Page Not Found".
    await expect(
      page.getByRole('heading', { name: '404 - Page Not Found' })
    ).toBeVisible();

    await expect(
      page.getByText('The page you are looking for might have been removed', { exact: false })
    ).toBeVisible();

    await expect(page.getByRole('link', { name: 'Return to Home' })).toBeVisible();
  });

  test('404 page Return to Home link navigates to homepage', async ({ page }) => {
    await page.goto('/cinemas/99999');
    await page.waitForLoadState('networkidle');

    const returnLink = page.getByRole('link', { name: 'Return to Home' });
    await expect(returnLink).toBeVisible();

    await returnLink.click();
    await expect(page).toHaveURL('/');
  });
});
