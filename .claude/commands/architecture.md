---
description: Design a repository-grounded architecture from approved requirements and request approval.
argument-hint: [JIRA-KEY]
---

# Architecture

Produce the architecture artifact for an approved requirements baseline. This phase describes design; it does not implement it.

## Preconditions and evidence

1. Verify the active Jira key, set `JIRA_ID`, and confirm `workflow/workflow-state.json` belongs to this Jira workflow.
2. Resolve `requirements` and `architecture` via `workflow/artifact-paths.js` after `ensure --jira-id "$JIRA_ID"`. If that resolver is unavailable or returns an unsafe path, stop without writing and report the blocker.
3. Read the requirements artifact, `.claude/CLAUDE.md`, `.claude/agents/architecture.md`, and `.claude/skills/architecture/SKILL.md`. Require explicit requirements approval from the current human interaction and state. If absent, stop.
4. Use the architecture agent and skill when available. Inspect relevant source, tests, configuration, CI, and existing approved architecture. Do not rely on an agent's claims without repository evidence.

## Generate

Create only the resolver-returned `architecture` artifact, expected as `docs/<JIRA_ID>/architecture.md`. Include:

- Context, goals, non-goals, constraints, and decisions derived from approved requirements.
- Components and responsibilities, including existing versus proposed components.
- Data flow and important sequence/state transitions; use Mermaid only where it improves precision.
- API, UI, persistence, and integration boundaries as applicable. Mark unknown contracts `Not Found` rather than inventing them.
- Security and privacy controls, input validation, authentication/authorization boundaries, and sensitive-data handling.
- Performance, reliability, failure handling, scalability, and observability considerations.
- Dependencies, migration/compatibility impacts, risks, alternatives, and unresolved decisions.
- Traceability matrix mapping every FR/NFR/AC to components, design decisions, and verification approach.
- Evidence references to source files, tests, configurations, and approved requirements.

Preserve the current Flask/SQLAlchemy, Astro/Tailwind, SQLite, and Playwright architecture unless approved requirements and human approval authorize a change. Do not claim a deployment target or external integration that repository evidence does not establish.

## Validate and gate

Verify all requirements and acceptance criteria map to design or an explicit unresolved decision, security and operational concerns are covered, and the artifact agrees with repository evidence. Set state stage `architecture`, status `AWAITING_APPROVAL` or `BLOCKED`, update timestamp and artifact reference, and append material decisions/risks/blockers. Add `architecture` to `approvedStages` only after explicit approval.

Present the architecture and request explicit human approval before design review. Stop until approved.

## Example

`/architecture PET-123` must not proceed if requirements were edited after their recorded approval; request a fresh requirements review and approval first.