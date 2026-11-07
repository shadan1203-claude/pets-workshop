# Deployment Standards

## Required Approval

- Deployment requires explicit, immediate human approval for the specific verified target and version immediately before execution.
- A PR approval, prior deployment, saved decision, Jira status, or agent recommendation does not authorize a new deployment.
- If target, version, procedure, access, validation, or rollback evidence is unavailable, record `Not Found` and block execution.

## Release Preparation

- Create and review Jira-scoped `deployment.md` before execution using the approved artifact-routing resolver.
- Verify release identity, target environment, exact procedure, prerequisites, health checks, operational risks, and rollback from approved artifacts and repository deployment evidence.
- Never put secrets or sensitive environment values in deployment memory or artifacts.

## Execution and Verification

- Execute only the approved procedure after the immediate gate; use authorized tools and record actual output, deployed version, timestamp, smoke-test results, and rollback status.
- Stop on deployment or validation failure. Use only the approved rollback procedure; seek approval if rollback authority is unclear.
- Complete post-deployment checks and obtain explicit closure approval before marking the workflow closed.

## Monitoring

- Follow the target's verified operational guidance. Monitoring system, thresholds, alert owners, and retention are `Not Found` unless established in approved release evidence.
- Store release outcomes in Jira-scoped deployment/validation artifacts and workflow state, not in this durable standards file.

## Example

Before deploying, present `target=staging`, `version=<verified commit>`, the documented procedure, smoke checks, risks, and rollback to the approver. These values illustrate the request format only and are not an approved PetWorkshop target or deployment.