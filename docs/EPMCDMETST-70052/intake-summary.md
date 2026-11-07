# Intake Summary: EPMCDMETST-70052

Status: READY FOR INTAKE APPROVAL (intake approval NOT granted)
Workflow ID: EPMCDMETST-70052
Stage: intake
Date: 2026-11-07
Repository: pets-workshop (branch feature/backend-api-001)

## 1. Verified Jira Identity and Source References

| Field | Value | Source |
| --- | --- | --- |
| Issue key | EPMCDMETST-70052 | Jira MCP `getIssue` (verified 2026-11-07) |
| Internal id | 14548811 | Jira MCP `getIssue` |
| Issue type | Story | Jira MCP `getIssue` |
| Project | EPMCDMETST (EPM-CDME-TEST) | Jira MCP `getIssue` |
| Summary | Availability filter: Only available dogs | Jira MCP `getIssue` |
| Status | Open | Jira MCP `getIssue` |
| Priority | Average | Jira MCP `getIssue` |
| Reporter / creator | Shadan Haq (Shadan_Haq@epam.com) | Jira MCP `getIssue` |
| Assignee | Not Found (unassigned) | Jira MCP `getIssue` |
| Created | 2026-10-24T06:02:47Z | Jira MCP `getIssue` |
| Last updated | 2026-10-24T06:02:47Z | Jira MCP `getIssue` |
| Resolution / due date | Not Found (none set) | Jira MCP `getIssue` |
| Labels | capstone, codemie, expense-tracker | Jira MCP `getIssue` (see Section 9, conflict C-1) |
| Components | Not Found (none set) | Jira MCP `getIssue` |
| Fix versions | Not Found (none set) | Jira MCP `getIssue` |
| Comments | 0 | Jira MCP `getIssue` (`comment.total = 0`) |
| Issue links | 0 | Jira MCP `getIssue` (`issuelinks = []`) |
| Attachments | 0 | Jira MCP `getIssue` |
| Confluence / remote links | Not Found (none on the issue) | Jira MCP `getIssue` |
| Subtasks | EPMCDMETST-70053 (Frontend), EPMCDMETST-70054 (Backend), EPMCDMETST-70055 (Tests Automation), EPMCDMETST-70056 (Docs Confluence); all Open | Jira MCP `getIssue` |
| Source URL (REST) | https://jiraeu.epam.com/rest/api/2/issue/14548811 | Jira MCP `getIssue` |

Retrieval status: retrieved and verified in the initial intake run and re-verified on 2026-11-07 for this resume. No field changed between the two retrievals.

## 2. Intake Understanding

Each item below is taken from the Jira description unless marked otherwise.

### Summary

Add an "Only available" checkbox filter on the homepage. When checked, the dogs endpoint returns only dogs with status AVAILABLE. The filter must persist in the URL and across pagination.

### Business Need

Users see dogs with status Pending or Adopted mixed in with Available dogs. This adds friction for users who intend to adopt. (Jira "Problem" section.)

### Functional Requirements (Jira Scope)

- FR-SRC-1: Add an availability checkbox to the homepage.
- FR-SRC-2: Update `/api/dogs` to accept an `available_only` query parameter. Jira also names `available_only=true` in the Description.
- FR-SRC-3: Preserve the filter in the URL and across pagination.

Out of scope (Jira): filtering by PENDING or ADOPTED specifically, beyond the checkbox.

### Non-Functional Requirements

Not Found. Jira contains no performance, security, accessibility, browser, or availability targets. An unnamed Jira custom field holds the value "All browsers" (customfield_35208), but the story text states no browser requirement. This is recorded as a gap for Requirements.

### Acceptance Criteria (verbatim, Jira Description "Acceptance Criteria")

- AC-01: The homepage shows an "Only available" checkbox.
- AC-02: When checked, only dogs with status AVAILABLE are returned and displayed.
- AC-03: When unchecked, dogs of all statuses are returned.
- AC-04: Filter state persists in the URL and across page reload.
- AC-05: Pagination preserves the filter state.

Source reference for all: Jira EPMCDMETST-70052, Description, "Acceptance Criteria" items 1 to 5. The IDs AC-01 to AC-05 are intake labels assigned in this artifact for traceability. They are not Jira IDs.

### Definition of Done (Jira)

- Implementation complete.
- Acceptance criteria satisfied.
- Automated tests created and passing.
- Code reviewed.
- Documentation updated.
- Local build and validation successful.

### Dependencies

- Backend list-endpoint query must include `Dog.status` if filtering is server-side (Jira Description "Dependencies").
- Subtasks (Jira, names only; Jira states no dependency links between them): EPMCDMETST-70053 (Frontend), EPMCDMETST-70054 (Backend), EPMCDMETST-70055 (Tests Automation), EPMCDMETST-70056 (Docs Confluence). Sequencing is not defined in Jira and is left to Planning.

