"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const artifactPaths = require("./artifact-paths");

const AGENTS = Object.freeze([
  "orchestrator",
  "requirements",
  "planning",
  "architecture",
  "development",
  "code-review",
  "testing",
  "deployment",
]);

const SESSION_FIELDS = Object.freeze([
  "sessionId",
  "agent",
  "status",
  "artifacts",
  "decisions",
  "risks",
  "blockers",
  "lastUpdated",
  "dependsOn",
]);

const RECORD_FIELDS = Object.freeze([
  "artifacts",
  "decisions",
  "risks",
  "blockers",
]);

const AGENT_SET = new Set(AGENTS);

/**
 * Persist independent PetWorkshop workflow sessions as local JSON files.
 *
 * The manager is synchronous and intended for a single local process. It
 * initializes missing files but never resets an existing session implicitly.
 */
class SessionManager {
  /**
   * Create the sessions directory and initialize any missing agent sessions.
   *
   * @param {string} [sessionsDirectory] Storage directory; defaults to
   *   `workflow/sessions` beside this module.
   * @param {object} [options] Repository and Jira workflow context.
   */
  constructor(sessionsDirectory = path.join(__dirname, "sessions"), options = {}) {
    this._requireText(sessionsDirectory, "sessionsDirectory");
    this.sessionsDirectory = path.resolve(sessionsDirectory);
    this.repositoryRoot = path.resolve(
      options.repositoryRoot || path.resolve(__dirname, "..")
    );
    this.jiraId = artifactPaths.resolveJiraId({
      repositoryRoot: this.repositoryRoot,
      jiraId: options.jiraId,
      environment: options.environment,
      branchJiraId: options.branchJiraId,
      allowNone: true,
    });
    if (this.jiraId) {
      artifactPaths.ensureArtifactDirectory(this.repositoryRoot, this.jiraId);
    }
    this._initializeMissingSessions();
  }

  /**
   * Resolve a standard workflow artifact under the active Jira folder.
   *
   * @param {string} stageOrFilename A stage key or artifact filename.
   * @returns {string} Absolute artifact path.
   */
  artifactPath(stageOrFilename) {
    if (!this.jiraId) {
      throw new Error(
        "A Jira key is required to resolve an SDLC artifact path; set JIRA_ID or pass jiraId."
      );
    }
    const filename =
      artifactPaths.ARTIFACT_FILES[stageOrFilename] || stageOrFilename;
    return artifactPaths.getArtifactPath(
      this.repositoryRoot,
      this.jiraId,
      filename
    );
  }

  /**
   * Ensure an agent has a session and return it without replacing saved data.
   *
   * This operation is idempotent. Use `resumeSession` to express the intent to
   * continue existing work explicitly; neither method resets a session.
   *
   * @param {string} agentName Supported workflow agent.
   * @returns {object} Defensive copy of the agent session.
   */
  createSession(agentName) {
    this._requireAgent(agentName);
    return this.loadSession(agentName);
  }

  /**
   * Load and validate an agent session, creating it only if its file is absent.
   *
   * @param {string} agentName Supported workflow agent.
   * @returns {object} Defensive copy of the persisted session.
   */
  loadSession(agentName) {
    this._requireAgent(agentName);
    const filePath = this._sessionFilePath(agentName);

    try {
      const contents = fs.readFileSync(filePath, "utf8");
      const persistedSession = JSON.parse(contents);
      const session = this._validateSession(persistedSession, agentName);
      if (
        JSON.stringify(persistedSession.artifacts) !==
        JSON.stringify(session.artifacts)
      ) {
        this._writeSession(agentName, session);
      }
      return session;
    } catch (error) {
      if (error && error.code === "ENOENT") {
        const session = this._defaultSession(agentName);
        this._writeSession(agentName, session);
        return this._clone(session);
      }

      this._logAndThrow(`load session for "${agentName}"`, error);
    }
  }

  /**
   * Validate and persist a complete session while retaining its identity.
   *
   * @param {string} agentName Supported workflow agent.
   * @param {object} data Complete session record matching the existing session.
   * @returns {object} Defensive copy of the saved session.
   */
  saveSession(agentName, data) {
    this._requireAgent(agentName);
    const current = this.loadSession(agentName);
    const session = this._validateSession(data, agentName, current.sessionId);
    session.lastUpdated = new Date().toISOString();
    this._writeSession(agentName, session);
    return this._clone(session);
  }

