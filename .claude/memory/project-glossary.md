# Project Glossary

| Term | Meaning |
| --- | --- |
| Jira | Issue-tracking system and source of truth for issue identity, fields, comments, and acceptance criteria when Jira MCP is available. |
| Confluence | Documentation system; linked page content must be retrieved and verified before use. |
| MCP | Model Context Protocol; a connection mechanism for external tool servers, not proof that a server is available or supports a particular operation. |
| Requirement | A traceable, sourced statement of required behavior or quality constraint, identified by a stable requirement ID. |
| Acceptance Criterion (AC) | A testable condition attached to the Jira issue and mapped through design and validation. |
| Architecture | Approved technical structure, component responsibilities, data flow, boundaries, and quality decisions. |
| Design Review | Independent evidence-based review of requirements and proposed architecture before implementation. |
| Planning | Ordered epics/stories/tasks with dependencies and requirement/AC mappings. |
| Test Design | Planned cases and expected outcomes mapped to requirements and Jira ACs; not execution evidence. |
| Development | Implementation of approved requirements, design, plan, and test design. |
| Code Review | Independent assessment of implementation correctness, security, maintainability, and testability. |
| Testing | Execution of approved tests and recording of actual commands, results, failures, coverage, and gaps. |
| PR | GitHub pull request. A number or URL is recorded only after the external result is verified. |
| Deployment | Approved release of a verified version to a verified target using an approved procedure and rollback plan. |
| Closure | Post-deployment validation and explicit human acceptance that the Jira workflow may close. |
| Jira-scoped artifact | An SDLC document in `docs/<JIRA_ID>/` routed by `workflow/artifact-paths.js`. |
| Workflow state | Live phase, approval, decision, risk, blocker, and artifact-reference record in `workflow/workflow-state.json`; not durable memory. |
| `Not Found` | Evidence is unavailable in inspected authoritative sources; it is not equivalent to false, not applicable, or approved. |

## Project-Specific Terms

- Pets Workshop: this repository's dog-shelter management application and associated delivery workflow.
- Backend: Flask/SQLAlchemy application under `app/server`.
- Frontend: Astro/Tailwind application under `app/client`.
- Playwright: configured browser end-to-end testing framework in `app/client`.

## Illustrative Example

An `AC` is not satisfied merely because a `TC` is designed. Testing must execute the relevant test and record evidence before reporting that criterion as passed.