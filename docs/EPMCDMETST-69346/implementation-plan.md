# Implementation Plan — EPMCDMETST-69346

## Status and authority

- **Stage:** Planning; approved by the user on 2026-11-02. This plan authorizes neither implementation nor deployment.
- **Development status:** **BLOCKED** pending repository-maintainer resolution of the pre-development hook path mismatch. The user chose to wait for the maintainer; no hook update or bypass is authorized.
- **Story:** Jira `EPMCDMETST-69346`, “Add instant search to Pets Workshop pet listing (Name + Category/Breed).”
- **Authoritative scope:** Jira AC-01..AC-08 and the user-approved D-01..D-04 in `requirements.md`; preserve their wording and intent.
- **Approved design inputs:** `architecture.md`, `api-design.md`, and Round 2 `design-review.md` (**Approved With Conditions; user-approved**). The review's conditions and residual findings are carried forward below.
- **API artifact boundary:** The existing issue-scoped `api-design.md` is input only and must not be generated or edited. An API Design role is not configured in the repository.
- **Planning agent applicability:** `.github/agents/planning.md` describes an unrelated automated-documentation-sync plan; feature planning follows `instructions/planning-instructions.md` and the approved issue-scoped artifacts.
- **Current evidence:** Static source and test inspection only. No tests, builds, or deployment actions were run during planning. No acceptance criterion is claimed complete.
- **Permitted change for this stage:** This file only. Existing worktree changes are to be preserved.

## Current implementation evidence and gaps

The feature is substantially present; implementation work should close the specified gaps, not replace existing patterns.

| Area | Evidence in the current repository | Remaining implementation / proof gap |
| --- | --- | --- |
| Homepage and interactive search | `app/client/src/pages/index.astro` renders labeled name and Category controls, reads URL state, uses `URLSearchParams`, calls the same-origin `/api/dogs` route, renders results in place, updates history, aborts superseded requests, and keeps filters in generated pagination URLs. | The name debounce is 300 ms, consuming the full AC-03 window. There is no measured end-to-end result-render deadline. |
| SSR breed catalog | The homepage fetches `/api/breeds`; `app/server/app.py` returns the ordered `{breeds:[{id,name}]}` catalog. | A non-OK catalog response silently leaves an “All”-only selector; a thrown catalog fetch shares the dog-fetch catch and can suppress usable name search. No accessible catalog failure path is established. |
| Dog API | `app/server/app.py` accepts optional `name`, `breed`, and `category` filters; `breed` takes precedence; filters combine; the existing response keys and pagination limits are present; name matching is case-insensitive partial `ilike`; name and breed/category inputs are capped at 100 characters. | The dog query has no explicit order before offset/limit; `%` and `_` are not shown to be literal; exact 100/101 behavior and wildcard-sensitive examples need focused evidence. |
| Existing verification | `app/server/test_app.py` uses `unittest` and mocked ORM queries. `app/client/e2e-tests/search.spec.ts` and `api-integration.spec.ts` cover basic UI/API filtering. Playwright config seeds a deterministic SQLite database and runs Flask plus Astro. | Existing tests do not establish the full 100 ms + 200 ms deadline, stable filtered multi-page membership, wildcard-literal behavior, or catalog failure with working name search. The current E2E seed has ten dogs, with no combined-filter result set spanning more than one six-item page. |
| Documentation / deployment | `app/client/README.md` is a generic Astro starter document. Local dev/test configuration exists. | The approved user-facing/technical documentation destination is **Not Found**. Production deployment environment, target, credentials, and rollback approval are **Not Found**. |

## Fixed constraints for implementation

1. Keep the existing Flask/SQLAlchemy, SQLite, Astro SSR and same-origin `/api/dogs` proxy boundaries. Do not add a search service, new response envelope, or browser-facing `/api/breeds` proxy.
2. Preserve the `/api/dogs` success contract (`dogs`, `page`, `per_page`, `total`, `total_pages`), dog fields (`id`, `name`, `breed`), defaults/clamps, JSON validation-error shape, exact case-insensitive Breed match, `category` alias, and `breed` precedence.
3. Implement D-01 as a **100 ms maximum debounce plus the remaining 200 ms for request, response, JSON parsing, and visible result rendering**. AC-03 is measured from the final input event to the rendered expected result within 300 ms; dispatch alone is insufficient.
4. Implement D-02 as ascending `Dog.id` before offset/limit pagination; do not add a user-facing sort control.
5. Implement D-03 as a 100-character maximum for both name and Category/Breed, with `%` and `_` treated literally in case-insensitive name substring searches. Test exactly 100 accepted and 101 rejected.
6. Implement D-04 for non-OK and thrown/unusable `/api/breeds` responses: show a clear accessible error associated with an unavailable Category control, do not present “All” alone as successful loading, and keep the name field, dog list, and name-only search usable.
7. Preserve URL restoration, pagination filter retention, clear-to-unfiltered page 1, safe text rendering, no full document reload, and existing empty-state behavior.
8. The review requires focused timing and failure-path tests to be **added and executed downstream**. Source inspection is never pass evidence.

