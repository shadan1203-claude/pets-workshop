# Known Risks

This is a durable register of recurring or unresolved project risks, not a live workflow blocker list. Current execution blockers belong in `workflow/workflow-state.json` and the owning Jira-scoped artifact.

## Risk Register

| Risk ID | Description | Mitigation | Owner | Status | Evidence / Reviewed |
| --- | --- | --- | --- | --- | --- |
| RISK-001 | The documented artifact resolver `workflow/artifact-paths.js` was missing when this register was created. | Resolver now exists and is used for every artifact path; keep the stop rule if it is ever missing. | Not Found | CLOSED 2026-11-07 | `workflow/artifact-paths.js` |
| RISK-002 | `hooks/pre-development.sh` checked root-level `docs/*.md`, conflicting with Jira-scoped governance. | Rewritten to resolve paths through `workflow/artifact-paths.js`. | Not Found | CLOSED 2026-11-07 | `hooks/pre-development.sh` |
| RISK-003 | The requested minimum coverage is 80%, but the configured coverage tool and CI threshold were not established in the inspected package/test configuration. | Identify and approve coverage instrumentation; report missing coverage as Not collected/NOT RUN until the threshold is measurable. | Not Found | OPEN - verify configuration | `app/client/package.json`, backend test configuration; 2026-11-05 |
| RISK-004 | The earlier deployment documents that disagreed on the target were removed from `docs/`; no approved deployment target, pipeline, or `.github/workflows/` files are evidenced. | Establish the target and procedure from source/configuration and active Jira-scoped approvals before any deployment. | Not Found | OPEN | Repository file search; 2026-11-07 |
| RISK-005 | Shell hooks are invoked with `bash`; a Windows host without Git Bash or WSL cannot run them. | Confirm `bash` is on PATH, or port the shell hooks to Node. | Not Found | OPEN | `.claude/settings.json`; 2026-11-07 |

## Update Rules

- Assign unique IDs; do not recycle IDs. Record evidence, owner only when confirmed, review date, status, and actionable mitigation.
- Update the same entry when likelihood, impact, mitigation, owner, or status changes. Retain resolved entries with resolution evidence and date for audit; do not turn a closed risk into a current blocker.
- Revalidate repository-state risks before carrying them into a new workflow. If a risk no longer applies, record evidence and mark it `CLOSED`, not silently delete it.
- Never store secrets, temporary test failures, current deployment outcomes, or issue-specific execution state here.

## Illustrative Entry

`RISK-EXAMPLE` about an example performance hotspot is a format illustration only. Do not add a risk without repository or approved artifact evidence.