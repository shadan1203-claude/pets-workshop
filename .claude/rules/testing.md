# Testing Rules

- Use the repository's configured Python `unittest` and Playwright projects; inspect package scripts and configuration before selecting commands.
- Map every Jira acceptance criterion to one or more test cases and report the mapping in Jira-scoped test artifacts.
- Report exact commands and observed results. `NOT RUN`, skipped, blocked, or missing evidence is never `PASS`.
- Route failures back to development and repeat code review and testing after fixes; do not waive failures without explicit human approval.
- Do not add test dependencies or infer unsupported behavior without an approved plan.