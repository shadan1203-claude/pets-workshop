# Developer Handoff — NA

- **Jira Story:** NA (not provided)
- **Jira URL:** Not provided
- **Feature:** Add Search capability on dog listing (homepage)

## Summary

Implement a keyword search experience on the homepage dog listing that filters adoptable dogs by **name** and/or **breed**. Search must be server-side (to work correctly with pagination) and represented in the URL query string (`?q=...`) so results are shareable. Pagination must preserve the current `q` term.

## Acceptance Criteria (Engineering Checklist)

1. UI: Homepage provides visible search input labeled clearly (e.g., “Search dogs”).
2. UI: Submitting a search updates results without a full page reload perception.
3. URL state: Search term represented in URL query string; pagination links preserve it.
4. Backend: `GET /api/dogs` supports optional `q` filtering by dog name OR breed name using case-insensitive partial match.
5. Backend: Pagination totals reflect filtered set when `q` is provided.
6. Validation: empty/whitespace-only `q` behaves as unfiltered.
7. Error handling: existing error state still used; no unhandled exceptions introduced.
8. Testing: Automated tests cover name search, breed search, and pagination with `q`.

## Suggested Branch and Commit

- **Branch:** `feature/na` (story key not provided; repository manager used fallback)
- **Commit message format:** `docs(NA): add implementation artifacts` (docs-only)

## Implementation Checklist

### Backend (Flask + SQLAlchemy)

File: `app/server/app.py`

- Read `q` from request query params.
- Trim whitespace; if blank treat as not provided.
- Apply filter for case-insensitive partial match:
  - `Dog.name` OR `Breed.name` contains `q`.
  - SQLite-compatible: use `func.lower(...).like(...)`.
- Ensure `total` and `total_pages` are computed after filtering.
- Preserve response shape (no breaking changes).

### Frontend (Astro)

File: `app/client/src/pages/index.astro`

- Read `q` and `page` from `Astro.url.searchParams`.
- Include `q` in backend API fetch when non-empty.
- Add a search form/input:
  - Visible label: **Search dogs**
  - `name="q"` so it binds to URL query string.
  - Hidden `page=1` on submit to reset pagination.
  - Optional Clear link to `/` when `q` is set.
- Update pagination links to preserve `q`.

### Tests

- Backend: `app/server/test_app.py`
  - Add/update unit tests for filtering and totals under `q`.
- E2E: `app/client/e2e-tests/homepage.spec.ts`
  - Add scenarios for name/breed search and pagination with `q`.

## Validation Requirements

- Local unit tests: `python -m unittest` from `app/server`.
- Local E2E: `npm run test:e2e` (or documented script) from `app/client`.
- Manual smoke:
  - `/` default listing
  - `/?q=husky` filters
  - navigate Next/Prev keeps `q`
  - submitting empty search returns to unfiltered

## Notes / Non-goals

- No full-text search.
- No schema migrations.
- No searching in description/age/gender/status.

## Risks & Mitigations

- LIKE query performance at scale: monitor, consider indexes or FTS later.
- Case-insensitive matching differences by collation: prefer explicit `lower()` logic.
- E2E fragility from seeded ordering: assert stable text presence rather than exact ordering.
