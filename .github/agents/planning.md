# Implementation Plan: Automated Documentation Sync

## Planning Basis

This plan is derived from [agents/requirements.md](requirements.md). It does not add requirements that are absent from that document. Confluence and JIRA details remain `Not Found` and are represented as clarification dependencies where they affect implementation decisions.

## Delivery Principles

- Preserve existing Flask/SQLAlchemy and Astro/Tailwind application behavior.
- Treat the manifest as the authoritative allowlist for analysis inputs and documentation outputs.
- Prefer source code, executable tests, and configuration over prose when evidence conflicts.
- Fail closed for contradictory evidence, missing provenance, unsafe paths, and partial writes.
- Keep generated documentation reviewable by humans before merge.

## Dependency Overview

```text
E1 Scope and Governance
  -> E2 Repository Discovery and Evidence
      -> E3 Validation and Fact Model
          -> E4 Documentation Generation
              -> E5 Safe Synchronization and Review
                  -> E6 Local and CI Delivery
```

Cross-cutting concerns for every epic: secret redaction, deterministic output, test coverage, logging, and preservation of application behavior.

## Epic 1: Scope and Governance Foundation

**Goal:** Establish the allowed inputs, outputs, evidence contract, and unresolved decisions before implementation changes are made.

**Requirements:** FR-01 to FR-05, FR-07 to FR-10, NFR-03 to NFR-05, constraints.

### Story E1-S1: Define synchronization scope

**As a** maintainer, **I want** the workflow to use an explicit allowlist, **so that** curated content and application code are protected.

**Tasks**

- T1.1 Review `.github/documentation-sync-manifest.json` against the requested scope.
- T1.2 Define the source-root and generated-target interfaces used by the implementation.
- T1.3 Define rejection behavior for excluded paths and unapproved output paths.
- T1.4 Add unit tests for approved and excluded path matching.

**Subtasks**

- S1.1.1 Cover `app/server`, `app/client/src`, and `app/client/e2e-tests` as configured inputs.
- S1.1.2 Cover `content/**`, `docs/**`, and `app/client/README.md` as exclusions.
- S1.1.3 Verify application source files cannot be selected as write targets.

**Dependencies:** None.

**Acceptance criteria**

- Given a repository path, when scope evaluation runs, then only configured source roots and documentation targets are eligible.
- Given an excluded or source-code path, when a write is requested, then the request is rejected.
- Given the manifest is invalid or missing required fields, when the workflow starts, then it fails before analysis or writes.

### Story E1-S2: Define the evidence and provenance contract

**As a** reviewer, **I want** each generated statement to identify its evidence, **so that** documentation claims are auditable.

**Tasks**

- T1.5 Define the normalized evidence record with `status`, `evidence`, `notes`, and `source_files`.
- T1.6 Define `verified`, `not_found`, and `contradictory` status handling.
- T1.7 Define the exact `Not Found` representation required for missing evidence.
- T1.8 Add fixtures for verified, missing, and contradictory evidence.

**Subtasks**

- S1.2.1 Validate all required fields are present and correctly typed.
- S1.2.2 Reject missing provenance for generated claims.
- S1.2.3 Ensure contradictory evidence is distinguishable from unavailable evidence.

**Dependencies:** E1-S1.

**Acceptance criteria**

- Given a generated section, when its evidence record is validated, then all required fields are present.
- Given no evidence exists, when the section is rendered, then it uses `Not Found` and an explanatory note.
- Given contradictory evidence exists, when validation runs, then the result is a failure requiring review.

### Story E1-S3: Resolve business and operational decisions

**As a** product and repository maintainer, **I want** unresolved business decisions identified, **so that** implementation does not silently invent policy.

**Tasks**

- T1.9 Obtain the Confluence overview and JIRA story fields for `EPMCDMETST`.
- T1.10 Confirm mandatory triggers and scheduling expectations.
- T1.11 Confirm whether automation may commit changes or create pull requests.
- T1.12 Confirm reviewer roles, audit retention, performance, availability, accessibility, localization, and browser targets.

**Subtasks**

- S1.3.1 Record answers in the requirements artifact.
- S1.3.2 Update affected acceptance criteria before implementation of dependent behavior.
- S1.3.3 Keep unresolved items explicitly marked `Not Found`.

**Dependencies:** E1-S1.

**Acceptance criteria**

