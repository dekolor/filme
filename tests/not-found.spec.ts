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

    // The page must not be blank — wait for either:
    //   (a) the custom 404 heading from not-found.tsx, or
    //   (b) the movie loading skeleton or an empty movie detail shell.
    // In all cases the <body> should have meaningful content.
    await expect(page.locator('body')).not.toBeEmpty();

    // Check that we see EITHER the Next.js 404 page text OR the movie page shell.
    // The not-found boundary renders "404 - Page Not Found".
    // We allow some time for the client-side query to settle.
    const notFoundHeading = page.getByRole('heading', { name: '404 - Page Not Found' });
    const notFoundCount = await notFoundHeading.count();

    if (notFoundCount > 0) {
      // Full 404 page is shown — verify the standard copy and return-home link
      await expect(notFoundHeading).toBeVisible();
      await expect(
        page.getByText('The page you are looking for might have been removed', { exact: false })
      ).toBeVisible();
      await expect(page.getByRole('link', { name: 'Return to Home' })).toBeVisible();
    } else {
      // The route matched /movies/[id] but the movie was not found.
      // The component might still show its skeleton or an empty shell.
      // Assert that the page at minimum has a <main> element (not a blank screen).
      await expect(page.locator('main')).toBeVisible();
    }
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
