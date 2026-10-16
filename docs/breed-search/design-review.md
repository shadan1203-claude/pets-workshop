# Design Review Report: Search Dogs by Breed

## Executive Summary

Follow-up review of `docs/breed-search/architecture.md` against `docs/breed-search/requirements.md`, the final `docs/breed-search/test-report.md`, and `docs/breed-search/review-report.md` confirms the architecture describes the main-based implementation, including the new breed catalog route, filtered pagination, fetch-error presentation, and explicitly unverified deployment properties. Tests provide evidence for AC-01–AC-08 and most of AC-09; preservation of vaccination routes is not verifiable because none is present in the `main` base source. No Critical or High feature-design defect was found. DR-01 remains a measurement-before-scale recommendation. DR-03 remains a production deployment condition because transport, access-control, and operational policies are **Not Found**.

**Feature design decision: Approved for the tested breed-search behavior.** AC-09's vaccination-route preservation clause remains unverified for this base. This is not overall security or release approval: `docs/breed-search/test-report.md` records a failed frontend audit with 13 vulnerabilities (1 critical, 11 high, 1 low). Resolve that security finding through an authorized dependency-maintenance change or formal exception before merge/release. Independently, confirm the DR-03 policies before production deployment.

## Review Scope and Evidence

Reviewed:

- `docs/breed-search/requirements.md` — FR-01–FR-08, NFR-01–NFR-05, AC-01–AC-09, assumptions, and risks.
- `docs/breed-search/architecture.md` — components, data flow, security, scalability, error handling, and observability.
- `app/server/app.py` — `/api/dogs` and `/api/breeds` implementations.
- `app/server/models/dog.py` and `app/server/models/breed.py` — relationship and schema declarations.
- `app/client/src/pages/index.astro` and `app/client/src/components/DogList.astro` — URL/query behavior, requests, form, pagination, errors, and rendered states.
- `app/server/test_breed_search.py` and `app/client/e2e-tests/homepage.spec.ts` — breed-search tests.
- `docs/breed-search/test-report.md` — final validation results and AC-01–AC-09 evidence mapping.
- `docs/breed-search/review-report.md` — final feature-scoped code review and security-gate disposition.

The review assesses design and repository evidence; it does not modify code or requirements. Unspecified deployment topology, service-level targets, and operational policies remain **Not Found**; no values are inferred.

## Requirements Coverage

| Requirement area | Review result and source evidence |
| --- | --- |
| Breed catalog and selector (FR-01, AC-01) | Covered: `/api/breeds` orders by `Breed.name`; the homepage renders a labeled select with “All breeds.” Evidence: `app/server/app.py` (`get_breeds`), `app/client/src/pages/index.astro`. |
| Exact, case-insensitive breed filter (FR-02, AC-02, AC-07) | Covered by implementation: `/api/dogs` trims the value, escapes backslash, `%`, and `_`, then applies `Breed.name.ilike(..., escape='\\')`. The query joins dogs and breeds. Evidence: `app/server/app.py` (`get_dogs`); `app/server/test_breed_search.py`. |
| URL state, page reset, pagination, clear filter (FR-03–FR-05, AC-03–AC-05) | Implemented: the homepage reads `breed` and `page`, resets selection changes to page 1, omits an empty breed value, and carries a selected breed through pagination. Current browser evidence verifies later-page selection resets to page 1 and sets the breed URL, filtered pagination retains the breed and matching cards, and clearing removes the parameter and restores the unfiltered list before re-selection. Evidence: `docs/breed-search/test-report.md` AC-03–AC-05; `app/client/src/pages/index.astro`. |
| Empty results and request errors (FR-06–FR-07, AC-06, AC-08) | Covered by implementation and current browser tests: the no-match test asserts zero count and a breed-specific message; separate dog-endpoint and breed-endpoint HTTP 503 tests assert an error and absence of successful empty/list UI. Evidence: `docs/breed-search/test-report.md` AC-06 and AC-08; `app/client/src/pages/index.astro`, `app/client/src/components/DogList.astro`. |
| Existing API/listing and unrelated flows (FR-08, NFR-04, AC-09) | Dog-list response retains `dogs`, `page`, `per_page`, `total`, and `total_pages`; dog entries retain `id`, `name`, and `breed`; cards retain `/dog/{id}` links. The design adds `GET /api/breeds` and no schema. The full frontend suite exercises dog cards, detail links/navigation, pagination, and API-backed pages. Vaccination-route preservation is not verifiable because the route is **Not Found** in the `main` base source. Evidence: `docs/breed-search/test-report.md` AC-09; `app/server/app.py`, `app/client/src/components/DogList.astro`. |
| Compatibility and bounded page size (NFR-01–NFR-02) | Consistent with current source: existing stack and SQLite configuration are used; the homepage requests six rows and the API clamps `per_page` to 1–100. Evidence: `app/server/app.py`, `app/client/src/pages/index.astro`. |
| Usability and unspecified service qualities (NFR-03, NFR-05) | The select has a visible label and uses native form submission. No quantified latency, availability, localization, browser-support, or formal accessibility target is present; these are correctly recorded as **Not Found** in requirements/architecture. |

