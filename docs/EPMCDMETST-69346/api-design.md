# API Design — EPMCDMETST-69346

## Status, authority, and scope

- **Stage:** API Design artifact; this document is a design, not implementation or test evidence.
- **Inputs:** User-approved `requirements.md`, user-approved `architecture.md`, and user-approved Round 2 `design-review.md` in this directory.
- **Authoritative scope:** Jira AC-01..AC-08 and user-approved D-01..D-04. The Round 2 review permits API Design to proceed with conditions; its Round 1 rejection is superseded.
- **Changes in scope:** Define current and target HTTP contracts for Flask `GET /api/dogs`, Flask `GET /api/breeds`, and the existing same-origin Astro `GET /api/dogs` proxy, including the SSR catalog-failure behavior.
- **Out of scope:** Source, tests, root documentation, new endpoints, new response envelopes, or claims that implementation/tests pass.

The current behavior below is based on inspected source (`app/server/app.py`, `app/client/src/pages/api/dogs.ts`, and `app/client/src/pages/index.astro`). Current behavior is evidence, not proof of acceptance-criteria completion.

## 1. Contract summary

| Route | Current contract | Target contract |
|---|---|---|
| Flask `GET /api/dogs` | Optional pagination and name/breed filters; returns the existing paginated JSON object. Invalid filter lengths return a JSON 400. | Preserve parameters and response shape. Enforce trimmed partial case-insensitive literal name matching, exact case-insensitive Breed matching, filtered count, ascending `Dog.id` order before pagination, and all limits/defaults below. |
| Flask `GET /api/breeds` | Returns `{ "breeds": [{ "id": number, "name": string }] }` ordered by Breed name. | Preserve this successful response wrapper and source. SSR must distinguish non-OK, transport, and unusable-response failures and show an accessible unavailable state without preventing name-only search. |
| Astro same-origin `GET /api/dogs` | Forwards the browser query string to Flask; passes through upstream status/body; thrown fetch becomes 502 JSON `{ "error": ... }`. | Preserve the proxy boundary and pass-through contract. Keep errors observable to the browser; it must not treat a non-OK response or transport failure as a successful empty result. |

No separate Astro `/api/breeds` proxy is specified. The homepage currently loads the breed catalog in SSR directly from Flask; interactive dog searches use the same-origin Astro proxy.

## 2. Flask `GET /api/dogs`

### Request

Method/path: `GET /api/dogs`

| Query parameter | Current behavior | Target behavior |
|---|---|---|
| `page` | Defaults to `1`; parsed as an integer, with a non-integer value falling back to the default; clamped to at least `1`. | Preserve. |
| `per_page` | Defaults to `6`; parsed as an integer, with a non-integer value falling back to the default; clamped to `1..100`. | Preserve. |
| `name` | Optional string, trimmed; over 100 characters after trimming returns 400. Non-empty input is used in a partial `ILIKE` pattern. Current pattern construction does not establish literal `%`/`_` behavior. | Optional, trimmed, maximum 100 characters. Match a substring of `Dog.name`, case-insensitively; `%` and `_` in caller text are literals, not SQL `LIKE` wildcards. Whitespace-only means no name filter. |
| `breed` | Optional string, trimmed; over 100 characters returns 400. Matches Breed name by case-insensitive equality. | Preserve exact, case-insensitive Breed-name matching and the 100-character maximum. |
| `category` | Legacy alias for `breed`; `breed` takes precedence when both non-empty values are supplied. | Preserve alias and precedence; callers may continue using either parameter. |

The name and Breed filters combine conjunctively: a returned dog must satisfy both when both are non-empty. An unknown Breed is a valid filter and yields an empty result, not a 404 or validation error.

Before offset/limit pagination, the server counts the filtered query. **Current source does not explicitly order the dog query.** Target behavior orders matching rows by ascending `Dog.id` before applying offset and limit. The count is for the filtered result set, independent of the requested page.

### Successful response — `200 OK`

Preserve the current JSON structure and per-dog fields:

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

- `dogs` contains at most `per_page` objects with `id`, `name`, and `breed`.
- `page` and `per_page` are the effective clamped values.
- `total` is the count after all active filters and before pagination.
- `total_pages` is `max(1, ceil(total / per_page))`; it remains `1` when there are no matches.
- A page beyond the available range remains a successful response with an empty `dogs` array and the filtered total/page metadata.

An empty result, including an unknown Breed, is `200 OK`, for example:

```json
{
  "dogs": [],
  "page": 1,
  "per_page": 6,
  "total": 0,
  "total_pages": 1
}
```

### Validation and errors

