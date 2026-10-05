# QA Handoff — NA

- **Jira Story:** NA (not provided)
- **Jira URL:** Not provided
- **Feature:** Homepage dog search + server-side filtering

## Acceptance Criteria → Test Scenarios

### AC1 — UI search input visible and labeled

- Verify homepage displays a visible input labeled **“Search dogs”**.
- Automation suggestion: `getByLabel('Search dogs')` (preferred) or `getByTestId('search-input')`.

### AC2 — Submitting a search updates results without full reload perception

- Enter a keyword and submit (Enter key or Search button).
- Expect the dog list to update quickly to filtered results.
- Expect no manual browser reload required.

### AC3 — URL state + pagination preserves q

- After search submit, verify URL contains `?q=<term>`.
- Click Next / Previous page links.
- Verify URL contains both `page=<n>` and `q=<term>`.

### AC4 — Backend supports q (name OR breed, case-insensitive partial)

API checks (manual or automated):

- `GET /api/dogs?q=bud` should include `Buddy` (partial, case-insensitive).
- `GET /api/dogs?q=HUS` should include Husky-breed dogs.

### AC5 — Pagination totals reflect filtered dataset

- Use a query that yields multiple results.
- Verify UI pagination (e.g., Page X of Y) reflects filtered total pages.
- Verify API response fields `total` and `total_pages` reflect filtered dataset.

### AC6 — Whitespace-only q behaves unfiltered

- API: `GET /api/dogs?q=   ` should behave the same as without `q`.
- UI: submitting whitespace-only should clear/ignore search and show unfiltered list.

### AC7 — Error handling preserved

- Simulate API failure (if possible):
  - Stop backend or introduce an invalid API URL in a test environment.
- Verify existing error state component renders and no uncaught errors occur.

### AC8 — Automated tests updated

- Ensure Playwright tests cover:
  - Search by name
  - Search by breed
  - Pagination with q applied

## Playwright E2E Test Guidance

File: `app/client/e2e-tests/homepage.spec.ts`

Suggested test cases:

1) Search by name
- Navigate to `/`
- Fill search input: `Buddy`
- Submit
- Assert URL includes `q=Buddy`
- Assert a dog card with name `Buddy` is visible

2) Search by breed
- Search: `Husky`
- Assert visible dog cards show breed `Husky`

3) Pagination preserves q
- Use a term known to return > 1 page in seeded test DB.
- After search, click Next
- Assert URL includes both `page=2` and `q=<term>`

## Edge Cases

- `q` includes spaces (e.g., “Golden Retriever”) should work.
- `q` returns 0 matches: verify empty state; ensure no crash.
- Very high page with q (e.g., `page=999`): should render empty list but not error.
- Case sensitivity: `hUsKy` works.

## Test Data Notes

- Use the existing deterministic seeded test DB used by Playwright (`app/server/utils/seed_test_database.py`).
- Avoid assertions that depend on ordering; assert presence and that all visible results match the filter.

## Execution

- Backend unit tests: `python -m unittest` from `app/server`.
- E2E: run Playwright per `app/client/e2e-tests/README.md` or `npm run test:e2e`.
