# Requirements: EPMCDMETST-70332

## Status and approval boundary

**Approved by the user on 2026-11-03 for progression to Architecture.**
This specification covers a visible favorite marker on dog cards and the
approved localStorage data contract for reading persisted favorite state.
Approval does not authorize implementation, a favorite-changing interaction,
a favorites management page, or any phase beyond Architecture. OQ-01 remains
open and must not be resolved by assumption.

## Business goal and actor

**BR-01** — Help users recognize dogs they have already favorited while
browsing the paginated dog listing.

**Actor:** A user browsing the dog listing.

**Source:** Jira EPMCDMETST-70332 and its approved intake summary.

## Scope and exclusions

### In scope

- Show a clear marker on a dog card exactly when its dog ID is in the
  persisted favorite state.
- Keep that representation consistent across listing pages and refreshes.
- Define the localStorage data contract required to read favorite state, as
  authorized by the prior user decision recorded in this artifact and intake.

### Out of scope

- A favorites management page (explicitly excluded by Jira).
- Any user-facing mechanism for adding or removing favorites; this remains
  OQ-01 and requires an explicit decision before such a mechanism is designed
  or implemented.
- Implementation, architecture, marker styling/placement, and a mechanism
  that writes favorite state. This artifact specifies requirements only.

## Functional requirements

| ID | Requirement | Traceability | Status |
| --- | --- | --- | --- |
| FR-01 | For each dog card in the dog listing, show a clear favorite marker if and only if that dog's `id` is present in the valid persisted favorite-ID set. | Jira AC 1–2; `app/client/src/components/DogList.astro` renders cards with dog IDs. | Approved. |
| FR-02 | The marker state for a given dog ID shall remain consistent when navigating between listing pages and after refreshing the page, based on the persisted favorite-ID set. | Jira scope and AC 3; `app/client/src/pages/index.astro` owns initial listing and client-side pagination. | Approved. |
| FR-03 | The listing shall read favorite state using this localStorage contract: key `tailspin:favorites:v1`; value is a JSON array of integer dog IDs corresponding to the listing/API `Dog.id`. Array order has no meaning and repeated IDs have the same effect as one ID. | Jira requires localStorage; authorized user decision D-01 below; `DogList.astro` types `id` as a number. | Approved by the user on 2026-11-03. |
| FR-04 | When the key is absent, empty, malformed JSON, not an array, or contains no valid integer IDs, the listing shall treat the favorite set as empty and remain usable without displaying favorite markers. | Reliability requirement for deterministic handling of the FR-03 contract. | Approved. |

FR-03 defines the persisted data interface only. It does not choose a reader or
writer component, when or how state is written, or how a user changes it.
Because localStorage is browser-origin scoped, cross-device or account-wide
synchronization is not part of this contract or story.

## Non-functional requirements

| ID | Requirement | Traceability | Status |
| --- | --- | --- | --- |
| NFR-01 | A displayed favorite marker shall expose its state through an accessible name or text and shall not communicate favorite state by color alone. | Accessibility criterion supporting Jira's “clear visual marker” requirement. | Approved. |
| NFR-02 | The favorite value defined by FR-03 shall contain dog IDs only; it shall not contain credentials or personal/user-identifying data. | Privacy/security constraint for client-side localStorage. | Approved. |

No response-time, browser-support, availability, or other measurable quality
target is specified by Jira or the reviewed repository evidence.
**Status: Not Found. Notes:** No such target is specified in the reviewed
source materials. **Evidence: Not Found.**

## Acceptance criteria

These are observable requirements for later verification. No code change or
implementation is authorized by this artifact.

| ID | Given / when | Then | Traceability / verification |
| --- | --- | --- | --- |
| AC-01 | Given the valid localStorage value contains a displayed dog's ID, when its listing card is rendered, | that card shows one clear marker identifying the dog as favorited. | Jira AC 1; seed the proposed key with the dog ID and inspect the card. |
| AC-02 | Given the valid localStorage value does not contain a displayed dog's ID, when its listing card is rendered, | that card has no favorite marker. | Jira AC 2; seed a different ID or an empty array and inspect the card. |
| AC-03 | Given favorite IDs include dogs on multiple listing pages, when the user navigates between those pages, | each dog card's marker matches whether its own ID is in the same persisted set; non-favorites remain unmarked. | Jira AC 3; seed the contract value and verify cards on at least two pages. |
| AC-04 | Given a valid favorite-ID value is persisted, when the listing is refreshed, | each rendered card's marker still matches that value. | Jira AC 3; inspect the same dog IDs before and after refresh. |
| AC-05 | Given the listing reads persisted favorite state, when localStorage is missing or its value is malformed, not an array, or has no valid integer IDs, | the listing remains usable and shows no favorite markers. | FR-04; verify each invalid/absent-value case. |
| AC-06 | Given a dog card has a favorite marker, when its accessibility representation is inspected, | favorite state is exposed by an accessible name or text and not by color alone. | NFR-01; accessibility-tree inspection. |

## Assumptions and decisions

- **A-01:** Jira is authoritative for the requested marker, localStorage
  expectation, and favorites-page exclusion.
- **A-02:** The repository contains no existing favorite persistence
  implementation; the Jira assumption that one exists is not verified.
