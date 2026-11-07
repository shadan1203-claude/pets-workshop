---
name: requirements-analysis
description: Turn an approved Jira intake into traceable, testable requirements with stable IDs. Use when writing or reviewing requirements.md.
---

# Requirements Analysis

Input: approved `intake-summary.md` and the verified Jira issue. Output: `requirements.md` at the resolver path (`workflow/artifact-paths.js path --artifact requirements`).

## Sections

Business goal, stakeholders, scope and out-of-scope, functional requirements (`REQ-n`), non-functional requirements, acceptance criteria (Jira IDs preserved), assumptions, dependencies, risks, open questions, and a requirement-to-AC traceability table.

## Rules

- Quote Jira acceptance criteria faithfully; never rewrite their meaning.
- Each requirement is atomic, verifiable, and traceable to Jira or an approved decision.
- Mark unknowns `Not Found` and list them as open questions; do not assume.
- Do not design the solution.
