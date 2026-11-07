---
description: Implement only approved work against requirements, architecture, plan, and approved test design.
argument-hint: [JIRA-KEY]
---

# Development

Implement the approved Jira scope. This command may modify application source and repository tests only after every readiness gate passes.

## Mandatory preflight

1. Verify the Jira key and active workflow state; require explicit current human approvals for requirements, architecture, design review, plan, and test design, plus implementation readiness. Do not treat stored status alone as approval.
2. Resolve and read `requirements`, `architecture`, `design-review`, `api-design`, `implementation-plan`, `test-cases`, and `tasks-test` using `workflow/artifact-paths.js`. The test design files are mandatory inputs. If the resolver is absent/fails, or any file is absent, stop without coding and record the exact blocker.
3. Read `.claude/CLAUDE.md`, `.claude/agents/development.md`, and `.claude/skills/implementation/SKILL.md`. Inspect relevant source, tests, dependency manifests, project scripts, hooks, and CI. Preserve the established stack and conventions.
4. Run `hooks/pre-development.sh` using the available shell and report its result. If it fails, stop and resolve the gate; never bypass it without explicit human approval.
5. Map every requirement and acceptance criterion to approved tasks and test cases. If any test case cannot be implemented as written, or an input conflicts with code/architecture, do not guess: create a clarification request in the Jira-scoped development report (or report a blocker if the report path cannot be resolved), update state, and stop before coding.

## Implementation rules

- Make the smallest changes that satisfy all approved requirements, acceptance criteria, and approved test cases.
- Do not alter unrelated behavior or introduce dependencies/technology changes without approved architecture.
- Add/update appropriate tests and validation, logging, and error handling. Never weaken tests to make a run pass.
- Protect secrets and sensitive data. Use repository evidence for commands and configuration.
- Run required post-code-generation quality hooks. Read `hooks/post-codegen.sh` first, then execute it with the available shell. Report all failures; do not silently waive them.

## Output and state

Create only the resolver-returned `development-report` artifact, expected as `docs/<JIRA_ID>/development-report.md`. Include changed files and purpose, requirement/AC/test traceability, exact commands executed, actual results, hook outcomes, decisions, risks, limitations, and clarification requests. Clearly distinguish `PASS`, `FAIL`, and `NOT RUN`; do not report unexecuted tests as passing.

Update workflow state stage/status, artifact references, timestamp, risks, blockers, and decisions without deleting history. Mark development complete only when implementation and applicable post-codegen gates complete. Request readiness for independent code review; do not approve your own work or proceed to PR/deployment.

## Example

`/development PET-123` with missing `test-cases.md` must stop before the first source edit and identify the unresolved required input.