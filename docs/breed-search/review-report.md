# Feature-Scoped Code Review: Search Dogs by Breed

**Review date:** 2026-10-16
**Disposition:** **Approved for the verified breed-search behavior; security and release readiness are not approved.** AC-09's vaccination-route preservation clause is not directly testable because no vaccination route exists in the `main` base source. This report does not approve merge or release.

## Scope and evidence

Reviewed the final breed-search runtime, relevant tests, and Playwright test harness against `docs/breed-search/requirements.md`, the amended `docs/breed-search/implementation-plan.md`, and current `docs/breed-search/test-report.md`. Source and diffs reviewed:

- `app/server/app.py` — breed filtering, literal wildcard escaping, count/pagination, ordered catalog, and dog-list response.
- `app/client/src/pages/index.astro` and `app/client/src/components/DogList.astro` — selected-breed URL/request state, page reset and pagination, catalog control, fetch errors, result count and empty state.
- `app/server/test_breed_search.py` and `app/client/e2e-tests/homepage.spec.ts` — backend/API and browser acceptance/regression coverage.
- `app/client/playwright.config.ts` and `app/client/start-test-server.js` — test server/proxy binding and URLs.

The review covers the isolated main-based PR branch; unrelated changes in the shared worktree were excluded. Tests were rerun against this branch and are recorded in the test report.

## Prior findings

| Prior finding | Final evidence | Disposition |
| --- | --- | --- |
| **AC-09 — existing behavior/regression coverage** | Full frontend suite covers dog listing/cards, detail navigation and pagination. Backend tests assert the dog-list response shape. No vaccination route is present in the `main` base source. | **Partially verified.** Existing listing, detail, pagination, and response fields are covered. Vaccination-route preservation is **Not Found / not applicable to the reviewed base**; no vaccination implementation or route test is included. |
| **AC-01 — catalog order and default view** | Homepage Playwright test asserts the complete option sequence (`All breeds`, `German Shepherd`, `Golden Retriever`, `Husky`). Default-list test checks 13 results, six visible cards, and pagination. The backend catalog query orders by breed name. | **Addressed; not blocking.** |
| **AC-02 — every displayed dog matches selected breed** | Filter test asserts every card's breed on page 1 and page 2, including filtered pagination. A separate lower-case URL test verifies canonical selector value and a matching displayed dog. Backend uses a case-insensitive exact-name predicate. | **Addressed; not blocking.** The lower-case-input case asserts the first displayed card rather than every card; all-card assertions are present for the normal filtered flow, and no source defect was found. |
| **Test proxy wildcard listener / URL mismatch** | `start-test-server.js` binds `proxy.listen` to `127.0.0.1`; its request URL base, Playwright proxy/API readiness and Astro API configuration, and browser failure-injection requests use the matching loopback address. The Astro frontend remains on `localhost:4321` as its separate server. | **Addressed; not blocking.** |

## Acceptance coverage and residuals

The current test report records passing evidence for AC-01–AC-08, including AC-03 page reset, AC-04 filtered pagination, AC-05 clearing/reselection, AC-06 no matches, and AC-08 separate dog/breed fetch failures. AC-07's backend tests compile the SQLite predicate for escaped wildcard input. The full browser suite also covers the dog-list behavior in AC-09; vaccination-route preservation cannot be exercised against the reviewed base.

| Residual | Blocking? | Assessment |
| --- | --- | --- |
| AC-07 has no browser-level search using catalog entries containing wildcard characters. | **No, for this scoped review.** | The SQLite/API predicate behavior where wildcard interpretation matters is directly exercised and passes; the test report clearly records the missing browser-level case. It is a coverage enhancement, not an observed correctness defect. |
| No vaccination route is present in the main base source, so its preservation cannot be tested in this branch. | **Merge condition.** | No vaccination code was added. Confirm the target deployment's baseline includes no such route, or add a separately approved test/change if it does. |
| Coverage percentage and non-Chromium browser runs are not demonstrated. | **No acceptance blocker identified.** | Current report says no coverage instrumentation was produced and only Chromium ran. Neither is an acceptance criterion with a measurable target in the feature requirements. |

No remaining acceptance gap is assessed as blocking the breed-search feature scope. These residual limits should not be represented as additional test coverage.

## Review observations

- Breed filtering occurs before count and pagination; the submitted breed is trimmed and `%`, `_`, and backslash are escaped before a case-insensitive exact-name comparison.
- The page requests the breed catalog and dog results, includes the selected breed in the request and pagination URLs, starts selection changes at page 1, and omits the `breed` parameter when “All breeds” is selected.
- Failed dogs or breeds requests render an error state rather than a successful empty state. The filtered empty result includes the selected breed.
- The test proxy and all URLs that address it are loopback-only. The test suite's serial configuration is consistent with its single-use failure injection state.
- No feature-scoped correctness, regression, or maintainability finding requiring code changes was identified.

## Validation and security-gate status

Per `docs/breed-search/test-report.md`, current results are: backend unittest **6/6 passed**; focused Chromium homepage **13/13 passed**; full frontend Playwright **23/23 passed**; Astro production build **passed**. Pre-development, post-codegen, and pre-commit hooks passed. The pre-PR hook failed on the frontend audit.

**Frontend dependency audit: FAIL — 13 findings (1 critical, 11 high, 1 low).** Dependency maintenance was not authorized in this feature scope. The pre-PR hook audits `app/client` and exits 1 on these findings. This is a merge/release hold unless findings are resolved or formally excepted.

`git diff --check` passed on the scoped changes; Git emitted only a line-ending conversion warning for `docs/breed-search/design-review.md`. Deployment was not performed.

## Final disposition

**Feature-scope review: APPROVED for the tested breed-search behavior.** The AC-01, AC-02, selection/pagination, fetch-error, and proxy-binding evidence is present. AC-09's vaccination-route clause remains unverified because the route is **Not Found** in the main base. **Overall security/pre-PR readiness is not approved:** the frontend audit failure blocks merge/release until remediated or formally excepted.
