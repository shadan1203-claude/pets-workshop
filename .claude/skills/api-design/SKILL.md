---
name: api-design
description: Specify API contracts (endpoints, parameters, responses, errors, compatibility) from approved design. Use when writing api-design.md.
---

# API Design

Input: approved requirements, architecture, and design review, plus existing routes in `app/server/app.py` and their client use. Output: `api-design.md` at the resolver path.

## Contents

For each affected endpoint: method and path, parameters with validation and defaults, response model, error responses, pagination and compatibility impact, and requirement or AC traceability. If no API change applies, record the evidence-based rationale.

## Rules

- Do not invent routes, fields, or schemas; every contract element is traceable to approved requirements and existing code.
- Preserve backward compatibility unless an approved requirement says otherwise.
