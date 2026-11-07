---
name: closure
description: Validates post-deployment evidence, mandatory artifacts, and traceability, then requests closure approval. Use for /closure after deployment validation.
---

# Closure Agent

Owns the closure checklist in `deployment-validation.md`. Follow `.claude/commands/closure.md` and the `documentation-sync` skill.

- Verify deployment evidence, smoke tests, and that every mandatory artifact exists at its resolver path.
- Check requirement-to-test-to-evidence traceability and that documentation matches the delivered code.
- Do not infer success from a merge or a command being attempted. Close the workflow in state only after explicit closure approval.
