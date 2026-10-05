# Developer Handoff — Instant Search by Pet Name and Category (Breed)

- **Jira Epic**: EPMCDMETST-60368
  - https://jiraeu.epam.com/browse/EPMCDMETST-60368
- **Jira Story**: _Not provided in context_
  - URL: _Not provided in context_

> Note: A Jira Story key was not provided in the design package. This handoff is tracked under the epic key **EPMCDMETST-60368**.

## Goal

Add instant (no full page reload) search/filtering on the homepage list page to filter dogs by:

- **Name** (case-insensitive, partial match)
- **Category** (assumed to be **Breed.name**)

Filters should be combinable, and pagination should remain functional.

## Suggested Branch

- `feature/EPMCDMETST-60368`

## Implementation Checklist

### Backend

- [ ] Extend `GET /api/dogs` to support optional query parameters:
  - `name` — case-insensitive partial match
  - `category` — maps to Breed.name (recommended exact match ignoring case)
  - Preserve `page` and `per_page`
  - Optional: accept `breed` as alias for `category` (document if implemented)
- [ ] Ensure filtered response metadata is correct:
  - `total` and `total_pages` reflect filters
- [ ] Add `GET /api/breeds` endpoint returning list of breeds for dropdown
- [ ] Add/Update backend unit tests in `app/server/test_app.py`

### Frontend

- [ ] Add filter controls to `app/client/src/pages/index.astro`:
  - Name search input with accessible label
  - Category dropdown with “All” option
  - Populate dropdown via `/api/breeds` (preferred: SSR fetch for first paint)
- [ ] Add client-side behavior (progressive enhancement) to update results instantly:
  - Listen to input/change
  - Debounce name input (~250ms)
  - Fetch `/api/dogs` with `page=1` on filter changes
  - Update list DOM + pagination DOM
  - Handle empty state when `dogs.length === 0`
  - Handle overlapping requests (AbortController or last-response-wins)
- [ ] Ensure pagination URLs include filter params so navigation stays consistent
- [ ] Ensure no regressions to dog details navigation and existing SSR rendering

### Tests

- [ ] Update Playwright specs:
  - `app/client/e2e-tests/homepage.spec.ts`
  - `app/client/e2e-tests/api-integration.spec.ts`

## Files Likely to Change

- Backend:
  - `app/server/app.py`
  - `app/server/test_app.py`
- Frontend:
  - `app/client/src/pages/index.astro`
  - `app/client/src/components/DogList.astro` (empty state message / reusable markup)
- Tests:
  - `app/client/e2e-tests/homepage.spec.ts`
  - `app/client/e2e-tests/api-integration.spec.ts`

## Validation Requirements

### Backend

- Run unit tests:
  - `cd app/server && python -m unittest`

### Frontend

- Run e2e:
  - `cd app/client && npx playwright test`

### Manual

- Start app:
  - `./app/scripts/start-app.sh` (or `.ps1`)
- Verify:
  - Typing in name input does not reload page
  - Selecting category updates instantly
  - Combined filters intersect
  - Empty state shows for no matches
  - Pagination still works with and without filters

## Assumptions & Risks to Call Out in PR

- **Assumption**: “Category” == `Breed.name`.
- **UX risk**: Pagination + filtering; mitigate by keeping server-side pagination and encoding filters in pagination URLs.
- **Race conditions** during typing; mitigate with debounce + request cancellation/guard.
