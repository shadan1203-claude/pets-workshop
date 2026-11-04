# Per-Agent Workflow Session Manager Implementation Plan

## Approved scope

Replace the existing untracked workflow-level implementation at
`workflow/session-manager.js` with the approved per-agent session manager.
Update its focused tests and workflow documentation to match. Do not alter the
shelter application, existing `workflow/workflow-state.json`, dependencies, or
external services.

## Dependency-ordered tasks and status

1. **Complete — Requirements:** Defined supported agents, schema, API,
   persistence, validation, and risks in `requirements.md`.
2. **Complete — Architecture and design review:** Documented fixed allowlist,
   local JSON flow, error handling, atomic replacement, constraints, and review
   disposition in `architecture.md` and `design-review.md`.
3. **Complete — API design:** Defined signatures, filenames, schema,
   validation, and return/error behavior in `api-design.md`.
4. **Complete — Implementation:** Replaced `workflow/session-manager.js`;
   updated `workflow/session-manager.test.js`, `workflow/README.md`, and
   `workflow/orchestration-example.md`.
5. **Complete — Review:** Direct review found no blocking correctness issues;
   findings and limitations are recorded in `review-report.md`.
6. **Complete — Testing:** Seven focused Node.js tests, syntax checks, the
   frontend production build, and the backend unittest suite passed. Exact
   commands and results are in `test-report.md`.
7. **Complete — Deployment and PR artifacts:** No deployment was performed;
   local adoption boundaries and PR description are recorded in
   `deployment-plan.md` and `pr-description.md`.

## Validation results

- `node --check workflow\session-manager.js` — passed.
- `node --check workflow\session-manager.test.js` — passed.
- `node workflow\session-manager.test.js` — passed, 7 tests.
- `bash hooks/post-codegen.sh` — passed; Astro production build and backend
  unittests (9/9) passed.
- No dependencies or application runtime code were changed.

## Scope boundaries and residual risks

No asynchronous API, multi-process lock, distributed persistence, encryption,
agent dispatch, approval enforcement, or application runtime integration is
included. Session data is local plain JSON; do not store credentials or
secrets. Concurrent writers may overwrite one another.
