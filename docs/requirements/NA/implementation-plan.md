# Implementation Plan — NA

- **Jira Story:** NA (not provided)
- **Jira URL:** Not provided
- **Title:** Add Search capability on dog listing (homepage)

## Executive Summary

- **Goal:** Add keyword search on the homepage dog listing to filter dogs by name and/or breed, while preserving pagination and shareable URL state.
- **In scope**
  - Backend: Extend existing `GET /api/dogs` with optional query param `q` performing case-insensitive partial match on `Dog.name` OR `Breed.name`.
  - Frontend: Add a search input on the homepage; reflect search term in URL (`?q=...`); preserve `q` across pagination links; reset page to 1 on new search.
  - Testing: Update Python unit tests and Playwright E2E tests.
  - Documentation: Mention the new `q` parameter and UI behavior.
- **Out of scope**
  - Full-text search, advanced filters, sorting changes, indexing/migrations (unless later required).
  - Search across description/age/gender/status.

## Assumptions

- Search scope is limited to dog name and breed name.
- Search is implemented server-side for correctness with pagination.
- Case-insensitive search is acceptable using SQLite-compatible operations (e.g., `LOWER(...) LIKE ...`).
- The homepage remains the primary dog browsing surface and is the initial location for the search UI.

## Risks

- Performance risk if `LIKE` queries on large datasets become slow without indexes; may require indexing or full-text search later.
- Potential SQLAlchemy/SQLite behavior differences for case-insensitive matching depending on collation settings.
- E2E test fragility if search results depend on seeded data ordering; tests should assert stable expected items.
- UX risk if search and pagination state are not synchronized correctly.

## Phases

### 1) Preparation and branching

- Create a feature branch for this work.
- Confirm local run steps for server + client and test execution.

**DoD checkpoints**
- Branch created; baseline tests passing.

### 2) Backend changes

Update `app/server/app.py` for `GET /api/dogs`:

- Read `q` from `request.args`.
- Trim whitespace; if empty => treat as not provided.
- Apply filter: dog name OR breed name contains `q`, case-insensitive.
- Ensure `total` and `total_pages` are computed after filtering.
- Keep response shape unchanged.

**DoD checkpoints**
- `/api/dogs?q=gold` returns only matching dogs and totals reflect filtered set.
- `/api/dogs?q= buddy` matches `Buddy` (case-insensitive, partial).
- `/api/dogs?q=\s+` behaves like unfiltered.

### 3) Frontend changes

Update `app/client/src/pages/index.astro`:

- Read `q` from `Astro.url.searchParams`.
- Include `q` in the API call when present/non-empty.
- Render a search form/input labeled **“Search dogs”**.
- On submit, navigate to `/?q=<term>&page=1` (or omit `q` when blank), preserving shareability.
- Update pagination hrefs to preserve `q`.

**DoD checkpoints**
- Searching updates list without requiring a manual reload (navigation acceptable).
- URL reflects `q` and pagination preserves `q`.
- Existing error UI remains.

### 4) Database changes

- No schema change required.

### 5) Testing

Backend tests in `app/server/test_app.py`:

- Add tests for search by name and search by breed.
- Add test verifying empty/whitespace-only `q` behaves unfiltered.
- Add test verifying pagination totals under `q`.

E2E tests in `app/client/e2e-tests/homepage.spec.ts`:

- Search by name (e.g., “Buddy”) updates results.
- Search by breed (e.g., “Husky”) updates results.
- Pagination with `q` preserves `q` in URL.

**DoD checkpoints**
- `python -m unittest` passes.
- Playwright suite passes.

### 6) Documentation

- Update documentation to mention `GET /api/dogs` supports `q`.
- Document homepage URL params used by browsing (`page`, `q`).

### 7) Manual verification

- Start app locally and verify:
  - Search + clear
  - Pagination preserves `q`
  - No UI/API crashes
