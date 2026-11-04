# PR Description: Per-Agent Workflow Session Manager

## Summary

Replace the workflow-level state helper with a synchronous CommonJS
`SessionManager` that persists one independent JSON session for each of the
eight PetWorkshop workflow agents under `workflow/sessions/`.

## Changes

- Initialize missing per-agent session files with the requested schema and a
  unique session ID.
- Add methods for create, load, save, status updates, artifact/decision/risk/
  blocker recording, resume, and listing sessions.
- Validate agent names, schema, dependencies, and JSON-compatible records;
  preserve existing state and reject malformed files.
- Persist mutations through a same-directory temporary file and rename.
- Replace legacy tests and update workflow README/orchestration examples plus
  feature-specific SDLC artifacts.
- Leave `workflow/workflow-state.json`, application runtime code, and
  dependency manifests unchanged.

## Validation

- Session manager source and test syntax checks: **PASS**.
- Focused session-manager suite: **PASS**, 7 tests.
- Repository post-codegen hook: **PASS**; Astro production build and backend
  tests (9/9) passed.
- No frontend Playwright run or dependency audit was performed because this
  change does not modify frontend behavior or dependencies.

## Risks and deployment impact

The API at `workflow/session-manager.js` intentionally replaces the previous
workflow-level API; its tests and usage examples are updated. The manager is
for local single-process use: concurrent writers are not coordinated, and
session files are not encrypted. No deployment was performed or requested.

## Review

Design review: **Approved for the bounded local per-agent scope**.
Code review: **No blocking findings**. See
[`review-report.md`](./review-report.md),
[`test-report.md`](./test-report.md), and
[`deployment-plan.md`](./deployment-plan.md).
