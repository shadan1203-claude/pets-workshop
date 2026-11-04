"use strict";

const childProcess = require("child_process");
const fs = require("fs");
const path = require("path");

const JIRA_ID_PATTERN = /^[A-Z][A-Z0-9]+-[0-9]+$/;
const DEFAULT_REPOSITORY_ROOT = path.resolve(__dirname, "..");

const ARTIFACT_FILES = Object.freeze({
  intake: "intake-summary.md",
  requirements: "requirements.md",
  architecture: "architecture.md",
  "design-review": "design-review.md",
  "api-design": "api-design.md",
  planning: "implementation-plan.md",
  development: "development-report.md",
  "code-review": "code-review.md",
  testing: "testing.md",
  deployment: "deployment.md",
  "release-governance": "release-governance.md",
  "pr-description": "pr-description.md",
});

const ARTIFACT_ALIASES = Object.freeze({
  "review-report.md": "code-review.md",
  "test-report.md": "testing.md",
  "deployment-plan.md": "deployment.md",
});

const STAGE_PREREQUISITES = Object.freeze({
  intake: [],
  requirements: ["intake-summary.md"],
  architecture: ["intake-summary.md", "requirements.md"],
  "design-review": ["requirements.md", "architecture.md"],
  "api-design": ["requirements.md", "architecture.md", "design-review.md"],
  planning: [
    "requirements.md",
    "architecture.md",
    "design-review.md",
    "api-design.md",
  ],
  development: [
    "intake-summary.md",
    "requirements.md",
    "architecture.md",
    "design-review.md",
    "api-design.md",
    "implementation-plan.md",
  ],
  "pre-development": [
    "intake-summary.md",
    "requirements.md",
    "architecture.md",
    "design-review.md",
    "api-design.md",
    "implementation-plan.md",
  ],
  "code-review": [
    "requirements.md",
    "architecture.md",
    "design-review.md",
    "api-design.md",
    "implementation-plan.md",
    "development-report.md",
  ],
  testing: [
    "requirements.md",
    "architecture.md",
    "api-design.md",
    "implementation-plan.md",
    "development-report.md",
    "code-review.md",
  ],
  deployment: [
    "requirements.md",
    "architecture.md",
    "design-review.md",
    "implementation-plan.md",
    "development-report.md",
    "code-review.md",
    "testing.md",
  ],
});

function validateJiraId(jiraId) {
  if (typeof jiraId !== "string" || !JIRA_ID_PATTERN.test(jiraId)) {
    throw new TypeError(
      'A valid Jira key is required (for example, "EPMCDMETST-69346").'
    );
  }
  return jiraId;
}

function getBranchJiraId(repositoryRoot) {
  try {
    const branch = childProcess.execFileSync(
      "git",
      ["branch", "--show-current"],
      { cwd: repositoryRoot, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }
    ).trim();
    const matches = [...branch.matchAll(/[A-Z][A-Z0-9]+-[0-9]+/g)].map(
      (match) => match[0]
    );
    const uniqueMatches = [...new Set(matches)];
    if (uniqueMatches.length > 1) {
      throw new Error(`Branch contains multiple Jira keys: ${uniqueMatches.join(", ")}`);
    }
    return uniqueMatches[0] || null;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Branch contains")) {
      throw error;
    }
    return null;
  }
}

function getStateJiraIds(repositoryRoot) {
  const docsDirectory = path.join(repositoryRoot, "docs");
  if (!fs.existsSync(docsDirectory)) {
    return [];
  }

  const jiraIds = [];
  for (const entry of fs.readdirSync(docsDirectory, { withFileTypes: true })) {
    if (!entry.isDirectory() || !JIRA_ID_PATTERN.test(entry.name)) {
      continue;
    }

    const statePath = path.join(docsDirectory, entry.name, "workflow-state.json");
    if (!fs.existsSync(statePath)) {
      continue;
    }

    let state;
    try {
      state = JSON.parse(fs.readFileSync(statePath, "utf8"));
    } catch (error) {
      throw new Error(`Unable to parse workflow state "${statePath}": ${error.message}`);
    }

    const stateJiraId =
      state.jira_key || state.jiraKey || state.jira_id || state.jiraId;
    if (stateJiraId && validateJiraId(stateJiraId) !== entry.name) {
      throw new Error(
        `Workflow state "${statePath}" does not match its Jira folder "${entry.name}".`
      );
    }
    jiraIds.push(entry.name);
  }
  return jiraIds;
}

function resolveJiraId(options = {}) {
  const repositoryRoot = path.resolve(
    options.repositoryRoot || DEFAULT_REPOSITORY_ROOT
  );
  const environment = options.environment || process.env;
  const explicitJiraId =
    options.jiraId ||
    environment.JIRA_ID ||
    environment.JIRA_KEY ||
    environment.ISSUE_KEY;
  if (explicitJiraId) {
    return validateJiraId(explicitJiraId);
  }

  const branchJiraId =
    options.branchJiraId === undefined
      ? getBranchJiraId(repositoryRoot)
      : options.branchJiraId;
  if (branchJiraId) {
    return validateJiraId(branchJiraId);
  }

  const stateJiraIds = getStateJiraIds(repositoryRoot);
  if (stateJiraIds.length === 1) {
    return stateJiraIds[0];
  }
  if (stateJiraIds.length > 1) {
    throw new Error(
      `Multiple Jira workflow folders found (${stateJiraIds.join(", ")}); set JIRA_ID or pass --jira-id.`
    );
  }
  if (options.allowNone) {
    return null;
  }

  throw new Error(
    "Unable to resolve Jira key. Set JIRA_ID, use a Jira-key branch, or pass --jira-id."
  );
}

