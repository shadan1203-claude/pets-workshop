Architecture Design Skill

Purpose
Convert requirements into solution architecture.

Responsibilities
Design high level architecture
Identify services
Define integrations
Create data flow
Create component diagram

Input
docs/<JIRA_ID>/requirements.md

Output
docs/<JIRA_ID>/architecture.md

Resolve the Jira key from the active issue, then use
the resolver's `path` command with the relevant stage key for artifact paths.
Never write SDLC artifacts directly under `docs/`.

Required Sections
Architecture Overview
Components
Data Flow
Security Design
Scalability Design
Error Handling
Logging Strategy
Mermaid Diagram
Rules
Prefer scalable patterns
Include monitoring
Include observability
Include security controls

## Scope Protection Rules

Scope Protection Rules
Architecture must not introduce new business requirements.

Architecture scope is limited to:

Approved Jira Story
Approved requirements.md
Explicitly approved human decisions
Architecture may identify:

future enhancements
persistence improvements
storage optimizations
schema improvements
integration opportunities
observability enhancements
scalability improvements
However, these discoveries must not automatically become required work.

When Architecture identifies a capability that is not explicitly required by the approved Jira scope:

Document it separately.
Mark it as Out Of Scope.
Mark it as Future Consideration.
Do not convert it into a requirement.
Do not create implementation dependencies.
Do not block implementation.
Do not request user clarification unless the capability is required for approved requirements.
Use the following format:

Status: Out Of Scope

or

Status: Future Consideration

and continue architecture design.

Blocking Criteria
Architecture findings may only be classified as BLOCKING when:

The approved Jira acceptance criteria cannot be implemented.
The approved requirements cannot be satisfied.
A security issue makes implementation unsafe.
A dependency required by approved scope is unavailable.
The current design is technically infeasible.
Examples of VALID blockers:

Required API unavailable
Required database table missing
Required infrastructure unavailable
Mandatory security requirement cannot be satisfied
Examples of NON-BLOCKING findings:

Undefined future persistence strategy
Optional storage contract
Future schema improvements
Potential caching improvements
Alternative implementation designs
Nice-to-have scalability enhancements
Future migration opportunities
These must be recorded as:

Status: Future Consideration

or

Status: Out Of Scope

Persistence and State-Management Rules
Architecture must not require:

storage schemas
persistence models
storage contracts
producer/consumer contracts
state-management contracts
migration strategies
unless those are explicitly required by:

Jira Story
requirements.md
approved acceptance criteria
If the design references an existing state mechanism and its implementation details are unknown:

Assume existing behavior remains unchanged.

Record:

Status: Existing Behavior Assumed

Do not create:

BLOCKER
HIGH risk
mandatory dependency
clarification request
unless the approved requirements specifically require modifications.

Example:

Favorite-state persistence exists but storage behavior is unknown.

Correct handling:

Status: Out Of Scope

Existing favorite-state behavior will be consumed without modification.

Future persistence improvements require a separate Jira story.

Incorrect handling:

BLOCKER: Define favorite-state contract before implementation.

Output Requirements
architecture.md must clearly distinguish:

In Scope
Work required to satisfy approved requirements.

Out Of Scope
Future enhancements and non-required architectural considerations.

Future Considerations
Optional improvements that may be implemented in future Jira stories.

Out-of-scope items must never block downstream workflow phases.

Development Handoff Rules
Architecture approval automatically authorizes Planning when:

All approved requirements have architecture coverage.
No blocking findings exist.
All Critical findings have been resolved.
Out-of-scope findings must not prevent:

Planning → Development → Code Review → Testing → PR Generation → Deployment