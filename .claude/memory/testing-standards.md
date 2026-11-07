# Testing Standards

## Coverage Requirement

- Required minimum: 80% code coverage for the scope measured by the project's approved coverage configuration.
- The repository's coverage tool, coverage scope, and CI-enforced threshold are `Not Found` from the currently verified configuration. Do not invent a percentage from test count or claim the threshold passes without a coverage report.
- A missing coverage measurement is `NOT RUN` or `Not collected`, never `PASS`. Resolve the coverage-tooling gap through an approved plan; do not add a dependency unilaterally.

## Test Categories

Design applicable Positive, Negative, Edge, Unit, Integration, and End-to-End cases. Not every layer applies to every change; record the evidence-based rationale for non-applicable layers.

## Acceptance-Criteria Mapping

- Preserve Jira acceptance-criterion IDs exactly and map every criterion to one or more stable test-case IDs.
- Each test case states its scenario, expected result, layer, and mapped requirement/AC IDs.
- An untestable or missing AC is a blocker for clarification, not implicitly covered.

## Naming and Test Assets

- Follow the configured Python `unittest` and Playwright projects and existing naming conventions in neighboring test files.
- `tests/<JIRA_ID>/tasks.test.js` is a requested workflow design asset only when an approved plan calls for it. The current frontend package's test runner is Playwright; a Jest-style `describe`/`test` skeleton is not assumed executable. Verify the runner before generating or running it.
- Do not report placeholders, skipped tests, failed tests, or unexecuted tests as passing.

## Verified Commands

- Backend: from `app/server`, `python -m unittest -v test_app.py`.
- Frontend build: from `app/client`, `npm run build`.
- Browser tests: from `app/client`, `npm run test:e2e -- --project=chromium`.
- Select only commands supported by the changed slice and record exact output/status in `docs/<JIRA_ID>/testing.md`.

## Example

`TC-AC-01-01` may map a positive test to `AC-01`; use real Jira IDs in project test artifacts. `AC-01` here is an illustrative pattern only.