## Ordered task breakdown

Task IDs are stable references for implementation, review, and verification evidence. Dependencies are explicit; tasks without a listed prerequisite may proceed independently after their stated dependencies.

### PLAN-01 — Resolve handoff ownership and prerequisite scope

- **Depends on:** None.
- **Traceability:** Workflow prerequisite; no AC or D behavior.
- **Surface:** No source change. Before Development, name the backend, frontend, test, reviewer, documentation, and release owners; the Jira issue is unassigned and named role-holders are **Not Found**.
- **Work:** Treat the issue-scoped approved requirements, architecture, API design, review, and this plan as the governing artifacts. Do not substitute stale root `docs/requirements.md` or `docs/architecture.md`.
- **Pre-development hook:** `hooks/pre-development.sh` now resolves the active Jira key and validates all required artifacts in `docs/<JIRA_ID>/`; it no longer checks root-level artifact paths. The hook is a prerequisite check, not a test.
- **Migration validation:** Resolver and session-manager tests pass. The hook still requires the Jira-scoped intake summary before Development can start; the current artifact set does not include that document, so Development remains blocked until intake is recorded.
- **Risk / owner:** Development start could be blocked by missing named owners or mismatched hook scope. **Owner:** repository maintainer / delivery lead; named owner **Not Found**.
- **Gate evidence:** The artifact scope is recorded, but the hook path conflict is unresolved. The prerequisite is not considered resolved until the repository maintainer selects a compliant path and the required hook passes; Development must remain blocked meanwhile.

### PLAN-02 — Complete dog API matching and deterministic ordering

- **Depends on:** PLAN-01.
- **Traceability:** AC-05, AC-06, AC-08; REQ-F-05, REQ-F-06, REQ-F-08, REQ-N-01; D-02 / REQ-D-02 / VER-D-02; D-03 / REQ-D-03 / VER-D-03.
- **Surface:** `app/server/app.py`, in `get_dogs`.
- **Work:** Preserve current parameters, response shape, page-size behavior, filter combination and 100-character validation. Escape SQL `LIKE` metacharacters in name input so `%` and `_` are literal, retaining parameterized ORM matching and case-insensitive substring semantics. Order the filtered result query by ascending `Dog.id` before offset/limit. Keep unknown Breed as a successful empty result and retain existing `breed`/`category` precedence.
- **Risk / owner:** Incorrect escaping or ordering could change matching or page membership. **Owner:** backend developer; named owner **Not Found**.
- **Done evidence:** Focused unit and API integration assertions prove response compatibility, literal wildcard-sensitive cases, exact length boundaries, stable ascending IDs, and repeatable page membership.

### PLAN-03 — Prepare deterministic multi-page and wildcard test fixtures

- **Depends on:** PLAN-01.
- **Traceability:** AC-05, AC-06, AC-08; D-02 / VER-D-02; D-03 / VER-D-03.
- **Surface:** `app/server/utils/seed_test_database.py`; use the existing Playwright test-database setup in `app/client/start-test-server.js` and `app/client/playwright.config.ts`.
- **Work:** Extend the test-only seed with at least seven dogs matching one name substring and one Breed, so combined-filter pagination spans multiple six-item pages. Add wildcard-sensitive literal and near-match names for both `%` and `_`. Keep the current deterministic baseline records and the first three dog ordering required by existing homepage tests.
- **Risk / owner:** Changing seed order or baseline values could break existing examples; insufficient fixtures would leave D-02 untestable. **Owner:** test/QA owner; named owner **Not Found**.
- **Done evidence:** Existing UI/API fixture expectations remain valid; the selected combined-filter dataset has more than six records and known ascending IDs across pages.

### PLAN-04 — Add focused backend unit coverage

