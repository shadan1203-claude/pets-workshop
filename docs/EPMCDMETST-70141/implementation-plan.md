# Implementation Plan — EPMCDMETST-70141

## Status and approval boundary

**Planning status:** Prepared for review; this plan has not been approved.
**Approved inputs:** Intake, requirements, architecture, Design Review (**Approved With Conditions**), and API Design. The user accepted DR-01 (the exact visible label **“All Breeds”**) and DR-02 (clear stale legacy `breed`/`category` parameters when selecting a breed, while retaining unrelated filters such as `name`) as implementation and test conditions.
**Phase boundary:** This artifact plans implementation and validation only. It does not create test design, change source or other artifacts, run validation, update `workflow-state.json`, authorize Development, or authorize deployment.

## Executive Summary

Complete and verify the breed filter on the existing Astro homepage and Flask API, using the integer `breed_id` contract and existing Breed data. Preserve unfiltered listing, filtered totals, URL/history and pagination behavior, and the empty state. Reconcile only the explicitly scoped candidate changes and add focused API/UI coverage and relevant documentation.

Breed-related code and tests already exist as uncommitted candidate changes in a worktree on `feature/EPMCDMETST-70332-favorite-badge`, alongside unrelated user changes. Static inspection shows two known acceptance gaps: the dropdown says “All” instead of **“All Breeds”**, and selection can retain legacy `breed`/`category` filters. The plan treats the candidate as input, not validated or accepted implementation. All later edits must be selective and preserve the rest of the worktree.

## Scope

**In scope**

- `GET /api/breeds`: return breed IDs and names ordered by name.
- `GET /api/dogs`: accept optional integer `breed_id`, filter before count and pagination, and preserve the unfiltered listing.
- Homepage breed options, exact **“All Breeds”** label, `breed_id` URL behavior, no-reload selection, page reset, pagination/history preservation, and empty results.
- On a new dropdown selection, clear stale `breed` and `category` parameters while retaining unrelated active filters such as `name`.
- Automated API and browser tests and the relevant existing documentation update.

**Out of scope**

- Breed-name alias as a required feature contract; multi-select, profile persistence, schema changes, new services, caching, telemetry, retries, or new performance/accessibility targets.
- Design Review recommendations DR-03 and DR-04 as feature work. They are not approved requirements or tasks in this plan. The production deployment target is not specified; this plan does not authorize production exposure.

## Assumptions

- **ASM-01:** Existing Breed records and Dog-to-Breed relations remain the source of IDs and names; no migration is required.
- **ASM-02:** Integer `breed_id` is the only required breed-filter parameter. Existing `breed`/`category` API behavior remains available for compatibility, but a new dropdown selection must not carry stale values for those parameters.
- **ASM-03:** The homepage is the target surface, and existing behavior remains when no breed is selected.
- **ASM-04:** Candidate files are user-owned, uncommitted changes, not baseline code to replace or discard. Worktree changes unrelated to this Jira remain untouched.
- **ASM-05:** The local/workshop Astro and Flask setup is the validation target. A QA/production host and release topology are not established in the inspected repository.

## Dependencies

| ID | Dependency | Planning treatment |
|---|---|---|
| DEP-01 | Existing `Breed` model/data and Dog-to-Breed relationship | Reuse existing model and database; validate with the isolated E2E test database. |
| DEP-02 | Astro server-side connectivity to Flask through `API_SERVER_URL`, and same-origin `/api/dogs` proxy for browser requests | Preserve existing boundaries; test both API and homepage paths. |
| DEP-03 | Existing Python unittest-compatible backend tests and Playwright/Chromium harness | Use existing files/configuration and commands below; do not add dependencies unless a later authorized phase establishes a need. |
| DEP-04 | Planning approval, a separately approved Test Design phase, and the repository pre-development gate | Required before Development; this plan does not bypass those gates. |

No new external service, database schema, package, or credential is anticipated.

