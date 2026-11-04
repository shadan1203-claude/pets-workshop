# Requirements — EPMCDMETST-70141

## Status and scope

**Intake:** Approved by the user on 2026-11-04.
**Requirements:** Approved by the user on 2026-11-04 after selecting the `breed_id`-only filter contract.
**Requirements basis:** Jira story as captured in [`intake-summary.md`](intake-summary.md).
**Candidate implementation:** The existing breed-filter edits were approved for consideration as candidate implementation, not as approved behavior or evidence of passing acceptance. No code was changed and no tests were run for this requirements analysis.
**User decision:** The breed filter contract shall use integer `breed_id` as the only required breed-filter parameter; a breed-name alias is not required.

This specification defines a homepage dog-listing breed filter and supporting API behavior. It records unresolved decisions without making architecture or implementation choices beyond the approved intake.

## Business goal

**BR-01:** Reduce browsing friction and improve dog discovery by allowing users to filter the homepage dog listing by breed.

## Stakeholders

| Stakeholder | Interest / responsibility | Evidence |
| --- | --- | --- |
| Dog-seeking users | Find dogs of a selected breed and understand when there are no matches. | Jira goal and requested scope in `intake-summary.md`. |
| Product owner / story approver | Confirm scope and resolve open product decisions. | Intake approved by the user; specific owner not identified. |
| Application developers | Deliver and maintain the API and homepage changes, documentation, and automated tests. | Jira requested scope. |
| Testers / reviewers | Verify API, URL, filtering, pagination, and empty-state acceptance. | Jira acceptance criteria and requested automated tests. |

Named owners and any additional operational stakeholders: **Not Found**.

## Functional requirements

| ID | Requirement | Traceability | Verification intent |
| --- | --- | --- | --- |
| FR-01 | The application shall provide `GET /api/breeds`, returning breed IDs and names ordered by breed name. | Jira scope; Jira AC-01. | API test checks successful response, ID/name fields, and ascending name order. |
| FR-02 | `GET /api/dogs` shall accept an optional integer `breed_id` filter and return only dogs matching that breed. A breed-name alias is not required for this feature. | Jira scope; Jira AC-03; intake assumption; user decision at requirements review. | API test checks matching and nonmatching breed IDs using `breed_id`. |
| FR-03 | The `total` and `total_pages` values returned by `GET /api/dogs` shall describe the result set after all active filters, including breed, have been applied. | Jira AC-03. | API test compares filtered count and page count with known filtered results, including an empty result. |
| FR-04 | The homepage shall provide a breed dropdown containing an “All Breeds” choice and the breeds retrieved from `GET /api/breeds`. | Jira AC-01. | UI test checks the exact “All Breeds” label and that available breed options correspond to the API response. |
| FR-05 | Selecting a breed shall update the listing and represent the selected integer ID as `breed_id` in the URL without requiring a manual full-page reload. | Jira requested scope; Jira AC-02; user decision at requirements review. | UI test selects a breed, checks the `breed_id` URL parameter and matching listing, and verifies the interaction completes without manual reload. |
| FR-06 | Pagination URLs and resulting requests shall retain the selected breed filter. Changing the breed filter shall reset the listing to page 1. | Jira requested scope; Jira AC-04 and reset behavior in requested scope. | UI tests follow pagination under a selected breed and change the filter from a later page, checking the URL and results. |
| FR-07 | When the active filters produce no dogs, the homepage shall show an empty state. Pagination shall be hidden or limited to one page. | Jira requested scope; Jira AC-05. | UI/API tests exercise a no-match filter and check the empty state and one of the permitted pagination outcomes. |
| FR-08 | Relevant documentation shall be updated and automated tests shall be added or updated for the requested behavior. | Jira requested scope. | Review the documentation diff and run the relevant automated tests during the testing phase. |
| FR-09 | With no breed filter selected, the existing unfiltered homepage dog listing and pagination shall remain available. | Implied by the optional filter and the “All Breeds” choice in Jira scope/AC-01. | Regression test checks the default listing and pagination without a breed parameter. |

## Non-functional requirements

The Jira story does not set quantitative quality targets. The following interaction-level constraint is explicit:

| ID | Requirement | Traceability | Verification intent |
| --- | --- | --- | --- |
| NFR-01 | The breed-selection interaction shall update the listing without requiring a manual full-page reload. | Jira requested scope and AC-02; also FR-05. | UI test observes the selection and refreshed listing without a manual reload. |

Performance/latency, accessibility conformance, browser support, availability, observability, and quantitative reliability targets: **Not Found**. See open items before assigning targets.

## Acceptance criteria

| ID | Acceptance criterion |
| --- | --- |
| AC-01 | The homepage dropdown includes “All Breeds” and the breeds returned by `GET /api/breeds`. The endpoint returns breed IDs and names sorted by name. |
| AC-02 | Selecting a breed updates the URL with `breed_id` and refreshes the dog listing without a manual full-page reload. |
| AC-03 | `GET /api/dogs` returns only dogs matching the selected breed, and `total` / `total_pages` reflect that filtered result set. |
| AC-04 | Pagination links and requests retain the selected breed. Changing the breed resets the listing to page 1. |
| AC-05 | A filter with no matching dogs shows an empty state; pagination is hidden or limited to one page. |
| AC-06 | With “All Breeds” selected, the normal unfiltered listing remains available. |
| AC-07 | Relevant documentation and automated tests cover the delivered behavior. |

## Traceability and evidence

