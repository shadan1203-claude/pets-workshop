Pets Workshop - Claude Code Instructions

## Automatically Loaded Project Memory

@memory/current-jira.md
@memory/approved-decisions.md
@memory/repository-context.md
@memory/README.md

Read phase-dependent and on-demand memory according to `memory/README.md`; do not load all memory files for every phase. Treat memory as cached context, not approval or workflow state. `workflow/workflow-state.json` and the owning Jira-scoped artifacts remain the sources of truth for current execution and phase evidence.

This repository is an existing application named pets-workshop.

Technology stack:

Flask + SQLAlchemy backend (app/server)
Astro + Tailwind frontend (app/client)
SQLite database
Playwright testing
Claude Code must function as an SDLC-governed engineering agent and follow all instructions in this document.

Core Principles
Follow the complete SDLC workflow.
Preserve traceability across requirements, architecture, implementation, testing, deployment, and pull requests.
Never bypass mandatory review gates.
Never skip required documentation.
Use MCP tools whenever available.
Use repository evidence before making decisions.
Never invent behavior, APIs, architecture, requirements, configurations, or deployment details.
Preserve existing architecture unless an approved architecture decision explicitly requires change.
Prefer minimal, reviewable modifications.
Human approval overrides autonomous progression.
Repository Context
Application:

Dog shelter management system
Backend:

app/server
Frontend:

app/client
Documentation:

docs/<JIRA_ID>/
All SDLC artifacts must remain within the active Jira folder.

Jira Context Resolution
Before beginning any SDLC activity:

Resolve the active Jira issue.

Set:

export JIRA_ID=<jira-key>
Ensure artifact folder exists:

node workflow/artifact-paths.js ensure --jira-id "$JIRA_ID"
Use resolver for all artifact locations:

node workflow/artifact-paths.js path \
  --jira-id "$JIRA_ID" \
  --artifact <artifact-name>
Never hardcode paths.

Never store SDLC documents directly under:

docs/
Always use:

docs/<JIRA_ID>/
Required SDLC Workflow
Every requirement must follow this exact workflow:

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
    ↓
Closure
Workflow stages may not be skipped.

Each phase must consume outputs from earlier phases.

Human Approval Requirements
The following checkpoints require explicit human approval.

Requirements Approval
Required before Architecture Design.

Architecture Approval
Required before Design Review.

Design Review Approval
Required before:

API Design
Planning
Development
Deployment Approval
Required before deployment execution.

After approval:

Execute deployment procedure.
Capture deployment results.
Update deployment documentation.
Closure Approval
Required after:

Development complete
Testing complete
Deployment validation complete
Documentation synchronized
Work remains in progress until closure approval is granted.

Required SDLC Artifacts
The following artifacts must exist when applicable.

docs/<JIRA_ID>/intake-summary.md
docs/<JIRA_ID>/requirements.md
docs/<JIRA_ID>/architecture.md
docs/<JIRA_ID>/design-review.md
docs/<JIRA_ID>/api-design.md
docs/<JIRA_ID>/implementation-plan.md
docs/<JIRA_ID>/development-report.md
docs/<JIRA_ID>/code-review.md
docs/<JIRA_ID>/testing.md
docs/<JIRA_ID>/deployment.md
docs/<JIRA_ID>/pr-description.md
Rules:

Update only impacted artifacts.
Do not regenerate unchanged artifacts.
Preserve approved decisions.
Preserve traceability links.
Preserve review history where applicable.
Artifact Ownership
Artifact	Owning Phase
intake-summary.md	Intake
requirements.md	Requirements Analysis
architecture.md	Architecture Design
design-review.md	Design Review
api-design.md	API Design
implementation-plan.md	Planning
development-report.md	Development
code-review.md	Code Review
testing.md	Testing
deployment.md	Deployment
pr-description.md	Pull Request
Only the owning phase may create or fully regenerate its artifact.

MCP Tool Usage
When MCP tools are available they become the system of record.

Jira MCP
Use Jira MCP for:

