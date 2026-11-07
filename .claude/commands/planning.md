---
description: Create an approved, traceable implementation plan after design review and approved API design.
argument-hint: [JIRA-KEY]
---

# Planning

Plan implementation tasks from approved requirements and design. Do not change scope or begin coding.

## Preconditions

1. Verify the Jira issue/key and state ownership. Require approved requirements, architecture, design review, and API design, with no unresolved Critical/High design findings.
2. Resolve `requirements`, `architecture`, `design-review`, `api-design`, and `implementation-plan` through `workflow/artifact-paths.js`; run `ensure --jira-id "$JIRA_ID"` first. If the resolver is missing/fails, stop and report the blocker; never hardcode a fallback.
3. Read `.claude/CLAUDE.md`, `.claude/agents/planning.md`, and `.claude/skills/implementation-planning/SKILL.md`, plus all approved inputs.

## Generate the implementation plan

Create only the resolver-returned `implementation-plan` artifact, expected as `docs/<JIRA_ID>/implementation-plan.md`. Include:

- Epics, stories, and ordered, actionable tasks with stable IDs.
- Mapping from every task to requirement and acceptance-criterion IDs.
- Dependencies, sequencing, ownership only when known, assumptions, risks, and external blockers.
- Affected components/files identified from evidence, without asserting unverified changes.
- API/data migration and compatibility considerations, if applicable.
- Deployment considerations, operational requirements, and a concrete rollback plan grounded in repository evidence. If target or commands are unknown, mark `Not Found` and block dependent execution.
- Validation strategy: unit, integration, validation, E2E, security, regression, and acceptance criteria coverage as applicable; cite existing commands/configuration rather than inventing commands.
- Required artifacts and gates, including test design before development.

## Validate and gate

Check all requirements/ACs have tasks and verification coverage, dependencies are ordered, and no task exceeds approved scope. Update workflow state for `planning`, the plan artifact reference, decisions/risks/blockers, and timestamp. Record approval only after explicit human approval. Present the plan and request approval before `/testing-design`; stop until approved.

## Example

`/planning PET-123` must stop before generating an implementation plan if the design review has unresolved Critical/High findings or API design cannot be completed.