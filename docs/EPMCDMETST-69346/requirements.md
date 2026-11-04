# Requirements — Instant Pet Search by Name and Category/Breed

## Status, Authority, and Scope

- **Jira:** EPMCDMETST-69346
- **Title:** Add instant search to Pets Workshop pet listing (Name + Category/Breed)
- **Requirements status:** **Approved by the user** at the revised requirements gate on 2026-11-02; this does not authorize implementation.
- **Approval authority:** The user approved this artifact at the workflow gate; a named product-owner role is **Not Found** in the story or repository evidence.
- **Source of requirements:** Jira story acceptance criteria AC-01 through AC-08 remain authoritative and are retained verbatim and in order. Supplemental decisions D-01 through D-04 are sourced to the user's explicit response at the design-review gate in this request (2026-11-02). Repository code and tests below document current behavior only and do not narrow or replace that scope.
- **Phase boundary:** Requirements Analysis only. No architecture, implementation plan, code changes, or approval are included.

The story requests homepage search over the dog listing by free-text Pet Name (partial, case-insensitive) and Category mapped to Breed; a 300 ms name-input debounce; results updated without a page reload; combined filters; filter preservation through pagination and URL state; a clear-to-default action; optional `/api/dogs` filters with its existing paginated response; category options from `/api/breeds`; and API/UI tests and documentation.

The eight acceptance criteria below follow the Jira issue retrieved through Jira MCP during intake. The acceptance criteria are mapped in the same order as the Jira story; repository behavior is recorded separately and does not imply that any criterion has passed.

## Business Goal and Stakeholders

- **Goal:** Help visitors quickly find dogs by a partial Pet Name and/or Category (the dog’s Breed) without losing their current search when navigating or sharing/reloading the listing.
- **Primary actor:** Visitor using the homepage dog listing.
- **Related stakeholders:** Product/story owner (confirms intended semantics and approves requirements), shelter operators (depend on accurate dog and breed data), maintainers (preserve the existing API and listing).

## Boundaries

**In scope**

- Homepage dog-list filters for Pet Name and Category/Breed, including the category options sourced from `/api/breeds`.
- 300 ms debounce for name typing, no-full-page-reload result updates, combined filters, filter-aware pagination and URL state, and clearing filters to the default listing.
- Optional filtering on `GET /api/dogs` while retaining its current paginated response contract.
- API/UI verification and feature documentation.

**Out of scope unless the story owner approves a change**

- Changes to dog or breed records, schemas, persistence, unrelated pages/routes, or staff workflows.
- New search modes beyond partial case-insensitive Pet Name and Category mapped to Breed.
- A new API response format or replacement of the existing paginated response.
- Performance, availability, supported-browser, localization, or production-operability targets not stated in the story.

## Story-Derived Requirements

These are requested outcomes, not claims that the current application already satisfies them.

| Stable ID | Requirement |
| --- | --- |
| REQ-F-01 | The homepage shall provide a visible Pet Name search input. A non-empty name query shall match a substring of the dog’s name without case sensitivity. |
| REQ-F-02 | The homepage shall provide a visible Category selector whose values represent dog Breeds. Its available options shall be populated from `GET /api/breeds`; an unfiltered/default option shall be available. |
| REQ-F-03 | While the visitor types a Pet Name, the client shall debounce the search and update results within 300 ms after typing stops, without a full-page reload. A newer keystroke restarts the debounce interval. |
| REQ-F-04 | Selecting a Category shall update results instantly without a full-page reload. |
| REQ-F-05 | Name and Category/Breed filters shall be independently optional and shall combine conjunctively when both are selected. Clearing one filter shall not implicitly remove the other. |
| REQ-F-06 | Pagination shall operate on the filtered result set, and moving between pages shall retain all active filters. The URL shall represent the current filter and page state so the current view can be restored by reloading or sharing that URL. |
| REQ-F-07 | A clear-filters action shall remove all active search filters, return to the default listing (page 1), and synchronize the URL with that default state. |
| REQ-F-08 | `GET /api/dogs` shall accept optional name and Category/Breed filters while preserving its existing paginated response contract. Category shall filter by Breed. The category control shall use `GET /api/breeds`. The change shall include API tests, UI tests, and feature documentation. |

