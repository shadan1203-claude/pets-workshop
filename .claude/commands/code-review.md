---
description: Independently review the implementation and test design, report findings, and gate testing.
argument-hint: [JIRA-KEY]
---

# Code Review

Perform an independent review of the implementation against approved scope. Do not implement fixes in this command.

## Preconditions

1. Verify Jira key and workflow-state ownership. Resolve `requirements`, `architecture`, `design-review`, `implementation-plan`, `test-cases`, `tasks-test`, `development-report`, and `code-review` through `workflow/artifact-paths.js` after ensuring the Jira folder. If missing/unusable, stop without writing.
2. Read `.claude/CLAUDE.md`, `.claude/agents/code-review.md`, and `.claude/skills/code-review/SKILL.md`. Confirm development is complete and review the actual diff/source, not only the report. Require all approved inputs and development report.
3. Use the code-review specialist and skill when available. Keep the review independent of the developer's self-assessment.

## Review

Review correctness, acceptance-criterion coverage, security/privacy, error handling, data integrity, compatibility, performance, maintainability, testability, test quality, scope control, and operational impact. For each finding provide a stable ID, severity (`Critical`, `High`, `Medium`, `Low`), exact file/symbol evidence, impact/reproduction context, affected requirement/AC/test IDs, and recommended action. Separate confirmed defects from questions and residual risks.

## Output and gate

Create only the resolver-returned `code-review` artifact, expected as `docs/<JIRA_ID>/code-review.md`. Include scope and reviewed revision, findings, security findings, maintainability/testability observations, requirement/test traceability gaps, risks, and an explicit recommendation (`Approve`, `Request Changes`, or `Blocked`).

Critical and High findings must be resolved and re-reviewed before testing proceeds. Do not mark findings resolved without new evidence. If there are no findings, state that explicitly and retain remaining risks/test gaps. Update workflow state with artifact, timestamp, findings/risks/blockers, and status. Require explicit human approval of the final review before adding the stage to `approvedStages` or proceeding to `/testing`.

## Example

`/code-review PET-123` that finds an authorization defect returns `Request Changes`, records a Critical/High finding, and stops; it does not edit the implementation or launch tests.