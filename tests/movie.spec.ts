import { test, expect } from "@playwright/test";
import { DateTime } from "luxon";

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3000/movies/MOV1');
});

test('has basic info', async ({ page }) => {
  await expect(page.getByTestId('movie-title')).toBeVisible();
  await expect(page.getByTestId('movie-description')).toBeVisible();
  await expect(page.getByTestId('movie-attributes')).toBeVisible();
  await expect(page.getByTestId('movie-release-date-badge')).toBeVisible();
  await expect(page.getByTestId('movie-length')).toBeVisible();
  await expect(page.getByTestId('movie-release-date')).toBeVisible();
});

test('has showtimes', async ({ page }) => {
  await expect(page.getByTestId('movie-showtimes')).toBeVisible();
  await expect(page.getByTestId('movie-showtimes').getByRole('button', { name: DateTime.now().plus({ days: 1 }).toFormat('yyyy-MM-dd')})).toBeVisible();

  await expect(page.getByTestId('movie-showtimes').locator('div[data-slot="card"]')).toHaveCount(1);
});