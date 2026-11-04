# Architecture — Instant Pet Search by Name and Category/Breed

## Status and authority

- **Architecture status:** Approved by the user at the revised architecture gate on 2026-11-02. This approval does not authorize API Design, implementation, or testing.
- **Business source of truth:** Jira story `EPMCDMETST-69346`.
- **Requirements input:** Jira AC-01 through AC-08 remain authoritative and unchanged. The supplemental user-approved decisions REQ-D-01 through REQ-D-04 in `docs/EPMCDMETST-69346/requirements.md` are also binding for this revision.
- **Scope boundary:** The Jira-specific requirements and their REQ/AC identifiers govern this document. The root `docs/architecture.md` and `docs/design-review.md` concern the rejected/stale breed-only scope and are not design authority here.
- **Evidence boundary:** Source and test files below establish current behavior, not acceptance-criteria completion. No tests or builds were run for this architecture stage.
- **Artifact-status note:** Requirements were re-approved by the user on 2026-11-02; `docs/EPMCDMETST-69346/requirements.md` records that approval.

## 1. Context and architecture summary

The requested capability is a browser-based filter over the existing dog listing: partial, case-insensitive Pet Name plus exact Category/Breed, combined with pagination and URL-restorable state. The existing Flask/SQLAlchemy API, SQLite storage, Astro server-rendered page, and Playwright test stack can support the scope without a new service or persistence model.

**The feature appears substantially implemented in the inspected source.** The homepage already renders search controls and breed options, the Flask endpoint already accepts name and breed/category filters and returns the paginated response, and the browser-side code already debounces, cancels superseded requests, updates the list without a document reload, and preserves filters in generated page URLs. This is source evidence only: it does not establish that ACs pass, and the test suite was not executed.

### Current versus proposed target

| Area | Current, evidenced implementation | Target architecture for this story |
| --- | --- | --- |
| UI / initial page | Astro SSR at `app/client/src/pages/index.astro` reads `page`, `name`, and `breed`/`category` from the incoming URL, then fetches initial dog and breed data from Flask. `DogList.astro` renders the initial cards. | Retain SSR for first paint and URL restoration. Keep labeled Name and Category controls, use `/api/breeds` as the category source, and keep the existing listing/detail navigation. |
| Interactive requests | The homepage script calls the same-origin `/api/dogs`; it does not call Flask directly from the browser. `app/client/src/pages/api/dogs.ts` forwards the query to Flask. | Retain the same-origin Astro proxy boundary for browser search. Filter/page updates use the existing Flask endpoint and response contract. |
| API / data | Flask `get_dogs` filters the joined Dog/Breed query, counts the filtered query, applies offset/limit, and returns `dogs`, `page`, `per_page`, `total`, `total_pages`. `/api/breeds` returns ordered breed IDs/names. | Preserve those endpoints and the response shape. Keep filters optional and conjunctive; reset to page 1 when filters change; paginate the filtered result set. |
| URL / interaction | The page uses a 300 ms name-input timer, immediate category-change requests, `AbortController`, in-place rendering, and `history.replaceState`. Pagination links carry active filters. | Keep URL restoration and in-place updates. For AC-03, target a 100 ms debounce and complete request, response parsing, and visible result rendering within the remaining 200 ms; §5 defines the end-to-end validation environment. This is a target, not an achieved result. |
| Persistence | Flask-SQLAlchemy uses SQLite; `DATABASE_PATH` selects the file and defaults to `app/server/dogshelter.db`. | Reuse current storage; no schema or data migration is required by the approved requirements. Deployment persistence and migration policy are not evidenced (see §8). |

## 2. Components and responsibilities

