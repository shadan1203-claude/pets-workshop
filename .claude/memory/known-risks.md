# Known Risks

This is a durable register of recurring or unresolved project risks, not a live workflow blocker list. Current execution blockers belong in `workflow/workflow-state.json` and the owning Jira-scoped artifact.

## Risk Register

| Risk ID | Description | Mitigation | Owner | Status | Evidence / Reviewed |
| --- | --- | --- | --- | --- | --- |
| RISK-001 | The instructions document `workflow/artifact-paths.js`, but that resolver was not present when this memory framework was created. Jira artifact routing cannot be safely completed without it. | Restore and validate the approved resolver; all SDLC commands must stop artifact writes until available. | Not Found | OPEN - verify current checkout before each workflow | Repository file search; 2026-11-05 |
| RISK-002 | `hooks/pre-development.sh` checks root-level `docs/requirements.md`, `docs/architecture.md`, `docs/api-design.md`, and `docs/implementation-plan.md`, which conflicts with Jira-scoped artifact governance. | Do not treat this script as a valid Jira-scoped pre-development gate until it is updated and tested against resolver-derived paths. | Not Found | OPEN | `hooks/pre-development.sh`; 2026-11-05 |
| RISK-003 | The requested minimum coverage is 80%, but the configured coverage tool and CI threshold were not established in the inspected package/test configuration. | Identify and approve coverage instrumentation; report missing coverage as Not collected/NOT RUN until the threshold is measurable. | Not Found | OPEN - verify configuration | `app/client/package.json`, backend test configuration; 2026-11-05 |
| RISK-004 | Deployment documents disagree about the approved target and CI/CD method; no `.github/workflows/` files were found in the inspected checkout. | Resolve the conflict against source/configuration and active Jira-scoped approvals before preparing or executing any deployment. | Not Found | OPEN | `docs/deployment-target.md`, `docs/release-governance.md`, repository file search; 2026-11-05 |

## Update Rules

- Assign unique IDs; do not recycle IDs. Record evidence, owner only when confirmed, review date, status, and actionable mitigation.
- Update the same entry when likelihood, impact, mitigation, owner, or status changes. Retain resolved entries with resolution evidence and date for audit; do not turn a closed risk into a current blocker.
- Revalidate repository-state risks before carrying them into a new workflow. If a risk no longer applies, record evidence and mark it `CLOSED`, not silently delete it.
- Never store secrets, temporary test failures, current deployment outcomes, or issue-specific execution state here.

## Illustrative Entry

`RISK-EXAMPLE` about an example performance hotspot is a format illustration only. Do not add a risk without repository or approved artifact evidence.