# Coding Standards

## Naming and Layout

- Follow the naming, formatting, and module organization already used in the touched language and neighboring files.
- Keep backend changes under `app/server` and frontend changes under `app/client` unless an approved plan identifies another owner.
- Use descriptive names, narrow functions, and explicit types where the existing language conventions support them. Do not reformat unrelated files.

## Behavior and Error Handling

- Implement only approved requirements, acceptance criteria, and tasks.
- Validate inputs, preserve API and data contracts, and handle errors at the owning boundary using established repository patterns.
- Do not hide failures, weaken assertions, or silently change behavior to satisfy a test.

## Logging and Sensitive Data

- Follow existing logging facilities and levels; the repository-wide logging library/convention is `Not Found` until verified in source.
- Do not log credentials, tokens, private data, or sensitive environment values. Prefer stable identifiers and actionable, redacted error context.

## Dependencies and Configuration

- Do not add a dependency or alter the technology stack without an approved plan/architecture decision.
- Backend dependencies are declared in `app/server/requirements.txt`; frontend dependencies/scripts are declared in `app/client/package.json`.
- Never put secrets in source, memory, tests, reports, or committed configuration. Use the approved secret store/environment mechanism.

## Example

Before adding an HTTP client dependency, inspect existing backend dependencies and patterns, map the change to an approved requirement, and obtain approval if it changes the approved architecture. The example is guidance, not authorization.