| Component | Responsibility / boundary | Evidence |
| --- | --- | --- |
| Browser homepage | Displays the filter controls, list, status, empty state, and pagination; sends same-origin asynchronous search requests; renders text safely; updates URL state. | `app/client/src/pages/index.astro` (SSR setup and inline script); `app/client/src/components/DogList.astro` |
| Astro homepage SSR | Parses URL state and fetches initial page and breed catalog from the configured Flask origin before rendering. | `app/client/src/pages/index.astro`, `API_SERVER_URL`, SSR `Promise.all` |
| Astro `GET /api/dogs` route | Forwards the request query to Flask `/api/dogs`; returns upstream status/body as JSON, or 502 on fetch failure. | `app/client/src/pages/api/dogs.ts`, exported `GET` |
| Flask API | Applies validated optional filters and pagination; returns the dog and breed catalog contracts. | `app/server/app.py`, `get_dogs`, `get_breeds` |
| ORM / SQLite | Stores Dogs and Breeds; Dog references Breed through `breed_id`. | `app/server/models/dog.py`, `app/server/models/breed.py`, `app/server/models/__init__.py` |
| Verification | Flask unit tests mock ORM query behavior; Playwright tests exercise the UI and direct API integration. | `app/server/test_app.py`; `app/client/e2e-tests/search.spec.ts`, `api-integration.spec.ts`, `homepage.spec.ts`; `app/client/playwright.config.ts` |

No separate search index, cache, asynchronous job, or new service is evidenced or required by the story.

## 3. Request and data flow

```mermaid
sequenceDiagram
    actor Visitor
    participant Browser as Browser / Astro page
    participant SSR as Astro SSR
    participant Proxy as Astro GET /api/dogs
    participant Flask as Flask API
    participant ORM as SQLAlchemy / SQLite

    Visitor->>Browser: Open homepage with optional page/name/breed query
    Browser->>SSR: GET /
    SSR->>Flask: GET /api/dogs?page=&per_page=6[&name=&breed=]
    SSR->>Flask: GET /api/breeds
    Flask->>ORM: Query dogs + joined breed / ordered breed catalog
    ORM-->>Flask: Filtered page, count, catalog
    Flask-->>SSR: JSON contracts
    SSR-->>Browser: HTML with controls, options, dogs, pagination
    Visitor->>Browser: Type name / select category
    Browser->>Proxy: GET /api/dogs?page=&per_page=6[&name=&breed=]
    Proxy->>Flask: GET /api/dogs plus forwarded query
    Flask->>ORM: Filter, count, offset, limit
    ORM-->>Flask: Dogs and filtered totals
    Flask-->>Proxy: JSON response
    Proxy-->>Browser: Upstream status and JSON body
    Browser->>Browser: Render results/pagination; replace URL state
```

**Boundary distinction:** Initial data and the breed catalog are fetched by Astro SSR directly from Flask using `API_SERVER_URL`. Interactive browser dog-search requests use the same-origin Astro `/api/dogs` proxy. There is no Astro `/api/breeds` route in the inspected `app/client/src/pages/api` tree; the browser receives breed options in server-rendered HTML rather than fetching that catalog itself. Direct Flask calls in `app/client/e2e-tests/api-integration.spec.ts` are test requests, not the interactive page flow.

## 4. API and UI contracts

### Flask contracts (current implementation and target constraints)

| Endpoint | Contract |
| --- | --- |
| `GET /api/dogs` | Current endpoint accepts optional `page` (defaults to 1 and is clamped to at least 1), `per_page` (defaults to 6 and is clamped to 1–100), `name`, `breed`, and `category`. Target name matching is trimmed, partial, case-insensitive, and literal for `%` and `_`; the current `ilike` expression must be changed to escape those characters. Category/Breed remains an exact, case-insensitive name match; `breed` takes precedence over `category` if both are supplied. Name and Category/Breed values are each limited to 100 characters; over-limit values return 400. An unknown Breed returns an empty result set. Target dog results are ordered by ascending `Dog.id` before offset/limit pagination. |
| `GET /api/dogs` response | JSON keys are `dogs`, `page`, `per_page`, `total`, and `total_pages`. Each dog item currently contains `id`, `name`, and `breed`. The total and page count derive from the filtered query; zero results still report at least one total page. |
| `GET /api/breeds` | JSON `{ "breeds": [{ "id": number, "name": string }] }`, ordered by Breed name ascending. If the fetch returns non-OK or throws, SSR must render a clear accessible catalog error (for example, “Breed categories are currently unavailable. You can still search by pet name.”) and mark the Category selector unavailable/disabled with the error associated accessibly; it must not present “All” alone as successful catalog loading. Name-only search remains available. |
| Astro `GET /api/dogs` | Same-origin GET proxy forwards the query string to `${API_SERVER_URL}/api/dogs`, passes through upstream status/body, and returns 502 if upstream fetch throws. It does not define a separate response schema. |

