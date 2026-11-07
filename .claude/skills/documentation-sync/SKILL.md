---
name: documentation-sync
description: Keep repository documentation consistent with code, APIs, dependencies, and commands using source evidence. Use when closing a workflow or updating README and docs.
---

# Documentation Sync

Update only documentation that source evidence shows is out of date.

## Workflow

1. Identify what changed (routes, models, dependencies, scripts, behavior) from the diff and source.
2. Find documentation that describes those facts: `README.md`, `app/**/README.md`, `CHANGELOG.md`, and the Jira-scoped artifacts.
3. Update statements to match code and tests; mark unverifiable facts `Not Found`.
4. Do not change application code, and do not rewrite approved SDLC artifacts of other phases.

## Rules

- Source code and tests outrank prose.
- Report each documentation file changed and the evidence for the change.
