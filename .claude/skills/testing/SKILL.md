---
name: testing
description: Execute approved test suites and report honest results, coverage, and acceptance-criterion status. Use when writing testing.md.
---

# Testing

Input: approved implementation and review, `test-cases.md`, and the repository's test projects. Output: `testing.md` at the resolver path. Commands and coverage rules are in `.claude/rules/testing.md`.

## Report contents

Exact commands and environment, results per suite, failures and skips, coverage actually collected (or `Not collected`), AC coverage table, risks, and recommendations.

## Rules

- `NOT RUN`, skipped, blocked, or failed is never `PASS`; coverage counts only from a real report.
- Failures return to development; repeat code review and testing. Never waive or weaken tests without explicit human approval.
