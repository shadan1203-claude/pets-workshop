---
description: Prepare a deployment plan and deploy only after immediate explicit human approval.
argument-hint: [JIRA-KEY]
---

# Deployment

Prepare and, only after explicit approval, execute a deployment supported by verified repository/environment evidence.

## Preconditions and evidence

1. Verify Jira issue, state ownership, approved PR, approved testing evidence, and required release approvals. Resolve `requirements`, `testing`, `pr-description`, `deployment`, and any documented release-governance/deployment requirements using `workflow/artifact-paths.js`; output must be Jira-scoped. Stop if the resolver or evidence is unavailable.
2. Read `.claude/CLAUDE.md`, `.claude/agents/deployment.md`, and repository deployment evidence, including applicable Jira-scoped release/deployment artifacts, CI, manifests, and `docs/release-governance.md` where present. Do not treat general documentation as proof that a target is configured.
3. Verify target environment, version/commit, deployment procedure, access, health checks, and rollback from authoritative sources. This repository's orchestration docs state an external deployment target may be unestablished; if no target and procedure are evidenced, prepare a blocked plan and do not execute.

## Plan artifact

Create only the resolver-returned `deployment` artifact, expected as `docs/<JIRA_ID>/deployment.md`. Include verified environment/target, release version/source, exact deployment steps, prerequisites, validation/smoke checks, rollback steps, operational risks, monitoring, evidence sources, and unresolved items. Mark unavailable values `Not Found`; never include secrets or sensitive environment values.

Update state with artifact, risks/blockers, timestamp, and `AWAITING_DEPLOYMENT_APPROVAL`. Present the exact target, version, procedure, risks, and rollback to the user. Require explicit, immediate approval for that specific deployment. A prior approval, PR approval, or artifact status is not enough. If denied or ambiguous, do not execute.

## Execution and evidence

After approval, execute only the verified procedure using authorized tools. Capture actual result, version/commit, UTC timestamp, validation results, monitoring status, and rollback availability. If execution cannot be performed, record `NOT RUN` and the blocker. Update the deployment artifact and workflow state from verified output; never claim success from an attempted command alone. Stop on failure and follow only the approved rollback plan; request approval if rollback authority is not explicit.

## Example

`/deployment PET-123` with no documented target produces a blocked deployment plan and requests environment details; it does not infer a production host or execute a command.