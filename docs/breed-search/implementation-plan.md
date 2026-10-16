# Implementation Plan: Search Dogs by Breed

## Planning basis and scope

Feature scope and acceptance criteria come from `docs/breed-search/requirements.md`; architecture and design conditions from `docs/breed-search/architecture.md` and `docs/breed-search/design-review.md`; the endpoint contract from `docs/breed-search/api-design.md`; and completion status from the current source, tests, and reports. A separate planning-agent guide is **Not Found** in the main base source.

The breed-search runtime and API implementation, acceptance tests, and test-proxy loopback hardening are included on the main-based PR branch. The design preserves the existing dog-list response fields and database schema, adds `GET /api/breeds`, and adds an optional `breed` parameter to `GET /api/dogs`. No vaccination implementation or dependency changes are included. The shared-worktree reports were reconciled against the exact branch; validation and remaining holds are recorded below.

## Current completion status

| Area | Status | Repository evidence |
| --- | --- | --- |
| Requirements and traceability | Complete | `docs/breed-search/requirements.md`: FR-01–FR-08, NFR-01–NFR-05, AC-01–AC-09. |
| Architecture and design review | **Feature design approved**; external security and deployment gates remain open | `docs/breed-search/architecture.md`; the latest `docs/breed-search/design-review.md` approves the feature design and closes DR-02 with AC-01–AC-09 evidence. DR-03 remains a production deployment condition because deployment/security/operational information is not established. This amendment implements the bounded review follow-ups without changing architecture, API, or schema. |
| API design | Complete | `docs/breed-search/api-design.md`; new `GET /api/breeds`, extended `GET /api/dogs`, unchanged database schema. |
| Feature runtime implementation | Complete | `app/server/app.py`, `app/client/src/pages/index.astro`, and `app/client/src/components/DogList.astro` implement breed filtering, URL state, pagination, error states, and filtered empty state. |
| Automated coverage | AC-01–AC-08 and dog-list/detail parts of AC-09 tested | `docs/breed-search/test-report.md`: 6 backend tests, 13 focused homepage tests, and 23 full frontend tests passed. Vaccination-route preservation is Not Found in the main base source and is not claimed as tested. |
| Validation and reports | Feature tests/build pass; security gate open | Pre-development, post-codegen, and pre-commit hooks passed; pre-PR failed due to 13 frontend audit vulnerabilities (1 critical, 11 high, 1 low). No dependency changes were authorized. Security/merge readiness is not approved; deployment remains blocked pending security handling and documented deployment prerequisites. |
| PR branch | Isolated and based on `main` | Unrelated worktree changes were excluded. |

## Dependency-ordered actions

| Order / status | Bounded action | Traceability and completion evidence |
| --- | --- | --- |
| 0 — **Complete** | Requirements, architecture, design review, and API contract are produced and validated against the main-based branch. The design adds the breed catalog route and filter parameter without changing schema or dog-list response fields. | Requirements: FR-01–FR-08, NFR-01–NFR-05. See `docs/breed-search/api-design.md`. |
| 1 — **Complete** | Implement the catalog endpoint and filtered dog query; connect URL-backed selection, pagination, empty/error states, and test harness. | `app/server/app.py`, `app/client/src/pages/index.astro`, `app/client/src/components/DogList.astro`, test/config files. |
| 2 — **Complete** | Add AC-01–AC-08 coverage and dog-list/detail/pagination regression evidence; bind the test-only proxy and matching URLs to `127.0.0.1`. Vaccination-route preservation is not claimed because that route is Not Found in the main base. | `app/client/e2e-tests/homepage.spec.ts`, `app/client/playwright.config.ts`, `app/client/start-test-server.js`, `app/server/test_breed_search.py`. |
| 3 — **Complete** | Backend tests passed (6); focused homepage Chromium tests passed (13); full frontend tests passed (23); Astro build passed. Pre-development, post-codegen, and pre-commit hooks passed. Pre-PR exited 1 because the frontend audit found 13 vulnerabilities (1 critical, 11 high, 1 low). | Exact outcomes are in `docs/breed-search/test-report.md`. The security hold remains open and is prominently disclosed in the draft PR. |
| 4 — **Complete** | Review confirms breed-search behavior and test coverage; AC-09 vaccination-route preservation is not verifiable because the route is Not Found in the main base. Security and deployment gates remain open. | `docs/breed-search/review-report.md`, `docs/breed-search/design-review.md`. |
| 5 — **Complete** | Synchronized requirements, architecture, API, test, review, deployment, and PR artifacts to the main-based branch. No deployment was performed. | `docs/breed-search/requirements.md`, `docs/breed-search/architecture.md`, `docs/breed-search/api-design.md`, `docs/breed-search/test-report.md`, `docs/breed-search/review-report.md`, `docs/breed-search/deployment-plan.md`, `docs/breed-search/pr-description.md`. |