- Given a decision is unavailable, when planning is reviewed, then it is listed as an explicit blocker or `Not Found` item.
- Given authoritative business input is supplied, when the plan is updated, then dependent stories identify the changed requirement.

**Blockers:** External Confluence and JIRA content is unavailable in the workspace.

## Epic 2: Repository Discovery and Evidence Extraction

**Goal:** Discover approved files and extract facts without modifying application runtime code.

**Requirements:** FR-02, FR-04, FR-06 to FR-09, FR-21, NFR-01, NFR-02, NFR-05.

### Story E2-S1: Discover approved repository files

**As a** sync operator, **I want** a reproducible file inventory, **so that** analysis is limited and traceable.

**Tasks**

- T2.1 Implement manifest loading and path normalization.
- T2.2 Implement deterministic source and target discovery.
- T2.3 Emit included and excluded file lists.
- T2.4 Test discovery against the repository layout.

**Subtasks**

- S2.1.1 Handle missing files and directories as explicit validation errors where required.
- S2.1.2 Normalize path separators consistently across local Windows and CI environments.
- S2.1.3 Prevent traversal or absolute-path escape from the repository root.

**Dependencies:** E1-S1, E1-S2.

**Acceptance criteria**

- Given the same repository state, when discovery runs repeatedly, then it returns the same ordered inventory.
- Given an excluded directory, when discovery runs, then no file from that directory is selected.
- Given an unsafe path, when discovery evaluates it, then it is rejected.

### Story E2-S2: Extract backend and test facts

**As a** documentation generator, **I want** backend and test facts in a normalized form, **so that** API documentation reflects implementation evidence.

**Tasks**

- T2.5 Extract Flask route definitions and methods.
- T2.6 Extract SQLAlchemy model and relationship metadata relevant to documentation.
- T2.7 Extract backend test coverage and contract evidence.
- T2.8 Attach source-file provenance to each extracted fact.

**Subtasks**

- S2.2.1 Cover `app/server/app.py` routes including `/api/dogs`, `/api/dogs/<int:id>`, and `/health`.
- S2.2.2 Cover model files under `app/server/models`.
- S2.2.3 Avoid executing application code or mutating database state during analysis.

**Dependencies:** E2-S1.

**Acceptance criteria**

- Given a supported route or model declaration, when extraction runs, then the fact includes its source file.
- Given behavior is not statically supported, when extraction runs, then it is not promoted to a verified fact.
- Given backend tests provide evidence, when extraction runs, then that evidence is associated with the relevant fact.

### Story E2-S3: Extract frontend and end-to-end test facts

**As a** documentation generator, **I want** frontend and test facts in a normalized form, **so that** documented UI behavior matches the Astro application.

**Tasks**

- T2.9 Extract Astro page routes and API-fetch patterns.
- T2.10 Extract Playwright test scenarios and configuration evidence.
- T2.11 Attach provenance and evidence type to frontend facts.

**Subtasks**

- S2.3.1 Cover `app/client/src/pages` and relevant components.
- S2.3.2 Cover `app/client/e2e-tests` and `playwright.config.ts`.
- S2.3.3 Mark unsupported UX, accessibility, and browser claims as `Not Found`.

**Dependencies:** E2-S1.

**Acceptance criteria**

- Given an Astro page or Playwright scenario, when extraction runs, then the result identifies its source file.
- Given a UX claim lacks code or test evidence, when facts are normalized, then its status is `not_found`.

## Epic 3: Validation and Documentation Fact Model

**Goal:** Validate facts and document claims before any output is written.

**Requirements:** FR-07 to FR-15, NFR-01 to NFR-06.

### Story E3-S1: Normalize and compare evidence

**As a** validator, **I want** facts normalized and compared, **so that** contradictions and unsupported changes are detected consistently.

**Tasks**

- T3.1 Implement normalized fact types for routes, models, pages, tests, configuration, and documentation sections.
- T3.2 Implement duplicate consolidation while preserving all provenance.
- T3.3 Implement contradiction detection.
- T3.4 Add unit and fixture tests for comparison outcomes.

**Dependencies:** E1-S2, E2-S2, E2-S3.

**Acceptance criteria**

- Given equivalent evidence from multiple files, when facts are normalized, then one fact retains all supporting sources.
- Given conflicting evidence, when facts are compared, then the result is `contradictory`.
- Given missing evidence, when facts are compared, then the result is `not_found`, not contradictory.

### Story E3-S2: Validate documentation claims and security policy