### Acceptance-criteria evidence in the final test report

The following evidence is from `docs/breed-search/test-report.md`'s final acceptance mapping. The report records backend unittest **6/6 passed**, focused homepage Chromium Playwright **13/13 passed**, full frontend Playwright **23/23 passed**, and the Astro production build **passed**.

| Criterion | Evidence and review disposition |
| --- | --- |
| **AC-01 — Catalog and default view** | Playwright asserts the complete option order (“All breeds”, German Shepherd, Golden Retriever, Husky), 13 unfiltered results, six visible cards, and pagination. **Evidence present.** |
| **AC-02 — Breed match** | Browser test asserts every displayed breed label matches Golden Retriever on page 1 and page 2; lower-case URL input also resolves to the canonical selector and matching result. **Evidence present for exercised pages.** |
| **AC-03 — URL and page reset** | Browser test begins on `/?page=2`, selects Golden Retriever, then verifies breed in URL, page 1 results, and Buddy first. **Evidence present.** |
| **AC-04 — Filtered pagination** | Browser test advances filtered results to page 2, verifies page and breed remain in the URL, and asserts every displayed card matches on both pages. **Evidence present for fixture data.** |
| **AC-05 — Clear selection** | Browser test verifies “All breeds” removes the `breed` parameter, restores the unfiltered total/list, and allows the breed to be selected again. **Evidence present.** |
| **AC-06 — No matches** | Browser test verifies zero count and a breed-specific “No dogs found” message for an unlisted breed. **Evidence present.** |
| **AC-07 — Literal wildcard characters** | Backend tests verify the SQL `LIKE` escape and execute the filter with SQLite fixtures containing `%`, `_`, and backslash, confirming literal-only matches rather than distractors. No browser-level search with such catalog entries was run. **Backend/API-layer evidence present; browser-level residual retained.** |
| **AC-08 — Fetch failure** | Separate browser tests make the dog and breed endpoints return HTTP 503 and verify visible error states without empty-state or dog-list UI. **Evidence present for both requests.** |
| **AC-09 — Existing behavior** | Full frontend suite covers cards, detail navigation, pagination, and API-backed pages; backend tests verify dog-list response fields. Vaccination-route preservation could not be tested because no such route is present in the `main` base source. **Partially verified; route preservation remains unverified.** |

These results close the earlier DR-02 release-condition for AC-03, AC-05, AC-07, and AC-08: the final report contains evidence for each criterion. AC-07's browser-layer and AC-09's vaccination UI/live-database limits, along with Chromium-only execution and unmeasured coverage, remain explicit coverage limitations rather than unproven test claims or current design blockers.

## Security Review

- **Positive evidence:** Breed values are bound through SQLAlchemy's query expression rather than interpolated into SQL. The endpoint escapes `\\`, `%`, and `_` before the case-insensitive `LIKE` comparison (`app/server/app.py`, `get_dogs`); backend tests verify both the escape expression and literal filtering against SQLite fixtures (`docs/breed-search/test-report.md`, AC-07). Both breed-search endpoints are GET/read-only routes in the reviewed implementation.
- **Access control:** No authentication or authorization is implemented in these two route handlers. That is not, by itself, a feature defect for the visitor-facing catalog, but any broader access-control policy is **Not Found**. Confirm intended public access and deployment boundaries before production.
- **Transport and deployment security:** TLS configuration, network boundaries, and production secret-management policy are **Not Found** in the reviewed source and architecture evidence. Do not assume these protections exist.
- No Critical or High feature-specific security issue identified.
- **Release security status:** Design approval does not clear the separate security gate. The final test report records frontend `npm audit` failure with 13 unresolved vulnerabilities (1 critical, 11 high, 1 low). Overall security/release readiness remains **on hold** pending authorized resolution and re-audit.

## Scalability Review

The design limits each API response to at most 100 dogs and counts after applying the breed filter. It uses SQLite and performs a join plus count and offset/limit for each dog-list request (`app/server/app.py`, `get_dogs`). `Dog.breed_id` is a foreign key but has no explicit index declaration in `app/server/models/dog.py`; `Breed.name` is declared unique in `app/server/models/breed.py`. Expected dataset size, actual deployed database indexes, traffic, caching, and horizontal-scaling requirements are **Not Found**.

### DR-01 — Query cost may grow with dataset size

- **Severity:** Medium
- **Evidence:** Each list request joins dogs to breeds, counts the filtered query, then uses offset/limit (`app/server/app.py`, lines 108–125). The dog model declares `breed_id` as a foreign key without an explicit index (`app/server/models/dog.py`, line 18). The architecture states that indexing strategy and expected traffic are **Not Found**.
- **Risk:** Counting and deep offset pagination may become costly if the dog table grows; the current evidence does not establish whether this is material for the deployed dataset.
- **Recommendation / mitigation:** Before scaling beyond the current SQLite workload, inspect the deployed schema/query plan and measure representative filtered and deep-page queries. If measurements warrant it, consider an index on `dogs.breed_id` or a pagination strategy appropriate to the data volume. Do not claim an index or performance target without verification.

## Reliability Review

