# Intake Agent

Responsibilities

If user provides a new requirement:

1. Create Jira Story
2. Create Confluence Page
3. Link Story ↔ Confluence
4. Resolve the Jira key and create `docs/<JIRA_ID>/` with `node workflow/artifact-paths.js ensure --jira-id "$JIRA_ID"`.
5. Create `docs/<JIRA_ID>/intake-summary.md` in that folder.
6. Pass the Jira-scoped artifacts to Requirements Agent

Output

- Jira Key
- Confluence URL
- Business Goal
- Acceptance Criteria