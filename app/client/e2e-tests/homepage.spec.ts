import { test, expect } from '@playwright/test';

test.describe('Tailspin Shelter Homepage', () => {
  test.describe.configure({ mode: 'serial' });

  test('should load homepage and display title', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/Tailspin Shelter - Find Your Forever Friend/);

    await expect(page.getByRole('heading', { name: 'Welcome to Tailspin Shelter' })).toBeVisible();

    await expect(page.getByText('Find your perfect companion from our wonderful selection')).toBeVisible();
  });

  test('should display dog list', async ({ page }) => {
    await page.goto('/');

    const heading = page.getByRole('heading', { name: 'Available Dogs (13)' });
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText('Available Dogs (13)');

    const dogList = page.getByTestId('dog-list');
    await expect(dogList).toBeVisible();

    const dogCards = page.getByTestId('dog-card');
    await expect(dogCards).toHaveCount(6);
  });

  test('should display breed options in alphabetical order with All breeds first', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByTestId('breed-select').locator('option')).toHaveText([
      'All breeds',
      'German Shepherd',
      'Golden Retriever',
      'Husky',
    ]);
  });

  test('should display dog names and breeds', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByTestId('dog-name').nth(0)).toHaveText('Buddy');
    await expect(page.getByTestId('dog-breed').nth(0)).toHaveText('Golden Retriever');

    await expect(page.getByTestId('dog-name').nth(1)).toHaveText('Luna');
    await expect(page.getByTestId('dog-breed').nth(1)).toHaveText('Husky');

    await expect(page.getByTestId('dog-name').nth(2)).toHaveText('Max');
    await expect(page.getByTestId('dog-breed').nth(2)).toHaveText('German Shepherd');
  });

  test('should display pagination controls', async ({ page }) => {
    await page.goto('/');

    const pagination = page.getByTestId('pagination');
    await expect(pagination).toBeVisible();
    await expect(page.getByTestId('pagination-info')).toContainText('Page 1 of 3');
    await expect(page.getByTestId('pagination-next')).toBeVisible();
  });

  test('should navigate to page 2', async ({ page }) => {
    await page.goto('/');

    await page.getByTestId('pagination-next').click();
    await expect(page).toHaveURL(/page=2/);

    const dogCards = page.getByTestId('dog-card');
    await expect(dogCards).toHaveCount(6);
    await expect(page.getByTestId('dog-name').nth(0)).toHaveText('Rocky');
  });

  test('should filter dogs when a breed is selected', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('breed-select').selectOption({ label: 'Golden Retriever' });

    await expect(page).toHaveURL(/breed=Golden(%20|\+)Retriever/);
    await expect(page.getByTestId('breed-select')).toHaveValue('Golden Retriever');
    const dogCards = page.getByTestId('dog-card');
    await expect(dogCards).toHaveCount(6);
    await expect(page.getByTestId('dog-breed')).toHaveText(Array(6).fill('Golden Retriever'));
    await expect(page.getByRole('heading', { name: 'Available Dogs (7)' })).toBeVisible();
    await expect(page.getByTestId('dog-breed').first()).toHaveText('Golden Retriever');
    await expect(page.getByTestId('dog-name').first()).toHaveText('Buddy');

    await page.getByTestId('pagination-next').click();
    await expect(page).toHaveURL(/page=2.*breed=Golden(%20|\+)Retriever/);
    await expect(page.getByTestId('dog-card')).toHaveCount(1);
    await expect(page.getByTestId('dog-breed')).toHaveText(['Golden Retriever']);
    await expect(page.getByTestId('dog-breed').first()).toHaveText('Golden Retriever');
  });

  test('should reset to page 1 when selecting a breed from page 2', async ({ page }) => {
    await page.goto('/?page=2');
    await expect(page.getByTestId('dog-name').first()).toHaveText('Rocky');

    await page.getByTestId('breed-select').selectOption({ label: 'Golden Retriever' });

    await expect(page).toHaveURL(/page=1.*breed=Golden(%20|\+)Retriever/);
    await expect(page.getByTestId('pagination-info')).toHaveText('Page 1 of 2');
    await expect(page.getByTestId('dog-name').first()).toHaveText('Buddy');
  });

  test('should clear the breed filter when All breeds is selected', async ({ page }) => {
    await page.goto('/?breed=Golden%20Retriever');
    await expect(page.getByRole('heading', { name: 'Available Dogs (7)' })).toBeVisible();

    const breedSelect = page.getByTestId('breed-select');
    await breedSelect.selectOption({ label: 'All breeds' });

    await expect(page).toHaveURL((url) => !url.searchParams.has('breed'));
    await expect(breedSelect).toHaveValue('');
    await expect(page.getByRole('heading', { name: 'Available Dogs (13)' })).toBeVisible();
    await expect(page.getByTestId('dog-card')).toHaveCount(6);
    await expect(page.getByTestId('dog-name').first()).toHaveText('Buddy');

    await breedSelect.selectOption({ label: 'Golden Retriever' });
    await expect(page).toHaveURL(/breed=Golden(%20|\+)Retriever/);
    await expect(page.getByRole('heading', { name: 'Available Dogs (7)' })).toBeVisible();

    await page.evaluate(() => {
      const form = document.querySelector('[data-testid="breed-filter-form"]') as HTMLFormElement;
      const nativeSubmit = form.submit.bind(form);
      let submitCount = 0;
      form.submit = () => {
        if (++submitCount > 1) {
          nativeSubmit();
        }
      };
    });

    await breedSelect.selectOption({ label: 'All breeds' });
    await expect(breedSelect).toHaveValue('');
    await expect(breedSelect).not.toHaveAttribute('name');

    await breedSelect.selectOption({ label: 'Golden Retriever' });
    await expect(page).toHaveURL(/breed=Golden(%20|\+)Retriever/);
    await expect(page.getByTestId('breed-select')).toHaveValue('Golden Retriever');
    await expect(page.getByRole('heading', { name: 'Available Dogs (7)' })).toBeVisible();
    await expect(page.getByTestId('dog-card')).toHaveCount(6);
    await expect(page.getByTestId('dog-breed').first()).toHaveText('Golden Retriever');
  });

  test('should render an error when fetching dog data fails', async ({ page }) => {
    const response = await page.request.get('http://127.0.0.1:5101/__test/fail-next?endpoint=dogs');
    expect(response.ok()).toBeTruthy();

    await page.goto('/');

    await expect(page.getByTestId('error-message')).toContainText(/Failed to fetch dog data: 503/);
    await expect(page.getByTestId('empty-state')).toHaveCount(0);
    await expect(page.getByTestId('dog-list')).toHaveCount(0);
  });

  test('should render an error when fetching the breed catalog fails', async ({ page }) => {
    const response = await page.request.get('http://127.0.0.1:5101/__test/fail-next?endpoint=breeds');
    expect(response.ok()).toBeTruthy();

    await page.goto('/');

    await expect(page.getByTestId('error-message')).toContainText(/Failed to fetch breed data: 503/);
    await expect(page.getByTestId('empty-state')).toHaveCount(0);
    await expect(page.getByTestId('dog-list')).toHaveCount(0);
  });

  test('should match a breed name without regard to case', async ({ page }) => {
    await page.goto('/?breed=golden%20retriever');

    await expect(page.getByTestId('breed-select')).toHaveValue('Golden Retriever');
    await expect(page.getByTestId('dog-card')).toHaveCount(6);
    await expect(page.getByTestId('dog-breed').first()).toHaveText('Golden Retriever');
  });

  test('should explain when the selected breed has no matches', async ({ page }) => {
    await page.goto('/?breed=Unlisted%20Breed');

    await expect(page.getByTestId('empty-state')).toContainText('No dogs found for Unlisted Breed.');
    await expect(page.getByRole('heading', { name: 'Available Dogs (0)' })).toBeVisible();
  });
});
