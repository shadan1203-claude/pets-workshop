# Deployment Rules

- Verify the target, version, procedure, health checks, and rollback steps from approved artifacts and repository deployment evidence. Mark unknown details `Not Found` and block execution.
- Prepare and review deployment documentation before execution.
- Require explicit, immediate human approval for the specific target and version before deploying. A PR approval or earlier deployment approval does not authorize a new deployment.
- Capture actual execution output, deployed version, timestamp, smoke-test results, and rollback status. Never infer success from a command being attempted.
- Stop on deployment or validation failure; use only the approved rollback procedure and preserve evidence.