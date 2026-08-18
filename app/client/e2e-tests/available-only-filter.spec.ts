import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:5100';

// Seed data: 10 dogs total — 5 AVAILABLE, 3 PENDING, 2 ADOPTED
// AVAILABLE: Buddy, Bella, Charlie, Rocky, Sadie
// PENDING:   Luna, Daisy, Duke
// ADOPTED:   Max, Molly

test.describe('Available Only Filter', () => {
  test('should return all dogs when available_only param is omitted', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/dogs`);

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.total).toBe(10);
    expect(body.total_pages).toBe(2);
    expect(body.dogs).toHaveLength(6);
  });

  test('should return only available dogs when available_only=true', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/dogs?available_only=true`);

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.total).toBe(5);
    expect(body.total_pages).toBe(1);
    expect(body.dogs).toHaveLength(5);

    const names: string[] = body.dogs.map((d: { name: string }) => d.name);
    expect(names).toContain('Buddy');
    expect(names).toContain('Bella');
    expect(names).toContain('Charlie');
    expect(names).toContain('Rocky');
    expect(names).toContain('Sadie');
  });

  test('should exclude pending and adopted dogs when available_only=true', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/dogs?available_only=true&per_page=100`);

    expect(response.status()).toBe(200);

    const body = await response.json();
    const names: string[] = body.dogs.map((d: { name: string }) => d.name);

    // PENDING dogs must not appear
    expect(names).not.toContain('Luna');
    expect(names).not.toContain('Daisy');
    expect(names).not.toContain('Duke');

    // ADOPTED dogs must not appear
    expect(names).not.toContain('Max');
    expect(names).not.toContain('Molly');
  });

  test('should return all dogs when available_only=false', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/dogs?available_only=false`);

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.total).toBe(10);
    expect(body.total_pages).toBe(2);
  });

  test('should return 400 with error message for invalid available_only value', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/dogs?available_only=yes`);

    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body.error).toContain('Invalid value for available_only');
    expect(body.error).toContain('"yes"');
    expect(body.error).toContain('Must be "true" or "false"');
  });

  test('should return 400 for numeric available_only value', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/dogs?available_only=1`);

    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body.error).toContain('Invalid value for available_only');
  });

  test('should paginate correctly across available dogs only', async ({ request }) => {
    const page1 = await request.get(`${API_BASE}/api/dogs?available_only=true&page=1&per_page=3`);
    expect(page1.status()).toBe(200);
    const body1 = await page1.json();
    expect(body1.total).toBe(5);
    expect(body1.total_pages).toBe(2);
    expect(body1.dogs).toHaveLength(3);

    const page2 = await request.get(`${API_BASE}/api/dogs?available_only=true&page=2&per_page=3`);
    expect(page2.status()).toBe(200);
    const body2 = await page2.json();
    expect(body2.total).toBe(5);
    expect(body2.dogs).toHaveLength(2);

    // No overlap between pages
    const names1: string[] = body1.dogs.map((d: { name: string }) => d.name);
    const names2: string[] = body2.dogs.map((d: { name: string }) => d.name);
    const overlap = names1.filter(n => names2.includes(n));
    expect(overlap).toHaveLength(0);
  });

  test('should keep correct totals when available_only=false compared to no param', async ({ request }) => {
    const withFalse = await request.get(`${API_BASE}/api/dogs?available_only=false`);
    const withoutParam = await request.get(`${API_BASE}/api/dogs`);

    const body1 = await withFalse.json();
    const body2 = await withoutParam.json();

    expect(body1.total).toBe(body2.total);
    expect(body1.total_pages).toBe(body2.total_pages);
  });
});
