# Design Review — EPMCDMETST-70141

## Executive Summary

**Decision: Approved With Conditions.**

The proposed Astro → same-origin proxy → Flask → SQLAlchemy/SQLite flow satisfies the approved breed-filter requirements at the architecture level. The design covers the `breed_id` contract, filtered totals, URL updates, pagination reset/preservation, and empty results. No Critical or High findings prevent implementation.

Two non-blocking conditions remain for implementation/acceptance: render the exact Jira label **“All Breeds”**, and ensure stale legacy `breed`/`category` parameters cannot constrain a newly selected `breed_id`. Other security, reliability, performance, maintainability, and observability notes are recommendations or future considerations, not implementation blockers.

## Scope and Review Basis

- Reviewed `docs/EPMCDMETST-70141/requirements.md` and `docs/EPMCDMETST-70141/architecture.md` against the cited source, tests, and configuration.
- The review was performed after the user approved the architecture on 2026-11-04. At the time the review was drafted, its architecture status text and `workflow-state.json` had not yet been synchronized; the architecture status is now corrected, and the orchestrator will record the review phase in `workflow-state.json`.
- `.github/agents/design-review.md` describes an automated documentation-sync plan, not a design-review agent for this application, so it was not used. Followed `instructions/design-review-instructions.md`, `skills/design-review/SKILL.md`, and the applicable review gate in `copilot-instructions.md`.
- The breed-related source and test files are uncommitted candidate work. Findings below are based on static inspection only; **tests and builds were not run**.
- No API Design, planning, development, or workflow-state update was performed.

## Requirements Coverage

| Approved requirement | Architecture assessment and evidence |
|---|---|
| FR-01 / AC-01: `/api/breeds` returns IDs/names sorted by name | Covered: Flask orders by `Breed.name` (`app/server/app.py:93–98`); the homepage fetches the breed list (`app/client/src/pages/index.astro:40–56`). The candidate UI label differs; see DR-01. |
| FR-02 / AC-03: filter by integer `breed_id` | Covered: request validation and `Breed.id` predicate are in `app/server/app.py:26–38, 66–68`. Architecture correctly treats a breed-name alias as unnecessary; legacy filters are existing behavior, not a dependency of this feature. |
| FR-03 / AC-03: totals reflect filtered results | Covered: filters are applied before `query.count()` and pagination in `app/server/app.py:53–75`; response totals are formed at `app/server/app.py:84–91`. |
| FR-04 / AC-01: dropdown includes “All Breeds” and API breeds | Architecture records the exact label (`docs/EPMCDMETST-70141/architecture.md`, ADR-05), but candidate source and its test use “All” (`app/client/src/pages/index.astro:85–96`; `app/client/e2e-tests/search.spec.ts:11–16`). See DR-01. |
| FR-05 / AC-02: selecting a breed updates URL and list without reload | Covered: the page uses `breed_id`, client fetches the same-origin dog route, and history is updated (`app/client/src/pages/index.astro:335–383, 403–405`; `app/client/src/pages/api/dogs.ts:9–22`). |
| FR-06 / AC-04: reset to page 1 and preserve filter in pagination | Covered in the design and candidate flow: selection requests page 1 (`app/client/src/pages/index.astro:403–405`), and URL builders retain `breed_id` (`app/client/src/pages/index.astro:234–240, 349–352`). The stale legacy-parameter edge case is DR-02. |
| FR-07 / AC-05: empty state and permitted pagination behavior | Covered: zero results return one logical page (`app/server/app.py:84–91`); the homepage renders an empty state and hides pagination for one page (`app/client/src/pages/index.astro:131–134, 281–283`; `app/client/src/components/DogList.astro:13–19`). |
| FR-08 / AC-07: docs and automated tests | Architecture identifies the existing API and Playwright test surfaces (`app/server/test_app.py:151–277`; `app/client/e2e-tests/search.spec.ts:11–207`; `app/client/e2e-tests/api-integration.spec.ts:68–117`). Test definitions are not evidence of passing tests; validation remains for the authorized testing phase. |
| FR-09 / AC-06: unfiltered listing remains available | Covered: without `breed_id`, Flask adds no breed-ID predicate (`app/server/app.py:53–75`); the homepage defaults to page 1 (`app/client/src/pages/index.astro:17–25`). |