Evidence: `app/server/app.py` (`get_dogs`, `get_breeds`, `MAX_FILTER_LENGTH`); `app/client/src/pages/api/dogs.ts` (`GET`).

### UI state and interaction contract

- The homepage renders a labeled Pet Name input and Category select with an “All” option; options come from SSR's `/api/breeds` response.
- Incoming URL state is read from `page`, `name`, and `breed` or `category`. The current page size is six. Generated filter/pagination URLs use `name` and `breed`.
- Name input uses a 100 ms debounce; category changes request immediately. Both reset to page 1. A newer search aborts the prior in-flight request when the new request starts. The 100 ms is a budget allocation, not permission to relax the Jira 300 ms end-to-end rendered-result deadline.
- Browser search fetches `/api/dogs` with `URLSearchParams`, then replaces list/empty state and pagination in place and updates the address via `history.replaceState`; it does not submit a full document navigation for these interactions.
- Pagination links preserve active name and breed values. Clear filters clears both controls and requests the unfiltered first page.
- `DogList.astro` and the inline renderer expose dog cards and links to `/dog/{id}`. The inline renderer uses a text-node-based `escapeHtml` helper for dog names, breeds, and empty-state copy.

Evidence: `app/client/src/pages/index.astro`; `app/client/src/components/DogList.astro`.

### Target constraints

No new HTTP service or response envelope is proposed. The exact public API design and any contract changes remain subject to the later Design Review/API Design gates. Keep category semantics mapped to Breed as specified in REQ-F-02/08; do not introduce fuzzy matching, multi-select, or sorting enhancements.

## 5. Requirement and acceptance traceability

| Requirement / Jira AC | Architecture element | Current source evidence / gap (not a pass claim) |
| --- | --- | --- |
| REQ-F-01 / AC-01 — visible Pet Name search | Astro homepage form and name-input event handler | Input and label exist in `index.astro`; UI visibility test exists in `search.spec.ts`. Test not run. |
| REQ-F-02 / AC-02 — Category from breed catalog | SSR `GET /api/breeds` fetch and select options | SSR fetch and options exist in `index.astro`; API catalog contract is in `app.py`; tests exist in `test_app.py` and `search.spec.ts`. No client-side breed proxy is evidenced or needed for this flow. Test not run. |
| REQ-F-03, REQ-D-01 / AC-03 — debounced name filter, no reload, results visibly rendered within 300 ms | Browser debounce + same-origin Astro proxy + Flask filter + DOM update | Current `index.astro` waits 300 ms before dispatch, so current source does not establish the end-to-end target. Required budget and verification environment are specified below. `search.spec.ts` has no exact timing assertion. No test run or AC completion is claimed. |
| REQ-F-04 / AC-04 — immediate category filter, no reload | Category change handler + proxy + exact Breed filter | Handler calls `fetchAndRender(1)`; UI/API cases exist. Test not run. |
| REQ-F-05 / AC-05 — conjunctive combined filters | Flask query applies both name and Breed predicates; UI submits both | `app.py` applies both conditionally; tests cover combined filters in `test_app.py`, `search.spec.ts`, and `api-integration.spec.ts`. Test not run. |
| REQ-F-06, REQ-D-02 / AC-06 — filtered pagination and URL restoration | Filtered count/page response ordered by ascending `Dog.id`; filter-preserving links and SSR URL parsing | Current `get_dogs` has no explicit order. Require stable `Dog.id` ascending order before offset/limit. Existing `search.spec.ts` checks a name-filter pagination link but not stable combined-filter multi-page membership or reload restoration. Test not run. |
| REQ-F-07 / AC-07 — clear to unfiltered default | Clear handler resets both controls and requests page 1 | Implementation and a clear/list-restoration test exist in `index.astro` and `search.spec.ts`; URL-default assertion is not established by that test. Test not run. |
| REQ-F-08, REQ-N-01, REQ-D-03 / AC-08 — optional API filters, limits, literal matching, compatible response | Existing Flask endpoint and same-origin proxy | Existing response keys and 100-character API caps are present, but current name `ilike` pattern does not establish literal `%`/`_` behavior. Required API/UI edge tests are listed below. No test/build execution in this stage. Feature-documentation/DoD completion is not inferred from source inspection. |
| REQ-F-02, REQ-D-04 / AC-02 — breed catalog and usable fallback | SSR `/api/breeds` fetch, accessible error state, disabled/unavailable Category control; independent name-search path | Current SSR silently leaves only “All” for non-OK catalog responses and a thrown request enters the shared catch. Require visible catalog failure for both cases and keep name search usable. No such failure-path test is established. |
| REQ-N-02, REQ-D-03 — encoded URL state / data not markup | `URLSearchParams`, escaped display, literal `LIKE` matching | `index.astro` uses `URLSearchParams` and escaped rendering. The approved semantics require escaping `%` and `_` as literal search characters; this is a search correctness requirement, not an injection claim. |
| REQ-N-03 — labeled keyboard-usable controls, no document navigation | Native labeled `<input>` / `<select>` and fetch handler | Markup and event handling exist in `index.astro`; no accessibility-conformance test was run. |
| REQ-N-04 — automated API/UI verification and documentation | Existing unit/e2e suites; future verification gate | Test files exist; they were not run here. Required feature documentation and complete AC coverage must be verified by subsequent workflow stages. |
| REQ-N-05 — no invented non-functional targets | Architecture limits guarantees to specified behavior | Availability, concurrency, browser support, localization, telemetry, and other latency targets are Not Found; see §8. |

