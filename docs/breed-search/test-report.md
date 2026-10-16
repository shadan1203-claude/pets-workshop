# Test Report: Search Dogs by Breed

## Summary

Validation was performed against the main-based PR branch on **2026-10-16**. Backend unittests (6/6), focused homepage Chromium Playwright (13/13), full frontend Playwright (23/23), and the Astro production build passed. The pre-development, post-codegen, and pre-commit hooks passed. The pre-PR hook correctly failed because the frontend package audit reports **13 vulnerabilities (1 critical, 11 high, 1 low)**. Draft PR creation was explicitly authorized with this security hold prominently disclosed; merge and deployment are not approved.

## Environment and executed checks

| Check | Exact command | Result |
| --- | --- | --- |
| Backend unittests | `Push-Location app\server; & 'C:\Users\ShadanHaq\projects\pets-workshop\codemie-developer-runner\.venv\Scripts\python.exe' -m unittest -v test_app.py test_breed_search.py; $result = $LASTEXITCODE; Pop-Location; exit $result` | **PASS** — 6 tests ran, 6 passed, 0 failed. Includes breed filtering, wildcard escaping, catalog ordering, and existing dog-list response shape. |
| Focused homepage Playwright | `Push-Location app\client; npm run test:e2e -- --project=chromium e2e-tests/homepage.spec.ts; $result = $LASTEXITCODE; Pop-Location; exit $result` | **PASS** — 13/13 Chromium tests passed. Includes the acceptance-specific alphabetical option, every-card filtered breed, page reset, clear/reselect, and both failure cases. |
| Full frontend tests | `Push-Location app\client; npm test; $result = $LASTEXITCODE; Pop-Location; exit $result` | **PASS** — 23/23 Playwright tests passed. Covers homepage, dog detail navigation, API integration, and About page. |
| Frontend production build | `Push-Location app\client; npm run build; $result = $LASTEXITCODE; Pop-Location; exit $result` | **PASS** — Astro server build completed successfully. |
| Frontend dependency audit | `npm audit --prefix app/client` | **FAIL / security hold** — 13 vulnerabilities: 1 critical, 11 high, 1 low. No dependency changes were authorized or made. |
| Whitespace check | `git diff --check` | **PASS** — exit 0 on the scoped tracked changes. Git emitted only a line-ending conversion warning for `docs/breed-search/design-review.md`. |

Python was 3.11.9 in the configured repository virtual environment. The Playwright tests used the Chromium project. No coverage instrumentation/report was produced.

## Acceptance-criteria mapping

Acceptance criteria are from `docs/breed-search/requirements.md` AC-01–AC-09; test scope is cross-checked against `docs/breed-search/implementation-plan.md`.

| Criterion | Result and evidence |
| --- | --- |
| **AC-01 — Alphabetical catalog and default view** | **PASS.** `should display breed options in alphabetical order with All breeds first` asserts the complete UI option sequence: All breeds, German Shepherd, Golden Retriever, Husky. `should display dog list` verifies the unfiltered 13-dog count and six visible cards; pagination tests verify the bounded page and controls. |
| **AC-02 — Every result matches selected breed** | **PASS for exercised pages.** `should filter dogs when a breed is selected` asserts all six displayed breed labels on page 1 and the sole displayed label on filtered page 2 equal Golden Retriever. A separate case-insensitive test verifies lower-case URL input resolves to Golden Retriever. |
| **AC-03 — URL and reset to page 1** | **PASS.** The homepage test starts at `/?page=2`, selects Golden Retriever, then verifies the breed is in the URL, page 1 of filtered results is displayed, and Buddy is first. |
| **AC-04 — Filtered pagination** | **PASS for the fixture dataset.** The filter test advances to page 2, verifies page and breed remain in the URL, and checks every card's breed label on both pages. |
| **AC-05 — Clear and reselect** | **PASS.** The test confirms selecting All breeds removes the `breed` search parameter (not merely an empty value), restores the unfiltered total/list, then reselects Golden Retriever and verifies filtered results return. |
| **AC-06 — No matches** | **PASS.** The homepage test for an unlisted breed verifies count zero and a breed-specific “No dogs found” message. |
| **AC-07 — Literal `%`, `_`, and backslash** | **PASS at backend SQL/SQLite filtering layer.** Backend tests verify the SQL LIKE escape expression and execute the filter against SQLite fixture names containing `%`, `_`, and `\\`, asserting each special-character value matches only its literal name and not distractors. There is no browser-level UI test using these special-character breed names. |
| **AC-08 — Both API fetch failures** | **PASS.** Separate homepage tests force the dogs endpoint and the breeds endpoint to return 503. Each checks the visible error and absence of the empty-state and dog-list UI. |
| **AC-09 — Existing listing, links, API response, and vaccination routes** | **PARTIAL.** The full Playwright suite exercises dog cards, detail links/navigation, pagination, and API-backed pages. The dog-list response-shape unittest verifies the existing response fields. A vaccination route is **Not Found** in the `main` base source, so its preservation could not be verified and no vaccination implementation was added. |

## Repository hook results

The four requested hooks were invoked from the repository root. The pre-PR hook now audits the frontend package, so it exposes the outstanding security hold rather than reporting a clean root-level audit.

| Hook | Exact command | Result |
| --- | --- | --- |
| Pre-development | `bash hooks/pre-development.sh` | **PASS — exit 0.** Required requirements, architecture, API design, and implementation plan artifacts found. |
| Post-codegen | `bash hooks/post-codegen.sh` | **PASS — exit 0.** Production build completed and backend unittest suite reported 6 passed. |
| Pre-commit | `bash hooks/pre-commit.sh` | **PASS — exit 0.** Full frontend suite reported 23 passed. |
| Pre-PR | `bash hooks/pre-pr.sh` | **FAIL — exit 1.** Full frontend suite passed (23/23); frontend `npm audit` found 13 vulnerabilities (1 critical, 11 high, 1 low). |

## Failures, residual coverage, and recommendations

- **Test failures:** None in the final run; the backend, focused Playwright, and full frontend test suites passed.
- **Security audit:** The frontend package audit remains a failure with 13 vulnerabilities (1 critical, 11 high, 1 low). Resolve these in an authorized dependency-maintenance change or through a formal exception and rerun the frontend audit before merge/release.
- **Coverage target:** No measurable coverage target or coverage tool was found in the main base source. Coverage was not measured; passing test counts are not a coverage percentage.
- **Acceptance residuals:** AC-07 is verified through the backend filter with SQLite fixtures but not through an end-to-end browser search using those special-character names. AC-09's dog list/detail/pagination behavior is covered, but preservation of vaccination routes is unverified because such a route is Not Found in the main base source. Browser validation used Chromium only; other browsers were not run.
- **Scope and deployment:** Validation was local and no deployment/production validation was performed. The audit findings and route-scope limitation remain open as stated above.
