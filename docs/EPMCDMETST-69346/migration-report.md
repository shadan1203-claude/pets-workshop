# Jira-Scoped SDLC Artifact Path Migration

## Result

SDLC artifact generation and references now resolve to
`docs/<JIRA_ID>/<artifact>.md`. The shared resolver validates Jira keys,
resolves an explicit key/environment/branch/unique workflow-state folder,
creates the Jira artifact directory and workflow state, maps legacy artifact
names to canonical filenames, and validates stage prerequisites. The session
manager migrates legacy root-relative and absolute `docs/` artifact records
into the active Jira folder and rejects records that point to another Jira.
The pre-development hook now uses this resolver rather than selecting the
first workflow-state file under `docs/`.

Canonical outputs:

| Phase | Artifact |
| --- | --- |
| Intake | `intake-summary.md` |
| Requirements | `requirements.md` |
| Architecture | `architecture.md` |
| Design Review | `design-review.md` |
| API Design | `api-design.md` |
| Planning | `implementation-plan.md` |
| Development | `development-report.md` |
| Code Review | `code-review.md` |
| Testing | `testing.md` |
| Deployment | `deployment.md` |
| PR Generation | `pr-description.md` |

Compatibility aliases map `review-report.md` to `code-review.md`,
`test-report.md` to `testing.md`, and `deployment-plan.md` to `deployment.md`.

## Files changed

- `.github/agents/developer.md`
- `.github/agents/design-review.md`
- `.github/agents/intake.md`
- `.github/agents/orchestrator.agent.md`
- `copilot-instructions.md`
- `hooks/pre-development.sh`
- `instructions/architecture-instructions.md`
- `instructions/code-review-instructions.md`
- `instructions/deployment-instructions.md`
- `instructions/design-review-instructions.md`
- `instructions/developer-instructions.md`
- `instructions/intake-instructions.md`
- `instructions/orchestrator-instructions.md`
- `instructions/planning-instructions.md`
- `instructions/requirements-instructions.md`
- `instructions/testing-instructions.md`
- `skills/PR-generation/SKILL.md`
- `skills/architecture/SKILL.md`
- `skills/code-review/SKILL.md`
- `skills/design-review/SKILL.md`
- `skills/implementation/SKILL.md`
- `skills/requirement-analysis/SKILL.md`
- `skills/testing/SKILL.md`
- `workflow/artifact-paths.js` (new)
- `workflow/package.json` (new)
- `workflow/session-manager.js`
- `workflow/session-manager.test.js`
- `workflow/README.md`
- `workflow/orchestration-example.md`
- `docs/EPMCDMETST-69346/implementation-plan.md`
- `docs/EPMCDMETST-69346/workflow-state.json`
- `docs/EPMCDMETST-69346/migration-report.md` (new)

`prompts/` and the existing hook scripts other than `pre-development.sh` had
no hardcoded SDLC artifact paths requiring updates. Existing `docs/**`
exclusions in source-scanning requirements were retained; they are not artifact
destinations.

## Old paths found and replacements

- Root artifact patterns such as `docs/requirements.md`,
  `docs/architecture.md`, `docs/design-review.md`, `docs/api-design.md`,
  `docs/implementation-plan.md`, `docs/test-report.md`,
  `docs/review-report.md`, and `docs/deployment-plan.md` were replaced in
  active workflow instructions, skills, agent definitions, and examples with
  Jira-scoped paths.
- Malformed `docs//...` references and an embedded fixed Jira folder in the
  orchestrator agent were replaced with resolution through
  `workflow/artifact-paths.js`.
- The shared resolver maps the former root-relative artifact path pattern to
  `docs/<JIRA_ID>/<artifact>.md`; the session manager normalizes records both
  when added and when legacy sessions are loaded.
- Current Jira artifacts remain in `docs/EPMCDMETST-69346/`; no unrelated root
  artifacts were moved or duplicated.

## Remaining legacy references

- `docs/requirements.md`, `docs/architecture.md`, and `docs/design-review.md`
  are existing root-level legacy artifacts describing a different,
  breed-only scope. The Jira-scoped requirements explicitly distinguish them
  as stale and non-authoritative. No reliable Jira key for those files was
  established, so they were not moved or assigned to this story.
- The legacy root documents and `docs/EPMCDMETST-69346/` scope notes still
  mention those root files to explain the scope boundary. The root architecture
  and requirements also contain an old note referring to a missing root
  `intake-summary.md`.
- Role instructions still link to `../../docs/secret-management-plan.md` as a
  generic policy reference. That file does not exist in this checkout and is
  not an SDLC artifact, so it was not assigned a Jira folder as part of this
  migration.
- `docs/workflow-session-manager/implementation-plan.md` and
  `docs/workflow-session-manager/pr-description.md` retain local references to
  `review-report.md`, `test-report.md`, and `deployment-plan.md`. That
  historical document folder has no confirmed Jira key and was not moved.
- `workflow/session-manager.test.js` intentionally contains old and malformed
  path examples as migration test inputs. The compatibility aliases in
  `workflow/artifact-paths.js` intentionally retain the legacy filenames.

## Requested locations not present

- `.github/copilot-instructions.md` (the repository guidance file is
  `copilot-instructions.md` at the root)
- `.codemie/` (not present in the working tree)
- `scripts/`
- `templates/`
- `mcp/`
- root `workflow-session-manager/` (only
  `docs/workflow-session-manager/` is present)

## Validation

- `node --test workflow/session-manager.test.js workflow/prompt-cache.test.js`:
  passed; both test files succeeded, including Jira resolution, path
  normalization, legacy-session migration, ambiguity handling, and stage
  prerequisite checks.
- `node --check workflow/artifact-paths.js` and
  `node --check workflow/session-manager.js`: passed.
- `git diff --check`: passed.
- Resolver `resolve` and `path` commands: resolved to
  `EPMCDMETST-69346` and `docs/EPMCDMETST-69346/`.
- `node workflow/artifact-paths.js validate-stage development`: correctly
  reports the missing Jira-scoped intake summary.
- `bash hooks/pre-development.sh`: correctly fails on the same missing
  `docs/EPMCDMETST-69346/intake-summary.md`; the previous root-path mismatch is
  resolved. Development remains blocked until intake is recorded.