| Reference | Source / status | Use and limitation |
| --- | --- | --- |
| SRC-01 | Jira story `EPMCDMETST-70141`, recorded in [`intake-summary.md`](intake-summary.md) | Authoritative source for approved goal, requested scope, assumptions, exclusions, risks, and acceptance criteria. Jira details were retrieved for intake; comments and linked Confluence content were not verified. |
| SRC-02 | `copilot-instructions.md`, “Source Of Truth Priority” | Repository governance: source code, executable tests, configuration, build pipelines, deployment configuration, architecture documents, then requirements documents. Requirements are not used to overrule higher-priority implementation evidence. |
| SRC-03 | `app/server/app.py` (candidate working-tree version; `get_dogs` and `get_breeds`, lines 22–99) | Static inspection shows a breed-ID filter, filtered count/pagination calculation, and an ordered breeds query. This file is locally modified and uncommitted; inspection is not runtime verification. |
| SRC-04 | `app/server/test_app.py` (candidate working-tree version; tests around lines 151–276) | Test definitions cover breed filtering, empty/unknown IDs, breed listing, and filtered totals. These tests were not run; their presence does not establish passing behavior. |
| SRC-05 | `app/client/src/pages/index.astro` (candidate working-tree version; lines 7–55, 89–95, 131, 349–425) | Static inspection shows fetching breeds, reading `breed_id`, pagination URL construction, an empty-state message, and a dropdown. The current candidate's unselected option text is “All”, not the required “All Breeds”; this is an unresolved acceptance gap, not an approved change. |
| SRC-06 | `app/client/e2e-tests/search.spec.ts` (candidate working-tree version; tests around lines 36–207) | Test definitions cover URL updates, page reset, pagination preservation, and an empty state. Some tests use mocked responses. The tests were not run and do not establish end-to-end behavior against the running application. |
| SRC-07 | `.github/agents/requirements.md` | Not a valid agent definition: it has no agent front matter and contains a product-requirements document about automated documentation sync, unrelated to this story. It was not treated as source for EPMCDMETST-70141. |

### Candidate implementation note

The relevant files in SRC-03 through SRC-06 are locally modified and uncommitted on a branch named for another Jira, as recorded in `intake-summary.md`. The user approved treating the breed-filter edits as candidate implementation only. Their source and test definitions were inspected for possible gaps; no claim is made that the implementation is validated or accepted. In particular, the “All” versus “All Breeds” label differs from Jira AC-01.

## Assumptions

- **ASM-01:** The existing Breed data/model is the source of breed IDs and names; Jira identifies it as a dependency.
- **ASM-02:** Integer `breed_id` is the feature's sole required breed-filter parameter, as selected by the user. This does not require removal of unrelated pre-existing parameters.
- **ASM-03:** The homepage listing is the target surface, as stated in Jira.
- **ASM-04:** Existing unfiltered dog-listing behavior should remain available when no breed is selected, consistent with an optional filter and “All Breeds”.

## Dependencies

- **DEP-01:** Existing Breed records/model must be available to populate the API response and filter dogs.
- **DEP-02:** The homepage must be able to reach the dog and breed API endpoints.
- **DEP-03:** Automated API/UI test infrastructure and relevant documentation must be available for validation and delivery.
- Jira states there are no explicit dependencies; DEP-01 through DEP-03 are prerequisites implicit in the requested capability, not additional external dependencies.

## Exclusions

As recorded in the approved intake, the following are out of scope:

- Multi-select breed filters.
- Advanced search by name, age, or gender.
- Saving filter preferences to a user profile.

No broader changes to dog discovery or listing behavior are implied.

## Risks

| ID | Risk | Mitigation / handling |
| --- | --- | --- |
| RSK-01 | Candidate edits are uncommitted on a branch for another Jira and have not been validated. | Keep unrelated worktree changes untouched; validate the candidate against this specification in later authorized phases. |
| RSK-02 | Candidate UI uses “All” while Jira requires “All Breeds”. | Resolve this explicit discrepancy against AC-01 before implementation is considered accepted. |
| RSK-03 | Fixed-content E2E fixtures may disagree with repository data or behavior. | Check test fixtures against the actual data/configuration during test planning and validation. |
| RSK-04 | Jira comments and issue-specific Confluence context are unverified. | Recheck those sources if available before treating this document as fully informed by external context. |
| RSK-05 | Missing non-functional targets may lead to inconsistent interpretation of performance, accessibility, and browser support. | Resolve the relevant open items before defining corresponding verification expectations. |

## Open items

| ID | Question / missing evidence | Status |
| --- | --- | --- |
| OI-01 | Is `breed_id` the only supported API query parameter, or must the API also accept `breed`/a breed name? Which URL parameter should the homepage emit? | Resolved by user at requirements review: use integer `breed_id`; a breed-name alias is not required. |
| OI-02 | Does “All Breeds” require that exact visible label, including capitalization and spacing? | Jira AC-01 specifies the exact label; candidate source currently differs (“All”). Confirm during acceptance review. |
| OI-03 | For no-match results, should pagination be hidden or shown as one page? | Jira permits either; select the expected behavior before final UI test assertions if a single outcome is required. |
| OI-04 | What performance/latency, accessibility, browser-support, availability, reliability, and observability targets apply? | **Status: Not Found** |
| OI-05 | Are there relevant Jira comments or linked Confluence requirements? | **Status: Not Found**. Intake reports that comments and linked Confluence context could not be verified. |
| OI-06 | Who is the named product owner/approver and who owns test acceptance? | **Status: Not Found** |

## Handoff

This document records approved requirements and the remaining open items above. Approval does not authorize implementation or testing. Candidate code and tests remain unvalidated.
