import { test, expect } from '@playwright/test';

test.describe('Tailspin Shelter Homepage', () => {
  test.describe.configure({ mode: 'serial' });

  test('should load homepage and display title', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/Find Your Forever Friend - Pets Workshop Demo/);

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

  // EPMCDMETST-70052: "Only available" filter. Read-only tests against the shared seeded database.
  // They are nested in this serial describe so they run in the same worker as the fail-next tests above
  // and cannot consume a forced API failure meant for those tests.
  // Decisions: OQ-5 reset to page 1, OQ-6 server-side filtering, OQ-7 heading unchanged,
  // OQ-11 order by id, OQ-12 visible Apply button, DR-15 invalid URL values are ignored.
  const AVAILABLE_NAMES = ['Buddy', 'Bella', 'Charlie', 'Rocky', 'Sadie', 'Cooper', 'Rosie', 'Finn'];
  const NOT_AVAILABLE_NAMES = ['Luna', 'Max', 'Daisy', 'Duke', 'Molly'];

test.describe('Availability filter', () => {
  const applyFilters = async (page: import('@playwright/test').Page) => {
    await page.getByTestId('apply-filters').click();
  };
  const searchParams = (page: import('@playwright/test').Page) => new URL(page.url()).searchParams;
  const checkbox = (page: import('@playwright/test').Page) => page.getByTestId('available-only-checkbox');

  test('TC-040 shows an unchecked, labelled checkbox by default', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByLabel('Only available')).toHaveCount(1);
    await expect(page.getByLabel('Only available')).toBeVisible();
    await expect(page.getByLabel('Only available')).not.toBeChecked();
    await expect(page.getByTestId('apply-filters')).toBeVisible();
  });

  test('TC-041 checking the box and applying filters to available dogs', async ({ page }) => {
    await page.goto('/');
    await checkbox(page).check();
    await applyFilters(page);

    await expect(page).toHaveURL((url) => url.searchParams.get('available_only') === 'true');
    expect(searchParams(page).get('page')).toBe('1');
    await expect(checkbox(page)).toBeChecked();
    await expect(page.getByTestId('dog-card')).toHaveCount(6);
    await expect(page.getByTestId('dog-name')).toHaveText(AVAILABLE_NAMES.slice(0, 6));
    await expect(page.getByTestId('pagination-info')).toContainText('Page 1 of 2');
    await expect(page.getByRole('heading', { name: 'Available Dogs (8)' })).toBeVisible();
  });

  test('TC-042 unchecking the box returns all dogs and drops the parameter', async ({ page }) => {
    await page.goto('/?available_only=true');
    await checkbox(page).uncheck();
    await applyFilters(page);

    await expect(page).toHaveURL((url) => !url.searchParams.has('available_only'));
    await expect(checkbox(page)).not.toBeChecked();
    await expect(page.getByTestId('dog-card')).toHaveCount(6);
    await expect(page.getByTestId('pagination-info')).toContainText('Page 1 of 3');
    const names = await page.getByTestId('dog-name').allTextContents();
    expect(names).toContain('Luna');
    expect(names).toContain('Max');
    await expect(page.getByRole('heading', { name: 'Available Dogs (13)' })).toBeVisible();
  });

  test('TC-043 reload keeps the filter', async ({ page }) => {
    await page.goto('/?available_only=true');
    await expect(checkbox(page)).toBeChecked();
    await expect(page.getByTestId('pagination-info')).toContainText('Page 1 of 2');

    await page.reload();

    await expect(page).toHaveURL(/available_only=true/);
    await expect(checkbox(page)).toBeChecked();
    await expect(page.getByTestId('dog-card')).toHaveCount(6);
    await expect(page.getByTestId('pagination-info')).toContainText('Page 1 of 2');
  });

  test('TC-044 deep link to page 2 of the filtered list', async ({ page }) => {
    await page.goto('/?page=2&available_only=true');

    await expect(checkbox(page)).toBeChecked();
    await expect(page.getByTestId('dog-name')).toHaveText(['Rosie', 'Finn']);
    await expect(page.getByTestId('pagination-info')).toContainText('Page 2 of 2');
    await expect(page.getByTestId('pagination-prev')).toBeVisible();
  });

  test('TC-045 pagination keeps the filter on next and previous', async ({ page }) => {
    await page.goto('/?available_only=true');
    const seen: string[] = await page.getByTestId('dog-name').allTextContents();

    await page.getByTestId('pagination-next').click();
    await expect(page).toHaveURL((url) => url.searchParams.get('page') === '2' && url.searchParams.get('available_only') === 'true');
    await expect(checkbox(page)).toBeChecked();
    await expect(page.getByTestId('dog-card')).toHaveCount(2);
    await expect(page.getByTestId('pagination-info')).toContainText('Page 2 of 2');
    seen.push(...(await page.getByTestId('dog-name').allTextContents()));
    expect(seen).toEqual(AVAILABLE_NAMES);

    await page.getByTestId('pagination-prev').click();
    await expect(page).toHaveURL((url) => url.searchParams.get('page') === '1' && url.searchParams.get('available_only') === 'true');
    await expect(checkbox(page)).toBeChecked();
    await expect(page.getByTestId('dog-card')).toHaveCount(6);
  });

  test('TC-046 filter combines with the breed select in both directions', async ({ page }) => {
    await page.goto('/?available_only=true');
    await page.getByTestId('breed-select').selectOption({ label: 'Golden Retriever' });
    await expect(page).toHaveURL(/breed=Golden(%20|\+)Retriever/);
    expect(searchParams(page).get('available_only')).toBe('true');
    await expect(checkbox(page)).toBeChecked();
    await expect(page.getByTestId('breed-select')).toHaveValue('Golden Retriever');
    await expect(page.getByTestId('dog-breed')).toHaveText(Array(6).fill('Golden Retriever'));
    await expect(page.getByTestId('pagination')).toHaveCount(0);

    await page.goto('/?breed=Golden%20Retriever');
    await checkbox(page).check();
    await applyFilters(page);
    await expect(page).toHaveURL((url) => url.searchParams.get('available_only') === 'true');
    expect(searchParams(page).get('breed')).toBe('Golden Retriever');
    await expect(page.getByTestId('breed-select')).toHaveValue('Golden Retriever');
    await expect(page.getByTestId('dog-card')).toHaveCount(6);

    await page.getByTestId('breed-select').selectOption({ label: 'Husky' });
    await expect(page).toHaveURL(/breed=Husky/);
    await expect(checkbox(page)).toBeChecked();
    await expect(page.getByTestId('dog-name')).toHaveText(['Charlie', 'Sadie']);

    await checkbox(page).uncheck();
    await applyFilters(page);
    await expect(page).toHaveURL((url) => !url.searchParams.has('available_only'));
    expect(searchParams(page).get('breed')).toBe('Husky');
    await expect(page.getByTestId('dog-name')).toHaveText(['Luna', 'Charlie', 'Sadie']);
  });

  test('TC-047 shows the empty state for a breed with no available dogs', async ({ page }) => {
    await page.goto('/?breed=German%20Shepherd&available_only=true');

    await expect(page.getByTestId('empty-state')).toContainText('No dogs found for German Shepherd.');
    await expect(page.getByTestId('dog-card')).toHaveCount(0);
    await expect(page.getByTestId('pagination')).toHaveCount(0);
    await expect(page.getByTestId('breed-select')).toHaveValue('German Shepherd');
    await expect(checkbox(page)).toBeChecked();
    await expect(page.getByRole('heading', { name: 'Available Dogs (0)' })).toBeVisible();

    await page.goto('/?breed=German%20Shepherd');
    await expect(page.getByTestId('dog-name')).toHaveText(['Max', 'Daisy', 'Duke']);
  });

  test('TC-048 toggling from a later page resets to page 1', async ({ page }) => {
    await page.goto('/?page=2');
    await checkbox(page).check();
    await applyFilters(page);

    await expect(page).toHaveURL((url) => url.searchParams.get('available_only') === 'true');
    expect(searchParams(page).get('page')).toBe('1');
    await expect(page.getByTestId('dog-card')).toHaveCount(6);
    await expect(page.getByTestId('pagination-info')).toContainText('Page 1 of 2');

    await page.goto('/?page=3');
    await checkbox(page).check();
    await applyFilters(page);
    await expect(page).toHaveURL((url) => url.searchParams.get('available_only') === 'true');
    expect(searchParams(page).get('page')).toBe('1');
    await expect(page.getByTestId('dog-card')).toHaveCount(6);
  });

  test('TC-049 frontend and API accept the same values', async ({ page }) => {
    for (const value of ['TRUE', 'True']) {
      await page.goto(`/?available_only=${value}`);
      await expect(checkbox(page)).toBeChecked();
      await expect(page.getByTestId('dog-card')).toHaveCount(6);
      await expect(page.getByTestId('pagination-info')).toContainText('Page 1 of 2');
    }
    for (const value of ['FALSE', 'false']) {
      await page.goto(`/?available_only=${value}`);
      await expect(checkbox(page)).not.toBeChecked();
      await expect(page.getByTestId('pagination-info')).toContainText('Page 1 of 3');
    }
  });

  test('TC-050 invalid URL values are ignored and the unfiltered list is shown', async ({ page }) => {
    const values = [
      'available_only=maybe',
      'available_only=',
      'available_only=true&available_only=false',
      'available_only=%20true',
      'available_only=1',
    ];
    for (const value of values) {
      await page.goto(`/?${value}`);
      await expect(checkbox(page)).not.toBeChecked();
      await expect(page.getByTestId('error-message')).toHaveCount(0);
      await expect(page.getByTestId('dog-card')).toHaveCount(6);
      await expect(page.getByTestId('pagination-info')).toContainText('Page 1 of 3');
    }
  });

  test('TC-051 a hostile value is not reflected into the page', async ({ page }) => {
    let dialogSeen = false;
    const pageErrors: Error[] = [];
    page.on('dialog', async (dialog) => {
      dialogSeen = true;
      await dialog.dismiss();
    });
    page.on('pageerror', (error) => pageErrors.push(error));

    const payloads = ['<script>window.__x=1</script>', '"><img src=x onerror=window.__x=1>'];
    for (const payload of payloads) {
      await page.goto(`/?available_only=${encodeURIComponent(payload)}`);
      await expect(page.getByTestId('dog-card')).toHaveCount(6);
      expect(await page.evaluate(() => (window as unknown as { __x?: number }).__x)).toBeUndefined();
      expect(await page.content()).not.toContain(payload);
    }
    expect(dialogSeen).toBe(false);
    expect(pageErrors).toHaveLength(0);
  });

  test('TC-052 pagination links carry the active parameters', async ({ page }) => {
    await page.goto('/?available_only=true');
    const nextHref = new URL((await page.getByTestId('pagination-next').getAttribute('href')) as string, 'http://localhost');
    expect(nextHref.searchParams.get('page')).toBe('2');
    expect(nextHref.searchParams.get('available_only')).toBe('true');

    await page.goto('/?page=2&available_only=true');
    const prevHref = new URL((await page.getByTestId('pagination-prev').getAttribute('href')) as string, 'http://localhost');
    expect(prevHref.searchParams.get('page')).toBe('1');
    expect(prevHref.searchParams.get('available_only')).toBe('true');

    await page.goto('/?breed=Golden%20Retriever');
    const breedHref = new URL((await page.getByTestId('pagination-next').getAttribute('href')) as string, 'http://localhost');
    expect(breedHref.searchParams.get('page')).toBe('2');
    expect(breedHref.searchParams.get('breed')).toBe('Golden Retriever');
    expect(breedHref.searchParams.has('available_only')).toBe(false);
  });

  test('TC-053 API through the test proxy filters, validates and hides status', async ({ page }) => {
    const filtered = await page.request.get('http://127.0.0.1:5101/api/dogs?available_only=true');
    expect(filtered.status()).toBe(200);
    const filteredBody = await filtered.json();
    expect(filteredBody.total).toBe(8);
    expect(filteredBody.total_pages).toBe(2);
    for (const dog of filteredBody.dogs) {
      expect(Object.keys(dog).sort()).toEqual(['breed', 'id', 'name']);
      expect(NOT_AVAILABLE_NAMES).not.toContain(dog.name);
    }

    const unfiltered = await page.request.get('http://127.0.0.1:5101/api/dogs?available_only=false');
    expect((await unfiltered.json()).total).toBe(13);

    const invalid = await page.request.get('http://127.0.0.1:5101/api/dogs?available_only=maybe');
    expect(invalid.status()).toBe(400);
    expect(await invalid.json()).toEqual({
      error: 'Invalid input',
      details: { available_only: "available_only must be 'true' or 'false'" },
    });

    const none = await page.request.get('http://127.0.0.1:5101/api/dogs?available_only=true&breed=German%20Shepherd');
    expect((await none.json()).total).toBe(0);
  });

  test('TC-060 checkbox has an accessible name and a label that toggles it', async ({ page }) => {
    await page.goto('/');

    const box = page.getByRole('checkbox', { name: 'Only available' });
    await expect(box).toHaveCount(1);
    await expect(box).toHaveAttribute('type', 'checkbox');
    const id = await box.getAttribute('id');
    await expect(page.locator(`label[for="${id}"]`)).toHaveText('Only available');

    await page.locator(`label[for="${id}"]`).click();
    await expect(box).toBeChecked();
  });

  test('TC-061 checkbox and Apply are keyboard operable in DOM order', async ({ page }) => {
    await page.goto('/');

    await page.getByTestId('breed-select').focus();
    await page.keyboard.press('Tab');
    await expect(checkbox(page)).toBeFocused();
    await page.keyboard.press('Space');
    await expect(checkbox(page)).toBeChecked();
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('apply-filters')).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL((url) => url.searchParams.get('available_only') === 'true');
    expect(searchParams(page).get('page')).toBe('1');
    await expect(page.getByTestId('pagination-info')).toContainText('Page 1 of 2');
  });

  test('TC-062 focused checkbox shows a focus indicator', async ({ page }) => {
    await page.goto('/');

    await page.getByTestId('breed-select').focus();
    await page.keyboard.press('Tab');
    await expect(checkbox(page)).toBeFocused();
    const indicator = await checkbox(page).evaluate((element) => {
      const style = getComputedStyle(element);
      return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth, boxShadow: style.boxShadow };
    });
    expect(indicator.outlineStyle !== 'none' || indicator.boxShadow !== 'none').toBe(true);
  });

  test('TC-066 label hit area is at least 24 by 24 CSS pixels', async ({ page }) => {
    await page.goto('/');

    const labelBox = await page.getByText('Only available', { exact: true }).boundingBox();
    expect(labelBox).not.toBeNull();
    expect(labelBox!.width).toBeGreaterThanOrEqual(24);
    expect(labelBox!.height).toBeGreaterThanOrEqual(24);
  });

  test('TC-067 form reflows at 320px width without horizontal scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto('/');

    await expect(checkbox(page)).toBeVisible();
    await expect(page.getByTestId('apply-filters')).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe('Availability filter without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('TC-055 server renders the filter and the Apply button submits it', async ({ page }) => {
    await page.goto('/?available_only=true');
    await expect(page.getByTestId('available-only-checkbox')).toBeChecked();
    await expect(page.getByTestId('dog-card')).toHaveCount(6);

    await page.goto('/');
    await page.getByTestId('available-only-checkbox').check();
    await page.getByTestId('apply-filters').click();

    await expect(page).toHaveURL((url) => url.searchParams.get('available_only') === 'true');
    await expect(page.getByTestId('pagination-info')).toContainText('Page 1 of 2');
  });
});
});
