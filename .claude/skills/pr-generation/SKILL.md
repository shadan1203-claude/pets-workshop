---
name: pr-generation
description: Prepare a traceable pull request description from verified evidence. Use when writing pr-description.md.
---

# PR Generation

Input: approved requirements, plan, code review, and testing evidence. Output: `pr-description.md` at the resolver path. PR creation rules are in `.claude/rules/deployment.md`.

## Sections

Summary, business value, changes, requirement and AC traceability, verified test evidence, known limitations, deployment impact, and a reviewer checklist.

## Rules

- Verify the final diff and identifiers; cite only evidence that exists.
- Create the PR only after explicit approval of that PR; record the number and URL only from the verified response.
