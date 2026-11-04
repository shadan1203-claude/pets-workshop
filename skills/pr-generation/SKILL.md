Pull Request Generation Skill
Purpose
Prepare pull request documentation.

Input
docs/<JIRA_ID>/requirements.md

docs/<JIRA_ID>/architecture.md

docs/<JIRA_ID>/implementation-plan.md

docs/<JIRA_ID>/testing.md

Output
docs/<JIRA_ID>/pr-description.md

Resolve the active Jira key and use only artifacts from its `docs/<JIRA_ID>/`
folder. Use `node workflow/artifact-paths.js path pr-description --jira-id
"$JIRA_ID"` to resolve the output path.

Required Sections
Summary
Business Value
Changes
Architecture Impact
Testing Evidence
Deployment Impact
Rollback Plan
Reviewer Checklist
Rules
Keep concise Highlight risks Highlight test evidence