### Non-Functional Requirements

| Stable ID | Requirement |
| --- | --- |
| REQ-N-01 | Preserve compatibility with the current homepage listing and the existing paginated `/api/dogs` response; do not require a new response shape for search. |
| REQ-N-02 | Keep filters in URL query parameters using normal URL encoding; filter text must remain data, not executable markup. |
| REQ-N-03 | Search controls shall remain labeled and usable with standard keyboard interaction. Search-result updates shall not cause a full document navigation. |
| REQ-N-04 | Add automated API and UI verification for the accepted criteria and update applicable feature documentation. Do not claim criteria are verified solely from source-code inspection. |
| REQ-N-05 | No additional latency target beyond the 300 ms interaction criterion in AC-03, availability, concurrency, browser-support, localization, or telemetry target is established by the supplied story. These are **Not Found**, not implied guarantees. |

## Acceptance Criteria and Verification Traceability

Each Jira criterion is represented below as a testable requirement. Verification paths describe evidence to collect; they do not assert that the current suite already proves the criterion.

| Jira AC | Measurable acceptance criterion | Requirement trace | Verification evidence / current coverage |
| --- | --- | --- | --- |
| AC-01 | The homepage includes a visible search input for Pet Name. | REQ-F-01 | UI test verifies the visible, labeled input. |
| AC-02 | The homepage includes a visible Category selector populated from available categories (breeds). | REQ-F-02 | UI/API tests verify the visible selector and its options from `/api/breeds`. |
| AC-03 | Typing into Pet Name updates results within 300 ms after typing stops (debounced), without a full-page reload. | REQ-F-03, REQ-D-01 | UI test uses a controlled clock and asserts the rendered result update completes within 300 ms after typing stops; it also checks that the document does not reload. Existing coverage does not establish the rendered-result timing bound. |
| AC-04 | Selecting a Category updates results instantly without a full-page reload. | REQ-F-04 | UI test verifies selection-triggered results and document continuity. |
| AC-05 | Combined Name and Category filters reflect correct results. | REQ-F-05, REQ-F-08 | API/UI tests verify both predicates are applied together. Existing API and UI suites cover combined-filter behavior in part. |
| AC-06 | Pagination works with filters applied: total pages are recalculated and navigating pages keeps the filters. | REQ-F-06 | API tests validate filtered totals/pages; UI tests exercise multi-page filtered navigation and retained query parameters. Existing pagination coverage does not establish every filtered multi-page case. |
| AC-07 | Clearing the name and resetting Category returns to the default unfiltered list. | REQ-F-07 | UI test verifies both controls clear, the default first page is restored, and URL state is reset. Existing `search.spec.ts` checks control values and list restoration. |
| AC-08 | `/api/dogs` supports optional filter parameters and returns `dogs`, `page`, `per_page`, `total`, and `total_pages` consistent with the current contract. | REQ-F-08, REQ-N-01 | API contract tests verify responses with omitted and supplied filters. Existing `app/server/test_app.py` and `app/client/e2e-tests/api-integration.spec.ts` cover parts of the response/filter behavior. Separate definition-of-done obligations require API/UI tests and updated feature documentation; this requirements artifact alone does not satisfy them. |

## Supplemental Human Decisions

The following decisions supplement Jira AC-01 through AC-08 without changing their wording or order. They are requirements, not architecture choices.

| Decision ID | Decision and source | Stable requirement mapping |
| --- | --- | --- |
| D-01 | Preserve AC-03 as an end-to-end rendered-result deadline: results must be rendered within 300 ms after typing stops, not merely dispatched/requested within that interval. Source: user's response at the design-review gate in this request (2026-11-02). | REQ-D-01 |
| D-02 | Use stable `Dog.id` ascending order for deterministic pagination; do not provide a user-facing sort control. Source: user's response at the design-review gate in this request (2026-11-02). | REQ-D-02 |
| D-03 | Limit name search to 100 characters and treat `%` and `_` as literal characters in substring search. Category/Breed retains its existing 100-character cap. Source: user's response at the design-review gate in this request (2026-11-02). | REQ-D-03 |
| D-04 | If breed-catalog loading fails, show a clear error while keeping name search usable. Source: user's response at the design-review gate in this request (2026-11-02). | REQ-D-04 |

