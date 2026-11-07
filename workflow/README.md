# Workflow State and Artifact Routing

| File | Purpose |
| --- | --- |
| `workflow-state.json` | Live orchestration state for the active Jira issue. Keys: `workflowId`, `currentStage`, `status`, `approvedStages`, `artifacts`, `decisions`, `risks`, `blockers`, `lastUpdated`. |
| `artifact-paths.js` | Resolves Jira-scoped artifact paths. Use `node workflow/artifact-paths.js ensure --jira-id <KEY>` and `node workflow/artifact-paths.js path --jira-id <KEY> --artifact <name>`. |

Governance for both is in `.claude/rules/sdlc.md` and `.claude/rules/artifacts.md`. The `SessionStart` hook (`hooks/load-workflow-state.js`) injects a summary of the state file into each session.

Claude Code provides session resume and prompt caching itself, so this directory keeps no separate session or prompt-cache store.
