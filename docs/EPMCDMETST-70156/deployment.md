# Deployment — EPMCDMETST-70156

**Status:** Blocked; deployment target is not specified
**Deployment target:** Not specified
**Source:** Jira EPMCDMETST-70156

## Planned change

Deploy the approved breed-ID filter for the dog API and homepage after a remote pull request is reviewed and merged. The change uses the existing breeds and dogs schema and requires no database migration.

## Validation evidence

- Flask unit tests: 18 passed.
- Astro production build: passed.
- Focused Playwright search and API integration tests: 29 passed.
- No production or staging deployment validation has been performed.

## Authorization and rollback

- The user authorized deployment after PR merge, but the PR is still open and its base PR #19 is also open.
- Deployment has not been performed.
- The target environment and operator are not specified.
- A target-specific rollback procedure cannot be validated until the environment and release mechanism are known. No deployment artifact or rollback action is claimed.
