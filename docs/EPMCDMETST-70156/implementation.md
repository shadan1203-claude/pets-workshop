# Implementation — EPMCDMETST-70156

**Status:** Implemented

## Summary

- `GET /api/dogs` accepts an optional integer `breed_id`. The Flask route rejects malformed values with HTTP 400 and filters with `Breed.id` before counting and applying pagination. Unknown integer IDs return HTTP 200 with an empty result. Existing name and legacy `breed`/`category` predicates remain additive, and the dog pagination response shape is unchanged.
- `GET /api/breeds` remains ordered alphabetically and returns the existing breed IDs and names.
- The homepage breed dropdown uses breed IDs and initializes from `breed_id`. Its selection requests page 1, updates the URL, and restores filter state on browser back/forward. Pagination links retain the ID and other active filters; clear actions remove all filters. The existing same-origin proxy continues forwarding query parameters.
- Pagination links are disabled while a filter request is pending so stale links cannot override the selected filter's page-1 request.
- Updated Flask and Playwright coverage for ID filtering, invalid/unknown IDs, additive filters, filtered pagination, dropdown selection, URL state, history, and clearing. The Jira-scoped artifacts document the API and homepage changes; unrelated pre-existing edits in the root README are not included in the story branch.
- No database schema changes were needed.

## Validation

Commands were run from the indicated directories:

| Directory | Command | Result |
|---|---|---|
| `app/server` | `py -m unittest test_app` | Passed: 18 tests |
| `app/client` | `npm run build` | Passed: Astro server build completed |
| `app/client` | `npx playwright test e2e-tests/search.spec.ts e2e-tests/api-integration.spec.ts --project=chromium --reporter=dot` | Passed: 29 tests, including a delayed-response regression for stale pagination links |

`git diff --check` passed for the implementation changes. No PR, deployment, or commit was created.
