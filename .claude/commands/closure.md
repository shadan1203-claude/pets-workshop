---
description: Validate post-deployment evidence and artifacts, then request explicit workflow closure approval.
argument-hint: [JIRA-KEY]
---

# Closure

Perform post-deployment validation and prepare closure evidence. Do not close the workflow until every required check succeeds and the human explicitly approves closure.

## Preconditions

1. Verify Jira key and matching workflow state. Require verified deployment evidence and approved deployment. If deployment is not applicable, require documented governance evidence and an explicit human-approved disposition; do not silently skip it.
2. Resolve `requirements`, `architecture`, `implementation-plan`, `test-cases`, `tasks-test`, `development-report`, `code-review`, `testing`, `pr-description`, `deployment`, and `deployment-validation` using `workflow/artifact-paths.js`. Confirm every required path resolves inside its allowed Jira-scoped location (the test asset only in the explicitly requested `tests/<JIRA_ID>/` location). If resolver is missing or any required file is absent, record a blocker and stop.
3. Read the approved requirements/ACs, final test report, PR evidence, deployment plan and evidence, applicable hooks, and `.claude/agents/testing.md`. Do not infer deployment success from PR merge or command invocation.

## Validation

- Execute applicable post-deployment smoke tests and health checks only against the verified target, using documented commands and authorized access.
- Record exact commands, timestamp, target/version, actual results, failed/not-run checks, and acceptance-criterion coverage.
- Verify mandatory files exist: `requirements.md`, `architecture.md`, `implementation-plan.md`, `test-cases.md`, `development-report.md`, `code-review.md`, `testing.md`, `pr-description.md`, and `tests/<JIRA_ID>/tasks.test.js`. Also verify intake, design review, API design, deployment, and other phase artifacts required by governance.
- Validate traceability from Jira acceptance criteria through requirements, plan, test cases/results, code review, PR, and deployment evidence. List any gaps as blockers.

## Output and closure gate

Create only the resolver-returned `deployment-validation` artifact, expected as `docs/<JIRA_ID>/deployment-validation.md`. Include artifact checklist with resolved paths/status, smoke-test evidence, deployed version and timestamp when verified, acceptance coverage, incidents/failures, residual risks, and closure recommendation. Never report `NOT RUN` as `PASS`.

Update workflow state with validation artifact, evidence, blockers/risks, and status `AWAITING_CLOSURE_APPROVAL` or `BLOCKED`. Request explicit human approval after presenting all evidence. Only on a clear approval set `status` to `CLOSED`, `currentStage` to `closure`, update timestamp and record the decision; otherwise leave the workflow in progress. Do not delete historical state.

## Example

`/closure PET-123` with a missing deployment validation artifact or unavailable smoke-test evidence remains blocked/in progress and requests the missing evidence.