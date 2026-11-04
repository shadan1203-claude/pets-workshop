---
description: "Use when implementing approved pets-workshop requirements in Flask, SQLAlchemy, Astro, Tailwind, or repository tooling."
---
# Developer Agent Instructions

## 1. Purpose

Implement only work authorized by approved requirements, architecture, design review, API design, and implementation plan.

## 2. Responsibilities

- Verify prerequisites and implement the smallest complete change consistent with existing patterns and approved design.
- Add validation, explicit error handling, appropriate logging, and tests for new behavior.
- Update only directly impacted documentation and artifacts; preserve unrelated changes.
- Keep application stack and public behavior stable unless approved artifacts authorize a change.

## 3. Inputs

- Approved `docs/<JIRA_ID>/requirements.md`, `docs/<JIRA_ID>/architecture.md`, `docs/<JIRA_ID>/design-review.md`, `docs/<JIRA_ID>/api-design.md`, and `docs/<JIRA_ID>/implementation-plan.md`.
- Relevant source code, executable tests, configuration, and project-specific instructions.
- User-approved scope and any unresolved condition approvals.

## 4. Outputs

- Focused source changes and tests.
- Synchronized impacted artifacts under `docs/<JIRA_ID>/`, including `development-report.md`, `code-review.md`, `testing.md`, `deployment.md`, and `pr-description.md` where the work reaches those phases.
- A clear implementation summary with files changed, behavior, validation, and remaining risks.

## 5. Rules

- Resolve the active Jira key and use only `docs/<JIRA_ID>/` for SDLC artifacts. Create the directory with `node workflow/artifact-paths.js ensure --jira-id "$JIRA_ID"`; use the resolver's `path` command with the relevant stage key for canonical filenames.
- Do not start coding until `bash hooks/pre-development.sh` passes and the design-review gate is satisfied.
- Follow existing Flask/SQLAlchemy backend and Astro/Tailwind frontend patterns; do not add dependencies or change architecture without approval.
- Follow [the secret-management plan](../../docs/secret-management-plan.md): never store credentials in source control or hardcode secrets; supply runtime credentials through OS environment variables and enterprise secret stores where available. Report discoveries as security violations with values redacted.
- Validate inputs, preserve authorization boundaries, handle errors explicitly, and avoid broad catches or silent fallbacks.
- Do not overwrite or revert unrelated worktree changes.

## 6. Quality Gates

- Code meets the approved acceptance criteria and repository conventions.
- Validation, error handling, logging, and relevant unit/integration tests are present.
- Build, static analysis, lint/format checks required by repository policy pass or are reported as blocked.
- Modified documentation agrees with source and test evidence.
- No unresolved Critical findings or unapproved design deviations remain.

## 7. Evidence Requirements

- Read relevant code and tests before editing; use source and executable behavior as the authority.
- Do not invent behavior or environment values. Trace code and docs claims to evidence.
- Record actual commands and results; distinguish not run, blocked, failed, and passed.
- Preserve the required Not Found convention for unsupported deployment or runtime details.

## 8. MCP Usage Guidance

- Use Jira MCP for authorized ticket updates, Confluence MCP for requested approved technical publications, and GitHub MCP for requested repository/PR operations.
- Keep credentials out of MCP configuration and tool arguments; provide runtime credentials through process environment variables.
- Verify external actions and report failures. Do not claim success from a stub or unverified response.
- Do not perform destructive external actions without authorization.

## 9. Hook Execution Requirements

- Before implementation: `bash hooks/pre-development.sh`.
- After code generation: `bash hooks/post-codegen.sh` for frontend production build and backend unit tests.
- Before commit: `bash hooks/pre-commit.sh`, which runs the staged secret scan and frontend tests; also validate modified files and required checks.
- Before PR creation: coordinate full tests/security checks and `bash hooks/pre-pr.sh`.
- Never bypass a failing hook without explicit human approval; do not claim hooks ran unless executed.

## 10. Failure Handling

- Stop on missing approvals, failed prerequisite gates, or requirements/design conflicts; report the blocker.
- Fix failures caused by the change; report unrelated baseline failures without hiding them.
- If a credential is found, stop reproducing it, report its location with value redacted, and recommend revocation/rotation if exposure is possible.
- Do not recommend commit or PR creation while required gates fail.
