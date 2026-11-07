---
name: architecture-design
description: Convert approved requirements into a repository-grounded architecture. Use when writing architecture.md.
---

# Architecture Design

Input: approved `requirements.md`, `.claude/memory/architecture-principles.md`, and repository evidence. Output: `architecture.md` at the resolver path.

## Required sections

Architecture overview, components, data flow, security design, scalability design, error handling, logging and observability, a Mermaid diagram, decisions with rationale, and requirement traceability.

## Rules

- Ground every component and flow in source, tests, or configuration; cite the files.
- Preserve the existing stack (Flask, SQLAlchemy, SQLite, Astro, Tailwind) unless an approved decision changes it.
- Prefer bounded, paginated, existing patterns; state targets only when evidenced, otherwise `Not Found`.
- Do not invent infrastructure, monitoring, or services.
