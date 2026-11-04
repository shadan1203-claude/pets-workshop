# Per-Agent Workflow Session Manager Requirements

## Goal

Persist independent state for each PetWorkshop workflow agent in local JSON
files under `workflow/sessions/`.

## Functional requirements

- Support exactly these agents: `orchestrator`, `requirements`, `planning`,
  `architecture`, `development`, `code-review`, `testing`, and `deployment`.
- Store one file per supported agent using the `<agent>-session.json` naming
  convention; create any missing session files automatically.
- Use this schema for every session:

  ```json
  {
    "sessionId": "",
    "agent": "",
    "status": "NOT_STARTED",
    "artifacts": [],
    "decisions": [],
    "risks": [],
    "blockers": [],
    "lastUpdated": "",
    "dependsOn": []
  }
  ```

- Export a CommonJS `SessionManager` with `createSession(agentName)`,
  `loadSession(agentName)`, `saveSession(agentName, data)`,
  `updateStatus(agentName, status)`, `addArtifact(agentName, artifact)`,
  `addDecision(agentName, decision)`, `addRisk(agentName, risk)`,
  `addBlocker(agentName, blocker)`, `resumeSession(agentName)`, and
  `listSessions()`.
- Preserve an existing session when `createSession` is called; creation is
  idempotent and must not silently discard recorded work.
- Validate agent names, session shape, and JSON-compatible record values.
- Refresh `lastUpdated` on every persisted mutation and return defensive copies
  of session data.
- Reject malformed existing JSON and surface filesystem failures rather than
  replacing corrupt state with defaults.

## Non-functional requirements

- Use the Node.js built-in `fs` module and no new runtime dependency.
- Remain compatible with the repository's CommonJS and Node.js `>=16` settings.
- Use atomic file replacement for session writes to avoid exposing partially
  written JSON.
- Include JSDoc for the public class and methods and actionable error messages.
- Keep the manager synchronous and local; no HTTP endpoint, database, agent
  dispatch, or approval enforcement is in scope.

## Risks and constraints

| Risk | Mitigation |
| --- | --- |
| A caller could provide an unsafe agent name and escape the session directory. | Restrict names to the fixed supported-agent list before building paths. |
| A write interrupted mid-operation could corrupt a session. | Write a same-directory temporary file, then rename it into place. |
| Multiple processes can update the same JSON file concurrently and lose changes. | State the single-process/local coordination boundary; multi-process locking is out of scope. |
| State may contain sensitive details in caller-supplied records. | Do not put credentials or secrets in session content; the manager does not encrypt data. |
| Replacing the prior workflow-level API can break its previous callers. | Update the in-repository test and workflow documentation to the approved per-agent contract. |

## Acceptance criteria

- Construction creates the `workflow/sessions/` directory and all eight missing
  agent session files with the required schema.
- Each supported agent maps to its specified file and cannot access another
  agent's file by path manipulation.
- Create, load, save, status update, artifact, decision, risk, blocker, resume,
  and list operations persist correctly and retain the correct agent identity.
- Existing state is preserved by session creation and is not overwritten when
  malformed JSON is encountered.
- Invalid agents, invalid schema, and non-JSON record values fail explicitly;
  failed writes do not report success.
- Returned records cannot mutate manager state without a subsequent save.
- Focused Node.js tests and syntax checks pass.