  /**
   * Set the agent session's status.
   *
   * @param {string} agentName Supported workflow agent.
   * @param {string} status Non-empty workflow status.
   * @returns {object} Defensive copy of the updated session.
   */
  updateStatus(agentName, status) {
    this._requireAgent(agentName);
    this._requireText(status, "status");
    const session = this.loadSession(agentName);
    session.status = status;
    return this.saveSession(agentName, session);
  }

  /**
   * Append a JSON-compatible artifact record.
   *
   * @param {string} agentName Supported workflow agent.
   * @param {*} artifact JSON-compatible artifact value.
   * @returns {object} Defensive copy of the updated session.
   */
  addArtifact(agentName, artifact) {
    return this._addRecord(agentName, "artifacts", artifact);
  }

  /**
   * Append a JSON-compatible decision record.
   *
   * @param {string} agentName Supported workflow agent.
   * @param {*} decision JSON-compatible decision value.
   * @returns {object} Defensive copy of the updated session.
   */
  addDecision(agentName, decision) {
    return this._addRecord(agentName, "decisions", decision);
  }

  /**
   * Append a JSON-compatible risk record.
   *
   * @param {string} agentName Supported workflow agent.
   * @param {*} risk JSON-compatible risk value.
   * @returns {object} Defensive copy of the updated session.
   */
  addRisk(agentName, risk) {
    return this._addRecord(agentName, "risks", risk);
  }

  /**
   * Append a JSON-compatible blocker record.
   *
   * @param {string} agentName Supported workflow agent.
   * @param {*} blocker JSON-compatible blocker value.
   * @returns {object} Defensive copy of the updated session.
   */
  addBlocker(agentName, blocker) {
    return this._addRecord(agentName, "blockers", blocker);
  }

  /**
   * Reload a saved agent session without changing its status or other fields.
   *
   * @param {string} agentName Supported workflow agent.
   * @returns {object} Defensive copy of the persisted session.
   */
  resumeSession(agentName) {
    return this.loadSession(agentName);
  }

  /**
   * Load all supported sessions in the fixed agent order.
   *
   * @returns {object[]} Defensive copies of every agent session.
   */
  listSessions() {
    return AGENTS.map((agentName) => this.loadSession(agentName));
  }

  _initializeMissingSessions() {
    try {
      fs.mkdirSync(this.sessionsDirectory, { recursive: true });
    } catch (error) {
      this._logAndThrow("create sessions directory", error);
    }

    for (const agentName of AGENTS) {
      const filePath = this._sessionFilePath(agentName);
      if (!fs.existsSync(filePath)) {
        this._writeSession(agentName, this._defaultSession(agentName));
      }
    }
  }

  _defaultSession(agentName) {
    return {
      sessionId: crypto.randomUUID(),
      agent: agentName,
      status: "NOT_STARTED",
      artifacts: [],
      decisions: [],
      risks: [],
      blockers: [],
      lastUpdated: new Date().toISOString(),
      dependsOn: [],
    };
  }

  _validateSession(value, agentName, expectedSessionId) {
    if (!this._isPlainObject(value)) {
      throw new TypeError("Session data must be a plain JSON object.");
    }

    const actualFields = Object.keys(value).sort();
    const expectedFields = [...SESSION_FIELDS].sort();
    if (
      actualFields.length !== expectedFields.length ||
      actualFields.some((field, index) => field !== expectedFields[index])
    ) {
      throw new TypeError(
        `Session data must contain exactly: ${SESSION_FIELDS.join(", ")}.`
      );
    }

    this._requireText(value.sessionId, "sessionId");
    if (expectedSessionId && value.sessionId !== expectedSessionId) {
      throw new TypeError("sessionId cannot be changed for an existing session.");
    }
    if (value.agent !== agentName) {
      throw new TypeError(`Session agent must be "${agentName}".`);
    }
    this._requireText(value.status, "status");
    this._requireText(value.lastUpdated, "lastUpdated");
    if (!Number.isFinite(Date.parse(value.lastUpdated))) {
      throw new TypeError("lastUpdated must be a valid date string.");
    }

    for (const field of RECORD_FIELDS) {
      if (!Array.isArray(value[field])) {
        throw new TypeError(`Session field "${field}" must be an array.`);
      }
    }

    if (!Array.isArray(value.dependsOn)) {
      throw new TypeError('Session field "dependsOn" must be an array.');
    }
    for (const dependency of value.dependsOn) {
      this._requireAgent(dependency);
      if (dependency === agentName) {
        throw new TypeError("An agent cannot depend on its own session.");
      }
    }

    const session = {};
    for (const field of SESSION_FIELDS) {
      session[field] =
        field === "artifacts"
          ? value[field].map((record) =>
              this._clone(this._normalizeArtifactRecord(record), field)
            )
          : this._clone(value[field], field);
    }
    return session;
  }