Current and target invalid-length response:

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json
```

```json
{ "error": "name must be at most 100 characters" }
```

For an overlong Breed or `category` value, the current error text uses `breed must be at most 100 characters`. Preserve the existing `{ "error": string }` error shape and status. Values of exactly 100 characters are accepted; 101 are rejected. Current code validates after trimming. It does not otherwise reject or normalize filter content beyond trimming.

No custom Flask handler is present for unexpected database/server failures; their response format is not established by this API contract. Do not promise a JSON error envelope for unhandled 5xx responses without a separate approved requirement.

### Query examples

```text
/api/dogs
/api/dogs?page=2&per_page=6
/api/dogs?name=bud
/api/dogs?name=bud&breed=Golden%20Retriever
/api/dogs?name=bud&category=Golden%20Retriever
/api/dogs?name=100%25
/api/dogs?name=under_score
```

Construct query strings using `URLSearchParams` or an equivalent standard URL encoder; do not concatenate user input into a URL. Spaces may appear as `%20` or `+` in encoded query strings. The literal percent character in the `100%` example is encoded as `%25`; decoded `%` and `_` are literal search characters under the target semantics. Encoding does not replace server-side length validation.

## 3. Flask `GET /api/breeds`

### Request and successful response

Method/path: `GET /api/breeds`; no query parameters are defined.

Current and target successful response:

```http
HTTP/1.1 200 OK
Content-Type: application/json
```

```json
{
  "breeds": [
    { "id": 3, "name": "Beagle" },
    { "id": 7, "name": "Golden Retriever" }
  ]
}
```

The wrapper is exactly `{ "breeds": [...] }`; each item has numeric `id` and string `name`. Current source orders by Breed name ascending. The Category control represents these Breed names and includes its default “All” option.

### Failure behavior and SSR consumption

The endpoint has no custom error response handler in current source; only successful response shape is established. An HTTP non-OK response, network/transport exception, JSON parse error, or unusable payload must not be interpreted by SSR as a successfully loaded empty catalog.

**Current homepage behavior:** SSR fetches dogs and breeds together via `Promise.all`. A non-OK breed response is silently ignored, leaving only “All” in the Category selector without a failure message. A thrown fetch in either request reaches the shared catch, potentially preventing successful dog data from being rendered. Neither behavior satisfies D-04.

**Target homepage behavior:** Handle the catalog result independently of dog-list loading. If `/api/breeds` is non-OK, throws, cannot be parsed, or does not provide the expected wrapper/list, render a clear accessible unavailable/error message (for example: “Breed categories are currently unavailable. You can still search by pet name.”). Associate the message with the Category control, and disable or otherwise clearly mark that control unavailable; do not imply that an “All”-only selector means the catalog loaded successfully. Keep the name input enabled and allow name-only searches through the existing dog-search route. The catalog failure must not replace a successful dog listing with a page-wide fatal error.

The exact wording and whether the unavailable select is disabled or represented by another accessible disabled state are design details; the required outcome is clear error communication plus usable name search.

## 4. Same-origin Astro `GET /api/dogs` proxy

### Request and upstream behavior

Method/path: browser `GET /api/dogs` on the Astro origin. The route is not prerendered. It forwards the incoming search string unchanged to `${API_SERVER_URL}/api/dogs`; the API origin is server configuration, defaulting in current source to `http://localhost:5100`. The browser does not call Flask directly.

Example:

```text
Browser: GET https://pets.example/api/dogs?page=1&per_page=6&name=bud&breed=Beagle
Upstream: GET ${API_SERVER_URL}/api/dogs?page=1&per_page=6&name=bud&breed=Beagle
```

### Response and error behavior

- On an upstream response, the current proxy returns the upstream status and response body, setting `Content-Type: application/json`. This includes upstream 400 and other non-OK responses; it does not translate them into successful responses.
- If `fetch` throws, the current proxy returns `502 Bad Gateway`, JSON content type, and `{ "error": "Failed to reach dog service: ..." }`.
- **Target:** retain same-origin routing and upstream status/body pass-through, including Flask's `{ "error": string }` validation response. Browser code must inspect `response.ok`, present an accessible failure/status message, and not render an HTTP or transport failure as an empty successful result. Continue to ignore an intentional `AbortError` from a superseded request.
- The proxy does not define a separate success envelope or `/api/breeds` route. No additional proxy retries, caching, or timeout policy is specified.

The current transport error includes the caught exception text. Whether to redact or standardize that detail is not resolved by the approved requirements; avoid exposing secrets or configuration values in user-visible errors.

## 5. Compatibility, validation, and security

- Preserve the `/api/dogs` success keys, dog-object fields, default page size, pagination range, and `total_pages` minimum. Existing callers that omit filters remain valid.
- Continue accepting both `breed` and `category`; `breed` is canonical for UI-generated search and pagination URLs, while `category` remains an API alias. When both are provided, `breed` takes precedence.
- Keep API filter errors in the established JSON `{ "error": string }` shape with HTTP 400. Unknown Breed and ordinary no-match filters remain HTTP 200 empty results.
- Use standard query encoding (`URLSearchParams` in the browser); decode values once at the HTTP layer and treat them as data. Trim name and Breed values before applying match/length rules. Never interpolate caller values into raw SQL or HTML.
- Target name matching must escape SQL `LIKE` metacharacters so `%` and `_` are literal, while preserving case-insensitive substring semantics. Use parameterized ORM expressions and retain safe text-node/escaped rendering for returned names and breeds.
- The same-origin Astro proxy keeps the upstream origin on the server and avoids direct browser-to-Flask CORS calls. Do not add a caller-controlled upstream URL.
- No auth policy is established for these public listing endpoints. Do not infer access control from this contract.
- Integer query parse fallback behavior is current compatibility behavior: a non-integer `page` falls back to 1 and a non-integer `per_page` falls back to 6, rather than producing a 400. Negative/zero values are clamped as specified.

