# Design Review � EPMCDMETST-69346

## Round 2 � Current status (effective)

**Review date:** 2026-11-02  
**Status:** Approved With Conditions  
**Human gate:** Approved by the user on 2026-11-02.  
**API Design may proceed:** Yes, subject to the conditions below.  
**Source of truth:** Jira AC-01..AC-08; user-approved D-01..D-04; `docs/EPMCDMETST-69346/requirements.md` and `docs/EPMCDMETST-69346/architecture.md`.  
**Evidence base:** static review of approved requirements and architecture plus current repository source and config; no tests or builds were executed here. Source presence is not validation evidence.

### Summary

The revised architecture resolves the earlier design-review gaps at the architectural level by explicitly codifying the user-approved decisions: a 100 ms debounce with the remaining 200 ms for request, parse, and render; ascending `Dog.id` ordering before pagination; 100-character input caps with literal `%` and `_` matching; and a clear accessible breed-catalog failure mode that leaves name-only search usable. These decisions are consistent with Jira AC-01..AC-08 and D-01..D-04 and are now traceable in the architecture document.

Residual risk is no longer primarily design ambiguity; it is implementation and validation risk. The current repository source still does not show the D-01..D-04 behavior as implemented or measured, and production deployment evidence is still `Not Found`. The gate is therefore not a production sign-off, but it is acceptable to proceed to API Design with explicit conditions and evidence requirements.

### Assessment of DR-01..DR-04

| Design review item | Status at revised architecture stage | Evidence / residual risk |
|---|---|---|
| DR-01: 300 ms end-to-end budget and 100 ms debounce allocation | Resolved at design level | Architecture explicitly reserves 100 ms debounce and 200 ms for request, parse, and render. Current source still contains 300 ms debounce and no timing proof; this is a validation condition, not an approved runtime claim. |
| DR-02: deterministic filtered pagination order | Resolved at design level | Architecture requires ascending `Dog.id` before offset/limit. Current `app/server/app.py` has no `order_by`, so implementation must be updated and tested. |
| DR-03: 100-char limit and literal `%`/`_` semantics | Resolved at design level | Architecture requires maximum 100 chars and SQL LIKE escaping for `%` and `_`. Current `app/server/app.py` uses `Dog.name.ilike(f"%{name}%")` without escaping; implementation must be corrected. |
| DR-04: accessible breed-catalog failure without breaking name search | Resolved at design level | Architecture explicitly requires accessible error state and name-only search fallback. Current `app/client/src/pages/index.astro` still swallows a non-OK breed response and can leave a misleading All-only selector. |

## Findings

### Medium

**M-01 � Timing budget is specified but unimplemented and unmeasured.**  
**Evidence:** `docs/EPMCDMETST-69346/architecture.md` expressly defines a 100 ms debounce and 200 ms remaining budget for request, parse, and render. The current browser source still uses `setTimeout(..., 300)` in `app/client/src/pages/index.astro`, and there is no end-to-end timing evidence or Playwright timing assertion in the repository.  
**Impact:** AC-03 remains unproven; visible result rendering may exceed the business requirement even if request dispatch is within budget.  
**Remediation:** Implement the 100 ms debounce in browser code, measure the full 300 ms from final input to rendered result using the local Astro/Flask test setup, and keep the CI evidence in the downstream workflow. A fake clock alone does not satisfy the AC.

**M-02 � Pagination order and literal text matching are not yet implemented in source.**  
**Evidence:** `app/server/app.py` builds the filtered query and applies `.offset(...).limit(...)` without `order_by`, and the name match still uses `Dog.name.ilike(f"%{name}%")` without escaping SQL wildcard characters. The revised architecture requires ascending `Dog.id` before pagination and literal `%`/`_` matching.  
**Impact:** Filtered pagination can skip or duplicate rows, and literal search input can unexpectedly match wildcard patterns.  
**Remediation:** Add `order_by(Dog.id.asc())` before pagination and escape `%` and `_` before the SQL LIKE test; extend API/UI tests to cover page continuity and literal-match cases.

**M-03 � Accessible catalog-failure handling is specified but not yet in source.**  
**Evidence:** `app/client/src/pages/index.astro` currently does a `Promise.all` and silently leaves an All-only selector when `/api/breeds` fails. The revised architecture requires an accessible error that associates with the unavailable Category control while name search remains functional.  
**Impact:** A broken breed catalog can produce a misleading empty category selection and poor accessibility without a clear recovery path.  
**Remediation:** Render an explicit accessible error message, disable or mark the Category control unavailable, and keep the Pet Name filter usable for name-only results.

