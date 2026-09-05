# Implementation Plan

## Overview

This implementation plan translates the approved architecture into a dependency-ordered set of tasks for building the Automated Documentation Sync workflow without changing the application source code. The work is limited to the approved technical documentation subset and follows the requirements and design-review decisions.

The plan intentionally excludes non-required work, including feature development, application logic changes, and broad repo-wide documentation generation beyond the approved targets.

## Task Ordering Principles

- Tasks are ordered by dependency.
- Earlier tasks define the contract and scope for later tasks.
- No task may introduce a new design decision beyond those already approved.
- Blocked tasks are explicitly marked.
- The implementation must remain repo-native and evidence-based.

## Task List

### Task ID: T-01
- Description: Define the approved documentation scope and the repository manifest for automated sync.
- Files/components affected:
  - architecture.md
  - design-review.md
  - repository root documentation set
  - future sync configuration or manifest file (doc-only configuration, not application code)
- Dependencies:
  - None
- Acceptance criteria:
  - The approved technical documentation targets are explicitly identified.
  - Curated workshop and educational content is excluded from automated generation.
  - The sync workflow has a known allowlist of files or doc sections it may update.
  - The allowed scope is documented and reviewable.
- Test requirements:
  - Validation that manifest entries are limited to approved technical docs.
  - Negative test proving non-approved content is not included in the sync scope.
- Risk:
  - Medium
  - Risk of over-scoping the feature and touching human-authored documentation that should remain manual.
- Blocked:
  - No

### Task ID: T-02
- Description: Define the evidence model and the formal `Not Found` / provenance policy.
- Files/components affected:
  - validation policy definitions
  - documentation generation contract
  - doc templates for approved sections
- Dependencies:
  - T-01
- Acceptance criteria:
  - Every generated statement has a provenance source or an explicit `Not Found` record.
  - Missing evidence is represented as `Not Found`, not guessed.
  - Validation fails when a generated section lacks provenance.
  - The policy explicitly distinguishes between missing evidence and contradictory evidence.
- Test requirements:
  - Unit tests covering: valid proof, missing proof, contradictory evidence, and `Not Found` output.
  - Negative tests for missing provenance causing validation failure.
- Risk:
  - High
  - Risk of generating content that appears authoritative without proof.
- Blocked:
  - No

### Task ID: T-03
- Description: Implement repository discovery for approved technical files and documentation targets.
- Files/components affected:
  - repository root and approved doc locations
  - future Python sync runner entry point
  - discovery manifest and filtering logic
- Dependencies:
  - T-01
  - T-02
- Acceptance criteria:
  - The discovery layer identifies only approved sources and doc targets.
  - Non-approved content is ignored by the automated sync workflow.
  - The system can report which files were scanned and why they were included or excluded.
- Test requirements:
  - Unit tests for allowlist behavior and directory filtering.
  - Test that excluded workshop content is not selected for generation.
- Risk:
  - Medium
  - Risk of scanning too broadly and modifying the wrong files.
- Blocked:
  - No

### Task ID: T-04
- Description: Extract structural facts from the Flask backend and SQLAlchemy models.
- Files/components affected:
  - app/server/app.py
  - app/server/models/
  - app/server/utils/
  - Python sync analysis layer
- Dependencies:
  - T-03
- Acceptance criteria:
  - Route definitions are extracted from the Flask app.
  - Model metadata is extracted from the SQLAlchemy layer.
  - Relationship and field-level facts are normalized for documentation generation.
  - Unsupported or unverified behavior is not treated as fact.
- Test requirements:
  - Unit tests for route extraction and model metadata extraction.
  - Contract tests comparing extracted facts to actual repo files.
- Risk:
  - High
  - Risk of incorrect inference from dynamic or implicit application behavior.
- Blocked:
  - No

### Task ID: T-05
- Description: Extract structural facts from the Astro frontend and existing test files.
- Files/components affected:
  - app/client/src/
  - app/client/e2e-tests/
  - app/client/playwright.config.ts
  - Python sync analysis layer
- Dependencies:
  - T-03
- Acceptance criteria:
  - Page routes and UI data-fetch patterns are identified from the Astro app.
  - Existing test coverage is mapped to the actual repository tests.
  - The sync system understands which technical facts are supported by test evidence.
- Test requirements:
  - Tests verifying page-route inventory and test-source evidence mapping.
  - Negative tests for unsupported UI assumptions.
- Risk:
  - Medium
  - Risk of over-interpreting frontend page behavior that is not governed by code or tests.
- Blocked:
  - No

### Task ID: T-06
- Description: Implement the validation and policy layer for evidence, contradictions, and `Not Found` handling.
- Files/components affected:
  - validation layer
  - generated-document contract
  - repo validation rules
- Dependencies:
  - T-02
  - T-04
  - T-05
- Acceptance criteria:
  - Validation rejects contradictory statements.
  - Validation enforces `Not Found` when evidence is missing.
  - Validation requires provenance for generated statements.
  - Validation can fail a section without failing the whole repository in cases that require review.
