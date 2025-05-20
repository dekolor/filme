import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3000');
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
  await expect(page.getByTestId('featured-cinemas').getByRole('heading', { name: 'Popular Cinemas' })).toBeVisible();

  await expect(page.getByTestId('featured-cinemas').getByTestId('featured-cinema')).toHaveCount(3);
});

test('clicking on featured movie opens movie page', async ({ page }) => {
  await page.getByTestId('featured-movie').locator('a[data-slot="button"]').click();
  await expect(page).toHaveURL('http://localhost:3000/movies/MOV1');
});

