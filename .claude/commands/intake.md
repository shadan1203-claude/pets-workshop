---
description: Start a Jira-scoped SDLC workflow, gather source evidence, and request intake approval.
argument-hint: [JIRA-KEY or issue description]
---

# Intake

Initiate an SDLC workflow for `$ARGUMENTS`. Do not begin requirements analysis in this command.

## Preconditions and routing

1. Resolve the active Jira issue using the Jira MCP tool when available. If `$ARGUMENTS` contains a key, retrieve that issue and confirm it is the intended issue. If no unambiguous Jira key can be established, ask the user and stop. Never invent a key, issue field, acceptance criterion, comment, or link.
2. Set `JIRA_ID` to the verified issue key for this workflow. Confirm that the checked-out repository is `pets-workshop`.
3. Use the repository artifact resolver for every artifact path:

   ```sh
   node workflow/artifact-paths.js ensure --jira-id "$JIRA_ID"
   node workflow/artifact-paths.js path --jira-id "$JIRA_ID" --artifact intake-summary
   ```

   If the resolver is missing, errors, or returns a path outside the Jira folder, stop before creating files and record the blocker in the response. Do not construct a substitute path or write directly under `docs/`.
4. Read `.claude/CLAUDE.md` and the applicable `.claude/agents/intake.md`. Use the intake agent when available. Use Jira and Confluence MCP as the systems of record when available; distinguish unavailable integrations from absent data.
5. Inspect `workflow/workflow-state.json`. It is the repository's existing single-workflow state record. If it is active for a different Jira issue, stop rather than overwrite that workflow. If its `workflowId` is empty, initialize it only after confirming the Jira key. Do not discard existing decisions, risks, blockers, or artifact references.

## Work

- Retrieve the issue summary, description, status, reporter/owner when relevant, all acceptance criteria, comments, and Jira links. Cite issue fields and comment dates/identifiers in the intake artifact where available.
- Retrieve linked Confluence pages through Confluence MCP when available. Record page titles/URLs and relevant verified content; if inaccessible, write `Not Found` and explain the missing source.
- Analyze repository context read-only: relevant source, tests, configuration, CI, hooks, applicable instructions, existing architecture, and nearby Jira-scoped artifacts. Prefer executable code and tests over prose when they conflict.
- Separate verified facts, user-provided context, assumptions, unknowns, conflicts, risks, and blockers. Do not create Jira or Confluence records as a substitute for missing inputs.

## Output

Create only the resolver-returned `intake-summary` artifact, expected as `docs/<JIRA_ID>/intake-summary.md`. Include:

- Jira key, title, status, and source references.
- Business goal and requested outcome.
- Acceptance criteria verbatim or faithfully quoted, each with a stable source reference; if none are present, explicitly record `Not Found`.
- Relevant Jira comments and linked Confluence pages, with retrieval status.
- Repository areas and evidence inspected.
- Scope, constraints, known dependencies, assumptions, risks, conflicts, and blockers.
- Requirement questions that need clarification before requirements can be approved.
- Status `READY FOR INTAKE APPROVAL` or `BLOCKED`, and a proposed next phase.

Validate the file exists at the resolver-returned path and contains evidence for every material claim. Then update `workflow/workflow-state.json` without changing its schema: set `workflowId` to the Jira key, `currentStage` to `intake`, `status` to `AWAITING_APPROVAL` (or `BLOCKED`), set `lastUpdated`, add the artifact reference under `artifacts`, and append decisions/blockers without deleting prior records. The state file is orchestration state, not an SDLC artifact.

Present the intake summary and request an explicit human decision to proceed to requirements. Approval must be a clear response in the current conversation; do not infer it from Jira status, prior approvals, an agent recommendation, or stored state. Stop here until approved.

## Example

`/intake PET-123` retrieves PET-123, verifies the active issue, and prepares its intake artifact. If Jira MCP is unavailable and no locally verifiable issue context is supplied, report the blocker and ask for the issue context; do not fabricate it.