- **Depends on:** PLAN-02.
- **Traceability:** AC-05, AC-06, AC-08; D-02 / VER-D-02; D-03 / VER-D-03.
- **Surface:** `app/server/test_app.py` using its existing `unittest`, `unittest.mock`, and query-mock patterns.
- **Work:** Assert ordering is applied before offset/limit and pagination remains stable; test combined filtering, literal `%` and `_` cases, exactly 100 accepted and 101 rejected for `name`, `breed`, and `category`, filtered totals/page counts, and unchanged response fields. Keep API errors and unknown-Breed semantics compatible.
- **Risk / owner:** Mock-only assertions can prove expression construction but not database page membership or actual wildcard behavior. **Owner:** backend developer / QA; named owners **Not Found**.
- **Done evidence:** Focused unit tests pass; database-backed ordering and wildcard evidence is also supplied by PLAN-06 rather than inferred from mocks.

### PLAN-05 — Update homepage timing, input bounds, and catalog fallback

- **Depends on:** PLAN-01.
- **Traceability:** AC-01..AC-07; REQ-F-01..REQ-F-07 and REQ-N-02..REQ-N-03; D-01 / VER-D-01; D-03 / VER-D-03; D-04 / VER-D-04.
- **Surface:** `app/client/src/pages/index.astro`; retain `DogList.astro` unless a specific required rendering/accessibility change proves it necessary. Preserve the current same-origin route in `app/client/src/pages/api/dogs.ts`.
- **Work:**
  - Reduce the name debounce from 300 ms to no more than 100 ms and preserve debounce restart, request cancellation, immediate Category requests, in-place rendering and URL state.
  - Enforce the 100-character UI limit and provide accessible feedback for invalid/overlong name input; retain server validation for name and Breed.
  - Handle `/api/breeds` independently from dog-list loading. On non-OK, thrown, malformed or unusable catalog results, show a clear accessible error associated with the unavailable/disabled Category control; keep dog data and name-only search functional.
  - Keep filter changes on page 1; retain active filters in pagination links and reload-restorable URL state; clear both filters and return to the default first page.
- **Risk / owner:** SSR fetch coupling can make catalog failure fatal; 100 ms dispatch may still leave more than 200 ms for the result to render. **Owner:** frontend developer; named owner **Not Found**.
- **Done evidence:** Focused UI tests prove the accessible failure state and working name-only search, debounce behavior, URL/pagination/clear behavior, input limit, and no document navigation. The full timing deadline is separately evidenced in PLAN-06.

### PLAN-06 — Add Playwright/API integration evidence for all remaining gaps

- **Depends on:** PLAN-03, PLAN-04, PLAN-05.
- **Traceability:** AC-01..AC-08; D-01..D-04 / VER-D-01..VER-D-04; REQ-F-01..REQ-F-08 and REQ-N-01..REQ-N-04.
- **Surface:** Extend `app/client/e2e-tests/search.spec.ts` and `app/client/e2e-tests/api-integration.spec.ts`. If the current test harness cannot inject SSR catalog failures, add a **test-only** upstream fixture and configure it through `app/client/playwright.config.ts` (and narrowly adjust `start-test-server.js` only if needed). Do not add production failure endpoints.
- **Work / required evidence:**
  - AC-01..AC-02: visible, labeled controls; options come from the available breed catalog.
  - AC-03 / D-01: separately verify a debounce of at most 100 ms (including restart after a newer keystroke), then measure with a monotonic wall clock from the final keystroke until the expected result is visibly rendered. The complete local Chromium + Astro + same-origin proxy + Flask + deterministic database path must complete within 300 ms: at most 100 ms debounce and at most 200 ms for request/response, parsing and visible render. Assert no full document reload. A fake/controlled clock or request-dispatch assertion alone is not sufficient. Record runner, browser, fixture and measured result when tests are run.
  - AC-04..AC-05: immediate Category update and correct conjunctive name+Breed results without document navigation.
  - AC-06 / D-02: combined-filter results spanning multiple pages, ascending stable `Dog.id` membership, recalculated totals/pages, retained filters in pagination, and direct URL reload/restoration.
  - AC-07: clear resets both controls, page and URL to the default list.
  - AC-08 / D-03: unchanged response contract; exact 100 accepted / 101 rejected for name and Breed/category; literal `%` and `_` cases that would return different results if treated as wildcards; UI limit and feedback.
  - AC-02 / D-04: simulate both non-OK and thrown/transport `/api/breeds` failures (and malformed payload if supported by the fixture); assert accessible error association, no misleading successful “All”-only state, dog list remains renderable, and a name-only search succeeds.
