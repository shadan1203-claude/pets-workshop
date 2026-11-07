---
name: documentation-sync
description: Use this skill when updating or validating documentation for the pets-workshop repository in a way that follows the approved architecture: evidence-based technical documentation, source-of-truth analysis, Not Found handling, and strict scope control without modifying application code.
---

# Documentation Sync Skill for pets-workshop

Use this skill for repository documentation updates that must stay aligned with the actual implementation of the pets-workshop application.

## Scope

This skill is intentionally limited to the approved technical documentation subset defined by the repository's documentation-sync manifest and architecture. It does not apply to feature work or application source code changes.

This repository contains:

- Flask + SQLAlchemy backend under `app/server`
- Astro + Tailwind frontend under `app/client`
- Python `unittest` tests under `app/server/test_app.py`
- Playwright end-to-end tests under `app/client/e2e-tests`
- human-authored workshop content under `content/` that is explicitly out of scope for automated generation

## Required workflow

### 1. Inspect repository source files

Before making any doc change, inspect the relevant implementation sources and the approved documentation targets.

Review these areas first when relevant:

- `app/server/app.py` for HTTP routes and JSON responses
- `app/server/models/` for data model and database structure
- `app/server/utils/` for database seeding and environment assumptions
- `app/client/src/` for Astro pages, components, and data-fetch behavior
- `app/client/e2e-tests/` and `app/client/playwright.config.ts` for executed behavior and test coverage
- `README.md`, `architecture.md`, `design-review.md`, `impl-plan.md`, and the repo manifest for approved scope and conventions

Do not inspect or modify unrelated files beyond the approved technical documentation subset.

### 2. Identify documentation-relevant information

Extract only facts that are relevant to technical documentation, including:

- routes and endpoints
- request/response patterns
- model fields and relationships
- page structure and UI flow
- test evidence and configuration assumptions
- repository conventions used for validation and review

Avoid deriving documentation from guesswork, general assumptions, or narrative content that is not backed by source evidence.

### 3. Determine the source of truth

The source of truth for generated technical documentation is the repository's actual implementation and test evidence.

Use this precedence order:

1. direct source code evidence
2. executable tests and configuration
3. approved architecture or design artifacts that are already validated by the repo
4. `Not Found` when no evidence exists

Never treat workshop content, prose, or general documentation as authoritative when it conflicts with the actual implementation.

### 4. Update documentation

Update only the approved documentation subset documented by the repository manifest.

Rules:

- Never modify application source code
- Never modify unrelated files
- Keep the change limited to documentation output and validation metadata
- Preserve existing repo patterns and wording where appropriate
- Only update sections that are supported by evidence

### 5. Never invent missing information

If the repository does not contain explicit proof, do not guess.

Instead:

- state that the fact is unknown
- write `Not Found` as the value or status
- include a brief note explaining that no supporting evidence was found in the repository

This is mandatory for the pets-workshop workflow.

### 6. Mark unavailable information as Not Found

When documentation needs to describe a behavior, contract, configuration, or requirement but the repo does not provide explicit evidence, use this format:

- `Status: Not Found`
- `Notes: No evidence found in the repository for this behavior.`
- `Evidence: Not Found`

This should be preserved consistently across generated documentation.

### 7. Validate generated documentation

Before considering a documentation update complete, validate it against repository evidence.

Validate the documentation by checking:

- the relevant source files still support the written statement
- the statement is not contradicted by one or more repo sources
- the section has provenance or a valid `Not Found` marker
- the docs are still limited to the approved technical scope
- the update did not touch unrelated files

If validation fails because evidence is missing or contradictory, stop and report the issue instead of guessing.

### 8. Avoid modifying unrelated files

This skill must enforce strict scope control.

Do not touch:

- application business logic under `app/server`
- runtime application code under `app/client/src`
- unrelated docs or learning content under `content/`
- generated output outside the approved documentation subset
- anything outside the manifest allowlist

If a task would require application code changes, stop and report that it is out of scope for this skill.

## Repository-specific fit

This skill is specific to the approved architecture for pets-workshop:

- repository-native and evidence-based
- Python-based validation and documentation tooling
- GitHub Actions friendly validation workflow
- strict `Not Found` handling
- small-scope technical documentation only
- no source-code modifications

## Decision rules

When in doubt, choose the following order:

1. use the repository code or tests as proof
2. use the approved architecture or design docs as secondary evidence
3. use `Not Found` when evidence is absent
4. stop rather than inventing unsupported details

## Output expectations

When using this skill, the agent should produce a documentation update only if:

- the facts are grounded in repository evidence
- the doc target remains within the approved scope
- the generated output is explicit about missing evidence
- the change is limited to documentation only

If any of these are not true, the agent should refuse the change and explain why.
