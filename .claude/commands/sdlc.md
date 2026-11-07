---
description: Orchestrate the complete Jira-scoped SDLC in order, pausing for every human approval gate.
argument-hint: [JIRA-KEY or issue description]
---

# SDLC Orchestrator

Coordinate the full PetWorkshop delivery workflow for `$ARGUMENTS`. Use the `pets-workshop-orchestrator` agent and its specialist agents when available. This command coordinates phases; it does not grant approvals or claim work that has not run.

## Shared controls

- Resolve the active issue with Jira MCP and verify any supplied key. If the issue is ambiguous or Jira data is unavailable, ask for verifiable context and stop. Never invent Jira, Confluence, test, deployment, or PR data.
- Set `JIRA_ID` to the verified key. Before each phase, run `node workflow/artifact-paths.js ensure --jira-id "$JIRA_ID"` and resolve every input/output with `node workflow/artifact-paths.js path --jira-id "$JIRA_ID" --artifact <artifact-name>`. If the resolver is absent, fails, or returns an unsafe location, record a blocker and stop; do not hardcode a substitute.
- Keep SDLC documents under `docs/<JIRA_ID>/`; the requested test asset is the sole explicit repository-test-location exception. Use `workflow/workflow-state.json` as the existing single-workflow orchestration state, and refuse to overwrite another active Jira workflow. Preserve state history and its current schema.
- At every phase, run `CURRENT_PHASE=<phase> bash hooks/pre-phase.sh` first and stop on failure (phase names: intake, requirements, architecture, design-review, api-design, planning, testing-design, development, code-review, testing-execution, pr-generation, deployment, closure). Read `.claude/CLAUDE.md`, the owning agent instructions, and the mapped skill. Use Jira, Confluence, and GitHub MCP as systems of record when available. Distinguish unavailable tools/evidence from negative findings.
- Preserve requirement and acceptance-criterion IDs end to end. Record blockers rather than assume. Never treat agent output, a Jira status, a previous session, or a generated artifact as human approval.
- After every completed phase, update the state timestamp, current stage, status, artifact references, decisions, risks, and blockers. Add an approved stage only after an explicit human response. Do not continue past a missing/rejected approval.

## Ordered workflow

Run the following commands one phase at a time, carrying forward only verified and approved artifacts:

1. `/intake $ARGUMENTS` -> Jira/Confluence/repository context -> `intake-summary.md`. Pause for explicit intake approval.
2. `/requirements $JIRA_ID` -> approved intake -> `requirements.md`. Pause for requirements approval.
3. `/architecture $JIRA_ID` -> approved requirements -> `architecture.md`. Pause for architecture approval.
4. `/design-review $JIRA_ID` -> approved requirements and architecture -> `design-review.md`. Resolve all Critical/High findings and pause for human approval.
5. `/api-design $JIRA_ID` -> approved requirements, architecture, and design review -> `api-design.md`. If API design is not applicable, record the evidence-based rationale in the artifact. Pause for API design approval.
6. `/planning $JIRA_ID` -> approved design and API design -> `implementation-plan.md`. Pause for plan approval.
7. `/testing-design $JIRA_ID` -> approved requirements, architecture, and plan -> `test-cases.md` and `tests/<JIRA_ID>/tasks.test.js`. Pause for test-design approval.
8. `/development $JIRA_ID` -> all approved artifacts and test design -> source/test changes and `development-report.md`. Stop if any test design cannot be implemented. Require implementation readiness approval.
9. `/code-review $JIRA_ID` -> diff, report, and test design -> `code-review.md`. Resolve Critical/High findings, rerun review, and obtain final review approval.
10. `/testing $JIRA_ID` -> approved implementation/review and tests -> executed test evidence and `testing.md`. Fix failures through development/review/testing loops. Require test/release approval.
11. `/pr-generation $JIRA_ID` -> approved evidence -> `pr-description.md`. Request separate explicit approval before creating a GitHub PR; record only returned PR identifiers.
12. `/deployment $JIRA_ID` -> approved PR, test evidence, and verified deployment requirements -> `deployment.md`. Request immediate approval for the specific deployment before execution.
13. `/closure $JIRA_ID` -> verified deployment evidence -> `deployment-validation.md`, smoke tests, mandatory-artifact and traceability checks. Request closure approval; close state only after explicit approval.

The ordered flow follows `rules/sdlc.md`, including mandatory API Design between design review and planning. Do not skip it or proceed when its contract is not established.

## Stop conditions

Stop immediately and report the owner/action needed when: Jira identity is unresolved; the artifact resolver is missing or unsafe; required evidence/artifacts are absent or contradictory; workflow state belongs to another active Jira key; a gate lacks explicit approval; a Critical/High finding remains open; a required test is failed or not run; a requested test case is not implementable; a deployment target/procedure is unverified; an MCP action fails or returns no verifiable identifier; or any security concern is found. Mark the phase `BLOCKED` or `AWAITING_APPROVAL` and keep the overall workflow `IN_PROGRESS`.

## Completion report

At the end, report verified Jira ID, completed phases, approvals and their evidence, artifacts with resolver-derived paths, exact test/deployment outcomes, unresolved risks/blockers, PR number/URL if actually returned, and MCP status. Closure is complete only after mandatory artifacts and validations pass and the human grants closure approval. Otherwise report `Status: In Progress` and the precise next action.

## Example

`/sdlc PET-123` begins with intake, then pauses for approval. A single invocation must not rush through later stages merely because the user asked for end-to-end execution; resume only after the user supplies each required decision.