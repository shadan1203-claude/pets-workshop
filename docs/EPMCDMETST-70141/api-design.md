# API Design — EPMCDMETST-70141

## Status and design basis

**Phase:** API Design
**Design Review:** Approved With Conditions. The approved conditions are the exact UI label **“All Breeds”** and removing stale `breed`/`category` parameters when a new dropdown breed is selected, while retaining unrelated filters such as `name`.
**Filter decision:** The only required breed-filter parameter is integer `breed_id`; a breed-name alias is not required.

This design records the existing candidate source behavior separately from the target contract. Source references are static inspection only; the candidate implementation is uncommitted and has not been runtime-validated here. No code or tests were changed or run for this phase.

## Contract overview

| Endpoint / interaction | Method | Purpose |
|---|---|---|
| `/api/breeds` | `GET` | Return the available breed IDs and names, ordered by name, for the homepage dropdown. |
| `/api/dogs` | `GET` | Return a page of dogs, optionally filtered by `breed_id` and existing filters. Counts and page totals describe the filtered result set. |
| `/api/dogs` (Astro same-origin route) | `GET` | Forward browser listing requests to Flask, preserving the query string and upstream status/body. |
| `/` (homepage) | `GET` | Server-render the listing and controls from URL query parameters. Client-side selection and pagination fetch refreshed listing data without a full-page reload. |

JSON endpoints return `application/json`. No new authentication, persistence, or API versioning requirement is introduced.

## Request models and query parameters

### `GET /api/breeds`

No query parameters or request body. Returns all available breeds; this endpoint is not paginated.

### `GET /api/dogs`

All parameters are optional. The required feature contract is `breed_id`; remaining filters are existing behavior.

| Parameter | Type / default | Semantics and validation |
|---|---|---|
| `page` | Integer; default `1` | Page number. Values below `1` are normalized to `1`. Invalid integer conversion falls back to the default under Flask's typed query parsing. |
| `per_page` | Integer; default `6` | Page size, normalized to the inclusive range `1`–`100`. Invalid integer conversion falls back to the default. |
| `breed_id` | Optional integer | Filters to the breed whose ID equals this value. This is the only breed filter required for the feature. A supplied value must be an ASCII decimal integer, optionally prefixed with `-`; malformed values return `400`. |
| `name` | Optional string; max `100` characters | Existing case-insensitive partial match on dog name. Leading/trailing whitespace is stripped. Longer values return `400`. |
| `breed` | Optional string; max `100` characters | **Legacy compatibility only.** Existing case-insensitive exact match on breed name. Leading/trailing whitespace is stripped. |
| `category` | Optional string; max `100` characters | **Legacy alias only.** Used if `breed` is absent/empty. When both legacy parameters are non-empty, `breed` takes precedence. |

When multiple filters are supplied, they are intersected. In particular, the API currently applies a supplied `breed_id` and a legacy `breed`/`category` predicate together. The homepage's new dropdown selection must therefore remove stale `breed` and `category` parameters before sending its request; it must retain unrelated filters such as `name`.

The API reads the first value for a repeated query parameter, consistent with Flask `request.args.get`; clients should send each parameter at most once.

### Homepage / browser request contract

- On initial `GET /`, the homepage reads `page`, `name`, `breed_id`, and any existing legacy `breed`/`category` values from the URL. It server-side fetches dogs from Flask and loads dropdown options from `/api/breeds`.
- The breed dropdown submits the selected breed as `breed_id`. The unfiltered option's visible text must be exactly **“All Breeds”**.
- On a new dropdown selection, request page `1`, include the selected `breed_id` (or omit it for “All Breeds”), clear stale `breed` and `category`, and retain `name`. Update the URL/history and replace results without a full-page reload.
- Pagination requests and URLs preserve the selected `breed_id` and other active filters, including `name`. Browser back/forward restores the URL's page and filters.
- Clearing all filters removes filter query parameters and requests page `1`.
- The browser calls the same-origin Astro `/api/dogs` route for interactive listing updates. There is no inspected same-origin Astro `/api/breeds` route; breed options are fetched server-side from Flask, not directly by browser code.

## Successful response models

### `GET /api/breeds` — `200 OK`

```json
{
  "breeds": [
    { "id": 1, "name": "Beagle" },
    { "id": 2, "name": "Golden Retriever" }
  ]
}
```

`breeds` is an array of objects with integer `id` and string `name`, ordered ascending by breed name. If there are no breeds, return `{"breeds":[]}`.

### `GET /api/dogs` — `200 OK`

```json
{
  "dogs": [
    { "id": 12, "name": "Buddy", "breed": "Beagle" }
  ],
  "page": 1,
  "per_page": 6,
  "total": 1,
  "total_pages": 1
}
```

`dogs` contains objects with integer `id`, string `name`, and string `breed`. `page` and `per_page` are the effective normalized values. `total` is the count after all active filters; `total_pages` is `ceil(total / per_page)`, with a minimum of `1`.

An unknown `breed_id`, a valid but nonmatching breed ID, or any other filter combination with no matches is a successful empty result: `dogs` is `[]`, `total` is `0`, and `total_pages` is `1`. The homepage displays its empty state and hides pagination when only one page exists. For a requested page beyond the last populated page, the API returns an empty `dogs` array while retaining the effective requested `page` and reporting totals for the filtered result.

No dog ordering is specified by the current query or requirements; clients must not rely on a stable ordering between pages unless a separately approved contract defines one.

## Error and status behavior

