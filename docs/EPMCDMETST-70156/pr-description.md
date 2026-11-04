# Pull Request — EPMCDMETST-70156

**Status:** Open — PR #20
**Source:** Jira EPMCDMETST-70156

**Pull request:** https://github.com/shadan1203-claude/pets-workshop/pull/20

## Base and dependency

The PR targets `feature/EPMCDMETST-70332-favorite-badge` so that its diff contains only this Jira story. It is stacked on open PR #19 and will be mergeable to `main` after that base branch is merged.

## Summary

- Add optional server-side `breed_id` filtering to `GET /api/dogs`, applied before count and pagination.
- Preserve alphabetical `GET /api/breeds` output and existing filters; reject malformed IDs with HTTP 400 and return empty results for unknown numeric IDs.
- Change the homepage breed dropdown to use breed IDs and preserve the selected filter in URL state and pagination.
- Disable stale pagination links while a filtered request is pending.
- Update backend/API and Playwright coverage and Jira-scoped documentation.

## Validation

- `py -m unittest test_app` — 18 passed.
- `npm run build` — passed.
- Focused Playwright search and API integration suite — 29 passed.
- `git diff --check` — passed.

## Review

The configured code-review agent initially identified a Medium stale-pagination race. The implementation was corrected and the reviewer confirmed the issue resolved with no new material findings. See `code-review.md`.

## Jira acceptance criteria

- AC-1: Stable alphabetical breed catalog containing IDs and names.
- AC-2: Optional breed ID filters dogs on the server while retaining additive existing filters.
- AC-3: The homepage selection updates results and filtered pagination totals; URLs retain the selected breed.

## Authorization

The user explicitly authorized remote PR creation. GitHub confirmed PR #20 is open and mergeable against its selected base branch.
