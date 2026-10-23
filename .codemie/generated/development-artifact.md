# Development Artifact — ENH-01 Instant Search on Homepage (Name/Breed) with Debounce

- Application: pets-workshop (Tailspin Shelter)
- Jira Epic: EPMCDMETST-69339
- Jira Story: EPMCDMETST-69999
- Status: READY_FOR_TESTING (per Jira status: completed)
- Confluence (implementation plan): https://epam-team-qucnxcim.atlassian.net/wiki/spaces/~712020fd7c84af4994406f8a7d7fb120cebee3/pages/37093377/Implementation+Plan+EPMCDMETST-69999

## 1) Feature Scope (what is included / excluded)

### In scope (ENH-01)
- Add a search input on the homepage above the dog list.
- Instant (debounced) filtering while typing (recommended 300ms; acceptable range 250–400ms).
- Backend: extend `GET /api/dogs` to accept optional query param `q`.
- Search matches **Dog.name** and **Breed.name** using **case-insensitive partial match**.
- Pagination remains; filtered results are paginated.
- URL synchronization:
  - `q=<term>` is reflected in the browser URL (shareable).
  - When `q` changes, reset `page` to 1.
  - Pagination navigation preserves `q`.

### Out of scope (explicit)
- Fuzzy matching, typo tolerance, ranking.
- Sorting options.
- Additional filters (breed dropdown, availability toggle).
- Enhanced UX states (distinct “No matches found”, loading indicator, clear button) — addressed by ENH-02.

## 2) Impacted Components

| Layer | Component | Impact |
|---|---|---|
| Frontend | `app/client/src/pages/index.astro` | Add search UI, read/write URL `q`, include `q` in SSR fetch, add client-side debounced fetch and DOM update, ensure pagination links preserve `q`. |
| Frontend | `app/client/src/components/DogList.astro` | Potential refactor: move header out or add hooks/containers to allow DOM replacement; keep empty state behavior. |
| Backend | `app/server/app.py` | Add `q` parsing and SQLAlchemy filter on `/api/dogs` query; ensure counts and pagination reflect filtering. |
| Tests (backend) | `app/server/test_app.py` | Add unit tests for `q` param; update query mocks to support `.filter()` chaining. |
| Tests (e2e) | `app/client/e2e-tests/homepage.spec.ts` | Add Playwright coverage for instant search + URL behavior + pagination preserving `q`. |

## 3) APIs Affected

### `GET /api/dogs`
- **New optional query param:** `q` (string)
- Matching:
  - Case-insensitive
  - Partial match
  - Against `Dog.name` OR `Breed.name`
- Existing params unaffected:
  - `page` (default 1)
  - `per_page` (default 6; clamped to 1..100)
- Response schema unchanged:
```json
{
  "dogs": [{"id": 1, "name": "Buddy", "breed": "Golden Retriever"}],
  "page": 1,
  "per_page": 6,
  "total": 1,
  "total_pages": 1
}
```

## 4) Backend Changes

### Required code changes
- File: `app/server/app.py`
- Update `get_dogs()`:
  - Parse `q = request.args.get('q', default=None, type=str)` and trim.
  - If `q` is non-empty after trim, apply filter:
    - `or_(func.lower(Dog.name).like(f"%{q.lower()}%"), func.lower(Breed.name).like(f"%{q.lower()}%"))`
  - Ensure `total = query.count()` is computed **after** filtering.
  - Keep pagination unchanged (offset/limit).

### Backend unit tests
- File: `app/server/test_app.py`
- Update `_setup_query_mock()` to support `.filter()` chaining (returning the same mock query instance).
- Add tests:
  - `test_get_dogs_with_q_name_case_insensitive()`
  - `test_get_dogs_with_q_breed_partial()`
  - `test_get_dogs_with_q_whitespace_treated_as_empty()`
  - `test_get_dogs_pagination_still_applies_with_q()` (structural verification based on mock chain; ensure no crash and correct response shape)

## 5) Frontend Changes

### SSR behavior (initial load)
- File: `app/client/src/pages/index.astro`
- Read `q` from `Astro.url.searchParams` and include it in SSR fetch to `/api/dogs`.
- Ensure pagination anchor `href`s preserve `q`.

### Client-side behavior (instant updates)
- Add a search input near/above the "Available Dogs" header.
- Implement client-side script in `index.astro`:
  - Attach `input` event listener.
  - Debounce (recommend 300ms).
  - On debounce fire:
    - Update URL using `history.replaceState` (set `q`, reset `page=1`; remove `q` if empty).
    - Fetch `/api/dogs?q=...&page=1&per_page=6`.
    - Replace the dog list DOM with returned results.
    - Replace pagination DOM based on `page` and `total_pages`, ensuring links include `q`.
  - Guard against out-of-order responses (optional but recommended) using a monotonically increasing request id.

### DogList component
- File: `app/client/src/components/DogList.astro`
- Expected minimal change:
  - Move `<h2>Available Dogs</h2>` to `index.astro` so the new search input can appear in the same section header row.
  - Keep list markup and `data-testid` attributes stable (`dog-list`, `dog-card`, `dog-name`, `dog-breed`, `empty-state`).

## 6) Database Changes

- None required for ENH-01.
- Note: SQLite performance may degrade with large LIKE queries; indexing is a future consideration (out of scope).

## 7) Files Likely to be Modified

### Confirmed from repo structure
- `app/server/app.py`
- `app/client/src/pages/index.astro`
- `app/server/test_app.py`
- `app/client/e2e-tests/homepage.spec.ts`

### Likely
- `app/client/src/components/DogList.astro`

## 8) Implementation Task Breakdown (for Testing Assistant / validation)

### Backend
1. Implement `q` query parameter on `GET /api/dogs` with case-insensitive partial matching against dog name and breed name.
2. Verify pagination and totals reflect filtered query.
3. Add/adjust unit tests for `q`.

### Frontend
4. Add search input on homepage near "Available Dogs".
5. SSR: include `q` in initial fetch and preserve `q` on pagination links.
6. Client: implement debounced fetch and DOM update; update URL via `replaceState` and reset page=1 on `q` change.

### E2E
7. Add Playwright tests for:
   - Search by name (partial + case-insensitive).
   - Search by breed partial.
   - URL includes `q` after typing.
   - Pagination preserves `q`.

## 9) Acceptance Criteria Coverage

### AC1 — Debounced instant updates
- Covered by: Playwright test typing into search input and waiting for the list to update within debounce window.

### AC2 — Case-insensitive partial match for name and breed
- Covered by:
  - Backend unit tests for `q` normalization and filter application.
  - Playwright tests for name (`bud`/`BuD`) and breed partial (`husk`).

### AC3 — URL includes q and pagination preserves q
- Covered by:
  - Playwright test verifying `page.url()` contains `q=...` after typing.
  - Playwright test clicking next/prev and asserting URL still contains `q=...`.

## 10) Test Data Assumptions (from existing e2e suite)
- Homepage page 1 (unfiltered) shows 6 dog cards.
- Known seeded names/breeds used by tests:
  - Buddy — Golden Retriever
  - Luna — Husky
  - Max — German Shepherd
  - Rocky appears first on page 2 (unfiltered)

## 11) Key Edge Cases to Validate
- `q` whitespace-only treated as no filter.
- Special characters in `q` are URL-encoded (no crash).
- Changing `q` while on page>1 resets to page=1.
- Rapid typing does not duplicate results; final term wins (debounce + stale response guard).
