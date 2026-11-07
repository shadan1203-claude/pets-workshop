# Approved Decisions

This append-only register contains durable architectural or implementation decisions explicitly approved by a human. It is not a workflow ledger and does not authorize a new action. Confirm applicability against the current Jira-scoped artifacts before relying on an entry.

## Decision Register

No approved decisions have been recorded in this memory file yet.

| Decision ID | Decision | Reason | Approval Date | Approver | Impacted Requirements | Evidence |
| --- | --- | --- | --- | --- | --- | --- |

## Add or Amend a Decision

- Use a unique sequential ID such as `ADR-001`; verify there is no collision before adding it.
- Record the exact decision, rationale, approval date, approver identity only when known, affected Jira requirement IDs, scope, and evidence link/path.
- Append new decisions. Never overwrite or delete an approved decision. Supersede it with a new decision ID and an explicit `Supersedes` reference.
- A recommendation, agent output, Jira status, prior session, or unverified memory entry is not human approval.
- Keep sensitive details out of the register; reference an approved secure system instead.

## Illustrative Entry (Not Approved)

`ADR-001` and `ADR-002` are ID-format examples only and are currently unallocated. This entry demonstrates the format only; it is not a project decision and must not be copied into the register as approved:

```text
ADR-EXAMPLE
Decision: Example decision text.
Reason: Example rationale.
Approval Date: YYYY-MM-DD
Approver: Not Found
Impacted Requirements: REQ-EXAMPLE
Evidence: Link to the explicit human approval and Jira-scoped artifact.
Status: EXAMPLE ONLY - NOT APPROVED
```