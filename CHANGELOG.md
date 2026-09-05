# Changelog

## Unreleased

### Added

- Added the approved documentation-sync manifest, reusable skill, and workflow prompt.
- Added unit tests for manifest policy, documentation scope, provenance, `Not Found` handling, source consistency, and common secret patterns.
- Added architecture, design-review, and implementation-plan documentation for Automated Documentation Sync.

### Verification

- Documentation and backend unit tests passed.
- Astro production build passed.
- Playwright integration tests remain blocked by the existing ES module/CommonJS mismatch in `app/client/start-test-server.js`.