## Risks

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---:|---:|---|
| RSK-01 | Candidate code does not satisfy the accepted DR-01 label or DR-02 stale-alias condition. | High | High | Treat both as required implementation changes and explicit browser assertions; do not accept the candidate solely because related tests/source exist. |
| RSK-02 | Candidate files are uncommitted on a branch for another Jira, in a worktree with unrelated user changes; broad Git operations could destroy or misattribute work. | Medium | High | Preserve current state and source evidence. Inspect exact diffs before any later edits; make only scoped, selective hunks; stage only reviewed paths/hunks. Prohibit reset, checkout, clean, blanket restore/revert, or blanket stash. |
| RSK-03 | Fixed E2E data or selectors drift from the test database and current UI. | Medium | Medium | Use the configured `start-test-server.js` seeding path and Playwright config; assert against returned IDs/data where practical and keep fixtures isolated from the default database. |
| RSK-04 | README API/UI descriptions may continue to describe only legacy breed-name filtering after implementation. | Medium | Medium | Update the existing API and homepage documentation to distinguish `breed_id` from retained legacy filters and verify the final wording against the approved contract. |
| RSK-05 | Deployment topology and production host are unspecified, and the inspected deployment guidance is local/workshop-oriented. | Medium | High | Limit planned deployment/smoke target to local/workshop validation. Require an identified target, reachable `API_SERVER_URL`, writable/persisted database path, and separate release approval before any non-local deployment. |
| RSK-06 | Jira comments and issue-specific Confluence context remain unverified, as recorded during intake. | Low | Low | Preserve this limitation; do not treat unverified external context as reviewed or expand scope absent an approved change. |

## Requirement Traceability

| Approved requirement | Planned task coverage |
|---|---|
| FR-01 / AC-01 — sorted breed IDs/names from `/api/breeds` | TASK-001, TASK-002 |
| FR-02 / AC-03 — optional integer `breed_id` filtering | TASK-001 |
| FR-03 / AC-03 — filtered `total` and `total_pages` | TASK-001 |
| FR-04 / AC-01 — dropdown from API with exact “All Breeds” label | TASK-002 |
| FR-05 / NFR-01 / AC-02 — update `breed_id` URL and listing without full-page reload | TASK-002 |
| FR-06 / AC-04 — preserve filter in pagination; reset to page 1 on selection | TASK-002 |
| FR-07 / AC-05 — no-match empty state and permitted pagination outcome | TASK-002 |
| FR-08 / AC-07 — relevant documentation and automated tests | TASK-001, TASK-002, TASK-003 |
| FR-09 / AC-06 — unfiltered listing remains available | TASK-001, TASK-002 |

## Task Breakdown

Tasks are ordered to be independently reviewable and testable. File names below identify the candidate implementation and relevant existing test/documentation surfaces; later Development must confirm the current diff and edit only authorized hunks.

| Stable ID | Category and task | Requirement mapping | Dependencies | Independent review / verification |
|---|---|---|---|---|
| **TASK-001** | **Backend/API:** Reconcile the candidate Flask endpoints against the approved API contract. Preserve ordered breed listing; validate optional integer `breed_id`; apply it before count/pagination; preserve valid empty/unknown-ID responses and the no-filter listing. Add or adjust focused backend tests in `app/server/test_app.py`. No new schema or breed-name alias is part of the task. | FR-01, FR-02, FR-03, FR-08, FR-09; AC-01, AC-03, AC-06, AC-07 | None | Review `app/server/app.py` and focused tests as a unit; run the backend test command. Check filtered records, counts/page totals, and no-filter behavior. |
| **TASK-002** | **Frontend/UI and browser tests:** Reconcile `app/client/src/pages/index.astro` and the existing Playwright coverage. Render the exact **“All Breeds”** option; use `breed_id`; on selection request page 1 without a full reload, remove stale `breed` and `category` while retaining unrelated filters such as `name`, and preserve selected filters through pagination/history. Verify empty state and permitted pagination behavior. Add/update focused assertions in `app/client/e2e-tests/search.spec.ts`; retain the API integration coverage in `api-integration.spec.ts` as applicable. | FR-04, FR-05, FR-06, FR-07, FR-08, FR-09, NFR-01; AC-01, AC-02, AC-04, AC-05, AC-06, AC-07 | TASK-001 | Review UI behavior and Playwright assertions together; run focused Chromium tests and the full E2E suite. Specifically assert the exact label and that selection from a URL with legacy parameters drops only `breed`/`category`, retains `name`, and selects the requested `breed_id`. |
| **TASK-003** | **Documentation:** Update the existing API/homepage feature description in `README.md` to document the `breed_id` filter, sorted breed endpoint, filtered totals, URL/pagination behavior, “All Breeds” option, and retained legacy API parameters without describing them as the new dropdown contract. Do not rewrite unrelated documentation. | FR-08; AC-07 | TASK-001, TASK-002 | Review the documentation diff against requirements and the delivered behavior; ensure no claim exceeds the verified contract. |

