# Developer Handoff — N/A

- **Jira Story:** N/A (not provided)
- **URL:** N/A (not provided)
- **Title:** Change displayed page title/branding from "Pets Workshop" to "Pets Workshop Demo"

## Suggested Branch
- `feature/na`

## Summary
Update the Astro UI branding and `<title>` strings (currently using "Tailspin Shelter") to **"Pets Workshop Demo"**, and update Playwright E2E tests that assert page titles.

## Files to Change
### Confirmed
- `app/client/src/layouts/Layout.astro`
- `app/client/src/components/Header.astro`
- `app/client/src/pages/index.astro`
- `app/client/src/pages/about.astro`
- `app/client/src/pages/dog/[id].astro`
- `app/client/e2e-tests/homepage.spec.ts`
- `app/client/e2e-tests/about.spec.ts`
- `app/client/e2e-tests/dog-details.spec.ts`

### Likely (optional)
- `app/client/e2e-tests/README.md` (only if it references the old brand)

## Required Title Outputs
- Homepage: **"Pets Workshop Demo - Find Your Forever Friend"**
- About: **"About - Pets Workshop Demo"**
- Dog Details: **"Dog Details - Pets Workshop Demo"**
- Layout default (when no title is provided): **"Pets Workshop Demo"**

## Implementation Notes
- Current state (from repo):
  - `Layout.astro` defaults title to "Tailspin Shelter".
  - Pages pass explicit strings such as "About - Tailspin Shelter".
  - Header branding text is hardcoded and should be updated.
- Prefer a single source-of-truth constant for the site name if doing more than a small string swap.

## Validation Requirements
- Run from `app/client`:
  - `npm run test:e2e`
  - `npm run build`
- Manual smoke checks:
  - Verify browser tab title and header branding on `/`, `/about`, `/dog/1`, `/dog/99999`.

## Assumptions
- Replace only the brand portion; keep the homepage suffix "- Find Your Forever Friend".
- No backend changes are needed.

## Risks
- Additional pages/components may hardcode the old name outside the listed files.
- Workshop docs/screenshots may become inconsistent; not in scope unless it breaks tests.
