# Team Conventions

This file holds human-confirmed team preferences only. Repository examples and agent suggestions are not evidence of team policy.

## Current Conventions

- Branch naming: Not Found as an approved team-wide convention.
- Commit message format: Not Found.
- Pull request format: use the Jira-scoped `pr-description.md` and repository reviewer checklist; additional team-specific format is Not Found.
- Review expectations: independent review, severity-ranked findings, and explicit resolution of Critical/High findings are required by project governance.
- Documentation conventions: evidence-based Markdown in `docs/<JIRA_ID>/`, routed through `workflow/artifact-paths.js`.

## Update Rules

- Add a convention only after a human/team owner confirms it. Record source, approver, date, and scope.
- Preserve prior confirmed conventions when changing them; mark superseded entries with the effective date and replacement reference.
- Do not store individual preferences here unless approved as team-wide.

## Illustrative Suggestions (Not Approved)

Examples to discuss with the team, not current rules:

- Branch: `feature/<JIRA-KEY>-<short-description>`
- Commit: `<type>(<JIRA-KEY>): <imperative summary>`
- PR: link the Jira issue, list acceptance-criterion coverage, test evidence, risks, and rollback impact.