No task is created for non-blocking recommendations or future considerations. Detailed test design is explicitly deferred to its own authorized phase.

## Validation Strategy

These are planned commands and checks, not results. No validation was run during Planning.

### Build validation

From `app\client`:

```powershell
npm run build
```

`app/client/package.json` defines the Astro build script. The root `package.json` does not define project build/test scripts.

### Unit validation

From `app\server`:

```powershell
python -m unittest test_app
```

`app/server/test_app.py` uses `unittest.TestCase` and patches the Flask/SQLAlchemy query. This validates focused backend response and filtering behavior without using the default data set. `pytest` is also documented as a repository fallback, but no backend test script is present under `app/scripts`.

### Integration validation

Use the configured Playwright server harness to exercise Astro-to-Flask behavior with the isolated seeded test database. `app/client/playwright.config.ts` starts `start-test-server.js` and the Astro dev server; the test server seeds `app/server/e2e_test_dogshelter.db`.

From `app\client`:

```powershell
npm run test:e2e:chromium -- --grep "breed|category"
```

Review API integration assertions for endpoint ordering, filter results, malformed/unknown IDs, and filtered pagination totals.

### End-to-end validation

From `app\client`:

```powershell
npm run test:e2e:chromium
```

The configured project is Chromium and the harness starts the API and Astro servers. The suite should cover the selection URL/no-reload flow, page reset, selected-filter pagination/history, no-match state, and both accepted Design Review conditions. Ensure the Chromium browser is installed in the validation environment if Playwright reports it missing. Run the broader suite after focused checks to catch regressions in the shared homepage.

### Acceptance validation

| Acceptance criterion | Planned evidence |
|---|---|
| AC-01 | API response contains breed IDs/names sorted by name; homepage option text is exactly **“All Breeds”** and remaining options correspond to the API list. |
| AC-02 | Selecting a breed sets `breed_id` and updates results without a manual full-page reload. |
| AC-03 | API results match the selected breed and `total`/`total_pages` are computed for filtered results, including zero matches. |
| AC-04 | Pagination URLs/requests retain `breed_id`; selecting a different breed from a later page returns to page 1. |
| AC-05 | No-match selection renders an empty state and hides pagination or limits it to one page. |
| AC-06 | “All Breeds” leaves the regular unfiltered listing and pagination available. |
| AC-07 | Updated documentation and automated test changes are reviewed, and the planned build/unit/integration/E2E checks pass in their authorized phase. |

**Additional accepted condition checks:** DR-01 exact “All Breeds” text is asserted; DR-02 selecting a different breed from a URL with stale `breed`/`category` removes both from the resulting URL/request while retaining unrelated `name`. These checks are acceptance conditions, not additional requirements or scope.

There is no configured lint script in `app/client/package.json`. No lint command is claimed or required by this plan.

## Testing Strategy

The focused validation above uses the existing backend unittest and Playwright suites; test design and detailed test-case artifacts are not part of this Planning output. In the later Test Design phase, map its cases to the acceptance table and include API response/order/count behavior, filtered and unfiltered UI behavior, pagination/reset, empty results, browser history, no-reload selection, exact DR-01 wording, and the DR-02 stale-alias case. Candidate test definitions are not evidence of passing tests.

## Deployment Considerations