## Findings

### Critical

None.

### High

None.

### Medium

#### DR-01 — Candidate dropdown label does not match Jira AC

- **Evidence:** Approved `docs/EPMCDMETST-70141/requirements.md` FR-04 and AC-01 require the exact visible text “All Breeds” (`docs/EPMCDMETST-70141/requirements.md:35, 56`). Candidate markup renders “All” (`app/client/src/pages/index.astro:93`), and its Playwright assertion also expects “All” (`app/client/e2e-tests/search.spec.ts:11–16, 198–207`). Architecture ADR-05 correctly records the required label and the discrepancy (`docs/EPMCDMETST-70141/architecture.md`, ADR-05 and traceability rows).
- **Impact:** If left unchanged, the candidate UI and its assertion do not satisfy the exact acceptance criterion, even though filtering behavior may otherwise work.
- **Recommendation:** Render “All Breeds” and align the UI assertion with that exact label.
- **Condition:** Resolve and verify this mismatch before acceptance of the implementation.
- **Decision:** **Non-blocking.** The approved architecture already specifies the required text; this is a localized implementation/test alignment item, not an architectural impediment.

### Low

#### DR-02 — Existing query aliases can constrain a newly selected breed

- **Evidence:** Architecture says the selected breed must use `breed_id` and stale legacy parameters must not narrow it (`docs/EPMCDMETST-70141/architecture.md`, “API/UI responsibility”). However, `currentFilters()` reads `breed` and `category` from the current URL (`app/client/src/pages/index.astro:224–231`), `fetchAndRender()` forwards them along with `breed_id` (`app/client/src/pages/index.astro:335–352`), and the dropdown change handler reuses those current filters (`app/client/src/pages/index.astro:403–405`). Flask applies the `breed_id` and legacy breed predicates independently (`app/server/app.py:66–70`).
- **Impact:** On a URL containing a legacy breed/category parameter, selecting a different dropdown breed can submit both filters and produce an unexpectedly empty result.
- **Recommendation:** On a new dropdown selection, clear stale `breed`/`category` parameters while retaining unrelated filters such as `name`; continue using `breed_id` for this feature.
- **Condition:** Confirm the selection path does not retain stale aliases before feature acceptance; a focused test should cover a legacy-parameter URL followed by a different breed selection.
- **Decision:** **Non-blocking.** This is an edge case in preserving old URL parameters, and the required `breed_id` flow is implementable without changing the approved contract.

#### DR-03 — Proxy error response includes upstream exception detail

- **Evidence:** `app/client/src/pages/api/dogs.ts:17–22` returns the caught exception message in the 502 JSON body. The architecture identifies this behavior and recommends avoiding internal-detail exposure outside local development (`docs/EPMCDMETST-70141/architecture.md`, “Security design”).
- **Impact:** In a deployed environment, transport or service details in an exception could disclose internal operational information to a browser.
- **Recommendation:** Return a generic client-facing 502 message and send appropriately sanitized diagnostics to server-side logs if/when an operational logging path is approved.
- **Condition:** No condition for this feature’s design gate; reassess before exposing the route in a production deployment.
- **Decision:** **Non-blocking / deployment consideration.** No new credentials or authorization requirement is introduced by this read-only feature, and deployment topology is not defined in the approved scope.

#### DR-04 — Breed-list failure has no explicit UI recovery state

