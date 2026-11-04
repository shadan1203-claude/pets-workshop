Code Review Skill
Purpose
Perform automated review of generated code.

Responsibilities
Review:

Quality
Security
Maintainability
Performance
Input
src/

tests/

Output
docs/<JIRA_ID>/code-review.md

Resolve the Jira key from the active issue and keep the review in that Jira's
artifact folder. Use `node workflow/artifact-paths.js path code-review --jira-id
"$JIRA_ID"` to resolve the output path.

Checklist
Security
Input validation
Authentication
Authorization
Secrets handling
Quality
SOLID
DRY
Readability
Performance
Database queries
Network calls
Memory usage
Review Severity
High

Medium

Low