# Design Review

## Review Scope

This review evaluates the proposed architecture for Automated Documentation Sync against the existing repository structure, constraints, and requirements. The assessment is limited to architectural fit and design quality and does not implement or modify application code.

The review is based on:

- [requirements.md](requirements.md)
- [.github/copilot-instructions.md](.github/copilot-instructions.md)
- [README.md](README.md)
- [app/server/app.py](app/server/app.py)
- [app/server/test_app.py](app/server/test_app.py)
- [app/server/models](app/server/models)
- [app/client](app/client)
- [content](content)
- [architecture.md](architecture.md)

Scope boundaries:

- Architectural fit with the existing Flask/SQLAlchemy and Astro/Tailwind project
- Evidence-based documentation generation
- Security, failure handling, and validation strategy
- Repository-native deployment and CI considerations
- Risk of over-engineering or invalid assumptions
- Documentation governance for generated versus curated content

## Review Participants

- Principal engineer review of the proposed architecture
- Repository context review using the current source tree and documentation
- Requirements review based on the repository’s existing project constraints

## Findings

### ID: A-01
- Severity: High
- Description: The architecture introduces a multi-layer pipeline (discovery, policy, synthesis, validation, update, logging) that is more complex than the repository requires.
- Decision: Accepted
- Rationale: The project is a small application with a clear Flask backend and Astro frontend. The design should remain intentionally simple and should not introduce a large framework or multi-system architecture without a strong reason. The current repo is not large enough to justify a broad orchestration model.
- Required architecture change: Reduce the system to a narrow pipeline: discovery → extraction → validation → document write. Eliminate unnecessary abstraction layers and keep the implementation focused on the actual repo structure.

### ID: A-02
- Severity: High
- Description: The proposed design assumes generated technical documentation can cover the whole repository, but the repo also contains handcrafted workshop and educational content that is not derived from source code.
- Decision: Accepted
- Rationale: The project includes substantial documentation under [content](content) and other repo-level docs that are intentionally narrative and instructional. Those materials cannot all be treated as generated code-derived facts without risking content drift and rewriting human-authored guidance.
- Required architecture change: Separate generated technical documentation from curated human-authored documentation. Restrict the sync mechanism to a defined, approved subset of files rather than the entire repo.

### ID: A-03
- Severity: High
- Description: The architecture uses “Not Found” as a fallback but does not define the exact decision rule for when missing evidence should be treated as acceptable documentation versus a failed validation.
- Decision: Accepted
- Rationale: The repository explicitly requires that undocumented facts be recorded as “Not Found” rather than guessed. That principle is important, but the architecture needs a formal rule to prevent ambiguous handling.
- Required architecture change: Define a strict section-level schema that requires evidence provenance, a confidence indicator, and a formal “Not Found” output when evidence is absent or incomplete.

### ID: A-04
- Severity: Medium
- Description: The architecture assumes the codebase is the only source of truth for every documentation topic.
- Decision: Needs clarification
- Rationale: This is not necessarily wrong if the architecture is explicitly scoped to generated technical docs. It becomes a real issue only if the system is intended to own all documentation in the repo, including workshop and educational material.
- Required architecture change: Clarify whether the automated sync applies only to technical documentation derived from code and tests, and exclude narrative or curated docs from scope.

### ID: A-05
- Severity: High
- Description: The source-analysis approach is under-specified for the actual patterns used in this repository.
- Decision: Accepted
- Rationale: Flask routes, SQLAlchemy models, Astro pages, and Playwright test patterns are all present in the repo and are not all trivial to parse consistently. Without explicit extraction rules, the implementation would be prone to false positives and missed facts.
- Required architecture change: Define extraction rules for route definitions, model metadata, page structures, and test evidence, and validate them against the real repository files before enabling automation.

### ID: A-06
- Severity: Medium
- Description: The security model is too generic for a repository-writer or CI automation that can mutate documentation.
- Decision: Accepted
- Rationale: The repository’s documented security rules forbid exposing sensitive values. The architecture mentions broad principles but does not define permission boundaries, write restrictions, or secret-handling rules in operational detail.
- Required architecture change: Specify GitHub Actions permissions, restrict writes to approved paths, prohibit secret logging, and require validation before any write path is enabled.

### ID: A-07
- Severity: Medium
- Description: The CI model is under-specified and does not define clear exit semantics or artifact behavior.
- Decision: Accepted
- Rationale: CI automation requires deterministic modes and explicit failure behavior. The current description leaves room for inconsistent runs and unclear developer outcomes.
- Required architecture change: Define execution modes such as analyze, validate, generate, and sync, and specify precise exit codes, logs, and diff outputs for each mode.

