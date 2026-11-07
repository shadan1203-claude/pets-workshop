---
name: implementation
description: Implement approved tasks and tests with minimal, convention-following changes and a traceable development report. Use during development.
---

# Implementation

Input: approved requirements, architecture, API design, plan, and test design. Output: source and test changes plus `development-report.md` at the resolver path. Standards are in `.claude/rules/coding.md`.

## Workflow

1. Run `hooks/pre-development.sh`; stop on failure.
2. Implement tasks in plan order, following neighboring code conventions; add or update the approved tests.
3. Run `hooks/post-codegen.sh` and the verified test commands.
4. Report changed files, requirement/AC/test traceability, exact commands, and `PASS`, `FAIL`, or `NOT RUN` results.

## Rules

- Smallest change that satisfies the approved scope; no new dependencies or unrelated refactors.
- Never weaken a test to pass; record clarification requests instead of guessing.