- **Risk / owner:** Timing evidence depends on stable CI/browser conditions; SSR failures cannot be simulated by browser interception of server-to-server fetches. **Owner:** QA / frontend owner; named owners **Not Found**.
- **Done evidence:** Playwright cases pass in Chromium using the configured local servers and deterministic fixtures; timing context and result are recorded without generalizing local timing to production.

### PLAN-07 — Update Jira-scoped feature documentation

- **Depends on:** PLAN-02, PLAN-05, PLAN-06.
- **Traceability:** AC-08 / REQ-F-08 / REQ-N-04 and relevant D-01..D-04 behaviors.
- **Surface:** `docs/EPMCDMETST-69346/feature-documentation.md`, per the user's requirement that generated artifacts stay in the Jira-specific folder. The Jira story also mentions Confluence publication; available Confluence MCP tools in this workflow are read/search only, so publishing externally is **Not Run / unavailable** unless a write-capable tool and authorization are provided.
- **Work:** Document search controls, name and Category/Breed semantics, pagination/URL behavior, clear action, length/wildcard semantics, catalog-failure fallback, and verified operational notes. Do not claim tests pass until their execution evidence exists.
- **Risk / owner:** The local technical artifact may not fulfill an external Confluence publication expectation. **Owner:** product/documentation owner; named owner **Not Found**.
- **Done evidence:** Jira-scoped documentation is updated and reviewed against the API contract and actual tested behavior; any external Confluence publication is separately authorized and evidenced.

### PLAN-08 — Independent code review and remediation

- **Depends on:** PLAN-04, PLAN-06, PLAN-07.
- **Traceability:** AC-01..AC-08; D-01..D-04; all Round 2 review conditions.
- **Surface:** Review the implementation/test/documentation diff, especially `app/server/app.py`, `app/server/test_app.py`, `app/server/utils/seed_test_database.py`, `app/client/src/pages/index.astro`, Playwright tests/configuration, and the approved documentation change. Do not edit the approved API-design artifact.
- **Work:** Require a reviewer independent of the implementation owner. Check API compatibility, safe parameterized matching and escaped rendering, deterministic order before pagination, accessible catalog fallback, error handling, URL state, test validity and traceability. Resolve findings before final verification.
- **Risk / owner:** No named reviewer is established. **Owner:** code reviewer; named owner **Not Found**.
- **Done evidence:** Review findings and dispositions are recorded; no unresolved blocking finding remains; any post-review change is revalidated in PLAN-09.

### PLAN-09 — Run focused verification after review

- **Depends on:** PLAN-08.
- **Traceability:** AC-01..AC-08; D-01..D-04; design-review condition 2.
- **Surface / commands:** Use the existing project commands from the relevant working directories:

  ```powershell
  # From the repository root
  Push-Location app\server
  python -m unittest test_app
  Pop-Location

  Push-Location app\client
  npm run build
  npm run test:e2e -- e2e-tests/search.spec.ts e2e-tests/api-integration.spec.ts
  Pop-Location
  ```

- **Work:** Run backend unit tests, then frontend production build and focused Playwright suites (the Playwright config starts the deterministic Flask test server and Astro dev server). If a post-review fix changes a tested surface, rerun the affected checks; rerun the focused end-to-end timing and D-04 tests after related fixes.
- **Risk / owner:** CI/runtime variation may reveal regressions or prevent reliable timing evidence. **Owner:** QA / implementation owners; named owners **Not Found**.
- **Gate evidence:** Preserve actual command results and, for D-01, browser/runner/fixture/measured timing context. Failure, skipped tests, or source-only inspection must not be reported as a pass. These commands are planned for Development/Testing; none was run during this planning stage.

### PLAN-10 — Establish deployment readiness; deployment remains blocked

