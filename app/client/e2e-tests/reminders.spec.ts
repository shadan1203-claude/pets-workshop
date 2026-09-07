import { test, expect, type Page } from '@playwright/test';

function uniqueDescription(label: string): string {
  return `E2E ${label} ${Math.random().toString(36).slice(2, 10)}`;
}

async function createReminder(
  page: Page,
  {
    type = 'vaccination',
    dueAt = '2099-06-15T10:00',
    description,
    recurrenceFreq,
  }: { type?: string; dueAt?: string; description: string; recurrenceFreq?: string }
) {
  await page.goto('/reminders/new');
  await page.getByTestId('type-input').selectOption(type);
  await page.getByTestId('due-at-input').fill(dueAt);
  await page.getByTestId('description-input').fill(description);
  if (recurrenceFreq) {
    await page.getByTestId('recurrence-freq-input').selectOption(recurrenceFreq);
  }
  await page.getByTestId('submit-button').click();
  await expect(page).toHaveURL(/\/reminders(\?.*)?$/);
}

test.describe('Reminders', () => {
  test('should create a valid reminder and show id/timestamps via the API, then list it', async ({ page, request }) => {
    const description = uniqueDescription('create');

    const apiResponse = await request.post('http://localhost:5100/api/reminders', {
      data: { type: 'vaccination', due_at: '2099-01-01T00:00:00Z', description },
    });
    expect(apiResponse.status()).toBe(201);
    const created = await apiResponse.json();
    expect(created.id).toBeTruthy();
    expect(created.created_at).toBeTruthy();
    expect(created.updated_at).toBeTruthy();

    await page.goto('/reminders?status=upcoming');
    const row = page.getByTestId('reminder-row').filter({ hasText: description });
    await expect(row).toBeVisible();
    await expect(row.getByTestId('reminder-type')).toHaveText('vaccination');
    await expect(row.getByTestId('reminder-status')).toHaveText('Upcoming');
  });

  test('should reject invalid input with field errors', async ({ page }) => {
    await page.goto('/reminders/new');
    await page.getByTestId('submit-button').click();

    await expect(page).toHaveURL(/\/reminders\/new/);
    await expect(page.getByTestId('field-error-due_at')).toBeVisible();
  });

  test('should create a reminder from the UI form and display it in the list', async ({ page }) => {
    const description = uniqueDescription('ui-create');
    await createReminder(page, { description });

    const row = page.getByTestId('reminder-row').filter({ hasText: description });
    await expect(row).toBeVisible();
    await expect(row.getByTestId('reminder-recurrence-indicator')).toHaveCount(0);
  });

  test('should edit a reminder and recompute its status immediately', async ({ page }) => {
    const description = uniqueDescription('edit');
    await createReminder(page, { description, dueAt: '2020-01-01T10:00' });

    let row = page.getByTestId('reminder-row').filter({ hasText: description });
    await page.goto('/reminders?status=overdue');
    row = page.getByTestId('reminder-row').filter({ hasText: description });
    await expect(row).toBeVisible();
    await expect(row.getByTestId('reminder-status')).toHaveText('Overdue');

    await row.getByTestId('edit-link').click();
    await expect(page).toHaveURL(/\/reminders\/\d+\/edit/);
    await page.getByTestId('due-at-input').fill('2099-06-15T10:00');
    await page.getByTestId('submit-button').click();

    await page.goto('/reminders?status=upcoming');
    row = page.getByTestId('reminder-row').filter({ hasText: description });
    await expect(row).toBeVisible();
    await expect(row.getByTestId('reminder-status')).toHaveText('Upcoming');
  });

  test('should mark a reminder complete and move it to the Completed tab', async ({ page }) => {
    const description = uniqueDescription('complete');
    await createReminder(page, { description });

    let row = page.getByTestId('reminder-row').filter({ hasText: description });
    await expect(row).toBeVisible();
    await row.getByTestId('complete-button').click();

    await expect(page).toHaveURL(/\/reminders/);
    row = page.getByTestId('reminder-row').filter({ hasText: description });
    await expect(row).toHaveCount(0);

    await page.goto('/reminders?status=completed');
    row = page.getByTestId('reminder-row').filter({ hasText: description });
    await expect(row).toBeVisible();
    await expect(row.getByTestId('reminder-status')).toHaveText('Completed');
    await expect(row.getByTestId('complete-button')).toHaveCount(0);
  });

  test('should delete a reminder so it no longer appears and is not retrievable', async ({ page, request }) => {
    const description = uniqueDescription('delete');
    await createReminder(page, { description });

    const row = page.getByTestId('reminder-row').filter({ hasText: description });
    await expect(row).toBeVisible();

    const reminderId = await row.getAttribute('data-reminder-id');
    await row.getByTestId('delete-button').click();

    await expect(page).toHaveURL(/\/reminders/);
    await expect(page.getByTestId('reminder-row').filter({ hasText: description })).toHaveCount(0);

    const apiResponse = await request.get(`http://localhost:5100/api/reminders/${reminderId}`);
    expect(apiResponse.status()).toBe(404);
  });

  test('should schedule the next occurrence when completing a recurring reminder', async ({ page }) => {
    const description = uniqueDescription('recurring');
    await createReminder(page, { description, recurrenceFreq: 'weekly' });

    let row = page.getByTestId('reminder-row').filter({ hasText: description });
    await expect(row.getByTestId('reminder-recurrence-indicator')).toBeVisible();
    await row.getByTestId('complete-button').click();

    await page.goto('/reminders?status=upcoming');
    const matches = page.getByTestId('reminder-row').filter({ hasText: description });
    await expect(matches).toHaveCount(1);
    await expect(matches.getByTestId('reminder-recurrence-indicator')).toBeVisible();

    await page.goto('/reminders?status=completed');
    await expect(page.getByTestId('reminder-row').filter({ hasText: description })).toHaveCount(1);
  });

  test('should filter reminders by status tab', async ({ page }) => {
    const description = uniqueDescription('tabs');
    await createReminder(page, { description, dueAt: '2020-01-01T10:00' });

    await page.goto('/reminders?status=upcoming');
    await expect(page.getByTestId('reminder-row').filter({ hasText: description })).toHaveCount(0);

    await page.getByTestId('tab-overdue').click();
    await expect(page).toHaveURL(/status=overdue/);
    await expect(page.getByTestId('reminder-row').filter({ hasText: description })).toBeVisible();
  });

  test('should show a 404 message when editing a non-existent reminder', async ({ page }) => {
    await page.goto('/reminders/999999999/edit');
    await expect(page.getByTestId('error-message')).toBeVisible();
    await expect(page.getByTestId('error-message')).toContainText('not found');
  });

  test('should show the reminders notification badge count in the header', async ({ page, request }) => {
    const description = uniqueDescription('badge');
    await request.post('http://localhost:5100/api/reminders', {
      data: { type: 'medication', due_at: '2020-01-01T00:00:00Z', description },
    });

    await page.goto('/');
    await expect(page.getByTestId('reminder-notification-badge')).toBeVisible();
  });
});