  _addRecord(agentName, field, record) {
    this._requireAgent(agentName);
    const normalizedRecord =
      field === "artifacts" ? this._normalizeArtifactRecord(record) : record;
    const safeRecord = this._clone(normalizedRecord, field);
    const session = this.loadSession(agentName);
    session[field].push(safeRecord);
    return this.saveSession(agentName, session);
  }

  _normalizeArtifactRecord(record) {
    if (!this._isPlainObject(record) || typeof record.path !== "string") {
      return record;
    }
    let artifactReference = record.path;
    if (!artifactReference.replace(/\\/g, "/").startsWith("docs/")) {
      const absolutePath = path.resolve(this.repositoryRoot, artifactReference);
      const relativePath = path
        .relative(this.repositoryRoot, absolutePath)
        .replace(/\\/g, "/");
      if (!relativePath.startsWith("docs/")) {
        return record;
      }
      artifactReference = relativePath;
    }
    if (!artifactReference.replace(/\\/g, "/").startsWith("docs/")) {
      return record;
    }
    if (!this.jiraId) {
      throw new Error(
        "A Jira key is required to record an SDLC artifact under docs/."
      );
    }
    return {
      ...record,
      path: artifactPaths.normalizeArtifactReference(
        artifactReference,
        this.jiraId
      ),
    };
  }

  _writeSession(agentName, session) {
    const filePath = this._sessionFilePath(agentName);
    const temporaryPath = `${filePath}.${process.pid}.${crypto.randomUUID()}.tmp`;

    try {
      fs.mkdirSync(this.sessionsDirectory, { recursive: true });
      fs.writeFileSync(
        temporaryPath,
        `${JSON.stringify(session, null, 2)}\n`,
        { encoding: "utf8", flag: "wx", mode: 0o600 }
      );
      fs.renameSync(temporaryPath, filePath);
    } catch (error) {
      try {
        fs.unlinkSync(temporaryPath);
      } catch (cleanupError) {
        if (cleanupError.code !== "ENOENT") {
          console.error(
            `Failed to remove temporary session file "${temporaryPath}": ${cleanupError.message}`
          );
        }
      }
      this._logAndThrow(`write session for "${agentName}"`, error);
    }
  }

  _sessionFilePath(agentName) {
    return path.join(this.sessionsDirectory, `${agentName}-session.json`);
  }

  _requireAgent(agentName) {
    if (typeof agentName !== "string" || !AGENT_SET.has(agentName)) {
      throw new TypeError(
        `agentName must be one of: ${AGENTS.join(", ")}.`
      );
    }
  }

  _requireText(value, name) {
    if (typeof value !== "string" || value.trim() === "") {
      throw new TypeError(`${name} must be a non-empty string.`);
    }
  }

  _isPlainObject(value) {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      return false;
    }
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
  }

  _clone(value, label = "value", ancestors = new Set()) {
    if (value === null || typeof value === "string" || typeof value === "boolean") {
      return value;
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value !== "object") {
      throw new TypeError(`${label} must contain only JSON-compatible values.`);
    }
    if (ancestors.has(value)) {
      throw new TypeError(`${label} must not contain circular references.`);
    }
    if (!Array.isArray(value) && !this._isPlainObject(value)) {
      throw new TypeError(`${label} must contain only plain JSON objects.`);
    }
    if (Object.getOwnPropertySymbols(value).length > 0) {
      throw new TypeError(`${label} must not contain symbol properties.`);
    }

    ancestors.add(value);
    let clone;
    if (Array.isArray(value)) {
      clone = value.map((item) => this._clone(item, label, ancestors));
    } else {
      clone = {};
      for (const key of Object.keys(value)) {
        Object.defineProperty(clone, key, {
          value: this._clone(value[key], label, ancestors),
          enumerable: true,
          writable: true,
          configurable: true,
        });
      }
    }
    ancestors.delete(value);
    return clone;
  }

  _logAndThrow(action, error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error(`Failed to ${action}: ${detail}`);
    const wrappedError = new Error(`Unable to ${action}: ${detail}`);
    wrappedError.cause = error;
    throw wrappedError;
  }
}

SessionManager.AGENTS = AGENTS;

module.exports = SessionManager;
