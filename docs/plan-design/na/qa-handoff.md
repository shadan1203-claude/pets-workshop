# QA Handoff — N/A

- **Jira Story:** N/A (not provided)
- **URL:** N/A (not provided)
- **Title:** Change displayed page title/branding from "Pets Workshop" to "Pets Workshop Demo"

## Scope
Verify browser tab titles and visible header branding reflect **"Pets Workshop Demo"** across key pages, and confirm Playwright E2E tests pass after updating title assertions.

## Acceptance Criteria → Test Scenarios

### AC1: Homepage browser tab title includes "Pets Workshop Demo"
- Navigate to `/`.
- Verify `document.title`:
  - Expected: **"Pets Workshop Demo - Find Your Forever Friend"**
- Negative check:
  - Title should not contain the old brand (currently "Tailspin Shelter").

### AC2: Other pages use "Pets Workshop Demo" as base application name
- Navigate to `/about`.
  - Expected title: **"About - Pets Workshop Demo"**
- Navigate to `/dog/1`.
  - Expected title: **"Dog Details - Pets Workshop Demo"**

### AC3: Visible top-level site title/branding reflects "Pets Workshop Demo"
- On `/`, `/about`, `/dog/1`, verify header brand link text:
  - Expected: **"Pets Workshop Demo"**
- Click header brand and verify it navigates to `/`.

### AC4: Automated tests updated and passing
- From `app/client` run:
  - `npm run test:e2e`
- Expected: all tests pass, including updated assertions in:
  - `e2e-tests/homepage.spec.ts`
  - `e2e-tests/about.spec.ts`
  - `e2e-tests/dog-details.spec.ts`

## Additional Edge Cases
1. **Dog not found:** Navigate to `/dog/99999` and confirm:
   - Title is still **"Dog Details - Pets Workshop Demo"**
   - Error banner is visible (existing behavior)
2. **Direct deep-linking:** Open `/about` directly (not via navigation) and verify title/header.
3. **Refresh behavior:** Refresh on `/dog/1` and confirm title/header remain correct.
4. **Navigation:** Navigate between pages and confirm titles update correctly.
5. **Case/whitespace:** Ensure exact expected strings, no trailing spaces.