### Re-approved decisions and validation map

These are binding architecture constraints from the supplemental decisions; they do not amend Jira AC-01 through AC-08. The tests below are required evidence to collect, not claims that tests exist, pass, or that an AC is complete.

| Decision / mapping | Target architecture choice | Required verification and current evidence |
|---|---|---|
| D-01 / REQ-D-01 / REQ-F-03 / AC-03 | Reserve at most 100 ms after the final name keystroke for debounce. The subsequent request, response transfer, JSON parsing, and visible result/list update together must fit within the remaining 200 ms. Measure from the final input event to the expected result being visibly rendered; dispatch alone is insufficient. | Add a Playwright end-to-end timing test using Chromium with the local Astro app and Flask API running through the same-origin `/api/dogs` proxy, and the deterministic test database/fixtures. Use a monotonic wall-clock for the full 300 ms and verify the actual rendered result; a controlled/fake clock may separately verify the 100 ms debounce and reset behavior but must not replace the end-to-end measurement. Record the CI runner/browser and test fixture context with results. This is a validation target, not a measured result or production latency guarantee. Existing `app/client/e2e-tests/search.spec.ts` tests results/continuity but not this budget; no timing test has been run here. |
| D-02 / REQ-D-02 / REQ-F-06 / AC-06 | Apply ascending `Dog.id` order to the filtered query before offset/limit pagination. Do not expose a user-facing sort control. | Extend `app/server/test_app.py` and `app/client/e2e-tests/api-integration.spec.ts` to assert ascending IDs and repeatable page membership across multiple pages. Extend `app/client/e2e-tests/search.spec.ts` to exercise a combined-filter result set spanning pages, retained filters, and direct reload/restoration. Existing API query has no `order_by`; tests do not establish this contract. |
| D-03 / REQ-D-03 / REQ-F-01 / REQ-F-08 / AC-01, AC-05, AC-08 | Accept at most 100 characters for name and Category/Breed. Keep the existing 100-character Category/Breed cap. Treat `%` and `_` as literal characters in case-insensitive name substring searches by escaping SQL `LIKE` metacharacters. | Extend `app/server/test_app.py` and `app/client/e2e-tests/api-integration.spec.ts` for exactly 100 accepted / 101 rejected in both filters and `%`/`_` literal matches that differ from wildcard matches. Extend `search.spec.ts` for UI max-length/validation and feedback. Existing code caps both API parameters at 100, but `Dog.name.ilike(f'%{name}%')` does not establish literal semantics; existing UI/API overlong-name cases cover only part of the decision. |
| D-04 / REQ-D-04 / REQ-F-02 / AC-02 | For either a non-OK response or thrown `/api/breeds` fetch, render a clear accessible catalog error (e.g. “Breed categories are currently unavailable. You can still search by pet name.”); disable or clearly mark Category unavailable and never silently imply the lone “All” option is a successfully loaded catalog. Keep the name input and dog-search path independently usable. | Add Playwright SSR failure-path cases for non-OK and rejected catalog fetches. Assert an accessible visible error associated with the unavailable control, usable name input, and successful name-only results; verify the page remains renderable. Existing `search.spec.ts` covers normal catalog options only; no failure test is established. |

