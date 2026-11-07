# Approved Decisions

This append-only register contains durable architectural or implementation decisions explicitly approved by a human. It is not a workflow ledger and does not authorize a new action. Confirm applicability against the current Jira-scoped artifacts before relying on an entry.

## Decision Register

| Decision ID | Decision | Reason | Approval Date | Approver | Impacted Requirements | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| ADR-001 | Code Review precedes Testing Execution in the SDLC sequence. | Avoid test cycles on code that fails review. | 2026-11-07 | Human user (identity not stated) | Governance | Chat decision during the Claude-native refactor audit |
| ADR-002 | Refactor the SDLC framework to Claude Code conventions as a separate scope from EPMCDMETST-70052; remove the documentation-sync package, its skills and its agent documents; baseline commit first. | Audit found Copilot-era artifacts and unwired governance. | 2026-11-07 | Human user (identity not stated) | Governance | Chat approval; baseline commit 40ab235 |
| ADR-003 | Accept the existing Astro 7 (`^7.3.2`) and `@astrojs/node` 11 (`^11.1.5`) upgrades from baseline commit `aec8eda`, and resolve the three `npm audit` advisories (astro, undici, zod) in `app/client` without `--force`: pin `astro` to `~7.3.3` in `package.json` (resolves to 7.3.8) and regenerate `package-lock.json`. This narrower variant supersedes the earlier Option A (plain `npm audit fix`, lockfile only, astro 7.4.7), which was applied and validated but never committed. Reverting `aec8eda` is rejected. | The pre-upgrade tree (astro 6, `@astrojs/node` 10) reports 13 advisories (1 critical, 11 high, 1 low) in today's database; the upgraded tree reports 0 after the fix. Reverting the whole commit would also remove the `npm test` script that `hooks/pre-commit.sh`, `hooks/pre-pr.sh` and `.git/hooks/pre-commit` call. | 2026-11-07 | Human user (identity not stated) | DR-14; NFR-1, NFR-4 | Chat approval (Option A, then the `~7.3.3` variant); `app/client/package.json` (`astro` `^7.3.2` to `~7.3.3`, one line) and `package-lock.json` (61 version changes, astro 7.3.2 to 7.3.8, undici 8.10.2 to 8.12.4, zod 4.6.5 to 4.6.7); `npm audit` 0 vulnerabilities, build PASS, backend 39 of 39, chromium e2e 43 of 43, `dogshelter.db` hash unchanged. Both file changes are uncommitted at the time of recording. |

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