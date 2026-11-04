import { test, expect } from '@playwright/test';

test.describe('Instant Search by Name and Breed', () => {
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

  test('should filter dogs by breed ID and update the URL', async ({ page }) => {
    await page.goto('/');

    await page.getByTestId('category-select').selectOption({ label: 'Husky' });

    await expect(page.getByTestId('dog-card')).toHaveCount(3);
    await expect(page).toHaveURL(/breed_id=\d+/);
    await expect(page).not.toHaveURL(/(?:^|[?&])breed=Husky/);
    await expect(page.getByTestId('dog-breed')).toHaveText(['Husky', 'Husky', 'Husky']);
  });

  test('should combine name and breed ID filters', async ({ page }) => {
    await page.goto('/');

    await page.getByTestId('category-select').selectOption({ label: 'Golden Retriever' });
    await page.getByTestId('name-search-input').fill('Bel');

    await expect(page.getByTestId('dog-card')).toHaveCount(1);
    await expect(page.getByTestId('dog-name').first()).toHaveText('Bella');
  });

  test('should reset to page 1 when selecting a breed from page 2', async ({ page }) => {
    await page.goto('/?page=2');
    await page.getByTestId('category-select').selectOption({ label: 'Husky' });

    await expect(page).toHaveURL(/breed_id=\d+/);
    await expect(page).toHaveURL(/page=1/);
    await expect(page.getByTestId('dog-card')).toHaveCount(3);
    await expect(page.getByTestId('dog-breed')).toHaveText(['Husky', 'Husky', 'Husky']);

    await page.reload();
    await expect(page.getByTestId('category-select')).toHaveValue(/^\d+$/);
    await expect(page.getByTestId('dog-card')).toHaveCount(3);
  });

  test('should restore breed filters with browser back and forward history', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('category-select').selectOption({ label: 'Husky' });
    await expect(page.getByTestId('dog-card')).toHaveCount(3);
    await page.getByTestId('category-select').selectOption({ label: 'German Shepherd' });
    await expect(page.getByTestId('dog-breed')).toHaveText([
      'German Shepherd',
      'German Shepherd',
      'German Shepherd',
    ]);

    await page.goBack();
    await expect(page.getByTestId('category-select')).toHaveValue(/^\d+$/);
    await expect(page.getByTestId('dog-breed')).toHaveText(['Husky', 'Husky', 'Husky']);
    await page.goForward();
    await expect(page.getByTestId('dog-breed')).toHaveText([
      'German Shepherd',
      'German Shepherd',
      'German Shepherd',
    ]);
  });

  test('should preserve breed IDs in filtered pagination links and requests', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      const requests: string[] = [];
      (window as any).__dogApiRequests = requests;
      const nativeFetch = window.fetch.bind(window);
      window.fetch = async (input, init) => {
        if (typeof input === 'string' && input.startsWith('/api/dogs?')) {
          const requestUrl = new URL(input, window.location.origin);
          requests.push(requestUrl.search);
          const currentPage = Number(requestUrl.searchParams.get('page')) || 1;
          const dogs = Array.from({ length: 6 }, (_, index) => ({
            id: 100 + (currentPage - 1) * 6 + index,
            name: `Husky ${currentPage}-${index}`,
            breed: 'Husky',
          }));
          return new Response(
            JSON.stringify({ dogs, page: currentPage, per_page: 6, total: 13, total_pages: 3 }),
            { headers: { 'Content-Type': 'application/json' } }
          );
        }
        return nativeFetch(input, init);
      };
    });

    await page.getByTestId('category-select').selectOption({ label: 'Husky' });
    const breedId = await page.getByTestId('category-select').inputValue();
    const next = page.getByTestId('pagination-next');
    await expect(next).toHaveAttribute('href', new RegExp(`page=2.*breed_id=${breedId}`));

    await next.click();
    await expect(page).toHaveURL(new RegExp(`page=2.*breed_id=${breedId}`));
    await expect(page.getByTestId('pagination-prev')).toHaveAttribute(
      'href',
      new RegExp(`page=1.*breed_id=${breedId}`)
    );
    const requests = await page.evaluate(() => (window as any).__dogApiRequests as string[]);
    expect(requests).toHaveLength(2);
    expect(requests[1]).toContain(`page=2`);
    expect(requests[1]).toContain(`breed_id=${breedId}`);
  });

  test('should disable stale pagination links while a new breed filter is loading', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      const requests: string[] = [];
      (window as any).__dogApiRequests = requests;
      const nativeFetch = window.fetch.bind(window);
      window.fetch = async (input, init) => {
        if (typeof input === 'string' && input.startsWith('/api/dogs?')) {
          const requestUrl = new URL(input, window.location.origin);
          requests.push(requestUrl.search);
          if (requestUrl.searchParams.has('breed_id')) {
            return new Promise((resolve) => {
              (window as any).__resolveDogResponse = () =>
                resolve(
                  new Response(
                    JSON.stringify({
                      dogs: [{ id: 2, name: 'Luna', breed: 'Husky' }],
                      page: 1,
                      per_page: 6,
                      total: 13,
                      total_pages: 3,
                    }),
                    { headers: { 'Content-Type': 'application/json' } }
                  )
                );
            });
          }
        }
        return nativeFetch(input, init);
      };
    });

    await page.getByTestId('category-select').selectOption({ label: 'Husky' });
    const pagination = page.getByTestId('pagination-root');
    const staleNext = page.getByTestId('pagination-next');
    await expect(pagination).toHaveAttribute('aria-busy', 'true');
    await expect(staleNext).toHaveAttribute('aria-disabled', 'true');
    await expect(staleNext).not.toHaveAttribute('href');

    await staleNext.click();
    const breedId = await page.getByTestId('category-select').inputValue();
    const requestsWhilePending = await page.evaluate(() => (window as any).__dogApiRequests as string[]);
    expect(requestsWhilePending).toHaveLength(1);
    expect(requestsWhilePending[0]).toContain('page=1');
    expect(requestsWhilePending[0]).toContain(`breed_id=${breedId}`);
    await expect(page).not.toHaveURL(/page=2/);

    await page.evaluate(() => (window as any).__resolveDogResponse());
    await expect(pagination).not.toHaveAttribute('aria-busy', 'true');
    await expect(page).toHaveURL(new RegExp(`breed_id=${breedId}`));
    await expect(page.getByTestId('dog-name')).toHaveText('Luna');
    await expect(page.getByTestId('pagination-next')).toHaveAttribute('href', /page=2/);
  });

  test('should display an empty state when no dogs match the filters', async ({ page }) => {
    await page.goto('/');

    await page.getByTestId('name-search-input').fill('zzz-no-match');

    await expect(page.getByTestId('empty-state')).toBeVisible();
    await expect(page.getByTestId('empty-state')).toContainText('No results match your search. Clear filters to see all dogs.');
  });

  test('should clear the breed filter when selecting All', async ({ page }) => {

    await page.goto('/');

    await page.getByTestId('category-select').selectOption({ label: 'Husky' });
    await expect(page.getByTestId('dog-card')).toHaveCount(3);

    await page.getByTestId('category-select').selectOption({ label: 'All' });
    await expect(page.getByTestId('dog-card')).toHaveCount(6);
    await expect(page).not.toHaveURL(/breed_id=/);
  });

  test('should hide pagination when filtered results fit on one page', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByTestId('pagination')).toBeVisible();

    await page.getByTestId('category-select').selectOption({ label: 'Golden Retriever' });

    await expect(page.getByTestId('pagination')).toHaveCount(0);
  });

  test('should keep filters in pagination links', async ({ page }) => {
    await page.goto('/?page=1&name=a');

    await expect(page.getByTestId('name-search-input')).toHaveValue('a');
    const next = page.getByTestId('pagination-next');
    if (await next.count()) {
      await expect(next).toHaveAttribute('href', /name=a/);
    }
  });

  test('should restore the full list when clearing filters', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('clear-filters')).toBeHidden();

    await page.getByTestId('category-select').selectOption({ label: 'Husky' });
    await page.getByTestId('name-search-input').fill('zzz');
    await expect(page.getByTestId('empty-state')).toBeVisible();

    await page.getByTestId('clear-filters').click();

    await expect(page.getByTestId('name-search-input')).toHaveValue('');
    await expect(page.getByTestId('category-select')).toHaveValue('');
    await expect(page).not.toHaveURL(/(?:name|breed_id|breed|category)=/);
    await expect(page.getByTestId('dog-card')).toHaveCount(6);
    await expect(page.getByTestId('clear-filters')).toBeHidden();
  });

  test('should only render the latest results when typing rapidly', async ({ page }) => {
    await page.goto('/');

    const input = page.getByTestId('name-search-input');
    await input.pressSequentially('Lu', { delay: 50 });
    await input.pressSequentially('na', { delay: 50 });

    await expect(page.getByTestId('dog-card')).toHaveCount(1);
    await expect(page.getByTestId('dog-name').first()).toHaveText('Luna');
  });

  test('should show a non-blocking error for an overlong name', async ({ page }) => {
    await page.goto('/');

    await page.getByTestId('name-search-input').fill('a'.repeat(101));

    await expect(page.getByTestId('search-status')).toContainText('at most 100 characters');
    await expect(page.getByTestId('name-search-input')).toBeEnabled();
  });
});
