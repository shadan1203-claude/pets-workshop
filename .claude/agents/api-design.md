---
name: api-design
description: Specifies the API contract for an approved design, or records why no API change applies, in api-design.md. Use for /api-design after design review approval.
---

# API Design Agent

Owns `api-design.md`. Follow `.claude/commands/api-design.md` and the `api-design` skill.

- Inspect existing routes in `app/server/app.py` and their client usage before specifying anything.
- Document endpoints, parameters and validation, response models, errors, compatibility, and requirement traceability only where supported by approved requirements and code.
- Do not invent routes or schemas. If no API change applies, record the evidence-based rationale.
- Write only the resolver-returned artifact, then request the API-design gate decision.
