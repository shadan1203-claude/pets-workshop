# Test Design — EPMCDMETST-70156

**Status:** Approved for implementation
**Inputs:** Jira EPMCDMETST-70156, draft `requirements.md`, draft `architecture.md`
**Execution status:** Design only; no implementation tests or builds were run.

## Acceptance criteria mapping

| Jira criterion | Test cases |
|---|---|
| AC-1 — stable breed list with `id` and `name` | TC-01, TC-02 |
| AC-2 — optional `breed_id` returns only matching dogs | TC-03, TC-04, TC-05, TC-06 |
| AC-3 — dropdown updates results and filtered pagination totals | TC-07, TC-08, TC-09, TC-10 |

## Test cases

| ID | Type | Scenario | Expected result | Requirement mapping |
|---|---|---|---|---|
| TC-01 | Positive / API | Request `GET /api/breeds` with seeded breeds. | HTTP 200; response contains a `breeds` array of objects with `id` and `name`; repeated reads of unchanged data return the same alphabetical order. | FR-01, AC-1 |
| TC-02 | Edge / API | Request the breed list when there are no breed rows. | HTTP 200 with an empty `breeds` array; no malformed/null entries. | FR-01, AC-1 |
| TC-03 | Positive / API | Request `GET /api/dogs?breed_id=<known id>` with dogs from multiple breeds. | Only dogs associated with the requested breed are returned; response retains the existing pagination envelope. Verify the backend query filters before count/page slicing. | FR-02, AC-2 |
| TC-04 | Positive / regression API | Request `/api/dogs` without `breed_id`. | Existing unfiltered results and pagination behavior remain available. | FR-06, AC-2 |
| TC-05 | Edge / API | Request a valid numeric but unknown `breed_id`. | HTTP 200 with an empty dog list and `total=0`. | FR-02, AC-2 |
| TC-06 | Negative / API | Request a malformed/non-numeric `breed_id`. | HTTP 400; the invalid filter is not silently ignored. | FR-02, AC-2 |
| TC-07 | Positive / browser | Load homepage with breed catalog and a selected `breed_id`. | Dropdown options correspond to catalog IDs/names; the matching ID is selected; rendered dogs match that ID. | FR-03, AC-3 |
| TC-08 | Positive / browser | Change dropdown while viewing a later page. | Request uses selected `breed_id` and page 1; results update; URL state records `breed_id`; selected option stays selected after reload. | FR-03, FR-04, AC-3 |
| TC-09 | Positive / browser/API | Use next/previous pagination for a breed with multiple pages. | Link/request retains `breed_id`; every returned dog matches it; `total` and `total_pages` describe only matching dogs. | FR-05, AC-3 |
| TC-10 | Negative / browser | Select a breed with no matching dogs. | Empty state is rendered; pagination reflects the filtered result and no unfiltered dogs appear. | FR-05, AC-3 |
| TC-11 | Edge / browser | Clear the breed selection or load with no `breed_id`. | URL no longer contains `breed_id`; the unfiltered list is restored. | FR-03, FR-06 |
| TC-12 | Compatibility / API | Supply `breed_id` together with existing name or breed/category filters. | Apply all supplied filters together; results satisfy every predicate. | FR-06 |
| TC-13 | Edge / browser | Change a filter while a dog request is pending, then attempt to use a pagination link from the previous result set. | Stale pagination is disabled during loading and cannot issue a request for a later page with the newly selected filter. | FR-04, FR-05 |

## Test layers

- **Unit/API:** Flask test client and mocked SQLAlchemy query in `app/server/test_app.py`; verify predicate, output, filtered count, and pagination.
- **Integration/API:** exercise the running Flask API with seeded data to confirm actual ID-to-dog association and pagination across pages.
- **End-to-end:** Playwright verifies dropdown population/selection, URL persistence, result updates, clear behavior, and pagination links.
- **Regression:** retain coverage for no-filter requests and existing name/breed/category behavior as confirmed in Human Approval.

## Test skeleton

The Jira-scoped `tests/EPMCDMETST-70156/tasks.test.js` contains TODO placeholders for these scenarios. The repository's executable API/E2E frameworks are Python `unittest` and Playwright; this design-stage skeleton is not evidence that tests ran.

## Approval

Requirements, architecture, and test design were approved for implementation. No tests were executed during test design.
