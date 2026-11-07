#!/usr/bin/env node
"use strict";

/*
 * Artifact path resolver for Jira-scoped SDLC artifacts.
 *
 * Usage:
 *   node workflow/artifact-paths.js ensure --jira-id <KEY>
 *   node workflow/artifact-paths.js path   --jira-id <KEY> --artifact <name>
 *
 * `path` prints exactly one repository-relative POSIX path on stdout.
 * Errors go to stderr with a non-zero exit code. The resolver never builds
 * paths outside docs/<KEY>/ (SDLC documents) or tests/<KEY>/ (test assets).
 */

const fs = require("node:fs");
const path = require("node:path");

const REPO_ROOT = path.resolve(__dirname, "..");
const JIRA_ID_PATTERN = /^[A-Za-z0-9-]{1,64}$/;

// Artifact key -> { area, filename }. Filenames follow .claude/CLAUDE.md and
// the hook expectations in hooks/pre-phase.sh.
const ARTIFACTS = {
  "intake-summary": { area: "docs", filename: "intake-summary.md" },
  requirements: { area: "docs", filename: "requirements.md" },
  architecture: { area: "docs", filename: "architecture.md" },
  "design-review": { area: "docs", filename: "design-review.md" },
  "api-design": { area: "docs", filename: "api-design.md" },
  "implementation-plan": { area: "docs", filename: "implementation-plan.md" },
  "test-cases": { area: "docs", filename: "test-cases.md" },
  "development-report": { area: "docs", filename: "development-report.md" },
  "code-review": { area: "docs", filename: "code-review.md" },
  testing: { area: "docs", filename: "testing.md" },
  "pr-description": { area: "docs", filename: "pr-description.md" },
  deployment: { area: "docs", filename: "deployment.md" },
  "deployment-validation": { area: "docs", filename: "deployment-validation.md" },
  "tasks-test": { area: "tests", filename: "tasks.test.js" },
};

function fail(message) {
  process.stderr.write(`artifact-paths: ${message}\n`);
  process.exit(1);
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const options = {};
  for (let i = 0; i < rest.length; i += 2) {
    const flag = rest[i];
    const value = rest[i + 1];
    if (!flag || !flag.startsWith("--") || value === undefined || value.startsWith("--")) {
      fail(`malformed argument near '${flag ?? ""}'`);
    }
    options[flag.slice(2)] = value;
  }
  return { command, options };
}

function requireJiraId(options) {
  const jiraId = options["jira-id"];
  if (!jiraId || !JIRA_ID_PATTERN.test(jiraId)) {
    fail(`--jira-id is required and must match ${JIRA_ID_PATTERN}`);
  }
  return jiraId;
}

function ensureDirectory(relativeDir) {
  const absolute = path.join(REPO_ROOT, relativeDir);
  const stat = fs.existsSync(absolute) ? fs.lstatSync(absolute) : null;
  if (stat && (stat.isSymbolicLink() || !stat.isDirectory())) {
    fail(`refusing to use non-directory or symbolic link: ${relativeDir}`);
  }
  fs.mkdirSync(absolute, { recursive: true });
}

function cmdEnsure(options) {
  const jiraId = requireJiraId(options);
  ensureDirectory(path.posix.join("docs", jiraId));
  process.stdout.write(`${path.posix.join("docs", jiraId)}\n`);
}

function cmdPath(options) {
  const jiraId = requireJiraId(options);
  const key = options.artifact;
  const entry = key && Object.prototype.hasOwnProperty.call(ARTIFACTS, key) ? ARTIFACTS[key] : null;
  if (!entry) {
    fail(`unknown artifact '${key ?? ""}'. Known: ${Object.keys(ARTIFACTS).join(", ")}`);
  }
  const relative = path.posix.join(entry.area, jiraId, entry.filename);
  // Defense in depth: the joined path must stay inside the expected area.
  const resolved = path.resolve(REPO_ROOT, relative);
  const areaRoot = path.resolve(REPO_ROOT, entry.area, jiraId);
  if (!resolved.startsWith(areaRoot + path.sep)) {
    fail(`resolved path escapes its Jira-scoped directory: ${relative}`);
  }
  process.stdout.write(`${relative}\n`);
}

function main() {
  const { command, options } = parseArgs(process.argv.slice(2));
  switch (command) {
    case "ensure":
      return cmdEnsure(options);
    case "path":
      return cmdPath(options);
    default:
      return fail("usage: artifact-paths.js <ensure|path> --jira-id <KEY> [--artifact <name>]");
  }
}

main();
