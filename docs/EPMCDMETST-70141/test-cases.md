# Test Design — EPMCDMETST-70141

## Scope and status

This pre-development test design is based on the approved `requirements.md`,
`architecture.md`, `design-review.md`, `api-design.md`, and
`implementation-plan.md`. It defines planned checks; it does not report test
execution or implementation validation.

The approved breed-filter contract uses integer `breed_id`. The accepted
Design Review conditions are explicitly covered:

- **DR-01:** the visible unfiltered dropdown option is exactly **“All Breeds”**.
- **DR-02:** selecting a new breed clears stale `breed` and `category`
  parameters, resets to page 1, and preserves unrelated filters such as `name`.

The JavaScript file under `tests/EPMCDMETST-70141/` is a planning skeleton, not
an implemented test suite. Repository evidence identifies backend unittest
tests and Playwright E2E tests (`app/server/test_app.py`,
`app/client/e2e-tests/`, and `app/client/playwright.config.ts`). The configured
Playwright `testDir` is `app/client/e2e-tests`; package scripts expose
Playwright commands. No Jest/Vitest configuration or root JavaScript test
script was found. Therefore `tests/EPMCDMETST-70141/tasks.test.js` is not part
of an existing configured test runner.

## Test cases

| Test ID | Test Level / Type | Scenario | Expected Result | Requirement Mapping |
|---|---|---|---|---|
| TC-API-001 | Unit / positive | Request `GET /api/breeds` with multiple breeds in the fixture. | A successful response contains integer `id` and string `name` for each breed, ordered by ascending breed name. | AC-01; FR-01 |
| TC-API-002 | Unit / positive | Request `GET /api/dogs?breed_id=<known-id>` when the fixture has matching and nonmatching dogs. | Every returned dog matches the selected breed ID; no nonmatching dog is returned. | AC-03; FR-02 |
| TC-API-003 | Unit / positive | Request a breed-filtered result set spanning multiple pages, with a known page size. | `total` equals the count after the breed filter, and `total_pages` is calculated from that filtered count and effective page size. | AC-03; FR-03 |
| TC-API-004 | Unit / negative | Supply a malformed `breed_id` (for example `husky`, `1.5`, or an empty value). | The API returns HTTP 400 with a JSON error indicating that `breed_id` must be an integer; it does not silently treat the malformed value as an unfiltered request. | AC-03; FR-02; API Design error contract |
| TC-API-005 | Unit / edge | Supply a well-formed but unknown `breed_id` or a valid ID with no matching dogs. | The API returns HTTP 200, `dogs: []`, `total: 0`, and `total_pages: 1`. | AC-03, AC-05; FR-03, FR-07 |
| TC-API-006 | Unit / positive regression | Request `GET /api/dogs` without `breed_id`. | The normal unfiltered listing remains available and totals/pagination describe that unfiltered result set. | AC-06; FR-09 |
| TC-API-007 | Unit / edge | Request `GET /api/breeds` when the data source contains no breeds. | The endpoint returns a successful response with `breeds: []`; it does not fail because the collection is empty. | AC-01; FR-01; API Design response contract |
| TC-API-008 | Unit / edge | Supply page values below 1 and `per_page` values outside the documented 1–100 range. | Page is normalized to 1; page size is normalized to the documented range, and response totals correspond to the effective values. | AC-03; API Design pagination contract |
| TC-API-009 | Unit / edge | Supply an integer `breed_id` outside signed 64-bit range. | The API follows the approved API Design behavior: HTTP 200 with an empty result, `total: 0`, and `total_pages: 1`. | AC-03, AC-05; API Design error/empty-result contract |
| TC-UI-001 | E2E / positive | Load the homepage with the breed list available and inspect the dropdown and its options. | The unfiltered option's exact visible text is **“All Breeds”**; each available breed is represented using the returned breed list. | AC-01; FR-04; DR-01 |
| TC-UI-002 | E2E / positive | Select a breed from the homepage dropdown and observe the URL and listing interaction. | The URL contains that integer `breed_id`; displayed results update for the selection without a manual full-page reload. | AC-02; FR-05; NFR-01 |
| TC-UI-003 | E2E / positive | Navigate to a later page, then select a different breed. | The new request and URL use page 1 for the newly selected breed; the resulting listing reflects that selection. | AC-04; FR-06 |
| TC-UI-004 | E2E / positive | Select a breed with multiple result pages and navigate to another page. | The pagination URL and request retain the selected `breed_id`; results remain constrained to that breed. | AC-04; FR-06 |
| TC-UI-005 | E2E / positive, DR condition | Open a URL containing stale `breed` and `category` parameters plus an unrelated `name` filter; select a different dropdown breed. | The new selection request/URL omits both stale parameters, retains `name`, contains the selected `breed_id`, and requests page 1. Results are not narrowed by the stale aliases. | AC-04; FR-05, FR-06; DR-02 |
| TC-UI-006 | E2E / negative-result presentation | Select a breed/filter combination that returns no dogs. | The page displays the approved empty state. Pagination is either hidden or limited to one page; do not require both alternatives. | AC-05; FR-07 |
| TC-UI-007 | E2E / positive regression | Select a breed, then choose **“All Breeds”**. | The breed filter is removed from the URL/request and the normal unfiltered listing remains available, including its pagination when the fixture has multiple pages. | AC-06; FR-09; DR-01 |
| TC-UI-008 | E2E / edge | Change page or breed, then use browser back and forward navigation. | The URL state is restored and the listing reflects the restored page and filters, without losing the selected breed when it remains active. | AC-02, AC-04; FR-05, FR-06 |
| TC-INT-001 | Integration / positive | Send a browser listing request through the Astro same-origin `/api/dogs` route with `breed_id` and `name`. | The proxy forwards the query to Flask and preserves the upstream response status/body; API results reflect both retained filters. | AC-02, AC-03; architecture/API proxy contract |
| TC-INT-002 | Integration / positive | Server-render the homepage for a URL with `breed_id` and verify the fetched breed options and dog results. | The selected breed is represented in the control and rendered dog results/totals agree with the Flask API response. | AC-01, AC-02, AC-03; FR-01, FR-04, FR-05 |
| TC-DOC-001 | Delivery / acceptance traceability | Review the delivered documentation and implemented automated test changes against the approved feature behavior. | Relevant API/homepage documentation describes `breed_id`; implemented automated tests cover the delivered behavior and explicitly assert AC-01–AC-06 and the approved DR conditions. The test-design skeleton alone is not counted as an implemented automated test. | AC-07; FR-08 |
| TC-UI-009 | E2E / negative-result presentation | Load the homepage with an unknown integer `breed_id` (for example `99999`). | The page displays the approved empty state and pagination is hidden or limited to one page. | AC-05; FR-07 |

