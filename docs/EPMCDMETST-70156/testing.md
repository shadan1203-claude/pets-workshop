# Testing — EPMCDMETST-70156

**Status:** Focused validation passed
**Approved test design:** `test-cases.md`

## Commands and outcomes

| Working directory | Command | Result |
|---|---|---|
| `app/server` | `py -m unittest test_app` | Passed: 18 tests. |
| `app/client` | `npm run build` | Passed: Astro server build completed. |
| `app/client` | `npx playwright test e2e-tests/search.spec.ts e2e-tests/api-integration.spec.ts --project=chromium --reporter=dot` | Passed: 29 tests. |
| Repository root | `node --check workflow/artifact-paths.js` | Passed in the earlier implementation session; resolver source is not part of PR #20. |
| Repository root | `node workflow/artifact-paths.js validate-stage implementation --jira-id EPMCDMETST-70156` | Not reproducible on resume: direct invocation fails with `ReferenceError: require is not defined in ES module scope` because `workflow/package.json` declares `"type": "module"`. The previous temporary CommonJS compatibility invocation is not a direct-command pass. |
| Repository root | `git diff --check` | Passed; Git emitted only a line-ending notice for an unrelated pre-existing workflow-state file. |

## Acceptance-criteria coverage

- **AC-1:** Flask API coverage verifies breed IDs/names and deterministic alphabetical ordering; browser integration tests verify the breed catalog response.
- **AC-2:** Flask/API tests cover filtering by ID, malformed and unknown IDs, compatibility with existing filters, and behavior when the optional parameter is omitted.
- **AC-3:** Playwright tests cover dropdown selection, URL state, resetting to page 1, filtered pagination, preserving filters in page links, clearing filters, and prevention of stale pagination clicks while requests are pending.

## Limitations

- The full repository-wide test suite and security scan were not run; validation was scoped to the affected Flask and Playwright suites and the client production build.
- The unit, build, and Playwright checks above were run before PR creation and were not rerun during the 2026-11-04 workflow resume.
- GitHub currently reports PR #20's combined status as pending with zero statuses, zero check runs, and no workflow runs. The PR has no formal review. These are not passing remote CI or review results.
- The deployment gate is blocked because `design-review.md`, `implementation-plan.md`, and `development-report.md` are missing from the Jira-scoped folder.
- No deployment was performed.
