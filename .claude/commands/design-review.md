---
description: Independently assess approved requirements and architecture and gate downstream planning.
argument-hint: [JIRA-KEY]
---

# Design Review

Review the proposed architecture against approved requirements and repository evidence. Do not rewrite approved architecture or expand scope.

## Preconditions

1. Verify Jira issue and `JIRA_ID`; confirm the workflow state belongs to this issue.
2. Resolve `requirements`, `architecture`, and `design-review` through `workflow/artifact-paths.js` after ensuring the Jira folder. If the resolver is unavailable, stop and report the blocker; do not guess paths.
3. Read `.claude/CLAUDE.md`, `.claude/agents/design-review.md`, `.claude/skills/design-review/SKILL.md`, and both input artifacts. Require current human approval of requirements and architecture. Stop if either is missing or stale.
4. Use the independent design-review agent/skill when available. Inspect implementation patterns and executable tests as evidence.

## Review dimensions

Evaluate requirement alignment and traceability, security/privacy, reliability, scalability, performance, maintainability, observability, testability, compatibility, dependencies, and operational/deployment risks. For each finding record a stable ID, severity (`Critical`, `High`, `Medium`, `Low`), evidence/reference, impact, affected requirement IDs, and actionable recommendation. Separate findings from assumptions and residual risks.

## Output and decision

Create only the resolver-returned `design-review` artifact, expected as `docs/<JIRA_ID>/design-review.md`. Include:

- Reviewed artifact versions/sources and review scope.
- Findings, severity, evidence, requirement mapping, impact, and recommendation.
- Risk summary and mitigations.
- Required actions and unresolved questions.
- Explicit review outcome: `Approved`, `Approved With Conditions`, `Rejected`, or `Blocked`; state whether each Critical/High finding is resolved, mitigated, or open.
- Reviewer recommendation separately from the human approval decision.

Critical or High findings that remain unresolved block planning and implementation. `Approved With Conditions` is not a waiver: list each condition and require evidence of resolution or explicit human acceptance where permitted by project governance. Never characterize a finding as resolved without evidence.

Validate complete traceability and evidence. Update `workflow/workflow-state.json` stage/status, timestamp, artifact, decisions, risks, and blockers without deleting history. Record human approval in `approvedStages` only after an explicit current response. Request approval before API design; stop until the human approves and blocking findings are resolved.

## Example

`/design-review PET-123` with an open High finding produces a review artifact marked blocked and requests a decision/remediation; it does not launch planning.