| Stable requirement ID | Requirement |
| --- | --- |
| REQ-D-01 | The name-search interaction shall complete rendering the results within 300 ms after typing stops; request dispatch alone does not satisfy the deadline. |
| REQ-D-02 | Dog results shall use ascending `Dog.id` order so pagination is deterministic. No user-facing sort control shall be provided. |
| REQ-D-03 | Name search shall accept at most 100 characters and treat `%` and `_` as literal characters in substring matching. The Category/Breed filter retains its existing 100-character cap. |
| REQ-D-04 | If breed-catalog loading fails, the visitor shall see a clear catalog error, and name search shall remain usable. |

### Supplemental Decision Verification Traceability

| Decision | Requirement trace | Stable verification ID | Verification evidence to collect |
| --- | --- | --- | --- |
| D-01 | REQ-D-01, REQ-F-03 | VER-D-01 | With a controlled clock and representative delayed search response, assert the rendered result is updated within 300 ms after the final keystroke; also assert no full-page reload. A request-dispatch assertion alone is insufficient. |
| D-02 | REQ-D-02, REQ-F-06 | VER-D-02 | Verify `/api/dogs` results are ordered by ascending dog ID across pages, repeated requests return the same page membership, and no user-facing sort control is present. |
| D-03 | REQ-D-03, REQ-F-01, REQ-F-08 | VER-D-03 | Verify 100-character name and Category/Breed values are accepted, overlong values are rejected, and `%`/`_` match literally in name substring searches (including cases where wildcard semantics would produce different matches). |
| D-04 | REQ-D-04, REQ-F-02 | VER-D-04 | Simulate breed-catalog load failure; verify a clear visible catalog error and that a name-only search can still be entered and returns search results. |

## Verified Repository Behavior (Evidence Only)

Repository evidence is separate from the story requirements. Per `copilot-instructions.md` (“Source Of Truth Priority”), source code and executable tests take precedence over stale prose.

| Evidence | Verified current behavior |
| --- | --- |
| `app/server/app.py`, `get_dogs` | Optional `name`, `breed`, and legacy `category` query values are accepted; `breed` takes precedence over `category`. Name is trimmed and uses `Dog.name.ilike('%…%')`; Breed is matched case-insensitively by equality. Both filters can be applied to the same query. Filter values over 100 characters receive HTTP 400. Page is at least 1; `per_page` is bounded to 1–100 with a default of 6. The JSON includes `dogs`, `page`, `per_page`, `total`, and `total_pages`. |
| `app/server/app.py`, `get_breeds` | `GET /api/breeds` returns `{breeds: [{id, name}]}` ordered by Breed name ascending. |
| `app/client/src/pages/index.astro` | The homepage has a labeled name input and Category select, initializes filters from URL parameters, requests six dogs per page, and supplies both active filters to dog requests. It uses `setTimeout(..., 300)` for name input, requests immediately on category change, aborts the prior search request, updates results/pagination in the page, and uses `history.replaceState` to update the URL. The clear control clears both inputs and requests page 1. Generated links preserve name/category filter values, represented in generated URLs as `name` and `breed`. Breed options are assigned only when the catalog response is successful; the existing page does not show a dedicated catalog error in that case. |
| `app/server/app.py`, `get_dogs` | The filtered dogs query applies offset/limit without an explicit `order_by`, so stable pagination order is not currently established by the query. |
| `app/client/src/components/DogList.astro` and homepage rendering | Existing listing cards display dog names and breeds with dog-detail links; filtered and default empty messages are rendered. |
| `app/server/test_app.py` | Tests cover API response shape, partial-name filter expression, category/breed filters, combined filters, no matches, and breed catalog ordering among other API cases. |
| `app/client/e2e-tests/search.spec.ts` | UI tests cover controls, category options, name/category/combined search, empty state, clearing, some pagination/filter retention, and rapid typing. The pagination-retention case shown tests a name filter and does not establish filtered multi-page Category + name URL restoration. |
| `app/client/e2e-tests/api-integration.spec.ts` | Tests exercise name/category filters, combined filters, catalog order, `breed` parameter, unknown Breed, and overlong-name rejection. |

