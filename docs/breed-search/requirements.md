# Requirements: Search Dogs by Breed

## Business Goal

As a shelter visitor, I want to search dogs by breed so that I can find dogs matching my preferences.

The visitor needs a straightforward way to narrow the shelter's paginated dog list by a selected breed, while retaining the ability to return to the unfiltered list.

## Stakeholders

- **Primary stakeholder — Shelter visitor:** selects a breed and reviews matching dogs.
- **Shelter staff or site operators:** depend on accurate breed and dog records being available to visitors. The user story does not define staff workflows or ownership of those records.
- **Repository maintainers:** preserve the existing dog listing, API, and application architecture while delivering the search.

## Source Evidence

| Evidence | Verified facts |
| --- | --- |
| `app/server/app.py:99-142` | `GET /api/dogs` accepts `breed`, `page`, and `per_page`; defaults to page 1 and six results, bounds `per_page` to 1–100, strips the breed value, escapes SQL `LIKE` wildcard characters, filters with `Breed.name.ilike`, and returns dog and pagination data. |
| `app/server/app.py` | Breed search introduces `GET /api/breeds` and extends `GET /api/dogs` with an optional breed filter. |
| `app/client/src/pages/index.astro` | The homepage requests dogs and breeds, adds the selected breed to the dogs request, displays a labeled breed selector, submits page 1 when the selection changes, reflects the selection in the URL, and retains it in pagination links. Fetch failures are rendered as errors. |
| `app/client/src/components/DogList.astro` | The page displays the result count and uses a breed-specific empty-state message when a filtered list has no dogs. |
| `app/server/test_breed_search.py` | Unit tests cover breed filtering, wildcard escaping, catalog ordering, and paginated dog response structure. |
| `app/client/e2e-tests/homepage.spec.ts` | Browser tests cover the breed selector and filtering, pagination with the breed retained, case-insensitive matching, and the no-match state. |

No separate business metrics, stakeholder role definitions, or deployment/service-level targets were found in the available request and repository evidence.

## Functional Requirements

- **FR-01 — Browse breeds:** The homepage shall offer a visitor a selector populated from the breed catalog. The catalog shall be presented alphabetically.
- **FR-02 — Filter by selected breed:** When a visitor selects a breed, the dog list shall contain dogs whose full breed name matches that selection, without regard to letter case. The filter shall not interpret `%`, `_`, or `\` in a breed name as SQL wildcard syntax.
- **FR-03 — Share and restore a filtered view:** The selected breed shall be represented in the URL so that reloading or sharing that URL restores the filtered view.
- **FR-04 — Pagination:** Changing the breed selection shall start results at page 1. Pagination shall retain the selected breed and return only dogs matching it.
- **FR-05 — Clear the filter:** Selecting “All breeds” shall remove the breed filter and show the unfiltered dog list.
- **FR-06 — Empty results:** A valid request for a breed with no matching dogs shall show a zero result count and a breed-specific no-matches message; it shall not be reported as an API failure or as an empty unfiltered shelter list.
- **FR-07 — Error handling:** A failure to retrieve dog or breed data shall be presented as an error, not as a successful empty result.
- **FR-08 — Preserve existing dog listing:** Filtered and unfiltered results shall retain the existing dog card and detail-link behavior and the existing dog-list API response fields.

## Non-Functional Requirements

- **NFR-01 — Compatibility:** Implement the feature within the existing Flask, SQLAlchemy, SQLite, Astro, and Tailwind application. This request does not require a new service, dependency, or database schema change.
- **NFR-02 — Bounded results:** The homepage shall continue to show a bounded page of dogs and provide pagination where further results exist.
- **NFR-03 — Usability:** The breed selector shall have a visible label and be operable using standard form interaction.
- **NFR-04 — Regression safety:** Dog detail links, unfiltered browsing, and existing pagination shall continue to work. Vaccination routes are **Not Found** in the `main` base source and are outside this feature's implementation scope.
- **NFR-05 — Unspecified service qualities:** No measurable latency, availability, localization, browser-support, or formal accessibility target was provided. Record each as **Not Found** rather than inventing a threshold.

## Assumptions

- “Search by breed” means choosing a breed from the supplied catalog; free-text, partial-name, and multi-breed search are not requested.
- Matching is by the full breed name, case-insensitively. Leading and trailing whitespace in the submitted value is ignored, consistent with the backend's current behavior.
- A breed value absent from the catalog or with no dogs is treated as a zero-match result, not an API error.
- The current six-dog homepage page size and pagination are retained; no new result-size preference is requested.
- Unspecified business rules and operational targets remain Not Found pending clarification.

## Risks

| Risk | Severity | Mitigation / requirement |
| --- | --- | --- |
| A visitor may expect free-text or partial matching from the word “search,” while the evidenced UI is a breed selector and the matching contract is full-name matching. | Medium | State the selector and exact full-name behavior explicitly in FR-01 and FR-02; obtain clarification before expanding scope. |
| Breed and dog data are fetched from separate endpoints; if either request fails, the page cannot provide a complete usable search experience. | Medium | Keep failures visible as errors (FR-07); do not represent fetch failure as zero results. |
| SQL wildcard characters in breed values could unintentionally broaden results if treated as pattern syntax. | Low | Require literal matching of `%`, `_`, and `\` (FR-02); the backend unit test covers escaping. |
| Matching/collation behavior outside the evidenced SQLite setup is not established. | Low | Preserve the documented SQLite architecture; deployment on another database and its collation requirements are **Not Found**. |

## Acceptance Criteria

- **AC-01 — Catalog and default view:** Given the homepage loads successfully, when the visitor views the breed control, then it contains the alphabetized breed catalog and an “All breeds” option, and the dog list is initially unfiltered and paginated.
- **AC-02 — Breed match:** Given the visitor selects a breed with matching dogs, when the results load, then every displayed dog's full breed name matches the selected breed regardless of case.
- **AC-03 — URL and page reset:** Given the visitor is on a later page and selects a breed, when results load, then the URL identifies that breed and results start at page 1.
- **AC-04 — Filtered pagination:** Given more than one page of dogs match the selected breed, when the visitor moves between result pages, then the breed remains in the URL and every displayed dog matches it.
- **AC-05 — Clear selection:** Given a breed filter is active, when the visitor selects “All breeds,” then the breed parameter is removed and the unfiltered dog list is displayed.
- **AC-06 — No matches:** Given the URL specifies a breed with no matching dogs, when the page loads successfully, then the count is zero and the page displays a breed-specific no-matches message.
- **AC-07 — Literal wildcard characters:** Given a breed name contains `%`, `_`, or `\`, when the visitor searches for that breed, then those characters are treated literally and do not broaden the results.
- **AC-08 — Fetch failure:** Given either dog or breed data cannot be fetched, when the homepage renders, then it shows an error state rather than presenting the failure as a successful empty result.
- **AC-09 — Existing behavior:** Given the visitor uses dog cards, detail links, or pagination, when those existing flows are exercised, then their behavior and the dog-list API response fields remain unchanged.
