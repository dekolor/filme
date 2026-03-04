import { test, expect } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.goto('movies/MOV1');
});

test('has basic info', async ({ page }) => {
  await expect(page.getByTestId('movie-title')).toBeVisible();
  await expect(page.getByTestId('movie-description')).toBeVisible();
  await expect(page.getByTestId('movie-attributes')).toBeVisible();
  await expect(page.getByTestId('movie-release-date-badge')).toBeVisible();
  await expect(page.getByTestId('movie-length')).toBeVisible();
  await expect(page.getByTestId('movie-release-date')).toBeVisible();
});

test('movie title matches seeded data', async ({ page }) => {
  const title = page.getByTestId('movie-title');
  await expect(title).toBeVisible();
  await expect(title).toHaveText('The Adventures of ChatGPT');
});

test('movie description contains seeded text', async ({ page }) => {
  const description = page.getByTestId('movie-description');
  await expect(description).toBeVisible();
  await expect(description).toContainText('An AI assistant embarks');
});

test('has showtimes', async ({ page }) => {
  await expect(page.getByTestId('movie-showtimes')).toBeVisible();
  await expect(page.getByTestId('movie-showtimes').getByRole('button', { name: 'Tomorrow' })).toBeVisible();

  // Verify showtimes are displayed (at least 1 cinema showing this movie)
  const showtimeCount = await page.getByTestId('movie-showtimes').locator('div[data-slot="card"]').count();
  expect(showtimeCount).toBeGreaterThanOrEqual(1);
});

test('showtimes section shows at least one seeded cinema name', async ({ page }) => {
  const showtimesSection = page.getByTestId('movie-showtimes');
  await expect(showtimesSection).toBeVisible();

  // The cinema dropdown should contain at least one of the seeded cinema names.
  // The seed creates events for cinemas: AFI Palace Cotroceni, Sun Plaza, ParkLake.
  // Wait for the select trigger to be populated (not showing placeholder anymore).
  const selectTrigger = showtimesSection.locator('[data-slot="select-trigger"]');
  await expect(selectTrigger).toBeVisible();

  // Open the select dropdown to expose all cinema options
  await selectTrigger.click();
  const selectContent = page.locator('[data-slot="select-content"]');
  await expect(selectContent).toBeVisible();

  // At least one of the seeded cinema names should appear in the dropdown options
  const cinemaNames = ['AFI Palace Cotroceni', 'Sun Plaza', 'ParkLake'];
  let found = false;
  for (const name of cinemaNames) {
    const option = selectContent.getByText(name, { exact: false });
    const count = await option.count();
    if (count > 0) {
      found = true;
      break;
    }
  }
  expect(found, 'At least one seeded cinema should appear in the showtimes dropdown').toBe(true);

  // Close the dropdown by pressing Escape
  await page.keyboard.press('Escape');
});

test('clicking Tomorrow tab shows showtimes', async ({ page }) => {
  const showtimesSection = page.getByTestId('movie-showtimes');
  await expect(showtimesSection).toBeVisible();

  // Click the Tomorrow button — seed creates a tomorrow event for every movie/cinema pair
  const tomorrowButton = showtimesSection.getByRole('button', { name: 'Tomorrow' });
  await expect(tomorrowButton).toBeVisible();
  await tomorrowButton.click();

  // After clicking Tomorrow, at least one showtime card should be visible
  const showtimeCards = showtimesSection.locator('div[data-slot="card"]');
  await expect(showtimeCards.first()).toBeVisible();
  const count = await showtimeCards.count();
  expect(count).toBeGreaterThanOrEqual(1);
});
