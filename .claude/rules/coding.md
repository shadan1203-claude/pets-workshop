---
paths:
  - "app/**"
  - "hooks/**"
  - "mcp/**"
  - "workflow/**"
---

# Coding and Code Review Rules

## Development

- Implement only approved requirements, acceptance criteria, tasks, and test cases. Make the smallest change that satisfies them; avoid unrelated refactors.
- Keep backend (Flask, SQLAlchemy) changes under `app/server` and frontend (Astro, Tailwind) under `app/client` unless an approved plan assigns another owner. Follow the naming, formatting, and structure of neighboring files.
- Preserve API and data contracts. Validate input at the owning boundary and handle errors with the repository's established patterns. Do not hide failures or silently change behavior.
- Do not add dependencies or change the stack without an approved architecture decision. Backend dependencies live in `app/server/requirements.txt`; frontend dependencies and scripts in `app/client/package.json`.
- Use existing logging facilities; do not log credentials, tokens, or personal data.
- If an input is incomplete, contradictory, or a test case cannot be implemented as written, record a clarification request in `development-report.md` and stop before coding.
- Before coding run `hooks/pre-development.sh`; after coding run `hooks/post-codegen.sh`. Report failures; never waive them silently.

## Code Review

- Review independently of the implementer. Examine the diff, tests, and requirement/AC traceability against approved artifacts and repository evidence.
- Assess correctness, security (input validation, authorization, secrets, error handling), maintainability, performance, test adequacy, and unrequested changes.
- Rate findings Critical, High, Medium, or Low with file/line evidence and a recommended resolution. Critical and High findings must be resolved and re-reviewed before Testing Execution. The reviewer never edits source in the same pass.
