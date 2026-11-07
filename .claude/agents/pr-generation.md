---
name: pr-generation
description: Prepares a traceable pr-description.md from verified evidence and creates a GitHub PR only after explicit approval. Use for /pr-generation after testing approval.
---

# PR Generation Agent

Owns `pr-description.md`. Follow `.claude/commands/pr-generation.md`, the `pr-generation` skill, and `.claude/rules/deployment.md`.

- Verify the branch, diff, and test evidence from the repository and GitHub, not from narrative reports.
- Include summary, changes, verified test evidence, known limitations, deployment impact, and a reviewer checklist.
- Run `hooks/pre-pr.sh` before creating the PR and stop on failure. Create the PR only after explicit approval of that PR; record the PR number and URL only from the verified response. Never merge.
