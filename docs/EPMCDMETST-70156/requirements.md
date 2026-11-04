# Requirements — EPMCDMETST-70156

**Status:** Approved for implementation
**Source of truth:** Jira story EPMCDMETST-70156, “Homepage: Filter dog list by breed (dropdown) with server-side filtering”
**Related epic:** EPMCDMETST-69339

## Business goal and user

Improve homepage discovery by enabling a user to narrow the dog list to a breed and quickly find dogs of interest.

## Scope

- Provide a stable `GET /api/breeds` response containing breed `id` and `name`.
- Add optional `breed_id=<id>` filtering to `GET /api/dogs`, applied by the backend/database.
- Provide a homepage breed dropdown populated from the breed endpoint. Carry its selected ID in the URL query parameters and use it to fetch results.
- Keep pagination consistent with the selected breed: filtered `total` and `total_pages`, and pagination links retain `breed_id`.

## Functional requirements

| ID | Requirement | Source / verification |
|---|---|---|
| FR-01 | `GET /api/breeds` returns a stable list of breed objects with `id` and `name`, ordered alphabetically by breed name. | Jira AC-1; API contract test. Retains the current ordering behavior. |
| FR-02 | `GET /api/dogs` accepts optional `breed_id`; when supplied with a valid breed ID, only dogs belonging to that breed are returned. The filter is applied in the database query. | Jira AC-2; backend/API test verifying returned breed IDs and query filtering. |
| FR-03 | The homepage presents a single-select breed dropdown populated from the breed endpoint and uses the selected breed ID in the `breed_id` URL parameter and dog-list request. | Jira Scope; browser test verifies options, selection, request, and URL. |
| FR-04 | Changing the selected breed refreshes the results and resets the requested page to page 1. | Jira AC-3; consistent with the existing homepage filter behavior in `app/client/src/pages/index.astro`; browser test. |
| FR-05 | The filtered result set determines `total` and `total_pages`, and every next/previous pagination URL preserves `breed_id`. | Jira AC-3 / Scope; API and browser tests across multiple pages. |
| FR-06 | With no `breed_id`, existing dog-list behavior remains available. When supplied alongside existing name or breed/category filters, all filters apply together. | Jira says the parameter is optional and “add” support; regression test. |

## Non-functional requirements

- Filtering and counting must occur server-side before offset/limit pagination so totals describe the filtered set (Jira description and AC-3).
- Keep the dropdown labelled and usable with the existing homepage form; the current page has a label for its breed/category select (`app/client/src/pages/index.astro`).
- Preserve the existing API response shape for dog pagination (`dogs`, `page`, `per_page`, `total`, `total_pages`) unless a human approves a change (`app/server/app.py`).
- No additional performance, telemetry, data-retention, or availability targets are specified by the Jira story.

## Acceptance criteria

1. **AC-1:** `GET /api/breeds` provides a stable list of breeds containing `id` and `name`.
2. **AC-2:** `GET /api/dogs` accepts optional `breed_id=<id>` and returns only dogs of that breed.
3. **AC-3:** Changing the dropdown updates results and keeps pagination consistent, including filtered `total` and `total_pages`.

## Exclusions

- Multi-select breeds.
- Breed management/CRUD.
- Other changes to dog details, search, or sorting.

## Assumptions and dependencies

- **Jira assumption:** Breeds are seeded and present in the database; seed scripts exist.
- The current `breeds` table and `Dog.breed_id` relationship are reused (`app/server/models/breed.py`, `app/server/models/dog.py`).
- The existing `/api/breeds` route and breed-name filtering exist in the baseline (`app/server/app.py`); the requested delta is ID-based filtering and selection/pagination state.
- Approved behavior: the new `breed_id` filter is additive; existing name and breed/category filters continue to work when supplied together.

## Risks and open questions

- **Jira risk:** Current unit tests mock `db.session.query`; test doubles may need to support the new `.filter()` query path.
- Approved behavior: malformed/non-numeric `breed_id` returns HTTP 400; an unknown numeric ID returns HTTP 200 with an empty result and zero total. Invalid input must not silently disable the filter.
- Approved stable list ordering: alphabetical by breed name, retaining the existing route behavior.
- Approved filter interaction: `breed_id` combines additively with existing name and legacy breed/category parameters.
- Existing E2E tests assume the current breed-name/category UI. They will need updates for ID-valued selection while retaining relevant regressions.

## Baseline evidence

- `app/server/app.py`: current `/api/breeds` selects `Breed.id` and `Breed.name`, orders by breed name, and returns a `breeds` array; `/api/dogs` currently filters by breed name/category, then calculates totals and paginates.
- `app/client/src/pages/index.astro`: current homepage fetches dogs and breeds, presents a category select whose values are breed names, and preserves the existing name/breed parameters in page links and browser history.
- `app/client/src/pages/api/dogs.ts`: same-origin proxy forwards the dog request query string to the Flask API.
- `app/server/test_app.py`, `app/client/e2e-tests/api-integration.spec.ts`: existing API/unit and browser-integration coverage includes breed list and breed-name filters.
