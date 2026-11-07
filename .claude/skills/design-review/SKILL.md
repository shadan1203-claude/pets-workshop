---
name: design-review
description: Independently review requirements and architecture and report severity-rated findings. Use when writing design-review.md.
---

# Design Review

Input: approved `requirements.md` and `architecture.md`. Output: `design-review.md` at the resolver path.

## Review dimensions

Requirement alignment and traceability, security and privacy, reliability, scalability, performance, maintainability, observability, testability, compatibility, dependencies, and operational risk.

## Rules

- Each finding has an ID, severity (Critical, High, Medium, Low), evidence, affected requirement IDs, impact, and a recommendation.
- Report an explicit outcome: Approved, Approved With Conditions, Rejected, or Blocked; state whether each Critical and High finding is resolved, mitigated, or open.
- Review and recommend only; do not modify requirements, architecture, or code.