| Condition | Flask API response |
|---|---|
| Valid request, including an unknown/nonmatching breed ID | `200 OK` with the applicable success model (empty `dogs` for no match). |
| Malformed supplied `breed_id` (for example `breed_id=husky`, `1.5`, or empty) | `400 Bad Request`, `{"error":"breed_id must be an integer"}`. |
| `name` exceeds 100 characters | `400 Bad Request`, JSON `error` stating `name must be at most 100 characters`. |
| Effective legacy breed-name value exceeds 100 characters | `400 Bad Request`, JSON `error` stating `breed must be at most 100 characters`. |
| `breed_id` parses as an integer outside signed 64-bit range | Current behavior is `200 OK` with an empty dog result, not `400`. |

Errors use a JSON object with an `error` string. The implementation does not specify a response schema for unexpected database/server failures; normal server error handling applies.

The same-origin Astro `/api/dogs` proxy returns the upstream response body and status with JSON content type. If the upstream fetch throws, it returns `502 Bad Gateway` with an `error` string. The current body includes the caught exception detail; Design Review finding DR-03 recommends reconsidering that exposure before production, but does not make it an approved change for this feature.

## Pagination, empty results, and compatibility

- Filtering precedes counting and pagination. Thus `total` and `total_pages` describe the intersection of `breed_id`, `name`, and any legacy filters present.
- Defaults and bounds are `page=1`, `per_page=6`, and `1 <= per_page <= 100`; zero/negative page values normalize to page 1.
- Empty results use one logical page. UI pagination is hidden when `total_pages <= 1`, consistent with the accepted “hidden or limited to one page” requirement.
- Existing `breed` and `category` parameters remain supported for compatibility; neither is required to implement the new dropdown. Direct legacy URLs continue to filter server-side. On a legacy-only URL the current dropdown is driven by `breed_id`, so it may display “All Breeds” while the listing is constrained by a legacy filter. Do not add a legacy-to-dropdown mapping without an approved product/API decision.
- Selecting a dropdown breed clears legacy `breed` and `category`, as accepted in Design Review; this avoids unintended intersection with an old breed selection. Other filters such as `name` remain active.
- `/api/breeds` ordering is by `Breed.name` ascending. No case-insensitive ordering or locale-specific collation guarantee is defined.

## Examples

List breeds:

```http
GET /api/breeds
```

List the first page without a breed filter:

```http
GET /api/dogs?page=1&per_page=6
```

List page 2 for breed ID 2, retaining a name search:

```http
GET /api/dogs?page=2&per_page=6&breed_id=2&name=bud
```

Unknown but well-formed breed ID (successful empty result):

```http
GET /api/dogs?breed_id=99999
```

Malformed breed ID (client error):

```http
GET /api/dogs?breed_id=husky
```

Legacy compatibility example (the `category` alias remains usable; a new dropdown selection would remove it):

```http
GET /api/dogs?page=1&category=Golden%20Retriever
```

## Current behavior versus target behavior

| Area | Current candidate source behavior (static inspection) | Target contract / required disposition |
|---|---|---|
| Breed-list API | Flask `GET /api/breeds` returns `{breeds:[{id,name}]}` ordered by `Breed.name`. | Preserve this contract; homepage uses it to populate options. |
| Dog API filter and totals | Flask supports `breed_id`; legacy name filters remain; filters run before `count()` and pagination. | `breed_id` is the sole required new breed filter. Keep legacy filters for compatibility, but do not require a breed-name alias. |
| Invalid/unknown IDs | Malformed `breed_id` returns 400; unknown IDs and signed-64-bit overflow return 200 empty results. | Preserve and document the observed distinction; do not convert unknown IDs into errors. |
| UI label | Candidate markup currently says “All”. | **Approved condition:** change the visible option to exactly “All Breeds”. |
| New breed selection | Candidate client code reuses current legacy `breed`/`category` parameters along with the new `breed_id`. | **Approved condition:** clear stale `breed`/`category` on dropdown selection, while keeping unrelated filters such as `name`; request page 1. |
| Proxy failure detail | Astro proxy's 502 response exposes the caught exception message. | Record as-is for this API design. DR-03 is a non-blocking recommendation, not an authorized response-contract change; obtain approval before changing it. |

## Traceability and source evidence

| Contract element | Requirement / review reference | Source evidence (candidate working tree; inspection only) |
|---|---|---|
| Breed list fields and ordering | FR-01, AC-01 | `app/server/app.py`, `get_breeds`; `app/client/src/pages/index.astro`, server-side breed fetch. |
| Integer `breed_id`, optional filtering | FR-02; approved requirements decision | `app/server/app.py`, `get_dogs`; `app/server/test_app.py`, breed-ID and malformed-ID test definitions. |
| Filtered count, page bounds, empty result | FR-03, FR-07; AC-03, AC-05 | `app/server/app.py`, `get_dogs`; `app/server/test_app.py`, filtered-total and empty-result test definitions. |
| Dropdown label and stale legacy filters | FR-04–FR-06; Design Review DR-01 and DR-02 | `app/client/src/pages/index.astro`, dropdown markup, `currentFilters`, `fetchAndRender`, and change handler. |
| Same-origin forwarding | Architecture boundary description | `app/client/src/pages/api/dogs.ts`, `GET` route. |
| Existing compatibility parameters | Existing API documentation | `README.md`, API section; `app/server/app.py`, `get_dogs`. |

No automated tests, builds, implementation, planning, or workflow-state updates were performed as part of this API Design artifact.