### Risks

- Jira: existing e2e tests may assume fixed dog counts and ordering on the homepage.
- Intake-observed (repository evidence): `GET /api/dogs` (`app/server/app.py:99`) has no `available_only` parameter yet. The filter must be added.
- Intake-observed: `app/client/src/components/DogList.astro` has the heading "Available Dogs" and no checkbox control. The filter UI must be added.

### Assumptions

- Jira: dog status values are stored as an Enum and exposed as `.name` (AVAILABLE, PENDING, ADOPTED).
- Repository evidence supports this: `app/server/models/dog.py` defines `AdoptionStatus` with members `AVAILABLE = 'Available'`, `ADOPTED = 'Adopted'`, and `PENDING = 'Pending'`. The Enum member `.name` is `AVAILABLE`, `ADOPTED`, or `PENDING`. The stored string value is title case. Requirements must confirm which form the API exposes.
- Intake assumption (not in Jira): the existing `/api/dogs` pagination (`page`, `per_page`, `app.py:99-137`) is the pagination the AC-05 refers to.

### Positive, Negative, and Edge Scenarios

Not Found in Jira. The Jira story contains no scenario lists. These scenarios must be derived in Requirements and Testing Design from the approved acceptance criteria. They are not invented here.

## 3. Repository Evidence Inspected (Read-Only)

| Area | Path | Evidence |
| --- | --- | --- |
| Dogs list endpoint | `app/server/app.py:99-137` | `GET /api/dogs` with `page` and `per_page` pagination. No `available_only` handling found. |
| Other dog routes | `app/server/app.py:145-443` | Breed, detail, vaccination, reminder, and health routes. No availability filter. |
| Dog model and status enum | `app/server/models/dog.py` | `AdoptionStatus` enum; `Dog.status` column defaults to AVAILABLE. |
| Homepage list component | `app/client/src/components/DogList.astro` | Heading "Available Dogs" with count. No checkbox control. |
| Homepage page | `app/client/src/pages/index.astro` | Present (git status shows it modified). Not changed by intake. |
| Seed data | `app/server/utils/seed_test_database.py` | Seed dogs use `AdoptionStatus.AVAILABLE`. |
| Backend tests | `app/server/test_app.py` | Python `unittest`. Existing dog retrieval tests. |
| E2E tests | `app/client/e2e-tests/homepage.spec.ts` | Playwright. Existing homepage test. May depend on counts (Jira Risk). |
| Verified commands | `.claude/memory/repository-context.md` | Backend: `python -m unittest -v test_app.py` from `app/server`. Frontend: `npm run build` and `npm run test:e2e -- --project=chromium` from `app/client`. |

Repository state: the working tree has many uncommitted modifications and deletions (from `git status` at session start). These are not from this intake. Intake did not modify any source file.

## 4. Confluence

Not searched. The Jira issue has no Confluence or remote links, so there is no linked page to retrieve. The Jira subtask EPMCDMETST-70056 (Docs Confluence) implies a Confluence destination, but no page or space is identified. Status: Not Found.

## 5. Comments

Not Found. The issue has 0 comments.

## 6. Scope, Constraints, and Non-Goals

- In scope: homepage availability checkbox, `available_only` on `/api/dogs`, filter persistence in URL and pagination.
- Out of scope: PENDING or ADOPTED-specific filters beyond the checkbox.
- Constraints from repository governance: artifacts live under `docs/EPMCDMETST-70052/`; no source change before approved gates; technology stack (Flask, SQLAlchemy, Astro, Tailwind, SQLite, Playwright) is preserved.
- Non-goals (Jira): none beyond the out-of-scope item above.

## 7. Unrelated Content Noted

The Jira custom field `customfield_35221` contains a Dutch office-supplies list (for example, "Boeken", "Bedrijfsstempel"). It is unrelated to the dog-availability story. Intake did not use it. It is recorded here so that Requirements does not treat it as scope.

## 8. Assumptions and Unknowns Summary

| ID | Item | Status |
| --- | --- | --- |
| A-1 | Status enum is exposed as `.name` (Jira assumption). | Partially supported by repository evidence. Value form must be confirmed. |
| U-1 | Non-functional requirements. | Not Found in Jira. |
| U-2 | Positive, negative, and edge scenarios. | Not Found in Jira. |
| U-3 | Confluence destination for subtask EPMCDMETST-70056. | Not Found. |
| U-4 | Whether the issue belongs to the pets-workshop repository. | Conflict C-1 below. |

## 9. Conflicts and Deviations

### C-1: Jira labels versus repository (conflict)

- Jira labels: `capstone`, `codemie`, `expense-tracker`.
- Repository: `pets-workshop`, a dog-shelter application.
- Jira content (dogs, `/api/dogs`, AdoptionStatus) matches `pets-workshop`.
- The labels do not match. Per the conflict rule, this is reported, not resolved by assumption. The human must confirm the intended repository before intake approval.

