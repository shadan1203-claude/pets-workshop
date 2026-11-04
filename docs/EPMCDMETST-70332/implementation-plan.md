# Implementation Plan: EPMCDMETST-70332

## Status and approval boundary

**Planning artifact prepared by an explicitly authorized alternative because
the configured Planning specialist was unavailable.** The author is an
authorized alternative, not the configured specialist; this deviation is
recorded in `workflow-state.json`.

**Status: APPROVED FOR PRE-DEVELOPMENT GATE.** Human decision (2026-11-03):
“Approve plan and authorize pre-development gate.” This approval authorizes
the pre-development gate. If it passes, Development may proceed only through
the configured Development specialist as separately authorized for this
bounded task; if that specialist is unavailable, stop and request
authorization for an alternative. No direct implementation, tests, pull
request, deployment, or commit is authorized by this artifact.

The approved upstream inputs are `requirements.md`, `architecture.md`,
`design-review.md`, and `api-design.md`. DR-01 is accepted: the marker may
appear after client initialization, so implementation must read storage early
and test the initialization transition. API Design specifies no server API
changes. OQ-01—how favorites are added or removed—remains unresolved and is
not part of this plan.

## Executive Summary

Implement a read-only, browser-local favorite marker on dog listing cards.
Read `tailspin:favorites:v1` as a JSON array of integer `Dog.id` values, fail
closed to an empty set for absent, malformed, invalid, or inaccessible
storage, and apply the same rule to the initial server-rendered cards and
client-rendered pagination/search results. Preserve existing dog APIs and
listing behavior. Add focused Playwright coverage for marker membership,
pagination, refresh, invalid storage, and accessibility.

## Scope

**In scope**

- An accessible, non-color-only marker for each listing card whose dog ID is
  present in the valid stored ID set.
- The approved storage read contract and invalid-storage fallback.
- Consistent marker state on initial cards, client-rendered results, page
  changes, and refresh.
- Automated browser tests and relevant documentation updates.

**Out of scope**

- Any favorite writer, toggle, add/remove interaction, or management page.
- API, database, authentication, server-storage, telemetry, or deployment
  topology changes.
- Resolving OQ-01, cross-device/account synchronization, or changing the
  approved storage format.

## Assumptions

- The exact visual icon, copy, and placement remain an implementation choice;
  it must satisfy NFR-01 and the approved Architecture.
- Only safe integer IDs are accepted, as specified by Architecture. Ignore
  invalid array entries and collapse duplicates.
- Browser storage is origin/profile-specific. E2E tests must seed the exact
  test origin before navigation.
- The currently inspected `app/client/README.md` is generic Astro starter
  documentation and contains no favorite feature guidance; do not rewrite it
  merely to satisfy documentation scope. Update relevant product-facing
  documentation if an appropriate existing location is identified during
  Development, and record the implemented behavior in the Jira-scoped
  development artifact.

## Dependencies

- Plan approval is recorded; the resolver's pre-development gate must pass
  before Development. Development is limited to the configured Development
  specialist under the current authorization.
- Approved upstream artifacts and decisions: FR-01–FR-04, NFR-01–NFR-02,
  accepted DR-01, and the no-API-change determination.
- No new packages, API contract, environment variables, or database migration
  are anticipated.
- The current client E2E setup is configured in
  `app/client/playwright.config.ts` for Chromium and starts the test API and
  Astro development server.

## Risks

| ID | Risk | Mitigation |
| --- | --- | --- |
| R-01 / accepted DR-01 | SSR cannot read localStorage; a card may initially be unmarked before client code initializes. | Read and apply state as early as practical; assert the correct post-initialization state on initial load and refresh. Do not add server persistence to hide the transition. |
| R-02 | Initial markup and `renderDogs` are separate card-render paths. | Use the same ID-to-marker rule for both; test initial and client-rendered cards across pages and filtering. |
| R-03 | Storage can be absent, malformed, inaccessible, or contain invalid entries. | Validate the array and integer IDs; handle parse/access exceptions as an empty set without blocking the listing. |
| R-04 / OQ-01 | No writer or user interaction is authorized, so values may not be populated by the app. | Seed values only in tests; do not implement a writer/control or treat this as a blocker to the read-only marker. |
| R-05 | Playwright storage is scoped to its browser origin. | Seed storage with `addInitScript` before navigation and verify refresh retains the same origin-scoped value. |
| R-06 | The visual design is not prescribed. | Select a clear marker with accessible name/text, and verify it is not color-only. |

