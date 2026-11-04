# Pets Workshop Copilot Instructions

This repository is an existing application called **pets-workshop**.

It is a dog-shelter application with:

- Flask + SQLAlchemy backend under `app/server`
- Astro + Tailwind frontend under `app/client`

---

# Agentic SDLC Rules

This repository follows an Agentic SDLC workflow.

All new requirements must pass through the following phases in order:

1. Requirements Analysis
2. Architecture Design
3. Design Review
4. API Design
5. Planning
6. Development
7. Code Review
8. Testing
9. Deployment

Resolve the active Jira key from the issue, set `JIRA_ID`, and create
`docs/<JIRA_ID>/` with `node workflow/artifact-paths.js ensure --jira-id "$JIRA_ID"`.
All SDLC agents and phases must read and write artifacts in that same folder;
resolve canonical file paths with the resolver's `path` command.
Never write SDLC artifacts directly under `docs/`.

Each phase must consume the outputs of the previous phase.

## Never Skip

- Requirements Analysis
- Architecture Review
- Design Review
- Code Review
- Testing

Generate a Pull Request description before task completion.

---

# SDLC Artifact Rules

Always ensure the following SDLC artifacts exist and remain synchronized with implementation:

- `docs/<JIRA_ID>/intake-summary.md`
- `docs/<JIRA_ID>/requirements.md`
- `docs/<JIRA_ID>/architecture.md`
- `docs/<JIRA_ID>/design-review.md`
- `docs/<JIRA_ID>/api-design.md`
- `docs/<JIRA_ID>/implementation-plan.md`
- `docs/<JIRA_ID>/development-report.md`
- `docs/<JIRA_ID>/code-review.md`
- `docs/<JIRA_ID>/testing.md`
- `docs/<JIRA_ID>/deployment.md`
- `docs/<JIRA_ID>/pr-description.md`

Only update artifacts impacted by the requested change.

Avoid unnecessary regeneration of unchanged artifacts.

---

# SDLC Workflow

```text
Requirement
    ↓
Requirements Analysis
    ↓
Architecture Design
    ↓
Design Review
    ↓
API Design
    ↓
Implementation Planning
    ↓
Development
    ↓
Code Review
    ↓
Testing
    ↓
Deployment Planning
    ↓
Pull Request Generation
```

Do not bypass workflow stages.

---

# MCP Integration Rules

When MCP tools are available, use them as the system of record for external platforms.

## Jira MCP

Use Jira MCP for:

- Epic creation
- User Story creation
- Task creation
- Bug creation
- Ticket updates
- Sprint tracking
- Workflow transitions

Do not manually simulate Jira ticket creation when Jira MCP is available.

## Confluence MCP

Use Confluence MCP for:

- Architecture publication
- Design review publication
- Test report publication
- Deployment documentation
- Technical documentation publication

Ensure Confluence content matches approved repository artifacts.

## GitHub MCP

Use GitHub MCP for:

- Branch creation
- Pull Request creation
- Pull Request updates
- Issue management
- Repository metadata retrieval

Prefer GitHub MCP actions over manually generating repository state descriptions.

## MCP Validation

Before completing a task:

- Confirm MCP execution succeeded.
- Explicitly report MCP failures.
- Never assume external updates succeeded.

---

# Skill Usage Rules

Before starting implementation:

1. Discover available skills.
2. Select the most appropriate skill.
3. Follow skill instructions exactly.
4. Prefer specialized skills over generic generation.

## Skill Mapping

### Requirement Analysis

- requirement-analysis

### Architecture Design

- architecture-design

### Design Review

- design-review

### Implementation Planning

- implementation-planning

### Development

- implementation

### Code Review

- code-review

### Testing

- testing

### Pull Request Generation

- pr-generation

### Documentation Synchronization

- documentation-sync

## Skill Selection Rules

- Always choose the most specific matching skill.
- Preserve SDLC traceability.
- Preserve outputs from prior phases.
- Do not replace approved artifacts without justification.

---

# Hook Rules

Repository hooks are mandatory quality gates.

Never bypass hooks without explicit human approval.

## Pre-Development Hooks

Before code generation, verify existence of:

- `requirements.md`
- `architecture.md`
- `implementation-plan.md`

If missing:

- Stop execution.
- Report missing artifacts.

## Post-Code Generation Hooks

After code generation:

- Run linting.
- Run static analysis.
- Run formatting validation.

Report all failures.

## Pre-Commit Hooks

Before commit:

- Run build.
- Run tests.
- Validate modified files.

Do not recommend committing when failures exist.

## Pre-Pull-Request Hooks

Before Pull Request creation:

- Execute full test suite.
- Run security checks.
- Generate review report.

A Pull Request is not complete if hook execution fails.

---

# Quality Gates

Each SDLC phase must pass its quality gate before progressing.

## Requirements Gate

Requirements phase is complete only when:

- Functional requirements exist.
- Non-functional requirements exist.
- Acceptance criteria exist.
- Risks have been documented.

## Architecture Gate

Architecture phase is complete only when:

- Architecture decisions are documented.
- System components are documented.
- Security considerations exist.
- Scalability considerations exist.
- Data flow is documented.

## Design Review Rules

The Design Review phase acts as an approval checkpoint between Architecture Design and API Design.

The design-review agent must:

- Review `architecture.md`
- Validate alignment with `requirements.md`
- Identify security risks
- Identify scalability concerns
- Identify reliability concerns
- Identify performance concerns
- Identify maintainability concerns
- Verify observability requirements
- Document findings and recommendations
- Assign severity levels to findings