- **Depends on:** PLAN-09 and explicit operational approvals.
- **Traceability:** Design-review condition 3; M-04; operational risks in `architecture.md` §8. No new AC is implied.
- **Surface:** Deployment artifacts and target environment are not present in the reviewed repository; no deployment files are authorized by this planning task.
- **Work / release gate:** Obtain and review the target environment/topology, production `API_SERVER_URL`, Flask production server and debug-off configuration, database persistence plus backup/restore and migration policy, TLS/health checks, secret/credential provisioning through approved runtime secret management (never source control), rollout procedure, rollback plan and explicit rollback approval. Confirm relevant security/operability ownership. Do not deploy or fabricate values.
- **Status:** **BLOCKED — Deployment environment is Not Found.** Target, credentials/provisioning evidence, and rollback approval are not available. The Astro client Dockerfile and local scripts do not establish a complete production deployment.
- **Risk / owner:** Local correctness cannot establish production safety, persistence, or rollback readiness. **Owner:** release/operations approver; named owner **Not Found**.
- **Done evidence:** Environment-specific deployment and rollback artifacts are approved by accountable owners before any rollout; otherwise remain blocked.

## Requirement and decision coverage index

| Authoritative item | Planned implementation / evidence |
| --- | --- |
| AC-01 | PLAN-05, PLAN-06: visible labeled Pet Name input and UI verification. |
| AC-02 | PLAN-05, PLAN-06: breed catalog control/options and accessible D-04 failure state. |
| AC-03 | PLAN-05, PLAN-06, PLAN-09: 100 ms debounce plus full rendered result within the 300 ms end-to-end limit; no reload. |
| AC-04 | PLAN-05, PLAN-06: immediate Category update without reload. |
| AC-05 | PLAN-02, PLAN-04, PLAN-06: conjunctive name and Breed filters. |
| AC-06 | PLAN-02..PLAN-04, PLAN-06: filtered totals/pages, ascending `Dog.id`, stable multi-page membership, filter-preserving URLs and reload restoration. |
| AC-07 | PLAN-05, PLAN-06: clear to unfiltered page 1 and default URL. |
| AC-08 | PLAN-02, PLAN-04, PLAN-06, PLAN-07: optional filters, unchanged response contract, API/UI tests and feature documentation. |
| D-01 / REQ-D-01 / VER-D-01 | PLAN-05, PLAN-06, PLAN-09: 100 ms debounce; measured request-through-visible-render in remaining 200 ms; full 300 ms wall-clock verification. |
| D-02 / REQ-D-02 / VER-D-02 | PLAN-02..PLAN-04, PLAN-06: ascending `Dog.id` before pagination; repeatable filtered page membership; no sort control. |
| D-03 / REQ-D-03 / VER-D-03 | PLAN-02, PLAN-04..PLAN-06: 100/101 boundaries for name and Category/Breed and literal `%`/`_` matching in API and UI. |
| D-04 / REQ-D-04 / VER-D-04 | PLAN-05, PLAN-06: accessible catalog error for non-OK/thrown/unusable load and functioning name-only search. |

## Carried-forward review conditions, risks, and gates

| ID / risk | Required disposition | Owner |
| --- | --- | --- |
| Round 2 condition 1; M-01..M-03 | Implement D-01..D-04 exactly as above; do not downgrade approved conditions to suggestions. | Frontend/backend implementation owners; named owners **Not Found**. |
| Round 2 condition 2; M-01..M-03 | Add and execute the focused timing, catalog failure, API and UI tests before claiming any AC complete. Static inspection is insufficient. | QA/test owner; named owner **Not Found**. |
| Round 2 condition 3; M-04 | Production topology, runtime configuration, persistence/backup, secrets and rollback evidence are a release gate. Deployment remains blocked while the target, credential provisioning and rollback approval are **Not Found**. | Release/operations approver; named owner **Not Found**. |
| L-01 observability / traceability | Metrics, tracing, structured logging, alerting and retention remain **Not Found**. Do not invent a story requirement or silently claim this gap resolved; obtain an operations decision if required for release. Keep AC/test traceability in implementation and review evidence. | Operations owner; named owner **Not Found**. |
| External Confluence publication | Local documentation is scoped to the user's requested Jira folder. Confluence MCP tools available here are read/search only; external publication is **Not Run** without a write-capable tool and explicit authorization. Jira is unassigned. | Product/story owner; named owner **Not Found**. |
| Pre-development hook scope | Hook expects root-level API design and plan paths, while this request permits only the issue-scoped plan and prohibits API-design generation/editing. Resolve path scope with the maintainer; do not bypass by creating unrelated artifacts. | Repository maintainer; named owner **Not Found**. |

**Planning exit criteria:** PLAN-01's handoff prerequisites are understood; implementation tasks have assigned owners; all AC/D mappings remain intact; development and testing gates are explicit; and the deployment block is retained until its evidence and approvals exist. This plan records intended work only—it does not claim implementation completion, validation success, or deployment readiness.
