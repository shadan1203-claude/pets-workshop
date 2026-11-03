# API Design: EPMCDMETST-70332

## Status and authorization

**Status: API Design approved by the user on 2026-11-03.** This artifact was
prepared by an explicitly authorized alternative because the required API
Design artifact was missing and no configured API Design specialist was
available. The author is an authorized alternative, not the configured
specialist; this deviation is recorded rather than attributed to that
specialist.

The user accepted DR-01 and approved Design Review; that existing approval is
preserved in `design-review.md` and `workflow-state.json`. The user then
explicitly approved this API Design and authorized progression to Planning:
“Approve API Design and proceed to Planning.” This approval authorizes Planning
only; it does not authorize implementation or any later phase.

## Inputs and scope

- Approved requirements: `requirements.md`
- Approved architecture: `architecture.md`
- Approved Design Review, including accepted finding DR-01: `design-review.md`
- Jira story: `EPMCDMETST-70332`, “ENH-03: Show favorite badge/icon on dog cards
  in listing”

The approved client-side read contract uses localStorage key
`tailspin:favorites:v1`, whose value is a JSON array of integer `Dog.id` values.
The marker is required on dog cards and must remain correct across listing
pagination and refresh. A favorites management page is out of scope.

OQ-01—how favorites are added or removed—remains open. This design does not
specify a writer, toggle, add/remove interaction, or any other way to change
favorite state.

## API change determination

**No application API changes are needed or proposed.** The current dog-list
response already contains the integer `id` for every dog card. Favorite state
is browser-local presentation state read from the approved localStorage
contract; it does not need to be sent to or returned by the backend.

Accordingly, this design adds no endpoint, request parameter or body, response
field, database field, authentication rule, or server-side favorite state.
Existing API behavior and payloads remain unchanged.

## Existing API contract used by the listing

The Flask `GET /api/dogs` route in `app/server/app.py` returns a JSON object
with `dogs` (an array of objects containing integer `id`, `name`, and `breed`),
plus `page`, `per_page`, `total`, and `total_pages`. Its existing optional
query parameters are `page`, `per_page`, `name`, and `breed` (`category` is
also accepted as a breed alias). The `id` on each object is the existing
`Dog.id` required to compare a card with the stored favorite IDs; no other
response field is required for this feature.

The Astro listing fetches the dog list in `app/client/src/pages/index.astro`;
the same-origin proxy in `app/client/src/pages/api/dogs.ts` forwards the
request and upstream response. These existing paths remain unchanged.

### Request model

There is no new request model or favorite-related request. The listing
continues to use its existing `GET /api/dogs` request and query parameters.
The browser reads localStorage locally; it does not send the stored IDs to the
Flask API or proxy.

### Response model

There is no new or changed response model. For the marker, the client uses
only `dogs[].id` from the existing dog-list response. It obtains favorite IDs
from localStorage and compares them with those IDs for each rendered card,
including cards rendered after pagination or search.

### Error behavior

Existing API errors are unchanged. The dog-list route returns HTTP 400 with an
`error` message when the `name` or `breed` filter exceeds its existing
100-character limit. A valid query with no matching dogs returns a successful
response with an empty `dogs` array. The existing Astro proxy returns HTTP 502
with an `error` message when it cannot reach the dog service.

The approved architecture specifies that absent, malformed, or inaccessible
localStorage is treated as an empty favorite set so the listing remains usable;
this is client-side state handling, not an API error or API response.

## Authentication, validation, security, and privacy

No authentication or authorization change is required: the existing listing
API remains as it is. The browser reads the localStorage value in the
client-side boundary; the server does not read it, persist it, or receive it
over the network. The client should accept only the approved JSON-array
representation of integer IDs when forming its comparison set. This UI marker
is not an authorization or access-control decision, and localStorage must not
be treated as trusted server state.

Favorite IDs remain scoped to the browser origin/profile as described by the
approved architecture. They are not account data and are not synchronized
across devices or origins. Do not add logging or telemetry that records the
stored favorite list.

## Compatibility, observability, and risks

- **Compatibility:** Existing clients retain the same endpoint, parameters,
  response shape, and error behavior. No API versioning or migration is
  needed.
- **Errors and observability:** No new server-side error path, log, metric, or
  tracing event is introduced. Existing API and proxy errors remain visible
  under their current behavior. Storage read/parse/access failures use the
  approved empty-set fallback without making the listing unavailable.
- **Risk:** localStorage can be cleared, changed, or unavailable, and its
  state is origin/profile-specific. In those cases the marker may be absent;
  this does not change dog-list data or server state.
- **Scope guard:** Cross-device/account synchronization, server persistence,
  favorites management, and resolving OQ-01 are explicitly not part of this
  API design.

## Traceability

| Approved requirement or decision | API Design disposition |
| --- | --- |
| Dog cards mark favorites and non-favorites correctly | Use existing `dogs[].id` and the approved client-local ID set; no API change. |
| Marker remains correct across pagination and refresh | Each listing result can be matched by its existing dog ID against localStorage; no pagination API change. |
| FR-03 storage contract | Read `tailspin:favorites:v1` as the approved JSON array of integer `Dog.id` values; no server transport. |
| OQ-01 remains open | No writer, mutation API, or favorite-changing interaction is specified. |
| Accepted DR-01 | Preserve the approved SSR-to-client initialization transition; this API design does not alter it. |
| Favorites page is out of scope | No page or endpoint is added. |

## Approval gate

**Human API Design approval: APPROVED.** User decision on 2026-11-03:
“Approve API Design and proceed to Planning.” The decision approves this
artifact and authorizes Planning only. Preserve OQ-01 (favorite add/remove
remains open) and accepted DR-01's SSR-to-client transition. No implementation
or later phase is authorized by this decision.

## Evidence sources

- Jira `EPMCDMETST-70332` was retrieved with Jira MCP; it is the Open Story
  “ENH-03: Show favorite badge/icon on dog cards in listing.”
- `requirements.md` records user approval for the `tailspin:favorites:v1`
  integer-ID storage contract and keeps OQ-01 open.
- `architecture.md` records the approved read-only, client-local design and
  storage-failure behavior.
- `design-review.md` records the user's acceptance of DR-01 and approval of
  Design Review. That decision is unchanged by this artifact.
- `app/server/app.py` (`GET /api/dogs`, beginning at line 21) defines the
  existing paginated listing payload and its `dogs[].id` field.
- `app/client/src/pages/index.astro` (listing fetch at line 35) and
  `app/client/src/pages/api/dogs.ts` (proxy) are the existing frontend paths.
- `copilot-instructions.md` defines the API Design gate. The repository has no
  `instructions/api-design-instructions.md` or configured
  `.github/agents/api-design.md`; the authorized alternative did not claim to
  be that specialist.
