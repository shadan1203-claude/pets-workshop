# Per-Agent Workflow Session Manager API Design

## Module and construction

The module exports the `SessionManager` class directly as CommonJS:

```js
const SessionManager = require("./workflow/session-manager");
const sessions = new SessionManager();
```

An optional `sessionsDirectory` constructor argument overrides the default
`workflow/sessions/` location and is intended for isolated tests. Construction
creates missing session files for every supported agent.

## Agents and filenames

| Agent name | Session file |
| --- | --- |
| `orchestrator` | `orchestrator-session.json` |
| `requirements` | `requirements-session.json` |
| `planning` | `planning-session.json` |
| `architecture` | `architecture-session.json` |
| `development` | `development-session.json` |
| `code-review` | `code-review-session.json` |
| `testing` | `testing-session.json` |
| `deployment` | `deployment-session.json` |

Only these exact agent names are accepted.

## Session schema

```json
{
  "sessionId": "generated-unique-id",
  "agent": "requirements",
  "status": "NOT_STARTED",
  "artifacts": [],
  "decisions": [],
  "risks": [],
  "blockers": [],
  "lastUpdated": "ISO-8601 timestamp",
  "dependsOn": []
}
```

The schema's arrays hold JSON-compatible record values. `dependsOn` holds
supported agent names other than the session's own agent. `status` accepts any
non-empty string; only the initial status is fixed by this contract.

## Methods

All methods are synchronous. Methods that return session data return a
defensive copy.

| Method | Behavior |
| --- | --- |
| `createSession(agentName)` | Ensure the agent file exists and return its current session. Existing state is preserved; calling this method is idempotent, not a reset. |
| `loadSession(agentName)` | Read and validate that agent's file; initialize it only if missing. |
| `saveSession(agentName, data)` | Validate and persist a complete session record whose `agent` and `sessionId` match the existing session; updates `lastUpdated`. |
| `updateStatus(agentName, status)` | Set a non-empty status and persist the record. |
| `addArtifact(agentName, artifact)` | Append a JSON-compatible artifact value. |
| `addDecision(agentName, decision)` | Append a JSON-compatible decision value. |
| `addRisk(agentName, risk)` | Append a JSON-compatible risk value. |
| `addBlocker(agentName, blocker)` | Append a JSON-compatible blocker value. |
| `resumeSession(agentName)` | Load and return the persisted session without changing its status. |
| `listSessions()` | Return the eight validated sessions in the fixed agent order. |

Mutations read the latest disk version before changing it, but this does not
provide multi-process locking.

## Errors

Unsupported agents, invalid values, malformed JSON, and filesystem failures
throw errors. Read/write failures are logged with operation context; malformed
data is never silently replaced. No HTTP error contract applies to this local
module.
