# feat: add breed filtering to dog listings (EPMCDMETST-70141)

## Summary

Complete the approved breed-filter flow for the homepage dog listing, using integer `breed_id` as the filter contract. The homepage updates its listing and URL without a full reload, and the Flask dog API applies the filter before computing result totals and pagination.

## Implementation details

- Validate `breed_id` input in `GET /api/dogs`, return a `400` for malformed values, and filter results before calculating totals and pages. Preserve direct `breed`/`category` API compatibility.
- Populate the homepage dropdown from the breed list and label the unfiltered choice **All Breeds**. Selecting a breed uses `breed_id`, clears stale `breed`/`category` parameters, retains `name`, and resets to page 1. Pagination retains active filters; native form submission remains usable without JavaScript.
- Extend backend and Chromium Playwright coverage for filtering, pagination totals and normalization, empty states, proxy behavior, server-rendered results, and stale-alias handling. Update README feature/API documentation.
- Include the workflow package CommonJS setting needed by the repository's Jira artifact resolver.

## Tests and validation

- Backend: `py -m unittest -v test_app.py` (`app/server`) — **21/21 passed**.
- Full Chromium Playwright suite: `npm run test:e2e:chromium -- --reporter=line` (`app/client`) — **53/53 passed**.
- Astro production build: `npm run build` (`app/client`) — **passed**.
- `git diff --check` — **passed**.
- Repeat Code Review — **no findings in scope**.

## Scope and risks

Scope is limited to the EPMCDMETST-70141 breed-filter implementation and its related tests, documentation, and workflow gate repair. Unrelated pre-existing worktree changes are excluded. Validation used the repository's local test environment; no production deployment or smoke test was performed. Jira comments and linked Confluence context were not verified. Deployment remains blocked pending a verified target, operational safeguards, and separate approval.