### Severity Levels

- Critical
- High
- Medium
- Low

### Design Review Outcomes

- Approved
- Approved With Conditions
- Rejected

The design-review agent must not modify approved requirements or architecture.

Its responsibility is to review, identify risks, and provide recommendations prior to implementation.

## Design Review Gate

Design Review phase is complete only when:

- `design-review.md` exists
- Requirements-to-architecture traceability has been verified
- Security risks have been reviewed
- Scalability risks have been reviewed
- Reliability risks have been reviewed
- Performance risks have been reviewed
- Maintainability concerns have been reviewed
- Observability requirements have been reviewed
- Critical findings have been resolved or explicitly approved
- High-risk findings have mitigation plans documented
- Design review recommendations have been documented
- Approval status has been recorded

Implementation Planning, API Design, and Development must not begin until the Design Review Gate has passed.

## API Design Gate

API Design phase is complete only when:

- API contracts exist.
- Request models are documented.
- Response models are documented.
- Error handling is documented.

## Planning Gate

Planning phase is complete only when:

- Tasks are identified.
- Dependencies are identified.
- Implementation sequence is documented.

## Development Gate

Development phase is complete only when:

- Code builds successfully.
- Logging exists.
- Error handling exists.
- Validation exists.
- Tests have been added.

## Code Review Gate

Review phase is complete only when:

- Review findings are documented.
- Critical issues have been addressed.
- Risks are documented.

## Testing Gate

Testing phase is complete only when:

- Unit tests pass.
- Integration tests pass.
- Regressions are addressed.
- Test report exists.

## Deployment Gate

Deployment phase is complete only when:

- Deployment steps are documented.
- Rollback plan is documented.
- Operational risks are documented.

## Pull Request Gate

Pull Request generation is complete only when:

- Review report exists.
- Test report exists.
- Deployment impact is documented.
- PR description has been generated.

---

# Evidence-Based Decision Rules

All technical decisions must be supported by repository evidence.

## Source Of Truth Priority

Use the following order of precedence:

1. Source Code
2. Executable Tests
3. Configuration Files
4. Build Pipelines
5. Deployment Configurations
6. Architecture Documents
7. Requirements Documents

Prefer higher-priority evidence whenever available.

## Documentation Validation

All documentation must be validated against:

- Source code
- Automated tests
- Configuration files
- Approved design artifacts

Do not generate unsupported statements.

## Missing Evidence Handling

If evidence cannot be found:

```text
Status: Not Found

Notes: No evidence found in the repository for this behavior.

Evidence: Not Found
```

Do not guess.

Do not infer undocumented functionality.

## Contradictory Evidence

When conflicting evidence exists:

- Report the conflict.
- Identify all sources.
- Avoid unsupported conclusions.

## Evidence Traceability

Maintain traceability whenever generating:

- requirements.md
- architecture.md
- design-review.md
- api-design.md
- implementation-plan.md
- `code-review.md`
- `deployment.md`
- `testing.md`
- pr-description.md

---

# General Rules

- Preserve existing functionality.
- Preserve existing architecture unless an approved decision requires change.
- Follow existing repository structure and conventions.
- Follow existing naming standards.
- Minimize unnecessary code changes.
- Prefer small, reviewable modifications.
- Only modify files relevant to the approved implementation plan.

Requirements, architecture decisions, design reviews, and implementation plans remain authoritative until explicitly changed by a human reviewer.

---

# Build And Test Rules

Follow repository build standards.

## Backend

`app/server/requirements.txt`

## Frontend

`app/client/package.json`

## Testing Frameworks

- Python unittest
- Playwright

For new features:

- Add unit tests.
- Add integration tests where applicable.
- Follow existing testing patterns.

## Preserve Existing Technology Stack

- Flask
- SQLAlchemy
- Astro
- Tailwind CSS
- SQLite
- Playwright

Unless an approved design decision requires modification.

---

# Documentation Rules

Documentation must be evidence-based.

## Never

- Invent API behavior.
- Invent configuration values.
- Invent architecture decisions.
- Invent undocumented functionality.

Validate generated documentation against:

- Source code
- Automated tests
- Configuration
- Build scripts
- Approved SDLC artifacts

If information cannot be verified:

```text
Status: Not Found

Notes: No evidence found in the repository for this behavior.

Evidence: Not Found
```

## Keep Documentation Synchronized With

- APIs
- Routes
- Request models
- Response models
- Dependencies
- Build commands
- Environment configuration
- Test behavior

---

# Security Rules

## Never Expose

- API Keys
- Tokens
- Passwords
- Secrets
- Connection strings
- Certificates
- Private keys
- Sensitive environment variables

## Do Not Reproduce Secrets In

- Documentation
- Source code
- Examples
- Logs
- Tests
- Reports

Follow secure coding practices.

## Validate

- Inputs
- Authentication
- Authorization
- Sensitive data handling

Report security concerns immediately.

---

# Completion Criteria

Work is complete only when:

- Required SDLC artifacts are updated under `docs/<JIRA_ID>/`.
- Quality gates have passed.
- `docs/<JIRA_ID>/code-review.md`, `testing.md`, and `deployment.md` exist when their phases are in scope.
- Pull Request description exists.
- Documentation is synchronized.
- Repository evidence supports all generated content.
- Security requirements are satisfied.
- No unsupported assumptions remain.

# Deployement Rules

Deployment information may be sourced from:

- `docs/<JIRA_ID>/release-governance.md`
- `docs/<JIRA_ID>/deployment.md`
- CI/CD pipeline definitions
- Infrastructure configuration files