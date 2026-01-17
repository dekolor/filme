import { test, expect } from './fixtures';

/**
 * Cinema Carousel E2E Tests
 * 
 * These tests verify the cinema carousel functionality added to the main dashboard.
 * The tests are designed to be backward compatible with both grid and carousel layouts.
 * 
 * Features tested:
 * - Cinema section visibility and content
 * - Navigation buttons (when carousel is enabled)
 * - Horizontal scrolling behavior
 * - Cinema display limits (up to 20 cinemas)
 * - Cinema card functionality
 */

test.describe('Cinema Carousel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('displays cinema section with cinemas', async ({ page }) => {
    const cinemasSection = page.getByTestId('featured-cinemas');
    
    await expect(cinemasSection).toBeVisible();
    
    // Check for heading
    const heading = cinemasSection.locator('h2');
    await expect(heading).toBeVisible();
    
    // Check that cinemas are displayed
    const cinemaCards = cinemasSection.getByTestId('featured-cinema');
    const cinemaCount = await cinemaCards.count();
    expect(cinemaCount).toBeGreaterThan(0);
    expect(cinemaCount).toBeLessThanOrEqual(20);
  });

  test('cinema cards have required elements', async ({ page }) => {
    const firstCinema = page.getByTestId('featured-cinemas').getByTestId('featured-cinema').first();
    
    // Check that each cinema has required elements
    await expect(firstCinema.locator('img')).toBeVisible();
    await expect(firstCinema.locator('h3')).toBeVisible();
    await expect(firstCinema.locator('p')).toBeVisible();
    // Cinema card itself should be clickable (wrapped in Link component)
    await expect(firstCinema).toBeVisible();
  });

  test('cinema cards are clickable and navigate correctly', async ({ page }) => {
    const firstCinema = page.getByTestId('featured-cinemas').getByTestId('featured-cinema').first();
    
    // Get the cinema ID from the href attribute - the cinema card itself is the link
    const href = await firstCinema.getAttribute('href');
    
    expect(href).toMatch(/\/cinemas\/\d+/);
    
    await firstCinema.click();
    await expect(page).toHaveURL(href!);
  });

  test('respects maximum cinema limit', async ({ page }) => {
    const cinemaCount = await page.getByTestId('featured-cinemas').getByTestId('featured-cinema').count();
    expect(cinemaCount).toBeLessThanOrEqual(20);
    expect(cinemaCount).toBeGreaterThan(0);
  });

  test('carousel navigation works when enabled', async ({ page }) => {
    const cinemasSection = page.getByTestId('featured-cinemas');
    
    // Check if navigation buttons exist (carousel feature)
    const buttons = cinemasSection.locator('button');
    const buttonCount = await buttons.count();
    
    if (buttonCount >= 2) {
      // Carousel is enabled - test navigation
      const leftButton = buttons.first();
      const rightButton = buttons.last();
      
      await expect(leftButton).toBeVisible();
      await expect(rightButton).toBeVisible();
      
      // Left button should be disabled initially
      await expect(leftButton).toBeDisabled();
      
      // Test scrolling if there are enough cinemas
      const cinemaCount = await cinemasSection.getByTestId('featured-cinema').count();
      if (cinemaCount > 3) {
        // Right button should be enabled
        await expect(rightButton).toBeEnabled();
        
        // Test scrolling
        await rightButton.click();
        await page.waitForTimeout(500);
        
        // Left button should now be enabled
        await expect(leftButton).toBeEnabled();
        
        // Scroll back
        await leftButton.click();
        await page.waitForTimeout(500);
        
        // Left button should be disabled again
        await expect(leftButton).toBeDisabled();
      }
    }
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