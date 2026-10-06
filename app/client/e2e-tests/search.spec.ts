import { test, expect } from '@playwright/test';

test.describe('Instant Search by Name and Category', () => {
  test('should display search controls on the homepage', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByTestId('name-search-input')).toBeVisible();
    await expect(page.getByTestId('category-select')).toBeVisible();
  });

  test('should populate the category dropdown with all breeds plus "All"', async ({ page }) => {
    await page.goto('/');

    const options = await page.getByTestId('category-select').locator('option').allTextContents();
    expect(options).toContain('All');
    expect(options).toContain('Golden Retriever');
    expect(options).toContain('Husky');
    expect(options).toContain('German Shepherd');
  });

  test('should filter dogs by name without a full page reload', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      (window as any).__testMarker = 'persisted';
    });

    await page.getByTestId('name-search-input').fill('Luna');
    await expect(page.getByTestId('dog-card')).toHaveCount(1);
    await expect(page.getByTestId('dog-name').first()).toHaveText('Luna');

    const marker = await page.evaluate(() => (window as any).__testMarker);
    expect(marker).toBe('persisted');
    await expect(page).toHaveURL(/name=Luna/);
  });

  test('should filter dogs by category', async ({ page }) => {
    await page.goto('/');

    await page.getByTestId('category-select').selectOption({ label: 'Husky' });

    await expect(page.getByTestId('dog-card')).toHaveCount(3);
    await expect(page).toHaveURL(/category=Husky/);
  });

  test('should combine name and category filters', async ({ page }) => {
    await page.goto('/');

    await page.getByTestId('category-select').selectOption({ label: 'Golden Retriever' });
    await page.getByTestId('name-search-input').fill('Bel');

    await expect(page.getByTestId('dog-card')).toHaveCount(1);
    await expect(page.getByTestId('dog-name').first()).toHaveText('Bella');
  });

  test('should display an empty state when no dogs match the filters', async ({ page }) => {
    await page.goto('/');

    await page.getByTestId('name-search-input').fill('zzz-no-match');

    await expect(page.getByTestId('empty-state')).toBeVisible();
    await expect(page.getByTestId('empty-state')).toContainText('No dogs match your search.');
  });

  test('should clear the category filter when selecting All', async ({ page }) => {
    await page.goto('/');

    await page.getByTestId('category-select').selectOption({ label: 'Husky' });
    await expect(page.getByTestId('dog-card')).toHaveCount(3);

    await page.getByTestId('category-select').selectOption({ label: 'All' });
    await expect(page.getByTestId('dog-card')).toHaveCount(6);
  });

  test('should hide pagination when filtered results fit on one page', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByTestId('pagination')).toBeVisible();

    await page.getByTestId('category-select').selectOption({ label: 'Golden Retriever' });

    await expect(page.getByTestId('pagination')).toHaveCount(0);
  });
});
