---
description: Define the API contract for an approved design, or record why an API change does not apply.
argument-hint: [JIRA-KEY]
---

# API Design

Specify the API contract implied by approved requirements and architecture. Do not plan tasks or write code.

## Preconditions

1. Verify the Jira issue/key and that workflow state belongs to it. Require current human approval of requirements, architecture, and design review (no unresolved Critical/High findings).
2. Run `CURRENT_PHASE=api-design bash hooks/pre-phase.sh` and stop on failure. Resolve `requirements`, `architecture`, `design-review`, and `api-design` through `workflow/artifact-paths.js` after `ensure --jira-id "$JIRA_ID"`. If the resolver is missing or fails, stop and report the blocker.
3. Read `.claude/CLAUDE.md`, `.claude/agents/api-design.md`, `.claude/skills/api-design/SKILL.md`, and the approved inputs. Inspect existing routes in `app/server/app.py` and how `app/client` consumes them.

## Output

Create only the resolver-returned `api-design` artifact (`docs/<JIRA_ID>/api-design.md`). Cover, only where supported by requirements and code: endpoints and methods, request parameters and validation, response models, error responses, compatibility with existing clients, and requirement/AC traceability. Do not invent routes or schemas. If no API change applies, record the evidence-based rationale.

## Gate

Validate that every API-related requirement and acceptance criterion is covered. Update workflow state (`api-design`, artifact reference, decisions, risks, blockers, timestamp). Request explicit human approval before `/planning`; stop until approved.

## Example

`/api-design PET-123` for a new query parameter documents its name, accepted values, default, invalid-value behavior, and effect on pagination metadata.
