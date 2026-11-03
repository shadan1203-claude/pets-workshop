import { test, expect } from '@playwright/test';

const FAVORITES_STORAGE_KEY = 'tailspin:favorites:v1';

test.describe('favorite markers', () => {
  test('shows matching markers on initial and paginated cards after refresh', async ({ page }) => {
    const favoriteIds = [1, 7, 999];
    const apiRequests: string[] = [];
    page.on('request', (request) => {
      if (new URL(request.url()).pathname === '/api/dogs') {
        apiRequests.push(request.url());
      }
    });

    await page.addInitScript((ids) => {
      window.localStorage.setItem('tailspin:favorites:v1', JSON.stringify(ids));
    }, favoriteIds);
    await page.goto('/');

    const firstFavoriteCard = page.locator('[data-testid="dog-card"][data-dog-id="1"]');
    const firstMarker = firstFavoriteCard.locator('[data-favorite-marker]');
    await expect(firstMarker).toBeVisible();
    await expect(firstMarker).toHaveRole('status');
    await expect(firstMarker).toHaveAccessibleName('Favorited');
    await expect(firstMarker).toHaveText('Favorited');
    await expect(
      page.locator('[data-testid="dog-card"][data-dog-id="2"] [data-favorite-marker]')
    ).toBeHidden();

    await page.getByTestId('pagination-next').click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.locator('[data-testid="dog-card"][data-dog-id="7"] [data-favorite-marker]')).toBeVisible();
    await expect(page.locator('[data-testid="dog-card"][data-dog-id="8"] [data-favorite-marker]')).toBeHidden();

    await page.reload();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.locator('[data-testid="dog-card"][data-dog-id="7"] [data-favorite-marker]')).toBeVisible();
    await expect(page.locator('[data-testid="dog-card"][data-dog-id="8"] [data-favorite-marker]')).toBeHidden();

    expect(apiRequests.every((url) => !url.includes(FAVORITES_STORAGE_KEY))).toBe(true);
  });

  for (const [caseName, storedValue] of [
    ['missing', null],
    ['malformed JSON', '{'],
    ['non-array JSON', '{"favoriteIds":[1]}'],
    ['no valid integer IDs', '["1", 1.5, null, {}]'],
  ] as const) {
    test(`keeps the listing usable with ${caseName} favorite storage`, async ({ page }) => {
      await page.addInitScript((value) => {
        if (value !== null) {
          window.localStorage.setItem('tailspin:favorites:v1', value);
        }
      }, storedValue);
      await page.goto('/');

      await expect(page.getByTestId('dog-list')).toBeVisible();
      await expect(page.getByTestId('dog-card')).toHaveCount(6);
      await expect(page.getByRole('status', { name: 'Favorited' })).toHaveCount(0);
    });
  }

  test('ignores invalid entries in a mixed favorite ID array', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'tailspin:favorites:v1',
        JSON.stringify([1, '2', 2.5, null, 999])
      );
    });
    await page.goto('/');

    await expect(
      page.locator('[data-testid="dog-card"][data-dog-id="1"] [data-favorite-marker]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="dog-card"][data-dog-id="2"] [data-favorite-marker]')
    ).toBeHidden();
  });

  test('keeps the listing usable when favorite storage cannot be read', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        get() {
          throw new Error('Storage access denied');
        },
      });
    });
    await page.goto('/');

    await expect(page.getByTestId('dog-list')).toBeVisible();
    await expect(page.getByTestId('dog-card')).toHaveCount(6);
    await expect(page.getByRole('status', { name: 'Favorited' })).toHaveCount(0);
  });
});