## 6. Focused verification plan — not execution evidence

These are proposed focused checks mapped to authoritative ACs/decisions. They have not been run as part of this design artifact.

| Coverage | Focused checks |
|---|---|
| API: `GET /api/dogs` — AC-05, AC-06, AC-08; D-02, D-03 | Assert unchanged response keys and dog item fields; defaults/clamping and malformed integer fallback; 100 accepted / 101 rejected for `name`, `breed`, and `category`; trim and partial case-insensitive matching; literal `%` and `_` cases that would differ under wildcard matching; case-insensitive exact Breed match; `breed` precedence over `category`; unknown Breed is `200` with empty list; combined filters are conjunctive; filtered count precedes pagination; `total_pages` recomputed and minimum 1; ascending IDs and repeatable page membership. |
| API: `GET /api/breeds` — AC-02, AC-08 | Assert `200`, exact `{breeds:[{id,name}]}` wrapper/item fields, and name ordering. Failure cases should verify SSR handling rather than assume a specific Flask error body. |
| Astro proxy — AC-08; architecture proxy constraint | Verify query string forwarding/encoding; upstream success and non-OK status/body/content type pass-through; thrown upstream fetch yields 502 `{error: string}` JSON; no accidental conversion of failures into empty success. |
| SSR/UI catalog failure — AC-02; D-04 | Simulate both a non-OK catalog response and a rejected/transport fetch (and, if relevant, malformed JSON). Verify an accessible visible error associated with the unavailable Category control, no misleading successful “All”-only state, dog-list rendering is not suppressed by catalog failure, and the name input can still perform and display a name-only search via the proxy. |
| UI combined filters, URL, pagination, clear — AC-04..AC-07 | Verify category changes request immediately; name/category combine; filters persist in generated URLs and pagination; direct reload restores filter/page state; clear resets both filters and page to the unfiltered first page without document navigation; errors are announced accessibly. |
| End-to-end name timing — AC-03; D-01 | Measure from the final name-input event to the expected result being visibly rendered, not merely request dispatch. Allocate no more than **100 ms** to debounce and the remaining **200 ms** to request/response, JSON parse, and visible DOM render (300 ms total). Use an end-to-end monotonic wall-clock measurement with the local Astro app, Flask API, same-origin proxy, deterministic fixtures, and record browser/runner context. A controlled/fake clock can separately verify debounce restart/dispatch behavior but is not a substitute for the full rendered-result measurement. Assert no full-page reload. No result or pass claim is made here. |

## 7. Round 2 design-review conditions and unresolved unknowns

Round 2 is **Approved With Conditions** and permits this stage to proceed. It is not implementation approval, test sign-off, or production approval.

Conditions carried forward:

1. Downstream implementation must honor D-01..D-04: 100 ms debounce plus 200 ms remaining end-to-end rendering budget; ascending `Dog.id` ordering before pagination; 100-character limits and literal `%`/`_`; accessible catalog failure while name search stays usable.
2. Add and execute the focused timing and failure-path tests, plus API/UI evidence for the other mapped criteria, before claiming the ACs are complete. Source inspection alone is insufficient.
3. Production deployment and secret-management evidence remains a release gate, not an API Design blocker. The approved architecture records production topology, configuration, persistence/backup, health checks, and related operational evidence as **Not Found**.
4. The review's medium findings M-01..M-03 remain implementation/validation risks; M-04 is the later production release gate. The low observability/traceability gap is not resolved by this API contract.

Unresolved / **Not Found** (not silently decided here):

- Exact user-facing wording for search errors, loading state, and empty states beyond the accessible catalog-unavailable message outcome.
- Whether literal length limits count Unicode code points, grapheme clusters, or another unit; the existing Python implementation uses string length.
- Named requirements approver/product-owner role and the required destination for AC-08 feature documentation.
- Production availability, latency outside AC-03, load/concurrency, database consistency under concurrent writes, browser support, localization, accessibility conformance level, and observability requirements.
- Whether proxy transport errors should expose sanitized detail or a standardized error message; current code includes exception text.
- No new `/api/breeds` proxy, API versioning scheme, retry behavior, or caching policy is required or established.

These unknowns do not change Jira AC-01..AC-08 or D-01..D-04 and should be resolved only through the appropriate later approval/release gate.
