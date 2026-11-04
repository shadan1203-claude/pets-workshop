Design Review Skill
Review:

requirements.md
architecture.md
Identify:

Design flaws
Security issues
Scalability concerns
Performance risks
Reliability concerns
Generate:

docs/<JIRA_ID>/design-review.md

Read the Jira-scoped requirements and architecture artifacts from the same
`docs/<JIRA_ID>/` folder. Resolve canonical paths with
the resolver's `path` command with the relevant stage key.

Do not implement code.

Do not modify requirements.

Only review and recommend.

## Scope Validation Rules
Design Review must not create blocking findings for functionality that is not required by the approved Jira scope.

If an issue concerns:

Future enhancements
Optional persistence
Alternative storage mechanisms
Potential schema improvements
Additional state management capabilities
New features not defined in Jira
Then classify it as:

Informational or
Recommendation
Do not classify it as Critical or High.

Do not block implementation unless the approved Jira requirements cannot be satisfied without resolving the issue.

If an item is outside approved scope, document:

Status: Out Of Scope

and continue the workflow.

Review Scope Enforcement
Design Review must only evaluate approved Jira scope.

When identifying:

missing persistence contracts
optional storage mechanisms
undefined future schemas
potential state-management improvements
future integration contracts
classify the finding as:

Recommendation

or

Future Work

or

Out Of Scope

Do not classify it as:

Critical
High
Blocking
unless the approved Jira requirements cannot be implemented.