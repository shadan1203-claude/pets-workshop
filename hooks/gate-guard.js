"use strict";

// PreToolUse gate for Write/Edit/MultiEdit. Denies misplaced SDLC documents and asks the human
// before source or test edits when the workflow state is not in an implementing stage.

const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(process.env.CLAUDE_PROJECT_DIR || process.cwd());
const statePath = path.join(root, "workflow", "workflow-state.json");
const SOURCE_STAGES = new Set(["development"]);
const TEST_STAGES = new Set(["testing-design", "development", "testing"]);
const GENERATED = /(^|\/)(node_modules|dist|\.astro|test-results|playwright-report|__pycache__)\//;
const TEST_FILE = /(^|\/)(e2e-tests\/|test_[^/]*\.py$|[^/]*\.(spec|test)\.[cm]?[jt]sx?$)/;

function respond(decision, reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: decision,
        permissionDecisionReason: reason,
      },
    })
  );
  process.exit(0);
}

function readState() {
  try {
    const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
    return state && typeof state === "object" && !Array.isArray(state) ? state : null;
  } catch {
    return null;
  }
}

function targetPath() {
  try {
    const input = JSON.parse(fs.readFileSync(0, "utf8"));
    const file = input && input.tool_input && input.tool_input.file_path;
    return typeof file === "string" && file ? file : null;
  } catch {
    return null;
  }
}

const file = targetPath();
if (!file) process.exit(0);

const rel = path.relative(root, path.resolve(root, file)).split(path.sep).join("/");
if (rel.startsWith("..") || path.isAbsolute(rel) || GENERATED.test(rel)) process.exit(0);

if (/^docs\/[^/]+\.md$/i.test(rel)) {
  respond("deny", `SDLC documents must live under docs/<JIRA_ID>/ (resolve with workflow/artifact-paths.js): ${rel}`);
}

const state = readState();
const stage = String(state && state.currentStage || "").toLowerCase();
const status = String(state && state.status || "").toUpperCase();
const jira = state && state.workflowId;

const docMatch = /^docs\/([^/]+)\/.+\.md$/i.exec(rel);
if (docMatch && jira && docMatch[1] !== jira) {
  respond("deny", `docs/${docMatch[1]} is not the active Jira issue (${jira}); do not modify another issue's artifacts.`);
}

const isTest = TEST_FILE.test(rel) || /^tests\/[A-Za-z][A-Za-z0-9_]*-\d+\//.test(rel);
const isSource = /^app\//.test(rel);
if (!isSource && !isTest) process.exit(0);

const allowed = isTest ? TEST_STAGES : SOURCE_STAGES;
if (!state) {
  respond("ask", "Workflow state is missing or invalid; confirm this edit is intended before the SDLC gate can be verified.");
}
if (!allowed.has(stage) || status !== "IN_PROGRESS") {
  respond(
    "ask",
    `Workflow is at stage "${stage || "unknown"}" with status ${status || "unknown"}; ${isTest ? "test" : "source"} edits are expected only in ${[...allowed].join("/")} with status IN_PROGRESS after the required approvals.`
  );
}
process.exit(0);
