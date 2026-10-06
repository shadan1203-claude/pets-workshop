import { test, expect } from '@playwright/test';

test.describe('API Integration', () => {
  test('should render dogs from the API on the homepage', async ({ page }) => {
    await page.goto('/');

    const dogCards = page.getByTestId('dog-card');
    await expect(dogCards).toHaveCount(6);

    await expect(page.getByTestId('dog-name').nth(0)).toHaveText('Buddy');
    await expect(page.getByTestId('dog-breed').nth(0)).toHaveText('Golden Retriever');

    await expect(page.getByTestId('dog-name').nth(1)).toHaveText('Luna');
    await expect(page.getByTestId('dog-breed').nth(1)).toHaveText('Husky');

    await expect(page.getByTestId('dog-name').nth(2)).toHaveText('Max');
    await expect(page.getByTestId('dog-breed').nth(2)).toHaveText('German Shepherd');
  });

  test('should render dog details from the API', async ({ page }) => {
    await page.goto('/dog/1');

    await expect(page.getByTestId('dog-details')).toBeVisible();
    await expect(page.getByTestId('dog-name')).toHaveText('Buddy');
    await expect(page.getByTestId('dog-breed')).toContainText('Golden Retriever');
    await expect(page.getByTestId('dog-age')).toContainText('3');
    await expect(page.getByTestId('dog-gender')).toContainText('Male');
    await expect(page.getByTestId('dog-status')).toHaveText('Available');
  });

  test('should return 404 details for non-existent dog', async ({ page }) => {
    await page.goto('/dog/99999');

    await expect(page.getByTestId('error-message')).toBeVisible();
    await expect(page.getByTestId('error-message')).toContainText('not found');
  });

  test('should link from dog card to detail page', async ({ page }) => {
    await page.goto('/');

    const firstCard = page.getByTestId('dog-card').first();
    await firstCard.click();

    await expect(page).toHaveURL(/\/dog\/1$/);
    await expect(page.getByTestId('dog-details')).toBeVisible();
  });

  test('should filter dogs by name via the API', async ({ request }) => {
    const response = await request.get('http://localhost:5100/api/dogs?name=Luna');

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.total).toBe(1);
    expect(data.dogs[0].name).toBe('Luna');
  });

  test('should filter dogs by category via the API, case-insensitively', async ({ request }) => {
    const response = await request.get('http://localhost:5100/api/dogs?category=husky');

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.total).toBe(3);
    for (const dog of data.dogs) {
      expect(dog.breed).toBe('Husky');
    }
  });

  test('should combine name and category filters via the API', async ({ request }) => {
    const response = await request.get('http://localhost:5100/api/dogs?name=Bel&category=Golden%20Retriever');

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.total).toBe(1);
    expect(data.dogs[0].name).toBe('Bella');
  });

  test('should return an ordered list of breeds via the API', async ({ request }) => {
    const response = await request.get('http://localhost:5100/api/breeds');

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.breeds).toEqual(['German Shepherd', 'Golden Retriever', 'Husky']);
  });
});
