# SDLC Artifact Standards

## Routing and Ownership

- Resolve `JIRA_ID` from the verified active Jira issue. Run the documented `workflow/artifact-paths.js` resolver for every artifact path; stop if it is missing, errors, or returns an unsafe path. Never write SDLC documents directly under root `docs/`.
- Standard artifacts are owned by their workflow phases. Update only impacted artifacts; preserve approved decisions, review history, and traceability.
- `workflow/workflow-state.json` is the execution-state source of truth. Do not duplicate its stage/status, approval history, execution logs, test results, deployment results, or live blockers in durable memory.
- The user-requested test skeleton belongs at `tests/<JIRA_ID>/tasks.test.js` only when supported by the resolver and approved plan. The exact test runner compatibility must be verified; do not label a placeholder skeleton executable.

## Mandatory Artifact Set

The following Jira-scoped files are required when their phases apply:

- `docs/<JIRA_ID>/requirements.md`
- `docs/<JIRA_ID>/architecture.md`
- `docs/<JIRA_ID>/design-review.md`
- `docs/<JIRA_ID>/implementation-plan.md`
- `docs/<JIRA_ID>/test-cases.md`
- `docs/<JIRA_ID>/development-report.md`
- `docs/<JIRA_ID>/code-review.md`
- `docs/<JIRA_ID>/testing.md`
- `docs/<JIRA_ID>/pr-description.md`
- `docs/<JIRA_ID>/deployment.md`
- `docs/<JIRA_ID>/deployment-validation.md`
- `tests/<JIRA_ID>/tasks.test.js` when required by approved test design

Project governance also lists `intake-summary.md` and `api-design.md` as applicable artifacts. Keep them Jira-scoped and use the owning phase.

## Validation and Traceability

- Give requirements and acceptance criteria stable unique IDs. Map each requirement to design, tasks, code, tests, review, and release evidence as applicable.
- Cite evidence and distinguish verified facts, assumptions, recommendations, conflicts, and `Not Found` values.
- Record exact commands and observed results. `NOT RUN`, skipped, blocked, or missing evidence is never `PASS`.
- Record external identifiers (Jira, Confluence, GitHub PR) only after verifying the MCP/tool response.
- Human approval is explicit and phase-specific. An artifact, agent recommendation, saved state, or Jira status does not constitute approval.
- Never include secrets or unsupported claims.

## Illustrative Traceability

`REQ-001 -> ADR-EXAMPLE -> TASK-001 -> TC-AC-01-01 -> source/test evidence` illustrates a chain only. Replace every ID with verified active issue identifiers; the example is not evidence that these artifacts exist.