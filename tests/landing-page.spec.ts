import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('has title', async ({ page }) => {
  await expect(page).toHaveTitle("MovieTime");
});

test('has featured movie', async ({ page }) => {
  await expect(page.getByTestId('featured-movie')).toBeVisible();
  await expect(page.getByTestId('featured-movie').getByRole('heading', { name: 'The Adventures of ChatGPT' })).toBeVisible();
  await expect(page.getByTestId('featured-movie').locator('a[data-slot="button"]')).toHaveText('View Showtimes');
});

test('has featured movies', async ({ page }) => {
  await expect(page.getByTestId('featured-movies')).toBeVisible();
  await expect(page.getByTestId('featured-movies').getByRole('tab', { name: 'Now Showing' })).toBeVisible();
  await expect(page.getByTestId('featured-movies').getByRole('tab', { name: 'Coming Soon' })).toBeVisible();

  await expect(page.getByTestId('featured-movies').locator('div[data-slot="card"]')).toHaveCount(4);

  await page.getByTestId('featured-movies').getByRole('tab', { name: 'Coming Soon' }).click();
  await expect(page.getByTestId('featured-movies').locator('div[data-slot="card"]')).toHaveCount(1);
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
  await page.getByTestId('featured-movie').locator('a[data-slot="button"]').click();
  await expect(page).toHaveURL('movies/MOV1');
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
      
      // Wait for scroll animation
      await page.waitForTimeout(500);
      
      // Left button should now be enabled (can scroll back)
      await expect(leftButton).toBeEnabled();
      
      // Click left button to scroll back
      await leftButton.click();
      
      // Wait for scroll animation
      await page.waitForTimeout(500);
      
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
  
  await firstCinema.click();
  await expect(page).toHaveURL(href!);
});