function ensureArtifactDirectory(repositoryRoot, jiraId) {
  const root = path.resolve(repositoryRoot || DEFAULT_REPOSITORY_ROOT);
  const key = validateJiraId(jiraId);
  const artifactDirectory = path.join(root, "docs", key);
  fs.mkdirSync(artifactDirectory, { recursive: true });

  const statePath = path.join(artifactDirectory, "workflow-state.json");
  if (!fs.existsSync(statePath)) {
    const initialState = {
      jira_key: key,
      current_stage: "intake",
      status: "IN_PROGRESS",
      artifacts: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    fs.writeFileSync(statePath, `${JSON.stringify(initialState, null, 2)}\n`, {
      encoding: "utf8",
      flag: "wx",
    });
  } else {
    let state;
    try {
      state = JSON.parse(fs.readFileSync(statePath, "utf8"));
    } catch (error) {
      throw new Error(`Unable to parse workflow state "${statePath}": ${error.message}`);
    }
    const recordedJiraId =
      state.jira_key || state.jiraKey || state.jira_id || state.jiraId;
    if (recordedJiraId && validateJiraId(recordedJiraId) !== key) {
      throw new Error(`Workflow state Jira key does not match "${key}".`);
    }
  }
  return artifactDirectory;
}

function normalizeArtifactFilename(filename) {
  if (typeof filename !== "string" || filename.trim() === "") {
    throw new TypeError("Artifact filename must be a non-empty string.");
  }
  const normalized = filename.replace(/\\/g, "/");
  if (normalized.includes("/") || normalized === "." || normalized === "..") {
    throw new TypeError("Artifact filename must be a filename, not a path.");
  }
  return ARTIFACT_ALIASES[normalized] || normalized;
}

function getArtifactRelativePath(jiraId, filename) {
  const key = validateJiraId(jiraId);
  const safeFilename = normalizeArtifactFilename(filename);
  return `docs/${key}/${safeFilename}`;
}

function getArtifactPath(repositoryRoot, jiraId, filename) {
  return path.join(
    path.resolve(repositoryRoot || DEFAULT_REPOSITORY_ROOT),
    getArtifactRelativePath(jiraId, filename)
  );
}

function normalizeArtifactReference(reference, jiraId) {
  if (typeof reference !== "string" || reference.trim() === "") {
    throw new TypeError("Artifact path must be a non-empty string.");
  }
  const key = validateJiraId(jiraId);
  const normalized = reference
    .replace(/\\/g, "/")
    .replace(/^\.\/+/, "")
    .replace(/\/+/g, "/");
  const docsPrefix = "docs/";
  if (!normalized.startsWith(docsPrefix)) {
    return reference;
  }

  const parts = normalized.slice(docsPrefix.length).split("/");
  if (parts.length === 1) {
    return getArtifactRelativePath(key, parts[0]);
  }
  if (parts[0] !== key) {
    throw new Error(
      `Artifact path "${reference}" is outside the active Jira folder "docs/${key}/".`
    );
  }
  if (parts.length !== 2) {
    throw new Error(`Artifact path "${reference}" must be directly inside docs/${key}/.`);
  }
  return getArtifactRelativePath(key, parts[1]);
}

function validateStage(repositoryRoot, jiraId, stage) {
  const key = validateJiraId(jiraId);
  const requiredFiles = STAGE_PREREQUISITES[stage];
  if (!requiredFiles) {
    throw new Error(
      `Unknown SDLC stage "${stage}". Valid stages: ${Object.keys(STAGE_PREREQUISITES).join(", ")}.`
    );
  }
  const artifactDirectory = ensureArtifactDirectory(repositoryRoot, key);
  const missingFiles = requiredFiles.filter(
    (filename) => !fs.existsSync(path.join(artifactDirectory, filename))
  );
  if (missingFiles.length > 0) {
    throw new Error(
      `Missing ${stage} prerequisites in docs/${key}/: ${missingFiles.join(", ")}`
    );
  }
  return artifactDirectory;
}

function parseArguments(argv) {
  const [command, ...args] = argv;
  const options = {};
  const positional = [];
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === "--jira-id") {
      options.jiraId = args[index + 1];
      index += 1;
    } else if (args[index] === "--root") {
      options.repositoryRoot = args[index + 1];
      index += 1;
    } else {
      positional.push(args[index]);
    }
  }
  return { command, options, positional };
}

function runCli(argv = process.argv.slice(2)) {
  const { command, options, positional } = parseArguments(argv);
  const jiraId = resolveJiraId(options);

  if (command === "resolve") {
    process.stdout.write(`${jiraId}\n`);
    return;
  }
  if (command === "ensure") {
    process.stdout.write(`${ensureArtifactDirectory(options.repositoryRoot, jiraId)}\n`);
    return;
  }
  if (command === "path") {
    const [stageOrFilename] = positional;
    const filename =
      ARTIFACT_FILES[stageOrFilename] || normalizeArtifactFilename(stageOrFilename);
    process.stdout.write(
      `${getArtifactPath(options.repositoryRoot, jiraId, filename)}\n`
    );
    return;
  }
  if (command === "validate-stage") {
    const [stage] = positional;
    process.stdout.write(
      `${validateStage(options.repositoryRoot, jiraId, stage)}\n`
    );
    return;
  }

  throw new Error(
    "Usage: node workflow/artifact-paths.js <resolve|ensure|path|validate-stage> [stage-or-filename] [--jira-id KEY] [--root PATH]"
  );
}

if (require.main === module) {
  try {
    runCli();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = {
  ARTIFACT_FILES,
  DEFAULT_REPOSITORY_ROOT,
  ensureArtifactDirectory,
  getArtifactPath,
  getArtifactRelativePath,
  normalizeArtifactReference,
  resolveJiraId,
  validateJiraId,
  validateStage,
};
