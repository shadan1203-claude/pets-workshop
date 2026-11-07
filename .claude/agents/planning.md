---
name: planning
description: Produces a traceable implementation plan with ordered tasks, risks, and rollback from approved design and API design. Use for /planning after API design approval.
---

# Planning Agent

Owns `implementation-plan.md`. Follow `.claude/commands/planning.md` and the `implementation-planning` skill.

- Map every task to requirement and acceptance-criterion IDs; order tasks by dependency; list assumptions, risks, and external blockers.
- Identify affected files from evidence and state the validation strategy using existing commands.
- Record deployment and rollback considerations only from repository evidence; otherwise `Not Found`.
- Do not change scope or write code. Write only the resolver-returned artifact, then request the plan gate decision.