Epic creation
Story creation
Task creation
Bug creation
Sprint operations
Workflow transitions
Ticket updates
Assignment changes
Status updates
Never simulate Jira updates when Jira MCP is available.

Confluence MCP
Use Confluence MCP for:

Architecture publication
Design review publication
Technical documentation publication
Testing publication
Deployment publication
Published content must match repository artifacts.

GitHub MCP
Use GitHub MCP for:

Branch creation
Pull Request creation
Pull Request updates
Issue management
Repository metadata retrieval
Prefer GitHub actions through MCP instead of simulated repository actions.

MCP Validation
Before task completion:

Verify execution succeeded.
Verify returned identifiers.
Report failures.
Never assume external actions succeeded.
Success format:

MCP Status: Success
Failure format:

MCP Status: Failed
Reason: <details>
Skill Usage Rules
Before implementation:

Discover available skills.
Select the most specific skill.
Follow skill instructions completely.
Preserve SDLC traceability.
Preserve outputs from prior phases.
Skill Mapping
Requirements Analysis
requirement-analysis
Architecture Design
architecture-design
Design Review
design-review
API Design
api-design
Planning
implementation-planning
Development
implementation
Code Review
code-review
Testing
testing
Pull Request Generation
pr-generation
Documentation Synchronization
documentation-sync
Always use the most specific available skill.

Hook Enforcement
Repository hooks are mandatory quality gates.

Never bypass hooks without human approval.

Pre-Development Validation
Before code generation verify:

docs/<JIRA_ID>/requirements.md
docs/<JIRA_ID>/architecture.md
docs/<JIRA_ID>/implementation-plan.md
exist.

If any are missing:

Stop execution.
Report missing artifacts.
Do not generate code.
Post Code Generation Hooks
Execute:

Linting
Formatting validation
Static analysis
Report every failure.

Do not silently ignore warnings or errors.

Pre-Commit Hooks
Execute:

Build
Test suite
File validation
Do not recommend commit creation when failures exist.

Pre Pull Request Hooks
Execute:

Full test suite
Security checks
Review report generation
Pull request generation is incomplete until all hooks pass.

Quality Gates
Every phase must pass its quality gate.

No phase may proceed without passing its gate.

Requirements Gate
Requirements phase is complete only when:

Functional requirements exist
Non-functional requirements exist
Acceptance criteria exist
Risks exist
Constraints exist
Assumptions are documented
Architecture Gate
Architecture phase is complete only when:

Architecture decisions exist
Components are documented
Security considerations exist
Scalability considerations exist
Data flow exists
Dependencies are documented
Design Review Responsibilities
Review:

requirements.md
architecture.md
Validate:

Security
Reliability
Scalability
Performance
Maintainability
Observability
Document:

Findings
Recommendations
Severity
Required actions
Severity Levels
Critical
High
Medium
Low
Review Outcomes
Approved
Approved With Conditions
Rejected
Design review must never rewrite approved architecture.

Its purpose is evaluation and recommendations.

Design Review Gate
Requires:

design-review.md exists
Traceability verified
Security reviewed
Performance reviewed
Reliability reviewed
Scalability reviewed
Maintainability reviewed
Observability reviewed
Critical findings resolved or approved
High findings mitigated
Approval status recorded
Development cannot begin before this gate passes.

API Design Gate
Requires:

API contracts exist
Request models documented
Response models documented
Error handling documented
Planning Gate
Requires:

Tasks identified
Dependencies identified
Sequencing documented
Risks documented
Development Gate
Requires:

Successful build
Logging implemented
Validation implemented
Error handling implemented
Unit tests added
Integration tests added where applicable
Code Review Gate
Requires:

Findings documented
Critical findings resolved
Risks documented
Review status documented
Testing Gate
Requires:

Unit tests passing
Integration tests passing
Regression impacts reviewed
Testing report generated
Deployment Gate
Requires:

Deployment procedure documented
Rollback documented
Operational risks documented
Validation steps documented
Pull Request Gate
Requires:

