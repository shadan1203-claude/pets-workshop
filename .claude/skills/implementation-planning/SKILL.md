---
name: implementation-planning
description: Break approved design and API design into ordered, traceable tasks with risks and rollback. Use when writing implementation-plan.md.
---

# Implementation Planning

Input: approved requirements, architecture, design review, and API design. Output: `implementation-plan.md` at the resolver path.

## Contents

Ordered tasks with stable IDs, each mapped to requirement and AC IDs; dependencies and sequencing; affected files from evidence; assumptions and risks; validation strategy using existing commands; deployment and rollback considerations (`Not Found` when unevidenced).

## Rules

- Every requirement and AC has at least one task and one verification step.
- Do not exceed approved scope or begin coding.