**M-04 � Production deployment and runtime controls are still Not Found.**  
**Evidence:** The reviewed repository does not show a production Flask deployment artifact, production `API_SERVER_URL`, health checks, SQLite backup or persistence plan, or a secret-management plan. `app/server/app.py` uses `debug=True` when run directly, and the architecture explicitly notes that production deployment evidence is not present.  
**Impact:** The implementation may work locally but not be operable or safe in production; reliability, security, and observability cannot be validated.  
**Remediation:** Document or provide production service topology, WSGI server config, secret management, health checks, and persistence or backup policy before rollout. Keep this as a release gate, not as an API Design blocker.

### Low

**L-01 � Observability and traceability are defined only at a high level, not via concrete runtime instrumentation.**  
**Evidence:** The architecture notes that metrics, logging, and tracing are Not Found rather than assumed. No application logging, error correlation, or per-request tracing is evidenced for the new search flow.  
**Impact:** Operational diagnosis of search failures will be slow.  
**Remediation:** Add structured logging for request failures and filter metadata and ensure UI and API tests preserve traceability back to AC-01..AC-08 and D-01..D-04.

## Security, scalability, reliability, performance, maintainability, observability, and traceability

- Security: same-origin browser proxy and URL encoding are consistent with the requirements; no custom auth is required by the story. The missing secret-management plan and production deployment evidence are operational security gaps, not a direct vulnerability in the feature itself.
- Scalability: the design remains within the existing Flask + SQLite + Astro stack and does not introduce a new service. Scaling beyond the current dataset is not evidenced and no production load target exists; this is not a blocker for API Design but must be covered later with sizing evidence.
- Reliability: the revised architecture is coherent and specifically addresses the earlier failure modes. Still, the implementation must prove stable behavior under filtered pagination, invalid inputs, and catalog failures. The code currently does not yet match that contract.
- Performance: the proposed 100 ms + 200 ms budget is a good design constraint, but no measured evidence exists yet. The performance target is therefore design-complete but not implementation-proven.
- Maintainability: keeping the filtering logic in Flask and the URL state handling in the browser is acceptable and traceable to the story; the design remains simple and avoids unnecessary new services.
- Observability: the feature has no concrete metrics, logging, or tracing evidence. This is a gap to close in later stages.
- Traceability: requirement-to-architecture mapping is clear, and the user-approved D-01..D-04 decisions are documented. The code and test sources do not yet prove completion, but the design path is understandable and aligned with the business requirements.

## Decision

**Recommendation: Approved With Conditions.**  
**API Design may proceed**, but only with the following conditions:

1. The implementation must match the user-approved D-01..D-04 decisions, including the 100 ms debounce plus 200 ms remainder budget, `Dog.id` ascending order, 100-character cap with literal `%`/`_` handling, and accessible breed-catalog failure semantics.
2. The required timing and failure-path tests must be added and executed in the downstream workflow; source presence is not evidence.
3. Production deployment and secret-management evidence must be provided before launch; this is a release gate, not an API Design blocker.

No Critical or High findings remain in the revised architecture. The residual risks are medium and low and are conditionally acceptable for a downstream API Design stage, but not for production deployment.

## Round 1 (superseded � rejected)

This section preserves the earlier rejected review for audit. It is superseded by Round 2 above and is not the current decision.

- **Executive summary:** The original design reused the existing Astro/Flask implementation but did not satisfy AC-03 because the 300 ms debounce consumed the full result-rendering window. Filtered pagination lacked deterministic ordering, input and failure behavior were underspecified, and production deployment evidence was incomplete.
- **Recommendation at the time:** Rejected. API Design was not allowed to proceed.
- **Key findings:** DR-01 (end-to-end timing gap), DR-02 (no deterministic `Dog.id` ordering), DR-03 (100-char and `%`/`_` semantics not aligned), DR-04 (catalog and search failure behavior incomplete), and DR-05 (production deployment and security posture not evidenced).
- **Status:** Superseded by the user-approved revised architecture and explicit D-01..D-04 decisions recorded in `docs/EPMCDMETST-69346/architecture.md`.