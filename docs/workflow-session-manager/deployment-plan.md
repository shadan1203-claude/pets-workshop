# Per-Agent Workflow Session Manager Deployment Plan

## Status

**No deployment was performed or requested.** This is local CommonJS workflow
tooling with no application endpoint, database migration, new dependency, or
external service.

## Adoption

Consumers require `workflow/session-manager.js` and instantiate
`SessionManager`. By default, construction creates `workflow/sessions/` beside
the module and initializes the eight agent session files. A caller may provide
a different directory for isolated testing. Session files are plain JSON and
inherit local filesystem permissions; do not store credentials or secrets.
The implementation does not coordinate concurrent processes.

## Rollback

Stop consumers from using the new per-agent API and retain or archive
`workflow/sessions/` according to the repository owner's policy. The replaced
workflow-level API is not retained at `workflow/session-manager.js`, and no
automatic state migration is provided. `workflow/workflow-state.json` was not
modified by this work.

The repository does not establish a production target or operational owner;
external deployment instructions and rollback policy are **Not Found** and
not applicable to this local module change.
