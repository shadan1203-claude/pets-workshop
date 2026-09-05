# Pets Workshop Copilot Instructions

This repository is an existing application called `pets-workshop`. It is a dog-shelter application with a Flask/SQLAlchemy backend under `app/server` and an Astro/Tailwind frontend under `app/client`.

## General Rules

- Preserve existing functionality. Do not rewrite or replace working behavior unnecessarily.
- Preserve the existing architecture unless an approved design decision explicitly requires a change.
- Follow the repository's existing coding conventions, naming, structure, and patterns.
- Prefer small, focused, reviewable changes.
- Do not modify files unrelated to the approved implementation plan.
- Requirements, architecture decisions, design reviews, and implementation plans are authoritative until a human reviewer explicitly changes them.

## Build And Test Rules

- Follow the existing build system and scripts.
- Use the existing backend dependencies in `app/server/requirements.txt` and frontend scripts in `app/client/package.json`.
- Follow the existing Python `unittest` tests and Playwright end-to-end tests. Add tests for new functionality using the applicable existing test framework.
- Preserve the existing Flask, SQLAlchemy, Astro, Tailwind CSS, SQLite, and Playwright architecture unless an approved design decision says otherwise.

## Documentation Rules

- Never invent API behavior, configuration values, architecture details, or documentation facts.
- Validate generated documentation against the current source code, configuration, tests, and scripts.
- If required information cannot be established from the repository or an explicitly approved project artifact, write `Not Found` rather than guessing.
- Keep documentation synchronized with the actual routes, response shapes, commands, dependencies, environment variables, and test behavior.

## Security Rules

- Never expose or reproduce secrets, credentials, tokens, private keys, connection strings, or sensitive environment values.
- Do not include sensitive values in generated documentation, tests, logs, examples, or code changes.