These observations are point-in-time evidence from repository inspection, not proof that all Jira criteria pass. Requirements analysis did not run tests or modify the application.

## Contradictions and Stale Sources

- The existing root `docs/requirements.md` is for a breed-only story. It frames “search” as a catalog selector with exact Breed matching and explicitly asks whether free-text/partial search is wanted. That conflicts with this Jira story’s required partial, case-insensitive Pet Name search. It is not approved for this story and is left unchanged.
- The existing root `docs/architecture.md` is likewise for the breed-only scope and explicitly excludes free-text/partial search. It is proposed, not approved, and is left unchanged.
- `docs/design-review.md` records a rejected review of that breed-only architecture. It is not approval of the present Jira requirements and is left unchanged.
- Confluence MCP search and retrieval returned five Jira-linked pages. They include stale statements that Jira access failed and older breed-only or proposed behavior; they are supplementary context and do not override the retrieved Jira story. No approved Confluence page with additional product constraints or formal approval authority was identified.
- Current implementation already contains several requested behaviors. This is not a contradiction in the acceptance scope and does not justify reducing the story to a Breed-only change.

## Assumptions, Risks, and Open Questions

### Assumptions (pending confirmation)

1. “Category” means the dog’s Breed, and the available categories are the names returned by `/api/breeds`.
2. Name matching is substring matching after trimming surrounding whitespace, consistent with current API behavior; empty/whitespace-only input means no name restriction.
3. Combined filters mean intersection (a dog must satisfy both name and Breed).
4. “Preserve through URL” includes both direct reload/restoration and pagination links, not just displaying query parameters.
5. Existing API pagination fields and page-size behavior should remain compatible; the homepage currently requests six items per page.

### Risks

| Risk | Impact | Disposition |
| --- | --- | --- |
| Stale root docs describe a narrower, exact-Breed-only feature. | Downstream design or tests could omit required name search. | Keep this Jira-specific specification authoritative for its scope; do not silently overwrite existing artifacts. |
| Existing suite does not prove the end-to-end 300 ms rendered-result deadline or full filtered pagination/reload restoration. | A feature could appear to work while missing timing or state requirements. | Require targeted UI/API verification before marking the relevant ACs complete. |
| The current `/api/dogs` query has no explicit result ordering before offset/limit pagination. | Page membership may not be deterministic. | D-02 resolves the required behavior: use ascending `Dog.id`; verify ordering and page stability under REQ-D-02 / VER-D-02. |
| Existing `ilike` search uses caller text in a pattern, and current evidence does not establish literal `%`/`_` matching. | User-entered wildcard characters may not behave as literal substring characters. | D-03 resolves the intended behavior; verify literal matching under REQ-D-03 / VER-D-03. |

### Open Questions

1. Is there a required result-count display, empty-state wording, or loading/error copy beyond the clear breed-catalog error in D-04? None is specified in the story summary available here.
2. Who is the requirements approver, and which user-facing/technical documentation location must be updated for AC-08?
3. Are any latency, accessibility conformance, browser-support, localization, or operational targets required beyond the measurable interactions stated above?

### Missing Evidence

Status: Not Found

Notes: No local intake summary or retrieved Confluence page was available as evidence for additional product constraints or approval authority.

Evidence: Not Found

## Dependencies and Handoff

- `/api/breeds` must provide the category options and `/api/dogs` must remain available with its existing paginated contract.
- Dog names and Breed associations must be present in the existing application data for meaningful results.
- Product owner clarification remains needed for the unrelated open questions above; the name-length/wildcard behavior, deterministic ordering, end-to-end timing interpretation, and breed-catalog failure behavior are resolved by D-01 through D-04.
- Requirements are approved with D-01 through D-04. Subsequent architecture, design review, planning, implementation, review, testing, and release gates remain required.
