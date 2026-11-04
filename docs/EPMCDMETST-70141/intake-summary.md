# Intake Summary — EPMCDMETST-70141

**Retrieved:** 2026-11-04
**Source of truth:** Jira story `EPMCDMETST-70141`
**Intake status:** Approved by the user on 2026-11-04

## Jira issue

- **Title:** Breed filter on Dogs listing (UI + API)
- **Type / status:** Story / Open
- **Priority / effort:** P0 / M
- **Assignee:** Unassigned
- **Business goal:** Reduce browsing friction and improve dog discovery by letting users filter the homepage listing by breed.

## Requested scope

1. Add `GET /api/breeds`, returning breed IDs and names sorted by name.
2. Extend `GET /api/dogs` with an optional breed filter and ensure pagination totals describe the filtered result set.
3. Add a breed dropdown to the homepage, populated from `/api/breeds`.
4. Reflect the selected filter in the URL and update the listing without a full-page reload.
5. Preserve the filter in pagination URLs; reset to page 1 when the filter changes.
6. Show an empty state when no dogs match.
7. Update relevant documentation and create automated tests.

### Jira acceptance criteria

- The homepage dropdown contains “All Breeds” and breeds retrieved from `/api/breeds`.
- Selecting a breed updates the URL (the story permits `breed_id` or `breed`) and refreshes the list without a manual reload.
- `GET /api/dogs` filters results and reports `total` / `total_pages` for that filtered set.
- Pagination links preserve the selected breed.
- A no-match result displays an empty state; pagination is hidden or limited to one page.

## Constraints, assumptions, and exclusions

- Jira’s explicit assumption recommends integer `breed_id` rather than a breed name. It also identifies the homepage listing as the target.
- The story says there are no explicit dependencies, but relies on existing Breed data/model.
- Out of scope: multi-select breeds, advanced search by name/age/gender, and saving filter preferences to a user profile.
- Jira lists risks around fixed-content E2E tests and documentation potentially differing from the repository.
- Repository `copilot-instructions.md` additionally calls for an API Design phase and `api-design.md`; retain that repository workflow requirement for later phases.

## Repository and existing-artifact evidence

- The repository is a Flask/SQLAlchemy backend (`app/server`) and Astro/Tailwind frontend (`app/client`).
- The current working-tree source already contains breed-related implementation: the API source has `/api/breeds` and `breed_id` filtering; the homepage source fetches breeds, reads the filter from the URL, and preserves it when building pagination URLs. `app/server/test_app.py` also contains breed-filter test cases.
- These files are locally modified and uncommitted. The current branch is `feature/EPMCDMETST-70332-favorite-badge`, not a branch for this Jira. Relevant modified files include `app/client/src/pages/index.astro`, `app/server/app.py`, `app/server/test_app.py`, `app/client/e2e-tests/api-integration.spec.ts`, and `app/client/e2e-tests/search.spec.ts` (diff summary: 361 insertions and 31 deletions). The user explicitly approved treating these breed-filter edits as candidate implementation for this story. This does not attribute or approve any unrelated worktree changes. No tests or build were run during intake. No edits to these candidate source files were made during intake.
- Before intake setup, `docs/EPMCDMETST-70141/` did not exist. The Jira-scoped folder and initial workflow state were created with the artifact-path resolver. No other Jira folder was selected.

## Comments and Confluence context

- Jira `getIssue` returned the story details above but no comments. No Jira comments-read MCP tool was exposed in the available tools, so comments could not be verified; this must not be interpreted as “no comments.”
- No issue-specific Confluence context was identified. A generic page search did not return a page titled for this Jira; targeted CQL searches failed with HTTP 400, and a scoped page query returned no results. The issue response did not provide linked Confluence page IDs.

## Risks and open questions

1. The candidate implementation is on a branch labeled for another Jira and remains unvalidated. Keep other pre-existing worktree changes untouched.
2. Jira comments and linked Confluence context remain unverified because the available reads did not provide them.
3. The working-tree implementation has not been validated; acceptance coverage and any remaining gaps must be assessed only after the required approvals.

## Approval gate

The user approved the intake and clarified: **treat the existing uncommitted breed-filter changes as candidate implementation for EPMCDMETST-70141**. Preserve all unrelated changes. Intake is approved; subsequent phase gates remain in force.
