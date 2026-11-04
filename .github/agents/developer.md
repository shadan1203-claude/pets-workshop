# Developer Implementation: Automated Documentation Sync

# Inputs

Required

docs/<JIRA_ID>/requirements.md 
docs/<JIRA_ID>/architecture.md 
docs/<JIRA_ID>/design-review.md 
docs/<JIRA_ID>/implementation-plan.md 
docs/<JIRA_ID>/test-cases.md

tests/<JIRA_ID>/tasks.test.js

Resolve `<JIRA_ID>` from the active issue and obtain artifact paths with
the resolver's `path` command with the relevant stage key. Never use
unscoped root-level `docs` paths for SDLC artifacts.

The Developer Agent must not re-analyze requirements.

The Developer Agent must implement only what is specified in:

implementation-plan.md
approved requirements.md
approved architecture.md
approved test-cases.md
The Developer Agent must not add functionality outside approved scope.

The Developer Agent must review and use the approved testing artifacts before starting implementation.

Required testing inputs:

docs/<JIRA_ID>/test-cases.md
tests/<JIRA_ID>/tasks.test.js

The Developer Agent must treat the approved test design as an implementation contract.

Implementation must satisfy:

All Jira Acceptance Criteria
All approved test cases
All approved unit test scenarios
All approved integration test scenarios
All approved end-to-end test scenarios
The Developer Agent must maintain traceability between:

Requirements → Test Cases → Implementation

## Pre-Implementation Validation


Before writing code, the Developer Agent must:

Read requirements.md
Read architecture.md
Read implementation-plan.md
Read test-cases.md
Read tasks.test.js

The Developer Agent must verify:

Every requirement has associated implementation work.
Every Jira Acceptance Criterion has at least one mapped test case.
Every planned implementation task supports one or more test scenarios.
No approved test case is ignored.
Test-Driven Implementation Requirement

Implementation must satisfy all approved:

Positive Test Cases
Negative Test Cases
Edge Case Test Cases
Unit Test Scenarios
Integration Test Scenarios
E2E Test Scenarios
The Developer Agent must design and implement functionality to pass the approved test suite.

Clarification Rule

If implementation cannot satisfy any:

Requirement
Acceptance Criterion
Test Case
Test Scenario
Architecture Constraint

the Developer Agent must:

STOP implementation.

Generate a clarification request that includes:

Requirement or Test Case ID
Description of the conflict
Impact on implementation
Recommended resolution

The Developer Agent must not:

Modify approved requirements
Modify approved architecture
Modify approved test cases
Ignore failing acceptance criteria
Invent missing business rules
Explicit human approval is required before implementation resumes.


## Implementation Status

Implemented the source scanner, documentation generator, validation engine, atomic writer, CLI, unit tests, and integration tests described by `agents/requirements.md`, `agents/planning.md`, and `agents/architecture.md`.

The implementation is repository-native and uses Python standard-library modules only. Existing Flask, SQLAlchemy, Astro, Tailwind, and runtime API code were not modified.

## Delivered Components

### Source scanner and evidence extraction

Implemented in [documentation_sync/core.py](../documentation_sync/core.py):

- Loads and validates `.github/documentation-sync-manifest.json`.
- Resolves repository paths safely, including relative manifest paths.
- Scans only configured source roots.
- Applies configured exclusions.
- Rejects path escapes and unauthorized documentation targets.
- Extracts route, model, frontend fetch, and test facts.
- Preserves source-file provenance for each fact.

### Documentation generator

Implemented by `generate_markdown` in [documentation_sync/core.py](../documentation_sync/core.py):

- Produces deterministic Markdown.
- Renders status, evidence, notes, and source files.
- Supports explicit `Not Found` evidence records.
- Generates output from normalized facts rather than inferred behavior.

### Validation engine

Implemented by `validate_facts` in [documentation_sync/core.py](../documentation_sync/core.py):

- Validates evidence statuses and evidence types.
- Requires provenance for verified facts.
- Rejects contradictory evidence.
- Requires `Not Found` markers for unavailable facts.
- Detects missing provenance sources.
- Checks common secret patterns.

### Atomic writer

Implemented by `AtomicDocumentationWriter` in [documentation_sync/core.py](../documentation_sync/core.py):

- Writes only manifest-approved documentation targets.
- Stages output in temporary files on the target filesystem.
- Uses atomic replacement.
- Restores previous target content when a multi-target write fails.
- Cleans temporary files after success or failure.

### CLI

Implemented in [documentation_sync/cli.py](../documentation_sync/cli.py) and [documentation_sync/__main__.py](../documentation_sync/__main__.py).

Supported modes:

```text
python -m documentation_sync analyze --manifest .github/documentation-sync-manifest.json
python -m documentation_sync validate --manifest .github/documentation-sync-manifest.json
python -m documentation_sync generate --manifest .github/documentation-sync-manifest.json
python -m documentation_sync sync --manifest .github/documentation-sync-manifest.json --target README.md
```

Use `--format json` for machine-readable reports. Use `--dry-run` with `sync` to prevent writes.

The final Python module packaging name, numeric exit-code assignments, mandatory CI triggers, and automated commit or pull-request authority remain `Not Found` pending the clarification decisions in the requirements and architecture documents.

## Test Coverage

### Unit tests

[test_documentation_sync_engine.py](../test_documentation_sync_engine.py) covers:

- Manifest-scoped discovery and exclusions
- Route extraction
- Contradictory evidence
- Missing provenance
- Explicit `Not Found` handling
- Deterministic generation
- Unauthorized target rejection
- Approved-target replacement

### Integration tests

[test_documentation_sync_integration.py](../test_documentation_sync_integration.py) runs the CLI in a temporary repository and verifies:

- `analyze` returns a successful JSON report
- `generate` emits Markdown without writing files
- `sync` writes an approved target
- Generated output contains extracted source evidence

## Validation Results

Focused implementation validation:

```text
7 tests passed
```

Existing Flask regression validation:

```text
4 tests passed
```

The real repository manifest was validated successfully, with 23 extracted facts. Python diagnostics reported no errors for the implementation or its tests.

The existing documentation governance suite still reports missing `architecture.md` target files because those files are deleted in the current worktree outside this implementation. That pre-existing workspace state was not restored or changed by this implementation.

## Traceability

| Architecture requirement | Implementation |
| --- | --- |
| Manifest-scoped discovery | `Manifest`, `RepositoryScanner` |
| Evidence and provenance | `EvidenceFact` |
| Contradiction and missing-evidence policy | `validate_facts` |
| Deterministic Markdown | `generate_markdown` |
| Atomic approved-target writes | `AtomicDocumentationWriter` |
| Local and CI execution contract | `documentation_sync` CLI |
| Unit coverage | `test_documentation_sync_engine.py` |
| Integration coverage | `test_documentation_sync_integration.py` |