Code review report exists
Test report exists
Deployment impact documented
PR description exists
Evidence-Based Decision Rules
Every technical decision requires repository evidence.

Source Of Truth Priority
Use the following precedence order:

Source Code
Executable Tests
Configuration Files
CI/CD Pipelines
Infrastructure Definitions
Deployment Configurations
Architecture Documents
Requirements Documents
Higher-priority evidence always wins.

Documentation Validation
Validate documentation against:

Source code
Tests
Configuration
Build scripts
Approved SDLC artifacts
Unsupported statements are prohibited.

Missing Evidence Handling
If evidence cannot be found:

Status: Not Found

Notes:
No evidence found in the repository for this behavior.

Evidence:
Not Found
Never guess.

Never infer undocumented functionality.

Contradictory Evidence Handling
When conflicts exist:

Report conflict
Report all sources
Explain discrepancy
Avoid unsupported conclusions
Traceability Requirements
Maintain traceability for:

requirements.md
architecture.md
design-review.md
api-design.md
implementation-plan.md
code-review.md
testing.md
deployment.md
pr-description.md
Requirements must trace to:

Design
Tasks
Code
Tests
Development Rules
Always:

Read existing files before editing.
Prefer modifying existing files.
Minimize change scope.
Preserve behavior.
Preserve architecture.
Preserve conventions.
Preserve formatting.
Preserve comments unless incorrect.
Never:

Rewrite large files unnecessarily.
Refactor unrelated code.
Introduce technology changes without approved architecture.
Testing Requirements
Backend dependency source:

app/server/requirements.txt
Frontend dependency source:

app/client/package.json
Testing frameworks:

Python unittest
Playwright
For all new functionality create:

Positive test cases
Negative test cases
Edge case tests
Unit tests
Integration tests where appropriate
Test Artifact Requirements
Testing phase must generate:

docs/<JIRA_ID>/testing.md
and repository test assets.

Examples:

tests/<feature>.test.js
tests/<feature>.spec.ts
tests/test_<feature>.py
Tests must map to requirements and acceptance criteria.

Technology Constraints
Do not replace existing technology stack unless approved.

Preserve:

Flask
SQLAlchemy
Astro
Tailwind CSS
SQLite
Playwright
Documentation Rules
Documentation must remain evidence-based.

Never invent:

APIs
Routes
Configurations
Environment variables
Build commands
Architecture decisions
Functional behavior
Validate against:

Source code
Tests
Configurations
Build scripts
Approved artifacts
Synchronization Rules
Keep documentation synchronized with:

APIs
Routes
Request models
Response models
Dependencies
Environment configuration
Build commands
Test behavior
Security Rules
Never expose:

API Keys
Tokens
Passwords
Secrets
Certificates
Private keys
Connection strings
Sensitive environment variables
Do not reproduce secrets within:

Documentation
Examples
Source code
Logs
Reports
Tests
Validate:

Input handling
Authentication
Authorization
Sensitive data handling
Report security concerns immediately.

Deployment Rules
Deployment evidence may originate from:

docs/<JIRA_ID>/release-governance.md
docs/<JIRA_ID>/deployment.md
or:

CI/CD pipelines
Infrastructure definitions
Deployment manifests
Do not assume deployment behavior.

Deployment execution requires human approval.

Claude Code Output Format
For every completed task provide:

Summary
What changed.

Files Modified
List of modified files.

Tests
Executed
Passed
Failed
Artifacts Updated
List updated SDLC artifacts.

Risks
Known risks or "None".

Next Phase
Current SDLC phase and next expected phase.

MCP Status
Success or failure.

Completion Criteria
Work is complete only when:

Required SDLC artifacts exist in docs/<JIRA_ID>/.
Applicable quality gates passed.
Human approvals obtained.
Code review completed.
Testing completed.
Deployment documentation completed.
Deployment validation completed.
Pull request description generated.
Documentation synchronized.
Repository evidence supports all claims.
Security requirements satisfied.
MCP results validated and recorded.
Closure approval granted.
Without Closure Approval the work remains:

Status: In Progress