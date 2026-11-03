# Testing Report: EPMCDMETST-70332

## Status and authorization

**Testing completed; recommendation: READY FOR HUMAN RELEASE-READINESS / PR
DECISION.** All checks executed for this phase passed.

The configured Testing specialist was unavailable. The user explicitly
authorized an alternative agent for Testing; this report records that
deviation and does not attribute the work to the configured specialist. Work
was limited to the Testing phase. No code was changed, and no PR, deployment,
or commit was created.

## Approved inputs and scope

Before testing, reviewed the approved Jira-scoped Requirements, Architecture,
Design Review, API Design, and Implementation Plan, plus the Development
Report, Code Review, and current workflow state. The Jira issue is
EPMCDMETST-70332, “ENH-03: Show favorite badge/icon on dog cards in listing.”
Code Review recommends **APPROVE** with no findings.

Testing verifies the read-only localStorage contract
`tailspin:favorites:v1`, matching/nonmatching dog-card markers, persistence
across pagination and refresh, safe fallback behavior, accessibility, and
the unchanged dog-list API boundary. DR-01's SSR-to-client initialization
transition was explicitly accepted by the user. OQ-01 (how favorites are
added or removed) remains open; no writer or interaction is in scope.

## Commands and results

All commands below were freshly executed for this Testing phase.

| Command (working directory) | Exit | Result |
| --- | ---: | --- |
| `node workflow/artifact-paths.js path testing --jira-id EPMCDMETST-70332` (repository root) | 0 | Resolved the canonical report path to `docs/EPMCDMETST-70332/testing.md`. |
| `node workflow/artifact-paths.js validate-stage testing --jira-id EPMCDMETST-70332` (repository root) | 0 | Required Jira-scoped Testing prerequisites were present. |
| Focused Chromium Playwright run (`app/client`; exact invocation below) | 0 | **10 passed** in 8.6 seconds using the configured Chromium Playwright project. |
| `bash hooks/post-codegen.sh` (repository root) | 0 | Required Astro production build completed; the hook's `$PYTHON -m unittest -v test_app.py` step ran **13 tests**, all passed. `$PYTHON` is selected by the hook's interpreter detection. |
| `git diff --check` (repository root) | 0 | No whitespace errors in tracked changes. The Jira report and workflow state are untracked, so both were separately checked for trailing whitespace; none was found. |

Exact Playwright invocation:

```text
npm run test:e2e:chromium -- --grep 'favorite|pagination'
```

The Playwright run executed these relevant cases:

- Favorite markers: matching initial and paginated cards after refresh;
  missing, malformed JSON, non-array JSON, and no-valid-ID storage;
  mixed valid/invalid entries; and inaccessible localStorage.
- Existing pagination regression coverage: homepage pagination controls and
  filtered pagination behavior.

No test failures or skips were reported. The focused run also observed normal
`GET /api/dogs` and `GET /api/breeds` traffic. Its favorites test verifies
that the favorites storage key is not added to dog API request URLs. The
backend unit tests verify the existing dogs response structure, IDs, and
pagination/filter behavior. No backend source changes are present in the
worktree.

The workflow state was parsed and checked after updating: Jira key and Testing
stage match, `testing.md` is registered at the resolver-derived location,
status is `AWAITING_HUMAN_RELEASE_READINESS`, and no active blockers remain.
The Testing artifact path and `validate-stage testing` were re-run after the
report was created and both exited 0.

## Acceptance-criteria traceability

| Requirement / acceptance | Test evidence | Outcome |
| --- | --- | --- |
| Jira AC 1 / FR-01 / AC-01: a favorite card has a clear marker | `favorites.spec.ts`: dog ID 1 on the initial page and ID 7 on page 2 show the marker. | Pass |
| Jira AC 2 / FR-01 / AC-02: a non-favorite card has no marker | The same test confirms IDs 2 and 8 remain unmarked. | Pass |
| Jira AC 3 / FR-02 / AC-03: correct marker state across pagination | The test navigates to page 2 and checks the favorite and non-favorite there. | Pass |
| Jira AC 3 / FR-02 / AC-04: correct state after refresh | The test reloads page 2 and rechecks IDs 7 and 8 against the same seeded state. | Pass |
| FR-04 / AC-05: absent, malformed, non-array, or no-valid-ID storage is non-fatal | Four browser cases assert the listing remains visible with six cards and no markers. Mixed data also confirms only valid integer IDs match. | Pass |
| Storage access failure | A browser init script makes the `localStorage` getter throw; listing remains visible with six cards and no favorite marker. | Pass |
| NFR-01 / AC-06: marker is accessible and not color-only | The favorite marker is visible, has role `status`, accessible name “Favorited,” and text “Favorited”; non-favorites have no marker. | Pass |
| API boundary / NFR-02 | E2E asserts the favorites key is absent from dog API request URLs; backend tests pass for existing response shape and pagination. No backend source files are modified. | Pass |
| Accepted DR-01: marker accuracy follows client initialization | The browser test asserts the marker after page initialization and after refresh. It does not measure pre-hydration timing; that transition is accepted and remains a stated limitation. | Pass with limitation |

## Environment and coverage limits

- Browser coverage is Chromium only, as configured by Playwright; Firefox,
  WebKit, and production-deployed origins were not exercised.
- Browser tests use the configured local Flask test server and Astro
  development server. The build was run separately by the required hook.
- No code-coverage report or percentage was collected.
- The SSR-to-client transition timing itself was not measured; tests verify
  the post-initialization result, consistent with accepted DR-01.
- No separate API contract suite beyond the existing backend unit tests and
  E2E request-boundary assertion was run.
- No PR or pre-PR hook was run because this task explicitly stops before the
  PR step. No commit or deployment was made.

## Handoff

Testing passes and recommends proceeding to **human release-readiness / PR
decision**. This is a Testing recommendation, not release approval or PR
authorization. OQ-01 remains open; DR-01 remains accepted. Preserve the
read-only favorite-state scope and do not infer authorization for a writer,
deployment, PR, or commit.