- **Validation/deployment target:** Existing local/workshop setup only: Flask API on the configured service address (default `http://localhost:5100`) and Astro on `http://localhost:4321`. This is a local validation target, not a production deployment decision.
- **Non-local target:** No QA/production host, topology, or release pipeline was identified. Do not infer a production target or deploy from this plan.
- **Preconditions:** Required phase approvals and pre-development gate passed; build and tests successful; scoped changes reviewed and approved; Astro `API_SERVER_URL` reaches Flask; Flask has a writable, correctly selected database containing breeds/dogs; no production database is used for E2E tests. Any non-local deployment requires an explicitly identified target and separate deployment approval.
- **Post-deployment/local smoke:** Request `/api/breeds` and verify sorted `id`/`name` entries; request `/api/dogs` both with and without a valid `breed_id` and verify results/totals; open `/`, verify exact “All Breeds” text, select a breed and verify URL/result update without reload, then check pagination and the no-match empty state. Check service logs for startup/request errors without introducing new telemetry scope.
- **Data/configuration:** No database migration or new configuration key is planned. Keep Flask debug mode off outside local development; use a writable/persisted database path appropriate to any separately approved environment.

## Rollback Plan

1. Before Development, preserve the current `git status` and exact diffs for the candidate files and unrelated modifications as evidence. Make only selective, requirement-scoped edits; do not use destructive `reset`, `checkout`, `clean`, whole-file restore/revert, broad staging, or a blanket stash that could capture or discard the unrelated work.
2. Keep any later feature changes distinguishable from the pre-existing uncommitted candidate and other Jira work. If an implementation must be rolled back, revert only separately identifiable feature-owned commits or selectively reverse only explicitly authorized feature hunks. Never roll back the pre-existing candidate or unrelated user modifications as a side effect.
3. If an approved local/non-local release regresses, restore the previous application build or selectively revert the feature-owned change through the approved release process. The plan includes no schema/data migration, so no database rollback is expected. Do not clear, replace, or restore user data as part of rollback.
4. Re-run the applicable build and focused/full regression checks after rollback; do not report the rollback complete until the target is smoke-checked.

## Definition of Done

- Each in-scope requirement FR-01–FR-09 and NFR-01 maps to reviewed implementation and acceptance evidence; AC-01–AC-07 are satisfied.
- The exact DR-01 **“All Breeds”** label and DR-02 stale-alias clearing behavior are implemented and covered by automated assertions.
- API totals, pagination, empty state, and unfiltered behavior are verified; relevant documentation and automated tests are updated.
- The planned build, backend unit, integration, and E2E validations pass in their authorized phases.
- Only scoped changes are included; the existing candidate and unrelated user changes are preserved; no unapproved recommendations or future scope is added.
- Deployment/rollback readiness is documented for the approved target; no deployment is inferred or performed by completing this plan.

## Development-ready Handoff

The implementation sequence, requirement mapping, dependencies, risks, and validation strategy are prepared for plan review. This handoff is **conditional, not authorization to begin Development**: obtain explicit approval of this plan, complete and approve the separately required Test Design phase, and pass the repository pre-development gate before Development starts. At handoff, brief Development on the existing uncommitted candidate code and unrelated worktree changes; preserve all of them and make only selective, scoped changes. Do not modify test-design artifacts or workflow state as part of this plan.

## Evidence Reviewed

- Approved phase artifacts: `intake-summary.md`, `requirements.md` (FR-01–FR-09, NFR-01, AC-01–AC-07, ASM/DEP records), `architecture.md`, `design-review.md` (DR-01–DR-04 and approval), and `api-design.md`.
- Candidate source and tests, by static inspection only: `app/server/app.py`, `app/server/test_app.py`, `app/client/src/pages/index.astro`, `app/client/src/pages/api/dogs.ts`, `app/client/e2e-tests/search.spec.ts`, and `app/client/e2e-tests/api-integration.spec.ts`.
- Validation/deployment configuration and documentation: `app/client/package.json`, `app/client/playwright.config.ts`, `app/client/start-test-server.js`, `app/server/requirements.txt`, `README.md`, and the repository worktree status.
- The README references backend/build/E2E shell scripts that are not present in `app/scripts`; the client package exposes `build`, `test:e2e`, and `test:e2e:chromium`, and the Playwright configuration runs the Chromium integration/E2E stack. No test, build, deployment, or smoke check was executed during this planning task.
