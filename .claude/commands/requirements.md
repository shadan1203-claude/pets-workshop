---
description: Turn an approved Jira intake into traceable, testable requirements and request approval.
argument-hint: [JIRA-KEY]
---

# Requirements

Create the Jira-scoped requirements specification from the approved intake. Do not design or implement the solution here.

## Preconditions

1. Verify the Jira key against the active issue using Jira MCP when available. Set `JIRA_ID`; do not infer it from an unrelated artifact.
2. Resolve `intake-summary` and `requirements` with `workflow/artifact-paths.js`. Run `node workflow/artifact-paths.js ensure --jira-id "$JIRA_ID"` first. If the resolver is absent or fails, stop and report a blocker; never hardcode a fallback path.
3. Read the intake summary, `.claude/CLAUDE.md`, `.claude/agents/requirements.md`, and `.claude/skills/requirement-analysis/SKILL.md`. Confirm the intake decision is explicitly approved in the current workflow state and by the human. Otherwise stop.
4. Check `workflow/workflow-state.json`: `workflowId` must match `JIRA_ID`, intake approval must be recorded, and this command must not overwrite an active workflow for another issue.
5. Use the requirements specialist agent and the requirements skill when available. Jira and Confluence MCP remain authoritative for external requirements.

## Generate

Create only the resolver-returned `requirements` artifact, expected as `docs/<JIRA_ID>/requirements.md`. Include:

- Source basis and evidence status for Jira, Confluence, user input, and repository context.
- Problem statement, goals, users/stakeholders, scope, and explicit out-of-scope items.
- Functional requirements with stable IDs (`FR-001`, `FR-002`, ...), source references, and verifiable outcomes.
- Non-functional requirements with stable IDs (`NFR-001`, ...), measurable targets only when sources establish them; otherwise mark `Not Found` and state what clarification is needed.
- Jira acceptance criteria preserved with stable IDs (`AC-01`, `AC-02`, ...), source references, and testable Given/When/Then wording. Do not add or silently reinterpret acceptance criteria.
- Assumptions, constraints, dependencies, open questions, and a risk register with likelihood/impact where evidence supports ratings, mitigation, owner if known, and status.
- Traceability mapping from each requirement and acceptance criterion to its source.

Keep unknowns explicit as `Not Found`; distinguish assumptions from requirements. If the intake evidence is contradictory or insufficient to define acceptance criteria, record the blocker and ask for clarification rather than finalizing unsupported requirements.

## Validate and gate

Check requirement IDs are unique, every requirement has a source or is explicitly an approved assumption, acceptance criteria are testable, and all required sections exist. Confirm no scope has been introduced without a source. Update `workflow/workflow-state.json` preserving its existing schema: set `currentStage` to `requirements`, status to `AWAITING_APPROVAL` or `BLOCKED`, update timestamp and artifact reference, and append the decision/blocker. Add `requirements` to `approvedStages` only after explicit human approval, never when the artifact is merely generated.

Present the artifact and request explicit human approval before architecture. Stop until approved.

## Example

`/requirements PET-123` requires a matching, approved `intake-summary.md`. If intake is missing or not approved, do not generate requirements; state exactly which precondition is unmet.