## 6. Security, reliability, performance, maintainability, observability

### Security and privacy

- Browser search uses a same-origin route, avoiding a direct browser-to-Flask cross-origin dependency. The Astro route forwards only the GET query to the configured API origin.
- Filter values are encoded as URL query data with `URLSearchParams`; Flask builds ORM query expressions rather than interpolating raw SQL. The current `ilike('%{name}%')` pattern means `%` and `_` may retain SQL `LIKE` wildcard semantics; the approved target is literal matching per REQ-D-03.
- Target name matching escapes SQL `LIKE` metacharacters so `%` and `_` are literal user input, as required by REQ-D-03. Continue using ORM expressions and escaped/text-node rendering; do not treat filter text as executable markup.
- Dynamic dog names, Breed names, and status text are rendered through text nodes/escaped HTML in the interactive renderer. Keep API values as data and do not insert unescaped HTML.
- No authentication/authorization requirement or route-specific enforcement is evidenced for these listing endpoints. Do not assume externally enforced access controls from this repository evidence.
- The architecture agent instructions reference a secret-management plan at `docs/secret-management-plan.md`; that file was not found. No credentials are needed in this feature design; deployment secret handling is not established here.

### Reliability

- The proxy maps thrown upstream fetch failures to 502. Browser code aborts a previous request when the next search starts and ignores `AbortError`; non-success responses show status text.
- Initial SSR currently uses `Promise.all` for dogs and breeds. The target handles catalog failure independently from dog loading: a non-OK or thrown `/api/breeds` fetch produces an accessible error associated with an unavailable/disabled Category control, while the name input and dog-search path remain usable. It must not report a successful all-only catalog.
- The API computes count and page rows as separate query operations. Concurrent database changes between these reads are not addressed by the current contract; the result query must nevertheless order by ascending `Dog.id` before offset/limit pagination (REQ-D-02).

### Performance and scalability

- Jira AC-03 and REQ-D-01 require rendered results within 300 ms after typing stops. The target reserves 100 ms for debounce and the remaining 200 ms for request, response parsing, and visible rendering. Validate on the Playwright Chromium/local Astro + Flask/test-database setup described in §5, using wall-clock time from final input to visible expected result. The current 300 ms timer delays dispatch for the entire deadline; this target has not been measured or achieved, and the local test environment does not establish a production latency guarantee.
- Each search performs a filtered count plus a paginated query; category catalog data is fetched on SSR page requests. The current SQLite/file-backed design and leading-wildcard substring match may limit scaling for large datasets. No data-volume, concurrency, response-time, index, caching, or production-load target is evidenced.
- Do not add a search service, full-text index, caching, or fuzzy matching absent approved requirements.

### Maintainability and observability

- Keep UI state/URL handling in the homepage and API filtering in Flask; the proxy remains a small transport boundary. Preserve the existing response shape and trace changes to the IDs in §5.
- No metrics, tracing, structured application logging, alerting, or retention policy for this flow is evidenced. Observability requirements are Not Found rather than assumed.

## 7. Alternatives and architecture decisions

