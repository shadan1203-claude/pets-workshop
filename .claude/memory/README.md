# SDLC Memory

Concise, human-readable project knowledge that supplements, and never overrides, Jira, approved artifacts, source code, and `workflow/workflow-state.json`. Live state (active issue, stage, approvals, results) belongs in `workflow/workflow-state.json` and Jira-scoped artifacts, never here.

## Loading

| Load policy | Files |
| --- | --- |
| Always (imported by `.claude/CLAUDE.md`) | `repository-context.md`, `approved-decisions.md` |
| On demand | `architecture-principles.md` (architecture and design review), `known-risks.md` (risk assessment), `project-glossary.md` (terminology), `team-conventions.md` (branching, commits, PRs) |

Standards that were previously memory files now live in `.claude/rules/`: coding, testing, deployment, MCP, and artifacts.

## Update rules

- `approved-decisions.md`: append only explicit human-approved decisions with a unique ID; supersede rather than edit.
- `repository-context.md`: update only when verified repository facts change.
- `known-risks.md`: keep resolved entries marked `CLOSED` with evidence.
- `team-conventions.md`: add only after a human or team owner confirms.

## Prohibited content

Secrets, credentials, personal data, transcripts, test or deployment results, approval claims without evidence, and anything duplicated from rules or artifacts.