- **D-01 (preserved):** The user previously authorized Requirements to define a
  new localStorage favorite persistence contract within this story if no
  existing contract is found. The repository search did not find one. FR-03
  records a proposed contract for human approval; D-01 does not authorize code
  changes or settle how favorites are added or removed.
- **A-03:** Marker wording/icon, placement, and styling are examples in Jira,
  not selected design requirements.

## Dependencies and risks

### Dependencies

- Human approval of this Requirements artifact is required before Architecture
  begins.
- Later implementation and verification depend on the approved FR-03 contract
  being readable in the browser listing.
- Resolution of OQ-01 is required before designing or implementing any
  favorite-changing interaction; it is not required to review or approve the
  marker and read-contract requirements in this story.

### Risks

| ID | Risk | Impact / response |
| --- | --- | --- |
| R-01 | No existing storage writer or user interaction was found, and OQ-01 is unresolved. | Favorite values may not be populated through the application. Do not invent a control; obtain a separate explicit scope decision before designing or implementing one. |
| R-02 | Initial server-rendered cards and client-side pagination are distinct render paths. | Markers could differ between them or after refresh; verify each path against the same persisted IDs. |
| R-03 | The localStorage format is new. | FR-03 is approved for the listing read contract; do not add a writer or favorite-changing interaction without explicit scope approval. |
| R-04 | Jira describes a “clear” marker without prescribing its presentation. | Keep the exact visual design open for a later design phase while meeting AC-01, AC-02, and NFR-01. |

## Open question

**OQ-01 — How are favorites added or removed?** No favorite control or
storage writer was found in the reviewed application source. Jira asks for a
marker and excludes a favorites management page, but does not state how a
favorite is created or removed.

**Boundary:** Do not add a control, toggle, or other interaction under this
story without explicit authorization. The question does not prevent human
approval of the marker and localStorage read-contract requirements: those
requirements can be reviewed and verified using pre-seeded persisted IDs.
OQ-01 does prevent specifying or implementing an in-scope writer/interaction;
if a control is desired, the user must authorize and scope it separately.

## Evidence and sources

| Claim | Evidence | Finding |
| --- | --- | --- |
| Requested behavior, localStorage expectation, Jira acceptance criteria, and favorites-page exclusion | Jira MCP `getIssue` result for EPMCDMETST-70332 (Story, Open), retrieved 2026-11-03; `docs/EPMCDMETST-70332/intake-summary.md` | Source of truth for scope. |
| Dog cards expose a numeric dog ID and currently render no marker or favorite state | `app/client/src/components/DogList.astro` | `Dog.id` is numeric; current markup has no favorite marker/state. |
| Initial listing and client-side pagination render through separate paths | `app/client/src/pages/index.astro` | Initial `DogList` render and `renderDogs` pagination path are present; neither currently handles favorites. |
| Existing favorite storage key, serialization, reader, writer, or marker | **Status: Not Found. Notes:** Relevant source/test search found no `localStorage`, `sessionStorage`, favorite, favourite, or Favorited matches. **Evidence: Not Found.** | No existing contract to preserve or reuse. |
| Existing automated coverage for favorite persistence/markers | `app/client/e2e-tests/homepage.spec.ts` | Current tests cover listing and pagination but contain no favorite-state assertions. |
| Client package/configuration declaring a favorite persistence contract | `app/client/package.json` and relevant source/test search | **Status: Not Found. Notes:** No favorite storage contract is declared. **Evidence: Not Found.** |

## User decision and approval gate

This artifact preserves D-01, the user's authorization for Requirements to
define a new localStorage contract if none exists. On 2026-11-03, the user
explicitly approved Requirements and authorized progression to Architecture.
The key/value contract in FR-03 is approved as a read contract. The user has
not authorized implementation, a favorite-changing interaction, a favorites
management page, or any phase beyond Architecture. OQ-01 remains open;
Architecture must not resolve it by assumption.

## Resumption and delegation log (2026-11-03)

- The Jira-scoped intake records user approval for transition to Requirements
  only and the prior decision authorizing this phase to define a contract if
  none exists.
- The configured Requirements specialist was unavailable as a callable agent.
  The user explicitly authorized an alternative agent for this Requirements
  phase. This artifact was completed by that authorized alternative, **not by
  the configured Requirements specialist**; this is a delegation deviation
  from the normal specialist route.
- The alternative completed Requirements only, preserved OQ-01, made no code
  changes, did not approve the artifact, and did not advance to Architecture.
- Jira issue details were retrieved for source-of-truth verification. Jira
  comments were not available through the callable Jira operations recorded in
  the intake; no comment-based decision is claimed.

## Requirements approval and Architecture handoff (2026-11-03)

- The user explicitly approved this Requirements artifact with the decision:
  “Approve Requirements and proceed to Architecture.”
- The approval includes the FR-03 contract: localStorage key
  `tailspin:favorites:v1`, containing a JSON array of integer `Dog.id` values.
- OQ-01 (how favorites are added or removed) remains open. This approval does
  not authorize a writer, control, toggle, implementation, or scope expansion.
- Architecture is the only authorized next phase. No later phase is approved.