**As a** maintainer, **I want** validation to fail on unsafe or unsupported output, **so that** generated documentation remains trustworthy.

**Tasks**

- T3.5 Validate required provenance for every generated section.
- T3.6 Validate `Not Found` markers for unavailable facts.
- T3.7 Validate approved-target and source-code write restrictions.
- T3.8 Add secret-pattern and sensitive-value redaction checks.
- T3.9 Produce actionable validation results and exit outcomes.

**Dependencies:** E3-S1.

**Acceptance criteria**

- Given missing provenance, when validation runs, then it fails with the affected section and source context.
- Given a secret-like value appears in output or logs, when security validation runs, then the result fails or redacts it.
- Given an output path is not approved, when validation runs, then the result fails before writing.

## Epic 4: Deterministic Documentation Generation

**Goal:** Generate only approved technical Markdown from validated facts.

**Requirements:** FR-11 to FR-14, FR-20, NFR-02, NFR-04, NFR-05.

### Story E4-S1: Generate approved technical documentation

**As a** maintainer, **I want** deterministic documentation drafts, **so that** source changes produce reviewable updates.

**Tasks**

- T4.1 Define templates or section renderers for approved documentation targets.
- T4.2 Render verified facts with provenance.
- T4.3 Render missing facts using the required `Not Found` format.
- T4.4 Preserve stable ordering and formatting.
- T4.5 Add deterministic and snapshot-style tests.

**Dependencies:** E3-S1, E3-S2.

**Acceptance criteria**

- Given validated facts, when generation runs, then output is Markdown only within approved targets.
- Given the same facts, when generation runs repeatedly, then output is byte-for-byte stable.
- Given unsupported information, when generation runs, then it cannot produce an unsupported assertion.

### Story E4-S2: Provide analysis, validation, and generation modes

**As a** developer, **I want** separate non-writing modes, **so that** I can inspect and validate changes safely.

**Tasks**

- T4.6 Define CLI command and mode contract for `analyze`, `validate`, and `generate`.
- T4.7 Define deterministic exit codes for success, drift, invalid evidence, and operational failure.
- T4.8 Add mode-level tests that verify no unintended writes occur.

**Dependencies:** E2-S1, E3-S2, E4-S1.

**Acceptance criteria**

- Given `analyze`, when the command completes, then it emits structured facts without writing documentation.
- Given `validate`, when the command completes, then it reports compliance or actionable failure without writing files.
- Given `generate`, when the command completes, then it produces approved draft output without changing source code.

## Epic 5: Safe Synchronization and Human Review

**Goal:** Apply validated documentation changes safely and expose them for approval.

**Requirements:** FR-05, FR-16 to FR-20, NFR-01, NFR-03, NFR-05.

### Story E5-S1: Implement atomic, write-protected synchronization

**As a** maintainer, **I want** synchronization to update docs atomically, **so that** failed runs cannot corrupt the repository.

**Tasks**

- T5.1 Implement target-path authorization before opening any output.
- T5.2 Write generated content to temporary files in the same filesystem.
- T5.3 Replace targets atomically only after complete validation.
- T5.4 Clean up temporary files on success and failure.
- T5.5 Add failure-path tests for partial writes and unauthorized targets.

**Dependencies:** E4-S1, E3-S2.

**Acceptance criteria**

- Given validation fails, when synchronization exits, then existing documentation remains unchanged.
- Given a write fails midway, when synchronization exits, then no target contains partial output.
- Given a source-code path is supplied as a target, when synchronization runs, then it fails without modifying that file.

### Story E5-S2: Produce reviewable change reports

**As a** reviewer, **I want** a clear diff and validation summary, **so that** I can approve or reject generated changes.

**Tasks**

- T5.6 Report no-change, changed, and validation-failure outcomes.
- T5.7 Include affected documentation targets and evidence references.
- T5.8 Redact sensitive values from reports and logs.
- T5.9 Add tests for report content and redaction.

**Dependencies:** E3-S2, E5-S1.

**Acceptance criteria**

- Given generated output differs, when synchronization completes, then the report identifies changed targets and provenance.
- Given no output differs, when synchronization completes, then the report states no change.
- Given validation fails, when synchronization completes, then the report identifies the failure without applying writes.

### Story E5-S3: Establish human approval workflow

**As a** reviewer, **I want** generated documentation changes reviewed before merge, **so that** automation does not bypass repository governance.

**Tasks**

