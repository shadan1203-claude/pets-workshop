# API Design: Breed Search

## Scope and status

This document records the Flask contract introduced for breed search. The feature adds `GET /api/breeds` and extends `GET /api/dogs` with an optional `breed` query parameter while preserving the existing dog-list response envelope and database schema. The contract below is grounded in `app/server/app.py` and `app/server/test_breed_search.py`, with the requirements, architecture, and design review used for traceability.

## `GET /api/breeds`

### Request

- Method and path: `GET /api/breeds`
- Query parameters: none are declared or read by the route.
- Request body: none is used.

### Successful response

The route returns HTTP `200` with a top-level JSON array, ordered by `Breed.name` ascending. There is no enclosing object.

```json
[
  {"id": 3, "name": "Golden Retriever"},
  {"id": 8, "name": "Husky"}
]
```

Each item contains an integer `id` and string `name`. An empty catalog serializes as `[]` by the route's list serialization; the current unit test verifies the non-empty array shape and ordering query, not the empty-catalog case.

## `GET /api/dogs`

### Request

- Method and path: `GET /api/dogs`
- Query parameters are optional and read from the query string.
- Request body: none is used.

| Parameter | Effective type | Default and normalization | Effect |
| --- | --- | --- | --- |
| `breed` | string | Missing, empty, or whitespace-only means no breed filter. A non-empty value is trimmed at both ends. | Full-name match against `Breed.name`, case-insensitive through SQLAlchemy `ilike`. The value is not surrounded with `%` or `_`, so matching is not substring/prefix search. Literal `%`, `_`, and `\\` are escaped before the comparison and do not act as `LIKE` wildcards. |
| `page` | integer | Defaults to `1`; values below `1` are clamped to `1`. If Flask cannot convert the supplied value to an integer, `request.args.get(..., type=int)` uses the default `1`. | One-based page index. |
| `per_page` | integer | Defaults to `6`; values are clamped to the inclusive range `1`–`100`. If Flask cannot convert the supplied value to an integer, `request.args.get(..., type=int)` uses the default `6`. | Maximum number of dog records returned in this page. |

A representative request is:

```text
GET /api/dogs?breed=Golden%20Retriever&page=1&per_page=6
```

Breed matching is performed after joining dogs to breeds. A missing or blank breed does not add a filter. A non-empty supplied breed is stripped, has backslash and SQL `LIKE` wildcard characters escaped, then is compared with `Breed.name.ilike(..., escape='\\')`. Thus the implemented matching intent is exact full-name matching without regard to case, subject to the active database's `ilike` semantics. The app configures SQLite; equivalent case-folding behavior for other database engines or locale-specific names is not established by the reviewed evidence.

### Successful response

The route returns HTTP `200` with a JSON object containing these fields:

```json
{
  "dogs": [
    {"id": 1, "name": "Buddy", "breed": "Golden Retriever"}
  ],
  "page": 1,
  "per_page": 6,
  "total": 1,
  "total_pages": 1
}
```

| Field | Type | Meaning |
| --- | --- | --- |
| `dogs` | array of objects | Current page of dogs. Each object has `id` (integer), `name` (string), and `breed` (string). |
| `page` | integer | Normalized requested page number. |
| `per_page` | integer | Normalized page size. |
| `total` | integer | Number of dogs in the query after applying the optional breed filter and before pagination. |
| `total_pages` | integer | Ceiling of `total / per_page`, with a minimum value of `1`. |

### Filtering, pagination, and empty-result semantics

- Filtering occurs before `count()`, offset, and limit, so `total` and `total_pages` describe the filtered result set.
- The offset is `(page - 1) * per_page`; `limit` is the normalized `per_page`.
- No matches is a successful result, not an API error: `dogs` is `[]`, `total` is `0`, and `total_pages` is `1`. This applies both to an empty unfiltered result and to a breed value that matches no breed/dogs. The frontend distinguishes filtered and unfiltered empty messages; those are presentation behavior, not additional API fields.
- A page beyond the available result range is not clamped to `total_pages` by the route. It retains the normalized requested `page`; offset/limit can therefore produce `dogs: []` while `total` reflects the available filtered records. This follows from the route implementation; a dedicated test for this boundary is not present.

## Error behavior and unspecified contract

The route handlers return JSON for the successful query paths above, and the tests assert HTTP `200` for representative dog-list and breed-catalog requests. They do not define an application-specific error response for database/query exceptions, nor do they validate an error status or payload for such failures. That error mapping is **Not Found** in the reviewed API source/tests. No error schema, status code, authentication/authorization behavior, or transport/deployment policy is specified here. Do not infer or promise one from the successful response examples.

## Evidence and requirements traceability

| Contract point | Repository evidence |
| --- | --- |
| Dog-list parameters, defaults, clamping, breed trimming, literal wildcard escaping, filtered count, offset/limit, and response construction | `app/server/app.py`, `get_dogs` (`GET /api/dogs`, lines 99–142). |
| Breed catalog ordering and `{id, name}` list serialization | `app/server/app.py`, `get_breeds` (`GET /api/breeds`). |
| Breed filter, escaped filter expression, pagination ordering, and catalog shape | `app/server/test_breed_search.py`; existing response shape tests remain in `app/server/test_app.py`. |
| Feature intent, full-name case-insensitive selection, bounded pagination, empty results, and failure distinction | `docs/breed-search/requirements.md`: FR-01–FR-08, NFR-01–NFR-05, AC-01–AC-09. |
| UI URL/pagination behavior, frontend empty/error presentation, and existing component/data flow | `docs/breed-search/architecture.md`; source implementation in `app/client/src/pages/index.astro` and `app/client/src/components/DogList.astro`. |

## Design-review conditions and open questions

These are unresolved evidence/operational questions from `docs/breed-search/design-review.md`, not proposed changes to the current endpoint contract.

| Finding / question | Evidence and current disposition |
| --- | --- |
| **DR-02 — Acceptance-test coverage (Medium)** | The focused and full browser suites cover selection reset, clearing/reselection, pagination, and both fetch-failure states. Backend tests verify filter expression escaping. Special-character matching is not exercised through the browser UI. |
| **DR-01 — Query cost with growth (Medium):** What deployed schema/indexes, query plans, data volumes, and workload should inform performance expectations? | The route joins, counts, then uses offset/limit. No benchmark, deployed query-plan evidence, traffic expectation, or latency target was found. Review recommends measuring before scaling; no index or performance guarantee is asserted here. |
| **DR-03 / deployment policy (Low):** Are these visitor-facing endpoints intentionally public, and what transport, access-control, monitoring, and readiness policies apply in deployment? | The reviewed handlers contain no authentication/authorization logic; transport boundaries and operational observability are not established. The design review recommends confirming deployment-wide policy before production. These matters are **Not Found** in the reviewed evidence. |
| **Database/query failures:** What status and payload should clients receive if catalog/list queries fail? | The route source and focused tests do not define feature-specific exception mapping. The API error contract is **Not Found**; this document deliberately does not invent one. |
| **Cross-database matching:** Must case-insensitive equivalence extend beyond the evidenced SQLite setup or cover locale-specific character folding? | `ilike` is used by the route and SQLite is the documented configured database. Behavior on other database engines/locales is unverified. |