- **Evidence:** The homepage fetches dogs and breeds together (`app/client/src/pages/index.astro:40–56`). A rejected fetch reaches the page-level error path, while a non-OK breed response leaves `breeds` empty and does not report a specific dropdown failure. The architecture records the same limitation (`docs/EPMCDMETST-70141/architecture.md`, “Reliability and error handling”).
- **Impact:** During a partial API outage, users may see the dog list without available breed choices, or a request failure may replace the page content with an error state.
- **Recommendation:** Consider a clear filter-specific unavailable state and operational recovery behavior if reliability targets are later established.
- **Condition:** None; availability/recovery targets are not specified by the approved requirements.
- **Decision:** **Non-blocking / future consideration.** Existing error handling is adequate to describe the current scope; retries, timeouts, and availability targets are not acceptance requirements.

## Security Review

The feature adds read-only listing behavior and no authorization or credential requirement is defined. `breed_id` is parsed as an integer, page size is bounded, and filters are expressed through SQLAlchemy (`app/server/app.py:31–48, 53–75`). Dynamic dog name and breed values are escaped before client-side HTML insertion (`app/client/src/pages/index.astro:224–227, 262–263`), while server-rendered component values use Astro interpolation (`app/client/src/components/DogList.astro:10–39`). No SQL construction from raw filter strings or new secret-bearing client configuration was identified. DR-03 is the only security recommendation.

## Scalability and Performance

The architecture uses the existing database and API, counts after applying active filters, and limits page size to 100 (`app/server/app.py:53–91`). This is reasonable for the unquantified workshop scope. The filter joins dogs to breeds, but `Dog.breed_id` has no explicit index declaration in the model (`app/server/models/dog.py:13–18`). Exact counting on every page and the lack of a measured index/latency target are future scaling considerations, not demonstrated defects.

**Recommendation (non-blocking):** If inventory growth makes filtering or counting slow, inspect the SQLite query plan and benchmark representative data before adding an index or cache. No quantitative performance target is present (`requirements.md`, NFR-01/OI-04; `architecture.md`, “Scalability and performance”).

## Reliability

Invalid `breed_id` values produce a 400 response, unknown IDs yield an empty result, and the candidate interaction aborts superseded requests and surfaces a generic search error (`app/server/app.py:31–50`; `app/client/src/pages/index.astro:309–383`). The filtered count and page are derived from the same filtered query. DR-04 records the remaining partial-failure behavior. No availability, retry, timeout, or recovery objective is specified; no reliability blocker is identified.

## Maintainability

The architecture keeps the API authoritative for filtering/totals and the homepage responsible for presentation, with no new service or schema requirement (`docs/EPMCDMETST-70141/architecture.md`, “Components and boundaries”). One small maintenance risk is that server-rendered dog cards in `DogList.astro` and client-generated card markup in `index.astro` are separate templates (`app/client/src/components/DogList.astro:10–39`; `app/client/src/pages/index.astro:245–274`). **Recommendation:** Keep their structure and escaping behavior aligned; consider consolidation only if the UI is refactored under authorized scope. This is not a gate condition.

## Observability

**Status: Not Found.** The reviewed requirements define no logging, metrics, tracing, alerting, or quantitative operational target (`docs/EPMCDMETST-70141/requirements.md`, NFR-01/OI-04). The architecture notes no feature-specific telemetry (`docs/EPMCDMETST-70141/architecture.md`, “Logging and observability”). Treat operational telemetry as future work under separate approval, not as a prerequisite for this story.

## Risks and Recommendations

1. **Before acceptance:** Satisfy exact “All Breeds” labeling and the stale-alias selection condition (DR-01, DR-02).
2. **Before production exposure:** Avoid returning raw upstream exception detail to clients (DR-03); deployment configuration and security controls remain outside this feature’s approved scope.
3. **If operational needs change:** Define reliability/observability targets and measure query behavior before adding retries, telemetry, indexes, or caching (DR-04 and future considerations above).

## Approval Status

**Approved With Conditions** — No Critical or High findings remain unresolved. DR-01 and DR-02 are non-blocking conditions for implementation acceptance; the architecture expresses the approved requirements and can support them without redesign. Security, reliability, performance, maintainability, and observability concerns outside the approved functional scope are recorded as non-blocking recommendations or future considerations.

**Handoff:** This review permits the workflow to hand off to API Design when separately authorized. API Design and all later phases were **not started** in this task.