### Completed test outcomes

- **AC-01:** The homepage test asserts the complete UI breed-option sequence is alphabetically ordered and includes “All breeds.”
- **AC-02:** Filtered-page tests assert every displayed dog's full breed name matches the selected breed on both exercised pages.
- **AC-03:** The homepage test verifies selecting a breed from a later page resets the URL/results to page 1.
- **AC-05:** The test verifies “All breeds” omits the `breed` parameter and restores the unfiltered listing.
- **AC-07:** Backend SQLite tests verify literal handling of `%`, `_`, and `\\` without broadening results; no browser-level test with special-character breed names is claimed.
- **AC-08:** Separate tests verify visible errors for failed dog-data and breed-catalog requests.
- **AC-09:** Dog cards, detail links, pagination, and dog-list response fields are covered. Vaccination-route preservation is Not Found in the main base and is not claimed as verified.
- **Test harness:** The failure-injection proxy binds only to `127.0.0.1`; test configuration and browser requests use the matching loopback URL.
- Filtered pagination, no-match semantics, bounded pages, dog cards/detail navigation, and dog-list response fields were exercised as recorded in `docs/breed-search/test-report.md`.

## Dependency sequence

```text
Requirements, architecture, design review, and API design (complete)
    -> implement breed catalog/filter and homepage selection/pagination (complete)
        -> add acceptance tests and harden test-only proxy loopback configuration (complete)
            -> focused/backend/full-suite tests, build, and repository hooks (complete except pre-PR audit)
                -> scoped review (breed-search behavior approved; AC-09 vaccination scope not found in base)
                -> synchronize review/test/deployment/PR validation artifacts (complete)
                    -> external release gates: resolve or formally except the 13 frontend audit findings;
                       document deployment target/owner and release/rollback prerequisites (open)
```

## Risks, constraints, and deferred decisions

- **Review follow-ups:** AC-01 alphabetic UI ordering and AC-02 every-card matching are covered. Existing dog-list/detail behavior is covered; vaccination-route preservation is **Not Found** in the main base source. Coverage residuals (including no browser-level AC-07 wildcard-name search) are documented in `docs/breed-search/test-report.md` and `docs/breed-search/review-report.md`; do not overstate them.
- **Test-harness exposure:** The failure proxy must be loopback-only (`127.0.0.1`); keep its bind address, test configuration, and browser URLs aligned.
- **Authorized scope:** Implement breed search, its API contract, acceptance coverage, and requested hook fixes. Preserve the existing response shape and schema. No vaccination implementation or dependency changes. The frontend audit's 13 findings (including one critical) remain open because dependency remediation was not authorized; resolve them through separately authorized maintenance or obtain a formal exception before merge/release. Do not make unauthorized dependency changes.
- **DR-01, Medium:** Query count and offset cost may grow with data volume. Measure schema/query plan and representative workload before scaling; consider indexing or pagination changes only if evidence warrants them. No benchmark or scale target is currently established.
- **DR-03, Low:** Application-wide monitoring/readiness arrangements are not evidenced. Confirm them with the deployment owner before production; instrumentation or health-check changes require a separate scope if needed.
- TLS, deployment boundaries, access policy, monitoring targets, and release/rollback commands are **Not Found** in reviewed evidence. Resolve operational ownership rather than making assumptions. These deployment prerequisites remain external/open release gates; deployment is blocked until they are established and the required security gate is resolved or formally excepted.
- The PR branch is isolated from unrelated worktree edits and based on `main`. No production deployment is part of this task. Draft PR creation was authorized with the audit hold disclosed.

## Plan state

**Feature deliverables:** Implemented and validated for the tested scope. Backend tests (6/6), focused homepage tests (13/13), full frontend tests (23/23), and production build passed. Pre-development, post-codegen, and pre-commit hooks passed; pre-PR failed on the frontend audit (13 findings: 1 critical, 11 high, 1 low). No dependency changes were authorized. **Design:** Approved for the tested breed-search behavior; vaccination-route preservation remains unverified because no route exists in the main base. **Security/merge gate:** Blocked pending authorized remediation or a formal exception. **Deployment:** Not approved and not performed; target, owner, release process, and rollback information remain Not Found. A draft PR is authorized with these holds disclosed.
