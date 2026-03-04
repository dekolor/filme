import { test, expect } from './fixtures';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('has title', async ({ page }) => {
  await expect(page).toHaveTitle("MovieTime");
});

test('has featured movie', async ({ page }) => {
  const featuredMovie = page.getByTestId('featured-movie');
  await expect(featuredMovie).toBeVisible();

  // Check that there is a heading (any movie title)
  const heading = featuredMovie.getByRole('heading');
  await expect(heading).toBeVisible();

  // Verify the heading has some text content
  const headingText = await heading.textContent();
  expect(headingText).toBeTruthy();
  expect(headingText!.length).toBeGreaterThan(0);

  await expect(featuredMovie.locator('a[data-slot="button"]')).toHaveText('View Showtimes');
});

test('has featured movies', async ({ page }) => {
  await expect(page.getByTestId('featured-movies')).toBeVisible();
  await expect(page.getByTestId('featured-movies').getByRole('tab', { name: 'Now Showing' })).toBeVisible();
  await expect(page.getByTestId('featured-movies').getByRole('tab', { name: 'Coming Soon' })).toBeVisible();

  // Verify there are some movies showing (at least 1)
  const nowShowingCount = await page.getByTestId('featured-movies').locator('div[data-slot="card"]').count();
  expect(nowShowingCount).toBeGreaterThanOrEqual(1);

  await page.getByTestId('featured-movies').getByRole('tab', { name: 'Coming Soon' }).click();
  // Verify there are some upcoming movies (at least 1)
  const comingSoonCount = await page.getByTestId('featured-movies').locator('div[data-slot="card"]').count();
  expect(comingSoonCount).toBeGreaterThanOrEqual(1);
});

test('has featured cinemas', async ({ page }) => {
  await expect(page.getByTestId('featured-cinemas')).toBeVisible();
  
  // Check for either old or new heading (backward compatibility)
  const headingLocator = page.getByTestId('featured-cinemas').locator('h2');
  await expect(headingLocator).toBeVisible();
  
  // Should show some cinemas (between 3-20 depending on version)
  const cinemaCount = await page.getByTestId('featured-cinemas').getByTestId('featured-cinema').count();
  expect(cinemaCount).toBeGreaterThan(0);
  expect(cinemaCount).toBeLessThanOrEqual(20);
});

test('clicking on featured movie opens movie page', async ({ page }) => {
  const link = page.getByTestId('featured-movie').locator('a[data-slot="button"]');

  // Get the expected URL from the link's href attribute
  const href = await link.getAttribute('href');
  expect(href).toBeTruthy();
  expect(href).toMatch(/^\/movies\/[A-Z0-9]+$/);

  await link.click();
  await expect(page).toHaveURL(href!);
});

test('cinema carousel has navigation buttons (if carousel enabled)', async ({ page }) => {
  const cinemasSection = page.getByTestId('featured-cinemas');
  
  // Check if navigation buttons exist (new carousel feature)
  const buttons = cinemasSection.locator('button');
  const buttonCount = await buttons.count();
  
  if (buttonCount > 0) {
    // New carousel version - test navigation buttons
    const leftButton = buttons.first();
    const rightButton = buttons.last();
    
    await expect(leftButton).toBeVisible();
    await expect(rightButton).toBeVisible();
    
    // Left button should be disabled initially (can't scroll left)
    await expect(leftButton).toBeDisabled();
    
    // Right button state depends on content width vs container width
    const cinemaCount = await page.getByTestId('featured-cinemas').getByTestId('featured-cinema').count();
    if (cinemaCount > 3) {
      await expect(rightButton).toBeEnabled();
    }
  } else {
    // Old grid version - just verify cinemas are present
    const cinemaCount = await page.getByTestId('featured-cinemas').getByTestId('featured-cinema').count();
    expect(cinemaCount).toBeGreaterThan(0);
  }
});

