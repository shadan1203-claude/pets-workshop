---
paths:
  - "docs/**"
  - "tests/**"
  - "workflow/**"
---

# Artifact Rules

## Mandatory artifact set (per `JIRA_ID`)

Resolve each path with `workflow/artifact-paths.js`; the resolver keys are in parentheses.

- `docs/<JIRA_ID>/intake-summary.md` (`intake-summary`)
- `docs/<JIRA_ID>/requirements.md` (`requirements`)
- `docs/<JIRA_ID>/architecture.md` (`architecture`)
- `docs/<JIRA_ID>/design-review.md` (`design-review`)
- `docs/<JIRA_ID>/api-design.md` (`api-design`)
- `docs/<JIRA_ID>/implementation-plan.md` (`implementation-plan`)
- `docs/<JIRA_ID>/test-cases.md` (`test-cases`)
- `docs/<JIRA_ID>/development-report.md` (`development-report`)
- `docs/<JIRA_ID>/code-review.md` (`code-review`)
- `docs/<JIRA_ID>/testing.md` (`testing`)
- `docs/<JIRA_ID>/pr-description.md` (`pr-description`)
- `docs/<JIRA_ID>/deployment.md` (`deployment`)
- `docs/<JIRA_ID>/deployment-validation.md` (`deployment-validation`)
- `tests/<JIRA_ID>/tasks.test.js` (`tasks-test`), when required by approved test design

## Quality

- Cite evidence, and distinguish verified facts, assumptions, recommendations, conflicts, and `Not Found` values.
- Give requirements and acceptance criteria stable IDs and map each to design, tasks, code, tests, review, and release evidence.
- Record exact commands and observed results. Never include secrets or unsupported claims.
- Record external identifiers (Jira, Confluence, GitHub PR) only after verifying the tool response.
- Update only the artifacts a change impacts; preserve approved decisions and review history.
- Non-SDLC exports (for example CodeMie analytics) do not belong under `docs/`.
