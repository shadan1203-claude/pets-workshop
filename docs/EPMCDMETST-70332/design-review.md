# Design Review — EPMCDMETST-70332

## Review status and reviewer

**Review completed by an authorized alternative reviewer, not the configured
Design Review specialist.** The user explicitly authorized this substitution
because the configured specialist was unavailable. This review is not
represented as the configured specialist's work.

**Reviewer recommendation: APPROVED WITH CONDITIONS; the human decision is
recorded below.** No Critical or High findings were identified. The accepted
condition resolves the Design Review decision only; required downstream
repository phases remain governed by their own gates.

The previous version of this artifact recorded that no review had been
performed because the configured specialist was unavailable and alternative
review was not then authorized. That prior status is superseded by this
authorized review; the earlier artifact did not issue findings or a design
decision.

## Scope and evidence

Reviewed only the user-approved Architecture against the approved Requirements,
the Jira scope, intake, the prior Design Review blocker, and relevant current
source and tests. The requirements contract is the read-only localStorage key
`tailspin:favorites:v1`, containing a JSON array of integer `Dog.id` values.
OQ-01 (how favorites are added or removed) remains open. The review does not
require a writer/control or expand scope; a favorites management page remains
out of scope.

Jira `EPMCDMETST-70332` is the Open Story “ENH-03: Show favorite badge/icon on
dog cards in listing.” Its acceptance criteria require a clear marker only for
favorited dogs and correct state across pagination and refresh. The intake
records the explicit exclusion of a favorites management page.

| Review claim | Repository evidence |
| --- | --- |
| Approved contract, requirements, and unresolved OQ-01 | `docs/EPMCDMETST-70332/requirements.md`: FR-01–FR-04, NFR-01–NFR-02, OQ-01, and approval record. |
| Approved architecture and its client-only read design | `docs/EPMCDMETST-70332/architecture.md`: component boundaries, data flow, storage normalization, risks R-02/R-03, and traceability. |
| Initial listing is server-rendered and cards currently have no favorite state | `app/client/src/pages/index.astro`: server fetch and `<DogList dogs={dogs}>`; `app/client/src/components/DogList.astro`: current card markup. |
| Client search/pagination replaces cards in a separate path | `app/client/src/pages/index.astro`: `renderDogs`, `fetchAndRender`, and `handlePaginationClick`. |
| Existing tests cover listing/pagination but not favorite markers | `app/client/e2e-tests/homepage.spec.ts`; `app/client/e2e-tests/search.spec.ts`. |
| Existing favorite reader/writer or storage contract in listing source/tests | **Status: Not Found. Evidence: Not Found.** Search of `app/client/src` and `app/client/e2e-tests` for `localStorage`, `favorite`, `favourite`, and `Favorited` returned no matches. This agrees with `docs/EPMCDMETST-70332/intake-summary.md`. |

## Requirements traceability

| Requirement | Architecture coverage | Review |
| --- | --- | --- |
| FR-01; Jira AC 1–2: marker iff dog ID is in the valid set | Shared marker adapter matches card IDs against a normalized set; accessible marker is described. | Covered. Exact visual treatment can remain open if it meets NFR-01. |
| FR-02; Jira AC 3: consistent across listing pages and refresh | Adapter decorates initial cards and every `renderDogs` result; refresh re-reads browser storage. | Covered, subject to client initialization noted in DR-01. |
| FR-03: approved key and JSON integer-ID array | Reads only `tailspin:favorites:v1`; no writes/migration proposed. | Covered; integer validation includes safe-integer validation. |
| FR-04: invalid/absent/inaccessible storage fails closed | Missing, malformed, non-array, invalid, and read-exception cases resolve to an empty set. | Covered. |
| NFR-01: accessible, non-color-only marker | Architecture requires accessible name/text, not color alone. | Covered; verify in implementation tests. |
| NFR-02: IDs only, no personal data | Browser-local read-only state; no server/API or telemetry transmission proposed. | Covered. |
| Jira exclusion: no favorites management page | Explicitly out of scope; no page proposed. | Covered. |

## Findings

### Medium

#### DR-01 — Initial SSR cards cannot reflect localStorage until client code runs

- **Evidence:** `app/client/src/pages/index.astro` fetches and renders the
  initial list on the server and includes the browser script separately.
  `app/client/src/components/DogList.astro` currently renders the cards.
  `docs/EPMCDMETST-70332/architecture.md` states that the browser adapter
  decorates the SSR cards after markup exists and records this as risk R-02.