## Supplementary review condition

- **SRC-CR-01 (CR-01):** With JavaScript disabled, use the native form submit
  after selecting a new breed on a URL containing stale `breed` and `category`
  aliases. The submitted URL retains `name` and the selected `breed_id`, but
  omits both legacy aliases. This is a supplementary Code Review regression
  condition; it does not change the approved core contract or direct legacy
  API/URL compatibility.

## Acceptance-criteria coverage

| Acceptance Criterion | Explicit planned coverage |
|---|---|
| **AC-01** — Dropdown includes “All Breeds” and API breeds; API returns IDs/names sorted by name. | TC-API-001 verifies response fields/order; TC-API-007 covers an empty breed collection; TC-UI-001 verifies API-backed options and exact visible text; TC-INT-002 verifies the server-rendered integration. DR-01 is asserted by exact text in TC-UI-001 and TC-UI-007. |
| **AC-02** — Selecting a breed updates URL with `breed_id` and refreshes listing without manual full-page reload. | TC-UI-002 directly verifies URL and no-reload behavior; TC-UI-008 covers history restoration; TC-INT-001 and TC-INT-002 cover proxy/server-rendered paths. |
| **AC-03** — API filters dogs by breed; `total`/`total_pages` describe filtered results. | TC-API-002 checks matching rows; TC-API-003 checks filtered totals and pages; TC-API-004 checks malformed input; TC-API-005 and TC-API-009 cover empty/unknown IDs; TC-API-008 checks normalized pagination; TC-INT-001/002 verify integration. |
| **AC-04** — Pagination retains breed; changing breed resets to page 1. | TC-UI-003 verifies page reset; TC-UI-004 verifies pagination preservation; TC-UI-005 explicitly verifies DR-02 stale alias clearing while retaining `name`; TC-UI-008 covers browser history. |
| **AC-05** — No-match filter shows empty state; pagination is hidden or limited to one page. | TC-API-005/009 verify API empty-result contract; TC-UI-006 verifies the empty state and either allowed pagination outcome; TC-UI-009 verifies the breed-filtered empty state for an unknown integer ID and hidden pagination or one page. |
| **AC-06** — “All Breeds” preserves the normal unfiltered listing. | TC-API-006 verifies the unfiltered API path; TC-UI-007 verifies choosing “All Breeds” clears the filter and restores listing/pagination. |
| **AC-07** — Relevant documentation and automated tests cover delivered behavior. | TC-DOC-001 is the delivery review check. Its pass condition requires relevant docs and implemented automated coverage; this design document and the JavaScript planning skeleton alone do not satisfy that delivery condition. |

## Planned test placement and execution boundary

- Backend unit/API checks: extend the existing `app/server/test_app.py` patterns
  during the authorized implementation and testing phases.
- Browser integration and E2E checks: extend the configured Playwright tests
  under `app/client/e2e-tests/`, using the existing Chromium project and
  isolated test-server setup.
- `tests/EPMCDMETST-70141/tasks.test.js` is a planning-only skeleton. The
  repository's Playwright configuration points to `app/client/e2e-tests/`, and
  no configured Jest/Vitest runner was found for this skeleton. Do not treat
  it as runnable, passing, or as a substitute for the backend/Playwright tests.
- No tests were run for this Test Design phase.
