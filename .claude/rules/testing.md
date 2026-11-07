---
paths:
  - "tests/**"
  - "app/client/e2e-tests/**"
  - "app/server/test_*.py"
  - "docs/**/test*.md"
---

# Testing Rules

- Use the repository's Python `unittest` and Playwright projects. Inspect `app/server/requirements.txt`, `app/client/package.json`, and existing tests before choosing commands. Do not add a test dependency without an approved plan.
- Verified commands: backend `python -m unittest -v test_app.py` from `app/server`; frontend build `npm run build` and browser tests `npm run test:e2e -- --project=chromium` from `app/client`.

## Testing Design (owns `test-cases.md`, `tests/<JIRA_ID>/tasks.test.js`)

- Design Positive, Negative, Edge, Unit, Integration, End-to-End, Accessibility, and Performance cases as applicable. Record an evidence-based rationale for any layer that does not apply.
- Every Jira acceptance criterion maps to at least one test case with a unique Test ID, Scenario, Expected Result, layer, and Requirement/AC mapping. An untestable or ambiguous criterion needs clarification, not assumed coverage.
- Accessibility cases cover keyboard operation, labels/roles, and focus for new UI. Performance cases cover pagination bounds and query behavior for new endpoints. Do not add accessibility or performance tooling without an approved plan; until then record those cases as designed but not automated.
- `tests/<JIRA_ID>/tasks.test.js` is a design skeleton only when an approved plan calls for it. Use `describe('<JIRA_ID>')` with nested `Positive Cases`, `Negative Cases`, `Edge Cases`, and `Acceptance Criteria Mapping` groups, a TODO per case, and one mapping test per AC. The frontend runner is Playwright; do not claim a Jest-style skeleton executes.

## Testing Execution (owns `testing.md`)

- Execute applicable unit, integration, E2E, regression, and validation suites. Record exact commands, environment, outcomes, failures, skips, coverage actually collected, AC coverage, risks, and recommendations.
- Minimum coverage is 80% for the approved scope. A figure counts only from an actual report; if tooling is unavailable record `Not collected`. `NOT RUN`, skipped, blocked, or failed is never `PASS`.
- Failures return to Development, then Code Review and Testing are repeated. Never waive a failure without explicit human approval. Never weaken a test to make a run pass.