- T5.10 Define pull-request presentation and required checks.
- T5.11 Document reviewer verification of evidence and `Not Found` decisions.
- T5.12 Resolve approval roles and branch-protection requirements.

**Dependencies:** E5-S2, E1-S3.

**Acceptance criteria**

- Given generated changes are proposed, when a pull request is reviewed, then provenance and validation results are available.
- Given required checks or approval are missing, when merge protection is evaluated, then the change cannot be treated as approved.

**Blockers:** Exact reviewer roles and branch-protection settings are `Not Found`.

## Epic 6: Local and CI Delivery

**Goal:** Run the same safe workflow locally and in GitHub Actions without changing application behavior.

**Requirements:** FR-21 to FR-23, NFR-06 to NFR-10, constraints.

### Story E6-S1: Add CI validation workflow

**As a** maintainer, **I want** documentation validation in CI, **so that** source changes cannot silently introduce documentation drift.

**Tasks**

- T6.1 Add a least-privilege GitHub Actions validation job.
- T6.2 Run the same commands used by local validation.
- T6.3 Publish validation outcome and diff information for review.
- T6.4 Ensure CI does not write outside approved documentation targets.

**Dependencies:** E4-S2, E5-S2, E1-S3.

**Acceptance criteria**

- Given a pull request or configured CI event, when the job runs, then it validates the documentation workflow.
- Given invalid evidence or unsafe output, when CI runs, then the job fails with an actionable result.
- Given valid unchanged documentation, when CI runs, then the job succeeds without modifying application code.

**Blockers:** Mandatory trigger events and whether CI may publish or commit generated output are `Not Found`.

### Story E6-S2: Verify local and CI parity

**As a** developer, **I want** local and CI modes to behave consistently, **so that** failures can be reproduced before review.

**Tasks**

- T6.5 Document local setup and commands using existing Python tooling.
- T6.6 Run focused unit, contract, and integration tests locally.
- T6.7 Compare local and CI exit codes and validation outputs.
- T6.8 Run existing backend and frontend tests to verify application preservation.

**Dependencies:** E6-S1.

**Acceptance criteria**

- Given the same repository state and mode, when local and CI validation run, then they produce equivalent results.
- Given the documentation workflow is present, when existing application tests run, then application behavior remains unchanged.

## Cross-Cutting Test Matrix

| Area | Required coverage |
| --- | --- |
| Scope | Allowlist, exclusions, path traversal, source-code write protection |
| Evidence | Verified, missing, contradictory, duplicate provenance |
| Extraction | Backend routes/models, frontend pages, tests, configuration |
| Generation | Deterministic output, `Not Found`, approved targets only |
| Validation | Missing provenance, contradictions, unsupported claims, secrets |
| Writes | Atomic success, failure cleanup, unchanged-on-failure |
| CLI | All modes, exit codes, dry-run behavior |
| Reporting | Changed/no-change/failure summaries and redaction |
| CI | Least privilege, local/CI parity, application regression checks |

## Dependency and Risk Register

| Item | Impact | Mitigation or blocker |
| --- | --- | --- |
| Missing Confluence and JIRA details | Business scope may be incomplete | Resolve E1-S3 before finalizing affected stories. |
| Ambiguous write authority | Automation could exceed governance | Default to reviewable, non-writing validation until clarified. |
| Dynamic application behavior | Static extraction may miss facts | Use executable tests as supporting evidence and mark gaps `Not Found`. |
| Path or symlink escape | Unauthorized files could be read or written | Normalize and authorize paths against repository root and manifest. |
| Secret leakage | Sensitive values could enter docs or logs | Redact and fail security checks. |
| Partial writes | Documentation could be corrupted | Validate completely, then use atomic replacement and cleanup. |
| Existing app regression | Feature could disrupt the application | Run existing Python and Playwright test suites in E6-S2. |
| Over-engineering | Small repository gains unnecessary complexity | Keep the implementation repository-native and dependency-light. |

## Suggested Delivery Order

1. Complete E1-S1 and E1-S2; do not implement behavior without the scope and evidence contracts.
2. Resolve E1-S3 questions that affect triggers, write authority, and approval.
3. Implement E2 discovery and extraction with focused tests.
4. Implement E3 normalization and validation before rendering output.
5. Implement E4 deterministic generation and non-writing CLI modes.
6. Implement E5 atomic synchronization and review reporting.
7. Implement E6 CI workflow and local/CI parity checks.
8. Run the complete cross-cutting test matrix and existing application regression tests.
