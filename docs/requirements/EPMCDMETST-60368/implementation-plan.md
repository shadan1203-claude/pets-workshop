# Implementation Plan — Instant Search by Pet Name and Category (Breed)

- **Jira Epic**: EPMCDMETST-60368
  - https://jiraeu.epam.com/browse/EPMCDMETST-60368
- **Jira Story**: _Not provided in context_
  - URL: _Not provided in context_

> Note: The original request and design package did not include a Jira Story key/URL. This documentation is filed under the epic key **EPMCDMETST-60368**.

## Requirement Summary

Add instant search to the Pets Workshop (Tailspin Shelter) homepage list page so users can filter displayed pets (dogs) by:

- **Pet Name** (case-insensitive, partial match)
- **Category** mapped to **Breed.name** (dropdown)

Search results must update instantly (without full page reload) and filters must be combinable.

## Scope Decision (explicit)

- Implement **instant** behavior via **client-side JS + debounced server-side filtering requests**.
- Keep existing server-side pagination behavior; when filters are active, results are **still paginated server-side** and pagination reflects the **filtered** totals.

## Implementation Phases

### Phase 1 — Preparation & Branching (Effort: S)

1. Create/switch to branch:
   - `feature/EPMCDMETST-60368`
2. Verify run scripts:
   - `app/scripts/start-app.sh`
   - `app/scripts/start-app.ps1`
3. Run baseline tests:
   - Backend: `cd app/server && python -m unittest`
   - Frontend e2e: `cd app/client && npx playwright test`

**DoD checkpoints**
- Baseline tests pass
- Branch created and pushed

### Phase 2 — Backend changes (Effort: M)

1. Extend `GET /api/dogs` to accept optional query params:
   - `name` (string; partial match; case-insensitive)
   - `category` (string; maps to breed/category; expected exact match from dropdown; case-insensitive)
   - Preserve existing pagination params: `page`, `per_page`
   - Optional compatibility: also accept `breed` query param as alias for `category` (must be documented if implemented)
2. Update SQLAlchemy query:
   - Conditional filter on `Dog.name` using `ilike("%...%")`
   - Conditional filter on `Breed.name` using exact match ignoring case (recommended for dropdown), e.g. `func.lower(Breed.name) == category.lower()`
   - Ensure `total` reflects filtered count
3. Add `GET /api/breeds` endpoint (if not present) to populate dropdown values.
4. Add/Update backend unit tests:
   - Existing pagination still works
   - Filtering by `name`
   - Filtering by `category`/breed
   - Combined filtering
   - `/api/breeds` returns ordered list

**DoD checkpoints**
- `/api/dogs` supports new params without breaking existing consumers
- `/api/breeds` exists and returns breed list
- Unit tests updated and passing

### Phase 3 — Frontend changes (Effort: M)

1. Add search UI to homepage (`app/client/src/pages/index.astro`):
   - Text input for name with accessible label
   - Select dropdown for category/breed with “All” option
   - Populate dropdown from `/api/breeds` (preferred: SSR fetch)
2. Implement instant updates (no full page reload):
   - Add client-side script that listens to input/change events
   - Debounce name input (200–300ms)
   - Fetch filtered results from `/api/dogs` using current filters and `page=1` on filter change
   - Update dog list container DOM with results
   - Update pagination DOM with filtered totals
   - Handle empty state when no matches
   - Mitigate racing requests (AbortController or last-response-wins)
3. Pagination behavior when filters are active:
   - Continue server-side pagination for filtered results
   - Ensure pagination links include current `name` and `category` params
   - Progressive enhancement: pagination still works without JS (full navigation)

**DoD checkpoints**
- Filters update list instantly and are combinable
- No page reload on typing/changing filters
- Pagination remains functional and consistent with filtered totals
- Empty state displayed when no matches

### Phase 4 — Database changes (Effort: S)

- No schema changes required.
- Optional: indexes on `dogs.name` and `breeds.name` (not required for workshop scale).

### Phase 5 — Testing (Effort: M)

1. Update Playwright tests:
   - Name filter behavior (case-insensitive, partial)
   - Category filter behavior
   - Combined filters
   - Empty state
   - Pagination works with/without filters
   - Ensure no full navigation is triggered by typing/selecting
2. Add API integration assertions if needed.

**DoD checkpoints**
- Playwright tests passing

### Phase 6 — Documentation (Effort: S)

- Update relevant docs (README/workshop docs) describing:
  - Search controls and behavior
  - `/api/dogs` query params
  - `/api/breeds` endpoint
  - Pagination behavior with active filters

### Phase 7 — Build & Manual Validation (Effort: S)

- Start services:
  - Backend: `python app/server/app.py`
  - Frontend: `cd app/client && npm run dev` (ensure API is reachable; uses `API_SERVER_URL` as configured)
- Manual smoke checks:
  - Typing does not reload the page (network requests only)
  - Category change updates instantly
  - Combined filters work
  - Empty state renders
  - Pagination works with filters and without filters

## Dependencies

- Backend must expose breed list for dropdown (`/api/breeds`).
- Deterministic seeded DB for tests (`seed_test_database.py`).

## Risks & Mitigations

- **Performance** if client-side filtering required fetching all dogs → mitigate via server-side filtering.
- **Ambiguity** of “Category” meaning → treat as breed; document assumption.
- **Pagination confusion** when filters active → keep server-side pagination and include filters in pagination URLs.
- **Test stability** due to count/order assertions → update tests to assert behavior instead of brittle counts where possible.
