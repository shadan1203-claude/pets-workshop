# Deployment and Pull Request Rules

## Pull Request

- Generate `pr-description.md` with summary, changes, verified test evidence, known limitations, deployment impact, and a reviewer checklist. Verify the final diff and identifiers.
- Create a GitHub PR only after explicit approval of that specific PR. Record the PR number and URL only from the verified response. Never merge automatically.
- Run the pre-PR hook (`hooks/pre-pr.sh`) and stop on failure.

## Deployment

- Verify the target, version, procedure, health checks, and rollback steps from approved artifacts and repository evidence. Mark unknown details `Not Found` and block execution. Do not infer them from memory or contradictory prose.
- Prepare and review `deployment.md` before execution.
- Require explicit, immediate human approval for the specific target and version. A PR approval, merge, or earlier deployment approval does not authorize a new deployment.
- Capture actual execution output, deployed version, timestamp, smoke-test results, and rollback status. Never infer success from a command being attempted. Write `deployment-validation.md` afterwards.
- Stop on deployment or validation failure; use only the approved rollback procedure and preserve evidence.
- Monitoring system, thresholds, and alert owners are `Not Found` unless established in approved release evidence.