- Test requirements:
  - Unit tests for contradiction detection, proof checks, and `Not Found` rules.
  - Snapshot or fixture-based validation tests using known repo data.
- Risk:
  - High
  - Risk of invalid documentation passing because rules are too loose.
- Blocked:
  - No

### Task ID: T-07
- Description: Implement the documentation generation layer for approved technical sections only.
- Files/components affected:
  - approved technical documentation template(s)
  - generation functions
  - Markdown output logic
- Dependencies:
  - T-02
  - T-04
  - T-05
  - T-06
- Acceptance criteria:
  - The generator produces Markdown only for the approved technical docs subset.
  - Output is based on extracted facts and supported evidence only.
  - Missing facts are rendered as `Not Found` with provenance context.
  - Generated output remains deterministic for the same repo state.
- Test requirements:
  - Unit tests for template rendering and deterministic output.
  - Snapshot tests for known repository fixtures.
- Risk:
  - Medium
  - Risk of generating content that drifts from the actual repo state.
- Blocked:
  - No

### Task ID: T-08
- Description: Add the atomic documentation update layer and write-protection rules.
- Files/components affected:
  - write/update layer
  - repo write guardrails
  - approved doc subset
- Dependencies:
  - T-07
- Acceptance criteria:
  - The system writes only to approved doc files.
  - The system never writes to application source files.
  - Writes are atomic and do not leave partial output on failure.
  - A failed run leaves the repo unchanged.
- Test requirements:
  - Tests confirming no write occurs outside the approved subset.
  - Failure-path tests ensuring atomic update behavior.
- Risk:
  - High
  - Risk of partial or unsafe repo mutation.
- Blocked:
  - No

### Task ID: T-09
- Description: Implement the CLI modes and validation outputs for local and CI execution.
- Files/components affected:
  - Python sync CLI entry point
  - local execution commands
  - validation output/reporting
- Dependencies:
  - T-06
  - T-07
  - T-08
- Acceptance criteria:
  - The command supports analyze, validate, generate, and sync modes.
  - Exit codes are explicit and deterministic.
  - Local runs can validate without writing changes.
  - CI can run validation and diff reporting without mutating code.
- Test requirements:
  - Unit tests for mode behavior and exit codes.
  - Integration tests for dry-run validation vs write mode.
- Risk:
  - Medium
  - Risk of confusing developer workflows or CI outcomes.
- Blocked:
  - No

### Task ID: T-10
- Description: Add logging and traceability for each sync run.
- Files/components affected:
  - logging layer
  - CLI and CI reporting
  - validation summary output
- Dependencies:
  - T-03
  - T-06
  - T-09
- Acceptance criteria:
  - Logs contain the files scanned, facts extracted, validation outcomes, and write decisions.
  - Logs report when content is marked `Not Found` and why.
  - Logs do not expose secrets, API keys, tokens, or environment variables.
- Test requirements:
  - Tests verifying logging content and redaction behavior.
  - Negative tests for secret leakage in logs.
- Risk:
  - Medium
  - Risk of operational confusion or sensitive data exposure during automated runs.
- Blocked:
  - No

### Task ID: T-11
- Description: Configure GitHub Actions validation for the approved sync workflow.
- Files/components affected:
  - GitHub Actions workflow files
  - CI validation steps
  - repository automation metadata
- Dependencies:
  - T-09
  - T-10
- Acceptance criteria:
  - CI runs the sync validation in a controlled, repo-native workflow.
  - The workflow uses least-privilege permissions and restricts writes to approve doc locations only.
  - Validation fails on unverified content or missing provenance.
  - CI output is reviewable and deterministic.
- Test requirements:
  - Workflow validation using repository-native CI conventions.
  - Tests confirming write restrictions and validation flow behavior.
- Risk:
  - Medium
  - Risk of fragile CI execution or overly broad automation permissions.
- Blocked:
  - No

## Blocked Tasks

The following tasks are intentionally blocked until earlier tasks are complete:

- T-04 is blocked by T-03.
- T-05 is blocked by T-03.
- T-06 is blocked by T-02, T-04, and T-05.
- T-07 is blocked by T-02, T-04, T-05, and T-06.
- T-08 is blocked by T-07.
- T-09 is blocked by T-06, T-07, and T-08.
- T-10 is blocked by T-03, T-06, and T-09.
- T-11 is blocked by T-09 and T-10.

No task is blocked by a requirement outside the approved architecture.

## Exclusions

The following items are intentionally not included because they are not required by the approved architecture:

- Application feature development
- Backend logic changes
- Frontend UI implementation changes
- Database migration work
- Broader repo-wide documentation generation beyond the approved technical subset
- External documentation platforms or SaaS integration
- New enterprise-scale orchestration frameworks
- Any work that modifies application source code

## Final Note

This plan is intentionally narrow and grounded in the approved architecture and the design-review decisions. It produces a disciplined, evidence-based, repository-native documentation sync workflow without introducing scope creep or contradicting the project’s constraints.
