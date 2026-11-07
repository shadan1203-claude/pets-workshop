# Workflow Persistence for PetWorkshop

## Purpose

`SessionManager` and `PromptCache` provide lightweight local persistence for the
PetWorkshop multi-agent workflow. The orchestrator coordinates specialist
agents through the SDLC; these helpers preserve workflow records and reusable
prompt responses between steps or runs.

## Workflow lifecycle

The orchestrator is sequential by default: intake, requirements, planning,
architecture and design review, development, code review, testing, and
deployment. Each stage produces artifacts and evidence for human review before
the next stage proceeds. Deployment to a shared or production environment
requires explicit approval.

## Workflow state management

`SessionManager` stores one JSON session for each supported workflow agent in
`workflow/sessions/`. Construction creates any missing files using the
`<agent>-session.json` naming convention. Sessions track their ID, agent,
status, artifacts, decisions, risks, blockers, last-updated timestamp, and
dependencies. Mutations are validated and saved atomically; returned state is
a defensive copy. Calling `createSession(agentName)` preserves existing state.

The manager records state only. It does not dispatch agents, enforce stage
order, or grant approvals. Session files are local plain JSON; do not store
credentials or secrets in them. Multi-process coordination is not provided.

## Approval gates

The orchestration guidance requires human approval at intake, requirements,
planning, architecture, implementation readiness, final code review, release
readiness, deployment, and post-deployment closure. `SessionManager` records
agent status and decision records; it does **not** validate approvals, decide
whether a gate is satisfied, or block a stage. The orchestrator remains
responsible for requesting approval and respecting the human's decision.

## Prompt caching

`PromptCache` stores prompt/response pairs in `prompt-cache.json`, indexed by
the prompt's SHA-256 hash and timestamped when saved. Callers can retrieve,
check, replace, remove, or clear entries. A cache hit can avoid repeating work
for an identical prompt; callers decide when to use cached output. Prompts and
responses are stored as plain text, so do not cache secrets or sensitive data.

## Benefits

- Preserves workflow context, evidence references, and human decisions across
  process restarts.
- Makes agent status, decisions, risks, and blockers inspectable.
- Reuses exact prompt results and reduces repeated agent work where appropriate.
- Uses simple local JSON files without introducing a database dependency.

## Example workflow

```js
const SessionManager = require("./session-manager");
const PromptCache = require("./prompt-cache");

const sessions = new SessionManager();
sessions.createSession("requirements");
sessions.updateStatus("requirements", "IN_PROGRESS");

// After the artifact is produced, record its reference and review outcome.
sessions.addArtifact("requirements", {
  name: "requirements",
  path: "docs/requirements.md",
});
sessions.addDecision("orchestrator", {
  agent: "requirements",
  outcome: "approved by human reviewer",
});
sessions.updateStatus("requirements", "COMPLETED");

const cache = new PromptCache();
const prompt = "Summarize the approved requirements for PET-123.";

async function getOrGenerateResponse() {
  let response = cache.get(prompt);

  if (response === null) {
    response = await runRequirementsSummaryAgent(prompt);
    cache.set(prompt, response);
  }

  return response;
}
```

The example illustrates helper usage; the caller must provide and invoke the
agent operation and request approvals. The manager does not dispatch agents or
enforce the workflow lifecycle.

For a capstone-oriented, step-by-step orchestration example with diagrams, see
[`orchestration-example.md`](./orchestration-example.md).