## Requirement Traceability

| Requirement | Planned coverage |
| --- | --- |
| FR-01; Jira AC 1–2 | Tasks PL-01–PL-03: marker appears only on cards whose IDs are in the valid set; verify matching and non-matching cards. |
| FR-02; Jira AC 3 | Tasks PL-02–PL-03: apply the same state to initial and fetched cards; verify at least two pages and refresh. |
| FR-03 | Task PL-02: read only `tailspin:favorites:v1` as a JSON array of integer `Dog.id` values; no writes or migration. |
| FR-04 | Tasks PL-02–PL-03: absent, malformed JSON, non-array, invalid/no-valid-ID values, and storage-access failure remain non-fatal and show no markers. |
| NFR-01 | Tasks PL-01 and PL-03: marker exposes accessible text/name and is not conveyed by color alone. |
| NFR-02 | Tasks PL-02–PL-03: retain dog IDs only in localStorage; do not send IDs to API, logs, or telemetry. |
| Jira exclusion; OQ-01 | All tasks: no favorites page, writer, or favorite-changing interaction. OQ-01 remains open. |

## Task Breakdown

Tasks are proposed for execution by the configured Development specialist
only after plan approval and a passing pre-development gate.

| ID | Task and source/test targets | Requirements | Dependencies | Verification |
| --- | --- | --- | --- | --- |
| PL-01 | Add a stable dog-ID hook and accessible marker presentation to `app/client/src/components/DogList.astro`; keep the marker hidden/absent until client state matches. Preserve card links and existing content. | FR-01, NFR-01 | None | E2E assertions can locate cards by dog ID and observe a named marker only on matches. |
| PL-02 | Implement one browser-only read/normalize/decorate path in `app/client/src/pages/index.astro`. Apply it early to initial SSR cards and after `renderDogs` replaces results. Catch storage access/JSON failures, accept only safe integer IDs, and do not write storage or alter API requests. | FR-01–FR-04, NFR-02 | PL-01 | Review both render paths and exercise the planned Playwright cases. |
| PL-03 | Add focused tests, preferably `app/client/e2e-tests/favorites.spec.ts`, using patterns in `homepage.spec.ts` and `search.spec.ts`. Seed storage before navigation; test match/non-match, at least two pages, refresh, invalid/absent data, and accessible marker output. Add a controlled storage-read failure case if it can be reliably simulated in this browser harness. | FR-01–FR-04, NFR-01–NFR-02 | PL-01, PL-02 | `npm run test:e2e:chromium -- --grep "favorite|pagination"` from `app/client`. |
| PL-04 | Update a relevant existing product document only if an appropriate documentation location is found; do not rewrite the generic starter README. Record implementation and verification details in the Jira-scoped development artifact in its later authorized phase. | Jira Definition of Done; FR-03 | PL-02, PL-03 | Review changed documentation against the approved contract and scope. |

## Validation Strategy

Run after plan approval and implementation, from `app/client`:

1. `npm run test:e2e:chromium -- --grep "favorite|pagination"` — focused
   browser validation for card state, invalid/absent storage, pagination,
   refresh, and accessibility.
2. `npm run build` — validate Astro production build and server-rendered
   component/script integration.
3. Run the broader `npm run test:e2e:chromium` if focused tests or shared
   pagination paths indicate regressions; complete the repository-required
   full validation at the Testing/PR gates.

There is no lint script in the inspected `app/client/package.json`; do not
claim a lint run unless a configured repository lint command is found later.
Inspect the final code diff to confirm there are no API, database, storage
writer, or unrelated changes. No tests or builds were run during Planning.

## Testing Strategy

- Seed `tailspin:favorites:v1` with IDs obtained from rendered dog-card detail
  links before page navigation.
- Verify a seeded ID has one accessible marker and another displayed ID has
  none; also verify an empty set produces no markers.
