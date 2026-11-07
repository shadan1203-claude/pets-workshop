# Repository Context

## Project Overview

The repository contains the `pets-workshop` dog-shelter management application and SDLC workflow support. Keep application changes within the approved Jira scope and existing architecture.

## Backend

- Location: `app/server`
- Framework/data layer: Flask and SQLAlchemy
- Database: SQLite
- Test framework: Python `unittest`
- Verified backend test command, run from `app/server`: `python -m unittest -v test_app.py`

## Frontend

- Location: `app/client`
- Framework/styling: Astro and Tailwind CSS
- End-to-end framework: Playwright
- Verified build command, run from `app/client`: `npm run build`
- Verified Playwright command, run from `app/client`: `npm run test:e2e -- --project=chromium`
- `npm test` in `app/client` delegates to the Playwright E2E suite; inspect `package.json` before relying on it.

## Workflow and Documentation

- Project instructions: `.claude/CLAUDE.md`
- Claude Code agents, commands, skills, rules, hooks, and memory: `.claude/`
- SDLC artifacts: `docs/<JIRA_ID>/`, resolved through `workflow/artifact-paths.js` as required by project instructions.
- Persisted orchestration state: `workflow/workflow-state.json`. It is the workflow execution source of truth and currently has a single-workflow schema; preserve its history and do not replace another active issue's state.
- The repository instructions document `workflow/artifact-paths.js`; verify the file exists and works before routing artifact writes. If it is unavailable, stop and record a blocker.

## CI/CD and Infrastructure

- Repository hook scripts are under `hooks/`.
- No `.github/workflows/` files were found in the inspected checkout.
- Deployment documentation conflicts: `docs/deployment-target.md` names Azure App Service and a GitHub Actions pipeline and marks the target approved; `docs/release-governance.md` identifies local/manual development deployment, says production is `Not Found`, and says no automated pipeline or infrastructure definition is present.
- Treat the deployment target and automation status as unresolved until source/configuration and the active Jira-scoped approved release artifacts establish them. Never infer a production target or command from this summary.

## Illustrative Command Sequence

These commands reflect the verified package scripts and documented backend test:

```powershell
Push-Location app/server
python -m unittest -v test_app.py
Pop-Location

Push-Location app/client
npm run build
npm run test:e2e -- --project=chromium
Pop-Location
```

The sequence is an example, not a result. Report actual execution outcomes in the Jira-scoped testing artifact. Update this context when verified architecture, package scripts, test frameworks, or repository paths change.