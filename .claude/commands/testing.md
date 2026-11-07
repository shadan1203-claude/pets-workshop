---
description: Execute approved tests, record honest evidence and coverage, and request release-test approval.
argument-hint: [JIRA-KEY]
---

# Testing

Execute the applicable validation against the reviewed implementation and produce a factual test report.

## Preconditions

1. Verify active Jira key and matching workflow state. Require approved requirements, architecture, plan, test design, development report, and final human-approved code review with no unresolved Critical/High findings.
2. Resolve all inputs and output (`requirements`, `architecture`, `implementation-plan`, `test-cases`, `tasks-test`, `development-report`, `code-review`, `testing`) through `workflow/artifact-paths.js`. Ensure the Jira folder first. Stop and record a blocker if resolver/input is unavailable.
3. Read `.claude/CLAUDE.md`, `.claude/agents/testing.md`, and `.claude/skills/testing/SKILL.md`. Inspect test configuration and dependency sources. Use the testing agent/skill when available.

## Execute

- Run repository-supported unit, integration, validation, and E2E tests applicable to the change, plus relevant regression and security checks required by repository hooks/CI.
- Read scripts/configuration before choosing commands. Prefer focused checks first, then required broader checks. Never invent a command or change dependencies just to make a check appear runnable.
- Capture exact commands, environment/context that affects results, exit status, test counts, failures, skips, and coverage output if actually produced.
- Map each test case and acceptance criterion to executed evidence. An absent, blocked, or unexecuted check is `NOT RUN`; it is never `PASS`. Do not fabricate coverage percentages or results.
- If a test fails, report it and route the defect back to development. Do not alter product code or tests to conceal a failure.

## Output and gate

Create only the resolver-returned `testing` artifact, expected as `docs/<JIRA_ID>/testing.md`. Include test scope, exact commands, passed/failed/not-run tests, actual coverage or `Not collected`, acceptance-criterion coverage, failures, environmental blockers, known risks, recommendations, and release recommendation.

Update workflow state with artifact, timestamp, results, risks/blockers, and status. Testing is complete only when required checks have run and pass, or a human-approved exception is explicitly recorded under governance; do not unilaterally waive failures. Present the report and require explicit human approval before `/pr-generation`.

## Example

`/testing PET-123` when the Playwright server cannot start records the suite as `NOT RUN` with the reason; it must not claim E2E success.