# Architecture — EPMCDMETST-70156

**Status:** Approved for implementation
**Inputs:** Jira EPMCDMETST-70156 and draft `requirements.md`
**Design boundary:** Homepage breed filter only; no implementation or schema migration is authorized at this stage.

## Architecture overview

Reuse the current Flask/SQLAlchemy backend, existing `breeds` and `dogs` tables, and Astro homepage. The backend remains the authority for filtering and pagination. The existing breed catalog endpoint already returns IDs and names; the main backend delta is an ID predicate in the existing dog-list query. The homepage will represent the selected breed by ID in `breed_id`, while retaining the current query-driven rendering and pagination patterns.

## Components and responsibilities

| Component | Current evidence | Proposed responsibility |
|---|---|---|
| `app/server/app.py` — Flask API | Defines `GET /api/breeds` and `GET /api/dogs`; current dog query joins `Breed`, applies existing name/breed-name predicates, counts, then offsets/limits. | Retain the breed catalog route/response. Parse and apply optional `breed_id` against the joined breed ID before `count`, `offset`, and `limit`. Preserve the existing pagination response shape. |
| `app/server/models/breed.py`, `app/server/models/dog.py` | `Breed.id` is a primary key; `Dog.breed_id` references `breeds.id`. | Reuse the current relationship; no schema change is indicated by the story. |
| `app/client/src/pages/index.astro` | Server-rendered page fetches dog results and breeds; client script fetches `/api/dogs`, updates results, URL, and pagination. Current select uses breed names. | Render one option per breed with its ID as value; initialize from `breed_id`; on change fetch page 1 with the selected ID and retain that ID in URL/history and pagination URLs. |
| `app/client/src/pages/api/dogs.ts` | Forwards the incoming search string to Flask `/api/dogs`. | Continue forwarding the new query parameter unchanged; verify this path with an integration/browser test. |
| Tests | Flask `unittest` and Playwright E2E/API-integration tests exist. | Add focused API, pagination, and dropdown/URL coverage according to `test-cases.md`; update old name-valued UI expectations as needed during a later approved implementation. |

## Data flow

1. The homepage requests the existing breed catalog and current dog page.
2. The selected breed ID is read from the homepage URL; a change resets the page to 1.
3. The browser requests the same-origin `/api/dogs` proxy with `breed_id` and pagination (and any confirmed compatible filters).
4. The proxy forwards the query string to Flask.
5. Flask applies the breed-ID predicate to the SQLAlchemy query before `count` and pagination.
6. The API returns dogs and totals for that filtered query; the homepage renders results and page links that retain `breed_id`.

```mermaid
sequenceDiagram
  participant Browser
  participant Astro as Astro homepage / proxy
  participant Flask as Flask API
  participant DB as SQLAlchemy database
  Browser->>Astro: Load /?breed_id=...
  Astro->>Flask: GET /api/breeds and GET /api/dogs?breed_id=...
  Flask->>DB: Select breeds; select dogs joined to breeds
  DB-->>Flask: Breed list and filtered dog rows/count
  Flask-->>Astro: Breed list and paginated dog response
  Astro-->>Browser: Render selected dropdown, dogs, totals, links
  Browser->>Astro: GET /api/dogs?breed_id=...&page=...
  Astro->>Flask: Forward query string
  Flask->>DB: Filter by breed ID, count, offset, limit
  DB-->>Flask: Matching page and filtered count
  Flask-->>Astro: Dogs, total, total_pages
  Astro-->>Browser: Update results, URL, and pagination
```

## Decisions and constraints

- Reuse existing endpoint and ORM model boundaries; no new service, table, or migration is required by current evidence.
- Apply the ID predicate before counting and page slicing; this is required for AC-3.
- Keep the same-origin proxy for client-side requests; it forwards the query string without interpreting individual filters.
- Treat the new `breed_id` parameter additively with existing name and breed/category filters, as approved.
- Keep the breed catalog ordered alphabetically by breed name, as approved and consistent with existing behavior.

## Security, reliability, performance, and observability

- **Security:** `breed_id` is untrusted URL input. Validate/parse it as an ID and use the SQLAlchemy expression API; do not concatenate raw SQL. Exact malformed-ID response behavior is an open decision in `requirements.md`.
- **Reliability/error handling:** Reject malformed/non-numeric `breed_id` values with HTTP 400; unknown numeric IDs return an empty successful result with zero total. Do not silently disable an invalid filter.
- **Performance:** Filter in the database before count and pagination; do not retrieve all dogs and filter in the browser. No new cache or index is proposed without evidence.
- **Observability:** No feature-specific logging/metrics requirement or existing instrumentation was found in the inspected route/page. Do not claim new telemetry; retain existing application behavior.
- **Data/deployment:** Reuse the existing seeded breed rows and foreign-key relationship. Jira states seed scripts exist; no schema migration is proposed.

## Traceability

| Requirement | Architecture coverage |
|---|---|
| FR-01 / AC-1 | Existing Flask `GET /api/breeds`; ordered query and `{id,name}` projection. |
| FR-02 / AC-2 | Flask `/api/dogs` query applies a breed-ID predicate using the existing join. |
| FR-03 / AC-3 | Astro homepage loads catalog and represents selected ID in control/request/URL. |
| FR-04 / AC-3 | Homepage change handler requests page 1 after selection changes. |
| FR-05 / AC-3 | Filter-before-count/pagination; query-preserving page links. |
| FR-06 | Existing route and filters remain; approved behavior applies all supplied filters together. |

## Approved decisions

1. The stable breed list remains alphabetical by breed name.
2. Malformed/non-numeric `breed_id` values return HTTP 400; unknown numeric IDs return HTTP 200 with no matches and zero total.
3. `breed_id` combines additively with existing name and breed/category filters.
