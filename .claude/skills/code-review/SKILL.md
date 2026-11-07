---
name: code-review
description: Review an implementation diff for correctness, security, maintainability, performance, and test adequacy with severity-rated findings. Use when writing code-review.md.
---

# Code Review

Input: the actual diff and source, `development-report.md`, and the approved test design. Output: `code-review.md` at the resolver path.

## Checklist

- Security: input validation, authorization, secrets, error handling, injection.
- Correctness: requirements and ACs met, edge cases handled, no unrequested changes.
- Quality: readability, duplication, consistency with neighboring code.
- Performance: queries, pagination bounds, network calls.
- Tests: coverage of every AC, no weakened or skipped tests.

## Rules

- Findings use Critical, High, Medium, or Low with file and line evidence and a recommendation.
- Critical and High must be resolved and re-reviewed before testing. Never modify source.