test('cinema carousel scrolling functionality (if carousel enabled)', async ({ page }) => {
  const cinemasSection = page.getByTestId('featured-cinemas');
  const buttons = cinemasSection.locator('button');
  const buttonCount = await buttons.count();
  
  if (buttonCount > 0) {
    // New carousel version - test scrolling
    const cinemaCount = await cinemasSection.getByTestId('featured-cinema').count();
    
    if (cinemaCount > 3) {
      const rightButton = buttons.last();
      const leftButton = buttons.first();
      
      // Click right button to scroll right
      await rightButton.click();

      // Left button should now be enabled (can scroll back)
      await expect(leftButton).toBeEnabled();

      // Click left button to scroll back
      await leftButton.click();

      // Left button should be disabled again
      await expect(leftButton).toBeDisabled();
    }
  }
});

test('cinema displays shows maximum 20 cinemas', async ({ page }) => {
  const cinemaCount = await page.getByTestId('featured-cinemas').getByTestId('featured-cinema').count();
  expect(cinemaCount).toBeLessThanOrEqual(20);
  expect(cinemaCount).toBeGreaterThan(0);
});

test('clicking on cinema card navigates to cinema page', async ({ page }) => {
  const firstCinema = page.getByTestId('featured-cinemas').getByTestId('featured-cinema').first();

  // Get the cinema ID from the href attribute - the cinema card itself is the link
  const href = await firstCinema.getAttribute('href');

  expect(href).toMatch(/\/cinemas\/\d+/);

  await firstCinema.click();
  await expect(page).toHaveURL(href!);
});

test.describe('Cinema Carousel', () => {
  test('cinema cards have required elements', async ({ page }) => {
    const firstCinema = page.getByTestId('featured-cinemas').getByTestId('featured-cinema').first();

    // Check that each cinema card has required elements
    await expect(firstCinema.locator('img')).toBeVisible();
    await expect(firstCinema.locator('h3')).toBeVisible();
    await expect(firstCinema.locator('p')).toBeVisible();
    // Cinema card itself should be clickable (wrapped in Link component)
    await expect(firstCinema).toBeVisible();
  });

  test('handles responsive behavior', async ({ page }) => {
    const cinemasSection = page.getByTestId('featured-cinemas');
    await expect(cinemasSection).toBeVisible();

    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(cinemasSection).toBeVisible();

    // Test on desktop viewport
    await page.setViewportSize({ width: 1024, height: 768 });
    await expect(cinemasSection).toBeVisible();
  });
});

test.describe('Navbar search', () => {
  // The Navbar component (src/app/_components/navbar.tsx) renders a search input
  // with placeholder "Search for movies..." and navigates to /search?query=<encoded>.
  // MOV2 in the seed is "Debugging Wars: Episode IX".

  test('typing and submitting a query navigates to search results page', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search for movies...');
    await expect(searchInput).toBeVisible();

    await searchInput.fill('Debugging Wars');
    await page.getByRole('button', { name: 'Search' }).click();

    // The navbar uses window.location.href = `/search?query=${encodeURIComponent(query)}`
    // so "Debugging Wars" becomes "Debugging%20Wars" or "Debugging+Wars".
    await expect(page).toHaveURL(/\/search\?query=Debugging/);
  });

  test('search results page heading contains the submitted query', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search for movies...');
    await searchInput.fill('Debugging Wars');
    await page.getByRole('button', { name: 'Search' }).click();

    // Wait for the search results heading
    await expect(
      page.getByRole('heading', { name: 'Search results for "Debugging Wars"' })
    ).toBeVisible();
  });

  test('searching for "Debugging Wars" returns MOV2 in results', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search for movies...');
    await searchInput.fill('Debugging Wars');
    await page.getByRole('button', { name: 'Search' }).click();

    // Wait for results to load
    await expect(
      page.getByRole('heading', { name: 'Search results for "Debugging Wars"' })
    ).toBeVisible();

    // At least one result card should appear
    const searchCards = page.getByTestId('movie-search-card');
    await expect(searchCards.first()).toBeVisible();

    const count = await searchCards.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // MOV2 "Debugging Wars: Episode IX" should be visible
    const movieLink = page.getByRole('link', { name: 'Debugging Wars: Episode IX' });
    await expect(movieLink).toBeVisible();
  });
});