- Seed IDs on the first and later result pages; paginate and confirm state
  follows each ID, then refresh and confirm the same IDs remain marked after
  client initialization.
- Verify filtering/client result replacement preserves the same matching
  behavior.
- Cover missing key, malformed JSON, non-array JSON, mixed invalid entries,
  and a value with no valid integer IDs. Verify the list remains usable and
  has no markers when the normalized set is empty.
- Exercise storage-access failure if reliably expressible in Playwright; if
  not, document the harness limitation and cover the catch/fallback through a
  focused test of the chosen reader boundary.
- Check the marker's accessibility name/text and ensure the state is not
  conveyed by color alone.
- Confirm favorites remain browser-local: no favorite IDs in listing request
  URLs or API payloads; do not add telemetry or server-side state.

## Code Review Readiness

- Every card path uses the same dog-ID matching rule and does not rely on
  array order.
- Storage reads only the approved key, validates untrusted values, and fails
  closed without interrupting listing/search.
- The initial client read is early enough to honor accepted DR-01 and is
  tested after client initialization.
- Marker semantics are accessible and non-color-only.
- No favorite writer/control, favorites page, API/database changes,
  cross-device behavior, logging of IDs, unrelated files, or unresolved OQ-01
  assumption has entered the diff.
- Tests and production build pass; relevant documentation and test evidence
  are present before the separate Code Review and Testing gates.

## Deployment Considerations

- Architecture identifies Astro Node standalone output and an existing client
  container, but no production hosting target or deployment pipeline was
  identified. Confirm the current approved frontend release process at the
  Deployment phase; this plan does not authorize or imply a deployment.
- The expected change is frontend-only. Build and release the updated client
  through the existing process; no Flask service, database, migration,
  environment setting, or API version change is expected.
- Test against the deployed browser origin because localStorage is origin
  scoped. Keep the existing API and service health checks unchanged.
- Obtain the required human approvals for implementation, review, testing,
  PR, and deployment in their respective workflow gates. Plan approval alone
  is not release approval.

## Rollback Plan

If the frontend release causes listing or marker regressions, restore the
previous client build/image or revert the frontend-only change through the
approved release process. The design is read-only and performs no localStorage
writes or migration, so rollback requires no database action and must not
clear the user's `tailspin:favorites:v1` value. The listing should remain
usable without the marker after rollback.

## Definition of Done

- Approved requirements FR-01–FR-04 and NFR-01–NFR-02 are satisfied without
  resolving OQ-01 or expanding scope.
- Initial, paginated, filtered, and refreshed cards correctly reflect the
  stored IDs after client initialization; invalid storage remains non-fatal.
- Automated tests cover the planned acceptance and accessibility behavior and
  pass; the production build passes.
- Code review, Testing, relevant documentation, and all later phase gates are
  complete under their own approvals.
- No commit, pull request, or deployment is implied by completion of this
  plan.

## Development-Ready Handoff

The user approved this plan with “Approve plan and authorize pre-development
gate.” The next authorized action is to run the repository's pre-development
gate. If it passes, invoke only the configured Development specialist; do not
implement directly or substitute another agent. If the gate fails, record its
exact output and stop. If the configured Development specialist is
unavailable, stop and request authorization for an alternative. Keep the
marker read-only, preserve the accepted SSR-to-client transition, make no API
changes, leave OQ-01 unresolved, and stop at the next required human approval
gate.

## Pre-development gate result (2026-11-03)

The first invocation ran `bash hooks/pre-development.sh` without `JIRA_ID` and
exited 1 because the resolver found multiple Jira workflow folders. On retry,
the approved Jira key was set in the environment (`JIRA_ID=EPMCDMETST-70332`)
and the same command, `bash hooks/pre-development.sh`, exited 0:

```text
Checking prerequisites
Using Jira artifact directory: C:\Github capstone\pets-workshop\docs\EPMCDMETST-70332
All prerequisite artifacts found
```

The gate passed; no prerequisite was bypassed. The configured Development
specialist is not callable through the available agent invocation interface.
No implementation began. Stop and request authorization for an alternative
Development specialist before proceeding.