| Decision / alternative | Disposition | Rationale and status |
| --- | --- | --- |
| Preserve Flask + SQLAlchemy + SQLite and Astro SSR stack vs. introduce a search service/index | **Proposed: preserve existing stack.** | Current source already supports the filters and story scope does not require full-text search or a new storage model. Pending human approval. |
| Browser calls Flask directly vs. same-origin Astro proxy | **Proposed: retain same-origin `/api/dogs` proxy.** | This matches current interactive flow, avoids a browser CORS dependency, and keeps API origin configuration server-side. Initial SSR remains a direct server-to-server fetch. |
| Add an Astro `/api/breeds` proxy vs. retain SSR breed fetch | **Proposed: retain SSR breed fetch.** | The current select is rendered with catalog data from Flask at page render; the requirements require the catalog source, not a separate browser route. Add a proxy only if a later approved runtime need requires client-side catalog refresh. |
| Use the existing paginated JSON contract vs. introduce a search-specific response | **Proposed: preserve contract.** | Required by REQ-N-01 and AC-08; no new response envelope is justified. |
| Use the separate category query name vs. canonical `breed` query | **Current behavior: accept both at Flask; UI-generated URLs use `breed`.** | Requirements allow Category/Breed terminology, and current API documents the alias and precedence. Confirm canonical URL naming if external consumers depend on it. |
| Apply pagination without an explicit order vs. stable result ordering | **Target: ascending `Dog.id` before pagination; no sort control.** | Required by REQ-D-02 / AC-06 for deterministic page membership. |
| Treat `%` and `_` as SQL `LIKE` patterns vs. literal search input | **Target: literal characters, with escaped `LIKE` matching.** | Required by REQ-D-03 / REQ-F-01 / AC-01, AC-05, AC-08; verify wildcard-sensitive cases in the API and UI. |
| Silently retain only “All” vs. expose catalog failure | **Target: visible accessible error and unavailable Category control; name search remains usable.** | Required by REQ-D-04 / REQ-F-02 / AC-02 for both non-OK and thrown `/api/breeds` requests. Preserve the existing SSR catalog fetch and Astro dog-search proxy boundary. |

## 8. Configuration, deployment assumptions, and Not Found items

**Evidence found:** `API_SERVER_URL` is read by the Astro homepage and proxy, defaulting to `http://localhost:5100`; Playwright explicitly supplies that value for its local server. Flask reads `DATABASE_PATH`, defaulting to `app/server/dogshelter.db`, and direct execution runs Flask debug mode on port 5100. `app/client/astro.config.mjs` configures Astro server output with the Node standalone adapter. `app/client/Dockerfile` builds/runs the Astro Node server on port 4321.

**Status: Not Found**  
**Notes:** The reviewed repository configuration does not establish a production Flask container/service, deployment topology, production `API_SERVER_URL`, database volume/backup/restore policy, migration process, TLS termination, secrets provider, health checks, rollout/rollback procedure, production debug setting, or production scaling policy. The client Dockerfile alone does not establish a complete deployable application. Local start scripts and Playwright configuration are development/test setup, not production deployment evidence.  
**Evidence: Not Found** for production deployment/configuration artifacts in the reviewed project files.

Other non-functional targets not present in the approved story are also **Not Found**: availability/SLO, concurrency, dataset size, browser matrix, localization, accessibility conformance level, telemetry, and end-to-end latency beyond the 300 ms result-update criterion in AC-03. Do not infer or promise them in this architecture.

## 9. Risks, open decisions, and handoff

1. **AC-03 validation remains outstanding:** The target budget is 100 ms debounce plus at most 200 ms for request/parse/visible render in the §5 measurement setup. Current code waits 300 ms before dispatching. The target is not a result; validate it before claiming AC-03.
2. **D-02 implementation and test gap:** `get_dogs` currently has no explicit ordering. Implement/verify ascending `Dog.id` before pagination and test stable filtered pages; no user-facing sort control is in scope.
3. **D-03 wildcard test gap:** Current name matching may interpret `%` and `_` as SQL `LIKE` wildcards. Implement literal matching and verify 100/101-character boundaries and wildcard-sensitive examples for both API and UI.
4. **D-04 catalog-failure test gap:** Current SSR does not provide the required dedicated visible error for all catalog-failure modes. Handle non-OK and thrown fetches independently from name search and test the accessible error/unavailable selector behavior.
5. **URL parameter convention:** Current UI-generated state uses `breed`, while the HTML select is named `category` and the API accepts both. Keep both API parameters compatible; no change to the existing convention is proposed.
6. **Documentation and approval authority:** The required user-facing feature-documentation destination is not established in this repository; Jira mentions Confluence, but this stage does not publish there. A named product-owner role is also Not Found. These findings do not alter this architecture's pending renewed human approval.

**Handoff:** Submit this revised architecture for renewed human approval and Design Review. Do not represent any AC as passed or complete based on inspection. Verification must include the §5 D-01 through D-04 cases, in addition to filter-preserving pagination/reload restoration, clear-state URL behavior, and the existing API response contract. Preserve the current Astro proxy boundary and API response shape; production deployment details remain **Not Found** (§8).
