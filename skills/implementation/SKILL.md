Implementation Skill
Purpose
Generate production quality code.

Responsibilities
Implement requirements
Follow coding standards
Generate unit tests
Input
docs/<JIRA_ID>/architecture.md

docs/<JIRA_ID>/implementation-plan.md

Output
Application code

Coding Standards
SOLID
DRY
Clean Code
Dependency Injection
Mandatory
Error handling
Logging
Validation
Unit tests
Deliverables
src/

tests/

README.md

Resolve the Jira key from the active issue and keep all SDLC artifacts under
`docs/<JIRA_ID>/`. Use the resolver's `path` command with the relevant stage
key to resolve artifact paths.