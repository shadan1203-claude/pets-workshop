# Pull Request Description — EPMCDMETST-70332

**Draft only — prepared for review; no GitHub PR has been created.**

**Jira:** EPMCDMETST-70332 — ENH-03: Show favorite badge/icon on dog cards in listing

## Summary

Show an accessible “Favorited” marker on dog cards when the dog's ID appears in the browser's `tailspin:favorites:v1` localStorage JSON array. Apply the same read-only matching behavior to initial cards and client-rendered listing results.

## Business Value

Users can recognize already-favorited dogs while browsing the paginated listing, including after navigating between pages or refreshing.

## Changes

- Add dog-ID hooks and an initially hidden, accessible “Favorited” marker to dog cards.
- Read and validate safe integer IDs from the approved localStorage key; treat missing, malformed, non-array, invalid, or inaccessible storage as an empty set.
- Apply markers to both initial server-rendered cards and client-rendered results after pagination or filtering.
- Add Playwright coverage and update the product and E2E documentation.
- Do not add a storage writer, toggle, favorites page, API/backend/database change, or telemetry. **OQ-01 (how favorites are added or removed) remains open.**

## Architecture Impact

Client-only presentation change. The existing dog-list response already provides each `Dog.id`; the API contract, backend, and database remain unchanged. The listing reads localStorage but does not modify it.

The user accepted **DR-01**: server-rendered cards cannot read browser localStorage, so the marker becomes accurate after client initialization. This transition is preserved; its timing was not measured.

## Requirements Mapping

| Requirement | Evidence / outcome |
| --- | --- |
| Jira AC 1 / FR-01: mark favorited dogs | `favorites.spec.ts` verifies markers for IDs 1 and 7. |
| Jira AC 2 / FR-01: do not mark non-favorites | The same test verifies IDs 2 and 8 remain unmarked. |
| Jira AC 3 / FR-02: preserve state across pagination and refresh | The test checks page 2 and then reloads it with the same seeded localStorage state. |
| FR-04: fail safely for invalid or inaccessible storage | Tests cover missing, malformed, non-array, no-valid-ID, mixed, and inaccessible storage. |
| NFR-01: accessible, non-color-only marker | Test verifies role `status`, accessible name “Favorited,” and visible text. |
| API boundary | E2E asserts the favorites key is not added to dog API request URLs; backend tests verify existing listing behavior. |

## Testing Evidence

Results recorded in `testing.md`:

- From `app/client`: `npm run test:e2e:chromium -- --grep 'favorite|pagination'` — exit 0; **10 passed** in 8.6 seconds, no failures or skips.
- From repository root: `bash hooks/post-codegen.sh` — exit 0; Astro production build passed and the hook ran **13 backend unit tests, all passed**.
- From repository root: `git diff --check` — exit 0.
- **Code Review:** configured code-review specialist recommended **APPROVE**, with no findings.

Browser coverage is Chromium only; Firefox, WebKit, and production-deployed origins were not exercised. No coverage percentage was collected. The SSR-to-client transition timing was not measured.

## Deployment Impact

No deployment was performed or is claimed. No API, backend, database, or infrastructure change is included.

## Rollback Plan

Revert the scoped card-marker and browser-reader changes, their focused E2E spec, and related documentation updates. The feature only reads localStorage, so rollback requires no data migration or server-side cleanup.

## Risks and Limitations

- OQ-01 remains open: the application does not add or remove favorites; marker display depends on IDs already present in localStorage.
- By accepted DR-01, SSR cards may initially be unmarked until client initialization; this transition was not timed.
- Automated browser testing was Chromium-only.

## Reviewer Checklist

- [ ] Confirm the marker matches only valid stored dog IDs and remains correct across pagination and refresh.
- [ ] Confirm invalid/inaccessible storage leaves the listing usable and the marker accessible.
- [ ] Confirm accepted DR-01 and open OQ-01 are preserved; no writer or favorites interaction was added.
- [ ] Confirm the existing API/backend contract is unchanged.
- [ ] Review the Code Review and Testing evidence and their stated coverage limits.

## Workflow Delegation

Development and Testing were completed by explicitly authorized alternative agents because their configured specialists were unavailable; the deviations are recorded in `development-report.md` and `testing.md`. This PR description was also prepared by an explicitly authorized alternative because the configured PR Generation specialist was unavailable. The configured code-review specialist completed Code Review. This draft is not a PR, release, or deployment approval.
