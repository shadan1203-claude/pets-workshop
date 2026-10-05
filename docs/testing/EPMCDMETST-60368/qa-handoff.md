# QA Handoff — Instant Search by Pet Name and Category (Breed)

- **Jira Epic**: EPMCDMETST-60368
  - https://jiraeu.epam.com/browse/EPMCDMETST-60368
- **Jira Story**: _Not provided in context_
  - URL: _Not provided in context_

> Note: A Jira Story key was not provided in the design package. This handoff is tracked under the epic key **EPMCDMETST-60368**.

## Acceptance Criteria Mapping → Test Scenarios

### AC1: Name search input filters by name (case-insensitive, partial match)

- **Positive**
  - Type `bu` → list shows dogs whose names contain `bu` (e.g., Buddy), hides non-matching.
  - Type `BUD` → same results as `bu` (case-insensitive).
- **Negative**
  - Type `zzzz` → empty state displayed.
- **Edge**
  - Input whitespace only → treated as empty; shows default results for current page.

### AC2: Category selector filters by category/breed

- **Positive**
  - Select `Husky` → only Husky dogs displayed.
  - Select `All` → removes category filter.
- **Negative**
  - Manually set URL param to unknown category → empty state displayed.

### AC3: Results update instantly (no full page refresh)

- Verify:
  - Typing/selecting does **not** trigger a full navigation/reload.
  - Network calls to `/api/dogs` occur when input changes.

### AC4: Combined filters

- Verify intersection:
  - Name `lu` + category `Husky` → only dogs matching both.
  - Name `a` + category `German Shepherd` → only dogs matching both.

### AC5: Empty state

- Apply filters yielding 0 results → empty state visible with appropriate message (e.g., “No dogs match your search.”) and reuse existing styling.

### AC6: Pagination behavior not broken

- **Baseline** (no filters)
  - Pagination behaves as before (page switching works).
- **With filters**
  - Pagination reflects filtered totals.
  - Changing filters resets to page 1 (expected per design) and shows correct results.

### AC7: Automated tests updated

- Update/add Playwright e2e assertions for name search, category filter, combined filters, and empty state.

## Automation Guidance (Playwright)

Recommended stable locators to add/use:

- Name input: `data-testid="search-name"`
- Category select: `data-testid="search-category"`
- Dog card: existing test id(s) or `data-testid="dog-card"`
- Empty state: `data-testid="empty-state"`
- Pagination region: `data-testid="pagination"`

Test approach:

1. `goto('/')`
2. Assert initial list visible.
3. Fill name input and assert list changes.
4. Select category and assert all results match selected breed text.
5. Combine both and assert intersection.
6. Use a query producing no matches and assert empty state.
7. Ensure no `page.goto`/navigation occurs on input/select change.
8. Verify pagination works with and without filters.

## Test Data / Environment Notes

- E2E tests rely on deterministic DB seeding:
  - `app/server/utils/seed_test_database.py`
- Use seeded dog and breed names for deterministic assertions.

## Additional Edge Cases

- Rapid typing: last input wins; results consistent (no flicker to older results).
- Network/API failure during search: UI shows error state/banner and remains functional.
- Unknown URL params: handled gracefully (0 results → empty state).
