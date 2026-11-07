---
description: Design Jira acceptance-criterion-mapped tests and create the requested test skeleton.
argument-hint: [JIRA-KEY]
---

# Testing Design

Design tests from approved requirements, architecture, and plan. This phase specifies tests; it does not claim execution or implement product behavior.

## Preconditions and paths

1. Verify the active Jira key and matching workflow state. Require approved requirements, architecture, design review, and implementation plan. Read `.claude/CLAUDE.md`, `.claude/agents/testing-design.md`, and `.claude/skills/testing-design/SKILL.md`.
2. Resolve `requirements`, `architecture`, `implementation-plan`, `test-cases`, and the Jira test-skeleton artifact via `workflow/artifact-paths.js`, after `ensure --jira-id "$JIRA_ID"`. The expected test asset is `tests/<JIRA_ID>/tasks.test.js`; verify the resolver returns that exact issue-scoped destination and that it is outside `docs/` only because the user explicitly requires a repository test asset. If the resolver does not support this artifact or is missing, stop and report the blocker; do not construct the path yourself.
3. Read all inputs and inspect existing test frameworks/configuration before choosing syntax or assumptions. Do not add a test dependency as part of design.

## Test design artifact

Create `test-cases` (expected `docs/<JIRA_ID>/test-cases.md`) with test cases covering:

- Positive behavior, negative behavior, and boundary/edge cases.
- Unit, integration, validation, and end-to-end scenarios where applicable to the architecture.
- Every Jira acceptance criterion, including ACs with multiple cases where needed.

Each case must include a unique Test ID, Scenario, Expected Result, and Requirement Mapping. Include preconditions, test layer, and evidence/source references when useful. Add an explicit AC-to-test mapping table and flag any AC that cannot be tested from current information as a blocker, not as covered.

## Test skeleton

Create the resolver-returned `tasks-test` asset as JavaScript with exactly these top-level suites and at least one clearly named placeholder per applicable category. Preserve the requested `TODO` bodies; placeholders are design artifacts, not passing tests. Include one acceptance-criterion mapping test for every actual Jira AC using its real ID; do not assume there are only AC1/AC2.

```js
describe('<JIRA_ID>', () => {
  describe('Positive Cases', () => {
    test('...', () => {
      // TODO
    });
  });

  describe('Negative Cases', () => {
    test('...', () => {
      // TODO
    });
  });

  describe('Edge Cases', () => {
    test('...', () => {
      // TODO
    });
  });

  describe('Acceptance Criteria Mapping', () => {
    test('AC1', () => {
      // TODO
    });
  });
});
```

Replace `<JIRA_ID>` and `AC1` with the verified Jira key and actual acceptance-criterion identifiers. If the established test runner cannot parse this requested structure, document that incompatibility and stop for clarification instead of adding dependencies or misrepresenting the skeleton as executable.

## Gate

Validate each AC maps to one or more test IDs, IDs are unique, expected results are observable, both outputs resolve to the required locations, and placeholders are not reported as executed tests. Update state stage `testing-design`, artifacts, timestamp, decisions/blockers, and status. Request explicit human approval before development and stop.

## Example

`/testing-design PET-123` creates a TODO test mapping for each retrieved Jira AC. A missing acceptance criterion blocks a complete mapping and must be reported for clarification.