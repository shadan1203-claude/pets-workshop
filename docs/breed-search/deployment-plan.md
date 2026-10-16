# Deployment Plan: Search Dogs by Breed

## Deployment status

**No deployment has occurred. Do not deploy this feature based on the current evidence.**

- Target platform, target URL/resource, environment name, and deployment owner: **Not Found** in the reviewed repository evidence.
- Deployment procedure, release trigger/approval policy, credentials/secret handling, and operational rollback mechanism: **Not Found**.
- Deployment approval and release readiness: **Not approved / not established**.
- The feature-scope code review found no feature-correctness blockers, but explicitly did **not** approve overall security or pre-PR readiness while frontend dependency findings remain unresolved (`docs/breed-search/review-report.md`).

## Release prerequisites

Before any release is considered:

1. Have the responsible owner identify and document the target platform/resource, environment, deployment procedure, release trigger, approval policy, and operational ownership. These are currently **Not Found**; do not infer them from local development settings or CI validation.
2. Resolve or formally handle, through an authorized process, the frontend dependency audit findings. The `app/client` audit on the main-based branch **failed** with 13 vulnerabilities (1 critical, 11 high, 1 low). Re-run and record the frontend audit after authorized remediation; do not represent current security or pre-PR readiness as approved.
3. Confirm the exact release candidate has the required approved security/review status and fresh validation evidence. The current test report records backend tests 6/6, full frontend tests 23/23, and Astro production build as passed; these are validation results, not deployment approval. See `docs/breed-search/test-report.md` and `docs/breed-search/review-report.md`.
4. Confirm the release owner's health-check expectations, smoke-test access, and rollback procedure before any deployment. Formal availability, latency, monitoring, and readiness targets are **Not Found** (`docs/breed-search/requirements.md`, `docs/breed-search/architecture.md`).

## Deployment scope and impact

The feature uses the existing Astro homepage and Flask API with existing dog/breed data and SQLite persistence. It adds `GET /api/breeds` and a `breed` query parameter on `GET /api/dogs`, but no service or database schema/migration. The deployed application would need the compatible frontend and backend revision, but the repository does not establish how or where either component is hosted or promoted.

No deployment-agent workflow or external deployment procedure was found in the main base source. Local build/test success must not be interpreted as a deployed release.

## Smoke checks (only after prerequisites and an approved deployment)

These are behavior checks, not deployment commands. Use the owner-approved environment and procedure once those are established:

1. The `main` base source has no `GET /health` route. Use an owner-approved health/readiness check once an endpoint and procedure are established; these are currently **Not Found**.
2. Load the homepage and verify the breed catalog and unfiltered, paginated dog list render.
3. Select an existing breed and verify the displayed dogs match it, the result count is filtered, and pagination retains the selected breed.
4. Verify an unmatched breed produces the breed-specific no-results state, not a fetch-error state.
5. Select “All breeds” and verify the filter is removed and the unfiltered listing returns.
6. Confirm the page reports a visible error rather than an empty success state if dog or breed data cannot be fetched, if such failure behavior can be safely validated in the approved environment.

Exact URLs, deployment commands, environment configuration, and production test procedures are **Not Found** and are not specified here.

## Rollback

If an approved release fails its smoke checks, stop further promotion and have the deployment owner apply the documented, approved procedure to restore the prior known-good application revision. Then repeat the owner-approved health and homepage checks and record the outcome. The exact rollback mechanism, revision identification, command, and recovery-time expectation are **Not Found**; determine these with the owner before release. This feature introduces no database schema migration, so no feature-specific schema rollback is identified. Do not improvise rollback commands or claim rollback capability until the actual hosting procedure is established.

## Evidence and current disposition

- `docs/breed-search/requirements.md`: feature scope, acceptance criteria, risks, and unspecified operational targets.
- `docs/breed-search/architecture.md`: app components, SQLite data flow, and the absence of a verified health/readiness endpoint in the main base.
- Repository deployment workflow: **Not Found** in the main base source.
- `docs/breed-search/test-report.md`: test/build outcomes, frontend audit failure (13: 1 critical, 11 high, 1 low), and no deployment/production validation.
- `docs/breed-search/review-report.md`: no feature-scope correctness blocker; overall security/pre-PR readiness is not approved pending frontend dependency findings.

**Disposition: NO DEPLOY.** Revisit only after the target/environment/owner and approved release/rollback procedures are documented and the dependency security gate is resolved or formally handled. No deployment was performed as part of this plan.