### ID: A-08
- Severity: Medium
- Description: The architecture does not define atomic write handling for generated documentation.
- Decision: Accepted
- Rationale: Partial writes are a common failure mode in documentation sync systems. A failed generation run should not leave the repository in a half-written or inconsistent state.
- Required architecture change: Require atomic writes using temporary files and rename operations, and prevent partial updates to the repository on failure.

### ID: A-09
- Severity: Medium
- Description: The architecture does not sufficiently align with the repository’s existing test patterns and execution model.
- Decision: Accepted
- Rationale: This repo already uses Python `unittest` and Playwright testing. The documentation automation should integrate with these existing patterns rather than inventing a separate or parallel validation process.
- Required architecture change: Use repository-native test conventions for validation and source checks, and keep the doc-sync workflow aligned with existing CI/test execution patterns.

### ID: A-10
- Severity: Medium
- Description: The architecture is broader than the repository’s actual scale and likely scope.
- Decision: Accepted
- Rationale: A repo of this size does not need a large, abstract automation framework. The architecture should be consciously small and repo-bound to remain understandable and maintainable.
- Required architecture change: Restrict the system to a finite list of documentation targets and explicitly define the allowed scope of generated output.

### ID: A-11
- Severity: Medium
- Description: The architecture is coupled to a specific repository structure and therefore may be brittle as the repo evolves.
- Decision: Needs clarification
- Rationale: This may be acceptable if the design is intentionally repository-native, but the architecture should state whether it is intended as a general tool or a project-specific workflow. That is a design choice rather than an obvious flaw.
- Required architecture change: Clarify whether the sync logic should be config-driven and extensible, or whether it is intentionally fixed to the current repo layout.

### ID: A-12
- Severity: Medium
- Description: The architecture does not make evidence provenance explicit enough for generated sections.
- Decision: Accepted
- Rationale: Evidence tracking is essential because the project’s rules require that generated documentation never invent facts. Without provenance, reviewers cannot tell whether a statement is grounded in code, tests, configuration, or simply an assumption.
- Required architecture change: Require each generated section to include a provenance record and an explicit “Not Found” justification when no verified evidence exists.

## Accepted Findings

- A-01
- A-02
- A-03
- A-05
- A-06
- A-07
- A-08
- A-09
- A-10
- A-12

These findings are valid design risks with concrete repository-specific reasons and actionable changes.

## Rejected Findings

No findings are rejected.

The architecture does not contain obvious invalid proposals; instead, the main issues are about scope, precision, and operational rigor. Those are legitimate review concerns that should be addressed before implementation.

## Design Decisions

1. The automated documentation sync system should be repository-native and evidence-based.
2. Documentation generation should be restricted to verified technical facts rather than inferred behavior.
3. Missing facts should be represented as “Not Found” rather than guessed.
4. The system should operate on a narrow, explicitly approved set of documentation targets.
5. CI validation should be deterministic and should fail closed when evidence is missing or contradictory.
6. The design should remain small and aligned with the project’s existing Flask, SQLAlchemy, Astro, Python, and Playwright architecture.

## Risks

- Documentation drift caused by human-authored or workshop content being overwritten by generated output
- False positives in source extraction from a mixed codebase
- Partial writes or inconsistent docs after failed sync runs
- Security gaps in GitHub Actions permissions and secret handling
- CI instability caused by incomplete validation or ambiguous output handling
- Reduced trust if generated documentation lacks provenance or evidence trails

## Open Questions

- Is the sync scope limited to technical docs, or does it also include workshop and educational content?
- Should the system generate new documents, update existing ones, or both?
- Are we allowed to update only a defined subset of markdown files in the repo?
- Should documentation generation ever run in write mode without a human review gate?
- What exactly counts as accepted evidence for a generated section?
- Should all generated sections include explicit provenance metadata?

## Final Recommendation

The architecture is directionally sound and aligns with the repository requirement to avoid inventing facts, but it should be narrowed and tightened before implementation. The key improvements are:

- define scope clearly
- separate generated technical docs from curated workshop content
- formalize the “Not Found” decision model
- add atomic update behavior
- define precise CI and security boundaries
- make evidence provenance mandatory

With those changes, the architecture would be a good fit for this repository. Without them, it risks becoming too broad, too abstract, and too prone to incorrectly generated documentation.