- The page requests dogs and breeds concurrently, checks each HTTP response's `ok` flag, and catches fetch exceptions. It renders an error instead of treating failed retrieval as a successful empty list (`app/client/src/pages/index.astro`).
- The catalog and listing handlers do not define feature-specific database-exception handling (`app/server/app.py`, `get_breeds` and `get_dogs`). The API's database-error response mapping and recovery policy are **Not Found**. The frontend handles a non-success response as an error, but the actual error payload and operational recovery are not specified.
- A `/health` handler is **Not Found** in the `main` base source. Health/readiness behavior and recovery policy are **Not Found**.
- No feature-specific reliability blocker found for the stated visitor flow.

## Performance Review

- A bounded page size prevents an unbounded dog-list response, but the total-count query and offset pagination remain data-volume-sensitive (DR-01).
- The two page requests run concurrently, as documented and implemented. No latency measurements, budget, or production workload evidence is available; performance targets are **Not Found**.
- No benchmark or query-plan evidence was found. Avoid asserting measured performance.

## Maintainability Review

The feature reuses existing models and the homepage, adds the breed-catalog endpoint, and introduces no service, dependency, or schema. The architecture identifies the relevant source files and traces the primary request/data flow. No material modularity or coupling issue specific to this feature was found. Broader ownership, maintenance, and release practices are **Not Found**.

## Observability Review

The architecture explicitly reports no feature-specific logging, metrics, tracing, alerting, or health route in the reviewed source. Operational dashboards, alert thresholds, log-retention policy, and service-level objectives are **Not Found**.

### DR-03 — Production transport, access-control, and operational policies are unspecified

- **Severity:** Low
- **Evidence:** `docs/breed-search/architecture.md` records TLS configuration, deployment network boundaries, access-control policy, production secret-management policy, logging, metrics, tracing, alerting, and readiness as **Not Found**. The route handlers do not implement authentication/authorization; no `/health` route is present in the reviewed base.
- **Risk:** Production protections and operator signals cannot be assumed from this feature's visitor-facing, read-only routes; failures may be visible to visitors without documented operational detection or readiness behavior.
- **Recommendation / mitigation:** This is a **production deployment condition**: confirm the intended public-access and authorization boundaries, TLS/network protections, secret handling, application-wide monitoring/alerting, and readiness expectations before production. If policies or controls are absent, define and review them through a separate operational change. Until verified, these deployment policies remain **Not Found**; do not infer that the feature implements them.

## Risks

### Critical

- None identified.

### High

- None identified.

### Medium

- **DR-01 — Query cost with dataset growth.** Mitigation: verify actual schema/query plan and measure against an agreed workload before scaling; index or revise pagination only if evidence justifies it.

### Low

- **DR-03 — Production transport, access-control, and operational policies are unspecified.** Mitigation: confirm the policy and deployment controls listed above before production; keep each item **Not Found** until verified.
- Service targets remain **Not Found** and require operational confirmation rather than assumptions.

### Acceptance coverage finding (original severity: Medium)

- **DR-02 — Acceptance-test evidence condition.** The final `docs/breed-search/test-report.md` records evidence for AC-01–AC-08 and the listing/detail/pagination portion of AC-09. Vaccination-route preservation remains unverified because the route is Not Found in the main base; backend-only wildcard proof remains an explicit limitation.

## Recommendations

1. Preserve the documented acceptance boundary: AC-01–AC-08 and existing listing/detail/pagination behavior are covered; AC-07 is proven at the backend/SQLite layer (not browser-level); AC-09 vaccination-route preservation is Not Found in the reviewed base.
2. Before scaling beyond the current SQLite workload, use deployed-schema/query-plan evidence and representative filtered/deep-page measurements to evaluate DR-01. Consider an index or pagination change only if measurements justify it; no current performance failure or index is asserted.
3. Before production deployment, verify TLS, intended public access and authorization boundaries, network/secret protections, application-wide monitoring/alerting, and readiness expectations. These policies remain **Not Found** until verified (DR-03).
4. Treat the frontend `npm audit` failure (13 vulnerabilities: one critical, 11 high, one low) as a security/release hold. Resolve through an authorized dependency-maintenance change or formal exception and rerun the frontend audit.
5. Preserve the existing requirements and architecture scope. This review recommends no change to them and does not implement the recommendations.

## Design Review Gate

- Requirements-to-architecture traceability: **Reviewed**; the feature flow and key requirements align with the source.
- Security, scalability, reliability, performance, maintainability, and observability: **Reviewed**; architectural gaps and risks are recorded above, with no Critical/High feature-design finding.
- Critical findings: **None**.
- High-risk mitigation plans: **Not applicable**; no High findings.
- Medium-risk mitigation plans: **Documented** under DR-01; DR-02 is closed by test-report evidence, with residual test-layer limits retained.
- Feature design approval: **Approved** for the stated feature and evidenced application.
- Production deployment condition: **DR-03 remains open** until transport, access-control, and operational policies are verified; these remain **Not Found** in current evidence.
- Overall security/release status: **On hold** pending authorized remediation or formal exception for the frontend's 13 npm audit vulnerabilities. This is distinct from the feature design disposition.