- **Impact:** On refresh, a favorited card can briefly appear unmarked before
  the browser reads storage and applies the marker. Without client JavaScript,
  this browser-local state cannot be rendered by the server. This is a
  presentation delay, not a blocker to implementing the approved behavior
  after client initialization.
- **Recommendation:** Keep the read early in client startup and verify seeded
  favorites on initial load, refresh, and subsequent client-rendered pages.
  Record human acceptance that the marker becomes accurate after client
  initialization; do not introduce server persistence or an out-of-scope
  mechanism to eliminate the transition.
- **Blocking:** No. Jira does not require server-rendered access to browser
  storage, and the approved architecture explicitly identifies the transition.

No Critical or High findings were identified. OQ-01 is preserved as an open
scope decision, **not** a design finding or blocker: the marker can be
implemented and verified using pre-seeded persisted IDs without defining a
writer or control.

## Quality review

- **Security/privacy:** Appropriate design boundary. localStorage is treated as
  untrusted, values are parsed/validated, IDs are not sent to the API or
  telemetry, and storage content is not interpolated into HTML. Confirm those
  properties in implementation.
- **Reliability:** Missing, invalid, or inaccessible storage fails closed to
  an empty set without disabling listing/search. DR-01 records the expected
  SSR-to-client transition.
- **Performance/scalability:** Normalizing once to a `Set` and checking the
  visible cards is proportional to stored IDs plus rendered cards; no new
  request or backend load is introduced.
- **Maintainability/traceability:** One adapter is proposed for initial and
  client-rendered cards, and each approved functional requirement has a
  verification path. The current two card-render paths make the shared adapter
  and pagination/refresh tests important implementation checks.
- **Accessibility:** The architecture preserves accessible name/text and
  non-color-only requirements; confirm these in the selected marker and
  accessibility tests.
- **Observability:** No telemetry is required. Avoid emitting favorite IDs;
  no new observability dependency is warranted by this scope.

No build or tests were run: this phase reviews design only, no code changed,
and future validation belongs to implementation/testing.

## Decision and handoff

**Human decision (2026-11-03):** The user stated, “Accept DR-01 and approve
Design Review; proceed to Planning.” DR-01's documented SSR-to-client
initialization transition is explicitly accepted. The read-only design remains
approved; verify initial load, refresh, invalid storage, pagination, and
accessibility in later authorized phases.

**Design Review decision: APPROVED.** The accepted Medium finding is not
blocking. No Critical or High findings remain. This approval does not resolve
OQ-01 or authorize a favorite writer/control, favorites page, API/database
change, scope expansion, or implementation.

OQ-01 remains open and does not prevent implementation of the approved
read-only marker. No favorite writer/control, favorites page, API/database
change, or scope expansion is requested.

**Repository sequence discrepancy — stop before Planning:** `copilot-instructions.md`
requires API Design after Design Review and before Planning, and requires
`docs/EPMCDMETST-70332/api-design.md`. That artifact is absent, and no
configured API Design specialist is available in the repository agent
configuration. The resolver also lists `api-design.md` as a Planning
prerequisite. API Design has not been performed or approved for omission. Do
not invent API contracts or silently skip this phase. Planning and Development
remain not started pending human clarification/authorization and completion of
the mandatory API Design gate.

## Validation record

- Resolver canonical paths were checked for this Jira key:
  `docs/EPMCDMETST-70332/design-review.md`,
  `docs/EPMCDMETST-70332/requirements.md`,
  `docs/EPMCDMETST-70332/architecture.md`,
  `docs/EPMCDMETST-70332/intake-summary.md`, and
  `docs/EPMCDMETST-70332/workflow-state.json`.
- Resolver `validate-stage design-review` passed: requirements and
  architecture prerequisites exist.
- Jira issue details were retrieved for scope verification; status was Open.
- The user decision accepting DR-01 and approving Design Review is recorded
  above; the review is complete and approved.
- Repository instructions and resolver prerequisites were checked. The
  canonical API Design artifact is absent; Planning validation fails on that
  prerequisite, so no Planning work was started.
- `git diff --check` and workflow-state JSON parsing are recorded in the
  Jira-scoped workflow state after this artifact update.
