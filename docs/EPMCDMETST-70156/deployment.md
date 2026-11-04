# Deployment — EPMCDMETST-70156

**Status:** Blocked; PR chain, required SDLC artifacts, and deployment target are incomplete
**Deployment target:** Not specified
**Source:** Jira EPMCDMETST-70156

## Planned change

Deploy the approved breed-ID filter for the dog API and homepage after a remote pull request is reviewed and merged. The change uses the existing breeds and dogs schema and requires no database migration.

## Current workflow gate evidence (2026-11-04)

- Jira story EPMCDMETST-70156 remains **Open**.
- PR #20 and its base PR #19 are both **Open**; neither has been merged.
- GitHub reports pending combined status with zero commit statuses, zero check runs, no workflow runs, and no formal reviews for either PR. No passing CI or review evidence is available.
- The deployment artifact gate fails because `design-review.md`, `implementation-plan.md`, and `development-report.md` are missing from this Jira folder. They were not fabricated or retroactively claimed complete.
- No merge was attempted; the existing user authorization covers deployment after PR merge, not merging.

## Validation evidence

- Flask unit tests: 18 passed.
- Astro production build: passed.
- Focused Playwright search and API integration tests: 29 passed.
- These local checks were run before PR creation and were not rerun on this workflow resume.
- No production or staging deployment validation has been performed.

## Authorization and rollback

- The user authorized deployment after PR merge, but the PR is still open and its base PR #19 is also open.
- Deployment has not been performed.
- The target environment and operator are not specified.
- Target-specific prerequisites, safeguards, release steps, and validation are not specified.
- A target-specific rollback procedure cannot be validated until the environment and release mechanism are known. No deployment artifact or rollback action is claimed.
