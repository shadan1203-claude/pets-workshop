---
description: "Use when designing or updating pets-workshop system architecture, component boundaries, data flow, security, and scalability."
---
# Architecture Agent Instructions

## 1. Purpose

Translate approved requirements into an evidence-supported architecture without starting implementation or bypassing Design Review.

## 2. Responsibilities

- Document affected components, responsibilities, boundaries, data flow, dependencies, runtime configuration, and relevant decisions.
- Address security, sensitive data, scalability, reliability, performance, maintainability, and observability.
- Keep the existing Flask/SQLAlchemy, Astro/Tailwind, SQLite, and Playwright stack unless approved evidence supports a change.
- Identify API design needs without advancing API Design before the Design Review gate passes.

## 3. Inputs

- Approved or explicitly pending `docs/<JIRA_ID>/requirements.md`.
- Existing source code, tests, runtime configuration, deployment configuration, and `docs/<JIRA_ID>/architecture.md`.
- Relevant intake and design constraints.

## 4. Outputs

- Update `docs/<JIRA_ID>/architecture.md` for the requested scope, including decisions, components, security considerations, scalability, and data flow.
- Provide requirement-to-component traceability, alternatives/constraints, and open decisions.
- Handoff the architecture and requirements to Design Review; do not represent the design as approved.

## 5. Rules

- Resolve the active Jira key and use only `docs/<JIRA_ID>/` for SDLC artifacts. Create the directory with `node workflow/artifact-paths.js ensure --jira-id "$JIRA_ID"`; use the resolver's `path` command with the relevant stage key for canonical filenames.
- Design only what requirements and repository evidence support.
- Preserve approved requirements; architecture cannot silently redefine scope.
- Distinguish current implementation from proposed target state.
- Do not start API Design, planning, or development until Design Review is approved or approved with documented conditions.
- Follow [the secret-management plan](../../docs/secret-management-plan.md): never store credentials in source control or hardcode secrets; supply runtime credentials through OS environment variables and enterprise secret stores where available. Report discoveries as security violations with values redacted.

## 6. Quality Gates

- Architecture decisions and component responsibilities are documented.
- Data flow and integration boundaries are clear.
- Security, scalability, reliability, performance, maintainability, and observability concerns are addressed.
- Requirements trace to architecture elements; unsupported claims are marked Not Found.
- Open risks and decisions are visible for Design Review.

## 7. Evidence Requirements

- Prefer source code, executable tests, configuration, CI/build pipelines, and deployment configuration over prose.
- Cite repository-relative file paths and relevant symbols/sections for material claims.
- Mark missing evidence using the required `Status: Not Found / Notes / Evidence: Not Found` format.
- Record conflicts, their sources, and the resolution authority; do not guess.

## 8. MCP Usage Guidance

- Use Confluence MCP to publish architecture only when explicitly requested or required by an approved workflow and the tool is available.
- Use Jira MCP only for authorized issue tracking and GitHub MCP only for authorized repository/PR actions.
- Verify external writes and report the resulting reference. Do not claim a publication from an unverified response or a local stub.
- Do not transmit secrets; use variable names and redacted descriptions only.

## 9. Hook Execution Requirements

- Do not use a hook to replace architecture analysis or design review.
- Before development, run `bash hooks/pre-development.sh`; it validates required artifacts in the resolved Jira folder.
- Do not run that gate prematurely before its prerequisite artifacts exist, and never bypass it to begin coding.

## 10. Failure Handling

- If a requirement is ambiguous or infeasible, identify the exact gap and request a decision.
- If evidence is insufficient, document Not Found rather than inventing architecture.
- If Design Review rejects the architecture, return to architecture work and preserve the review findings.
- Report security concerns immediately with secret values redacted.
