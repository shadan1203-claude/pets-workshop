# Implementation Plan — N/A

- **Jira Story:** N/A (not provided)
- **URL:** N/A (not provided)
- **Title:** Change displayed page title/branding from "Pets Workshop" to "Pets Workshop Demo"

## Executive Summary
- **Goal:** Update the application’s visible branding and browser tab titles to clearly indicate the demo environment.
- **In scope:**
  - Update base site name used across HTML `<title>` generation.
  - Update page-specific titles to use the new base application name.
  - Update visible header/site branding text to match.
  - Update Playwright E2E tests that assert titles and branding.
- **Out of scope:**
  - Backend API behavior, data model, seed scripts.
  - Repository name.
  - Documentation refresh outside of these plan/design artifacts (unless a failing test depends on it).

## Acceptance Criteria Mapping
1. **Homepage browser tab title includes "Pets Workshop Demo"**
   - Update homepage title string.
   - Update E2E assertion.
2. **Other pages use "Pets Workshop Demo" as base application name**
   - Update About and Dog Details titles.
   - Update E2E assertions.
3. **Visible top-level site title/branding reflects "Pets Workshop Demo"**
   - Update header branding text.
   - (Optional) add an E2E assertion for header branding text if currently asserted.
4. **Automated tests updated and passing**
   - Update Playwright title assertions and run suite.

## Assumptions
- The intended new brand string is exactly: **"Pets Workshop Demo"**.
- Header/site branding should use the same new string.
- Page title composition should follow the pattern in acceptance criteria, e.g. **"About - Pets Workshop Demo"**.
- Homepage retains the existing suffix **"- Find Your Forever Friend"**; only the base brand string changes.

## Risks
- Other content (docs, screenshots, workshop instructions) may still reference the previous brand.
- Additional pages/components may hardcode the old brand name outside the initially identified files.

## Implementation Steps

### Phase 1: Preparation and branching
1. Create and work on branch: `feature/na`.
2. Identify all occurrences of the existing brand string (currently appears as "Tailspin Shelter" in the Astro UI).

### Phase 2: Frontend changes
1. Update base title default in `app/client/src/layouts/Layout.astro`:
   - Change default title to **"Pets Workshop Demo"**.
2. Update visible branding in `app/client/src/components/Header.astro`:
   - Change the header/site-name link text to **"Pets Workshop Demo"**.
3. Update page-specific titles:
   - `app/client/src/pages/index.astro` → **"Pets Workshop Demo - Find Your Forever Friend"**
   - `app/client/src/pages/about.astro` → **"About - Pets Workshop Demo"**
   - `app/client/src/pages/dog/[id].astro` → **"Dog Details - Pets Workshop Demo"**
4. (Optional improvement) Introduce a single source-of-truth constant for the base site name (e.g., `app/client/src/config/site.ts`) and reuse it in Layout/pages/components.

### Phase 3: Test updates
1. Update Playwright assertions:
   - `app/client/e2e-tests/homepage.spec.ts`
   - `app/client/e2e-tests/about.spec.ts`
   - `app/client/e2e-tests/dog-details.spec.ts`
2. Run E2E tests:
   - From `app/client`: `npm run test:e2e`

### Phase 4: Build and sanity checks
1. From `app/client`: `npm run build`.
2. Optional: `npm run preview` and smoke test:
   - `/`, `/about`, `/dog/1`, `/dog/99999`

## Definition of Done Checklist
- [ ] Base site title/default updated to "Pets Workshop Demo".
- [ ] All relevant pages use the new base site name.
- [ ] Header branding updated to "Pets Workshop Demo".
- [ ] Playwright E2E tests updated and passing.
- [ ] No regressions in navigation/rendering across homepage, about, and dog details.
