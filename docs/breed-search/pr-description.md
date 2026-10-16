# PR Description: Search Dogs by Breed

## Summary

Deliver breed search for the homepage dog list. Add a breed-catalog endpoint and an optional full-name breed filter to the paginated dog API. The selected breed is represented in the URL and retained through pagination; users can return to the unfiltered list.

**Current disposition:** This is a **draft PR** created with explicit authorization despite an unresolved frontend audit of 13 vulnerabilities (1 critical, 11 high, 1 low). Security/merge readiness and deployment are **not approved** until findings are remediated or formally excepted.

The SDLC artifacts are stored under `docs/breed-search/` to preserve the existing root-level `docs/architecture.md`, `docs/requirements.md`, and `docs/design-review.md`, which document a separate repository feature.

## Business Value

Shelter visitors can narrow the existing dog listing to a breed they prefer, share or reload a filtered view, and continue browsing matching dogs across pages. Clear empty and fetch-error states distinguish a valid no-match result from unavailable data.

## Changes

- Added `GET /api/breeds` and the optional `breed` query parameter on `GET /api/dogs`; preserved the dog-list response shape and existing dog-card/detail-link behavior.
- Added/verified an alphabetized breed selector, URL-backed filter state, page reset on selection, filtered pagination, clearing/reselection, and breed-specific no-match handling.
- Preserved literal matching for `%`, `_`, and `\\` in breed values through backend escaping.
- Kept dog-data and breed-catalog fetch failures visible as errors.
- Expanded browser and backend regression coverage; hardened the test-only failure proxy to loopback (`127.0.0.1`).
- Repaired the four requested repository hooks. The pre-PR hook audits the frontend dependency tree; it exits nonzero while its findings remain unresolved.
- No vaccination implementation is included. A vaccination route is **Not Found** in the `main` base source.

## Architecture Impact

The existing Astro homepage calls the Flask/SQLAlchemy breed and dog-list endpoints, which use the existing SQLite data. The change adds one read-only catalog route and a query parameter; it adds no service, dependency, or database/schema change. See `docs/breed-search/architecture.md` and `docs/breed-search/api-design.md`.

## Testing Evidence

Recorded results in `docs/breed-search/test-report.md` (2026-10-16):

- Backend unittest suite: **PASS, 6/6**.
- Focused homepage Playwright suite, Chromium: **PASS, 13/13**.
- Full frontend Playwright suite: **PASS, 23/23**.
- Astro production build: **PASS**.
- Pre-development, post-codegen, and pre-commit hooks: **PASS, exit 0**.
- Pre-PR hook: **FAIL, exit 1** after all 23 frontend tests passed; it correctly detected **13 vulnerabilities (1 critical, 11 high, 1 low)** in `app/client`.
- No dependency changes were authorized or made. The critical/high findings are an explicit merge/release hold.
- `git diff --check`: final scoped-branch result is recorded in `docs/breed-search/test-report.md`.

The suites passed, but this does not establish clean overall security/pre-PR readiness. Coverage percentage was not measured; browser validation used Chromium only. See `docs/breed-search/test-report.md` and `docs/breed-search/review-report.md` for scope and residual coverage details.

## Deployment Impact

No deployment has occurred, and deployment is not approved. The deployment target, environment, release owner/procedure, and operational policy are **Not Found** in repository evidence. Resolve or formally handle the frontend audit findings and establish approved deployment prerequisites before release. A `GET /health` route is **Not Found** in the main base source. See `docs/breed-search/deployment-plan.md`.

## Rollback Plan

No feature-specific database migration exists. If a future approved deployment fails its smoke checks, the deployment owner should restore the prior known-good application revision using the owner-approved procedure and re-run the approved health and homepage checks. The actual rollback mechanism, commands, revision identification, and recovery target are **Not Found**; establish them before deployment and do not improvise a rollback procedure.

## Reviewer Checklist

- [x] Requirements, architecture, implementation plan, test report, review report, and deployment plan consulted.
- [x] Feature-scope review: **Approved**; no remaining blocking breed-search acceptance finding reported.
- [x] Backend, focused browser, full frontend, production build, and the passing hooks have recorded outcomes.
- [ ] Resolve or formally handle the frontend audit findings (13 total: 1 critical, 11 high, 1 low) and rerun the frontend audit.
- [ ] Confirm the target baseline's vaccination-route scope; no such route was found in main.
- [ ] Establish deployment target, owner, release procedure, and rollback procedure before any release.
- [ ] Reassess overall security/pre-PR readiness; it is **not approved** at present.
- [x] Draft PR creation authorized with the security hold disclosed; do not merge or deploy before required gates pass.