### D-1: Artifact path deviation (user request versus governance)

- User item 6 named root-level `docs/*.md` paths (for example `docs/requirements.md`).
- Governance (`.claude/CLAUDE.md`, `.claude/rules/sdlc.md`) forbids SDLC documents directly under root `docs/`. Artifacts must be under `docs/EPMCDMETST-70052/`, resolved through `workflow/artifact-paths.js`.
- This artifact follows governance. Resolver path used: `docs/EPMCDMETST-70052/intake-summary.md`.

### D-2: Phase sequence deviation (user request versus governance)

- User phase list: Intake, Requirements, Architecture, Planning, Development, Testing Design, Testing, Code Review, PR Generation, Deployment Readiness.
- Governance adds Design Review and API Design between Architecture and Planning, and adds Closure at the end.
- Governance is followed. Design Review and API Design stay in the sequence.

### D-3: Artifact naming deviation

- User item 6 names `docs/implementation.md`, `docs/test-cases.md`, and `docs/code-review.md`, among others.
- Governance names `implementation-plan.md`, `test-cases.md`, `code-review.md`, and others, and also requires `design-review.md`, `api-design.md`, `development-report.md`, `deployment.md`, and `deployment-validation.md`. The governed names are used.

## 10. Risks

| ID | Risk | Source | Initial severity (intake only) |
| --- | --- | --- | --- |
| R-1 | Repository/project mismatch (labels). | Jira labels | High until confirmed |
| R-2 | Homepage e2e tests may break from count or ordering assumptions. | Jira Risks | Medium |
| R-3 | Status enum form (`Available` value versus `AVAILABLE` name) may affect the query and the response contract. | Repository evidence, Jira assumption | Medium |
| R-4 | No NFRs defined; accessibility, performance, and browser targets are unstated. | Jira gap | Medium |
| R-5 | Confluence docs subtask has no destination; publication needs explicit authorization. | Jira subtask EPMCDMETST-70056 | Low |

Severity values here are intake-stage triage. Design Review assigns the governed severities later.

## 11. Blockers

- BLK-INTAKE-001: resolved. `workflow/artifact-paths.js` now exists and returned the path above.
- No remaining technical blocker for intake.
- The Jira repository conflict (C-1) is a decision for the human, not a blocker to writing this artifact. It is a blocker for the intake approval.

## 12. Requirement Questions for Clarification Before Requirements Approval

1. Confirm the intended repository for EPMCDMETST-70052. The labels say `capstone`, `codemie`, and `expense-tracker`. Jira content matches `pets-workshop`.
2. Confirm the API parameter contract: `available_only=true` is the Jira value. Should `available_only=false` or an absent parameter return all statuses (AC-03)?
3. Confirm the exposed status value form in API responses: enum name (`AVAILABLE`) or stored value (`Available`)?
4. Are there non-functional requirements (performance, accessibility, supported browsers, response time) to add? Jira has none.
5. Confirm the positive, negative, and edge scenarios to be derived from AC-01 to AC-05 in Requirements.
6. Should the filter be server-side only, or should the client also filter? Jira says "if filtering is server-side", which leaves the choice open.
7. Confirm the Confluence destination for subtask EPMCDMETST-70056, and whether publication to Confluence is authorized in this workflow.
8. Confirm that the Jira subtasks (EPMCDMETST-70053 to 70056) are in scope for this workflow.

## 13. Open Decisions for the Human

| ID | Decision | Owner |
| --- | --- | --- |
| OD-1 | Confirm the repository for this issue (resolves C-1). | Human |
| OD-2 | Accept path deviation D-1 (governed `docs/EPMCDMETST-70052/`). | Human |
| OD-3 | Accept phase deviation D-2 (Design Review and API Design kept). | Human |
| OD-4 | Accept artifact naming deviation D-3 (governed names). | Human |
| OD-5 | Intake approval: approve, revise, pause, or cancel. | Human |

No decision in this table has been made.

## 14. Proposed Next Phase

Requirements, after explicit Intake approval (OD-5) and resolution of C-1 (OD-1). Requirements will produce `docs/EPMCDMETST-70052/requirements.md` and must not start before Intake approval.

## 15. Provenance

- Jira: `mcp__jira__getIssue` for EPMCDMETST-70052, initial run and resume run, 2026-11-07.
- Resolver: `node workflow/artifact-paths.js ensure --jira-id EPMCDMETST-70052` returned `docs/EPMCDMETST-70052`. `path --artifact intake-summary` returned `docs/EPMCDMETST-70052/intake-summary.md`.
- Repository evidence: read-only inspection, Section 3.
- Workflow state: `workflow/workflow-state.json`.
