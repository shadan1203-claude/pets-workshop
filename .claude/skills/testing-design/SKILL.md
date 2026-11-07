---
name: testing-design
description: Design test cases mapped to every acceptance criterion across positive, negative, edge, accessibility, and performance layers. Use when writing test-cases.md and the tasks.test.js skeleton.
---

# Testing Design

Input: approved requirements, architecture, and plan. Output: `test-cases.md` and `tests/<JIRA_ID>/tasks.test.js` at resolver paths. Rules for layers and the skeleton shape are in `.claude/rules/testing.md`.

## Test case fields

Test ID (unique), scenario, preconditions, expected result, layer, and requirement and AC mapping. Include an AC-to-test mapping table.

## Rules

- Cover positive, negative, edge, unit, integration, end-to-end, accessibility, and performance as applicable, with a rationale for each layer that does not apply.
- An AC that cannot be tested from current information is a blocker, not covered.
- Placeholders are design artifacts; never report them as executed tests.
