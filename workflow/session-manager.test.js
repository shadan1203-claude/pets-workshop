"use strict";

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const SessionManager = require("./session-manager");
const artifactPaths = require("./artifact-paths");

const TEST_JIRA_ID = "PET-123";

function createManager(sessionsDirectory, repositoryRoot) {
  return new SessionManager(sessionsDirectory, {
    repositoryRoot,
    jiraId: TEST_JIRA_ID,
  });
}

function withTemporaryDirectory(runTest) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "pets-agent-sessions-"));

  try {
    runTest(directory);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

function captureConsoleErrors(runTest) {
  const originalError = console.error;
  const messages = [];
  console.error = (...args) => messages.push(args.join(" "));
  try {
    runTest();
    return messages;
  } finally {
    console.error = originalError;
  }
}

function testCreatesAllAgentSessionFiles() {
  withTemporaryDirectory((directory) => {
    const sessionsDirectory = path.join(directory, "sessions");
    const manager = createManager(sessionsDirectory, directory);
    const agents = SessionManager.AGENTS;

    assert.deepStrictEqual(
      fs.readdirSync(sessionsDirectory).sort(),
      agents.map((agent) => `${agent}-session.json`).sort()
    );

    const sessions = manager.listSessions();
    assert.strictEqual(sessions.length, agents.length);
    assert.deepStrictEqual(
      sessions.map((session) => session.agent),
      agents
    );

    for (const session of sessions) {
      assert.deepStrictEqual(Object.keys(session), [
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
      assert.match(session.sessionId, /^[0-9a-f-]{36}$/i);
      assert.strictEqual(session.status, "NOT_STARTED");
      assert.deepStrictEqual(session.artifacts, []);
      assert.deepStrictEqual(session.decisions, []);
      assert.deepStrictEqual(session.risks, []);
      assert.deepStrictEqual(session.blockers, []);
      assert.deepStrictEqual(session.dependsOn, []);
      assert(Number.isFinite(Date.parse(session.lastUpdated)));
    }
  });
}

function testPersistsIndependentAgentUpdatesAndResumes() {
  withTemporaryDirectory((directory) => {
    const sessionsDirectory = path.join(directory, "sessions");
    const manager = createManager(sessionsDirectory, directory);
    const original = manager.createSession("requirements");

    manager.updateStatus("requirements", "IN_PROGRESS");
    manager.addArtifact("requirements", {
      name: "requirements",
      path: "docs/PET-123/requirements.md",
    });
    manager.addDecision("requirements", "Use local JSON files.");
    manager.addRisk("requirements", { severity: "low", description: "Local disk." });
    manager.addBlocker("requirements", "Awaiting review.");

    const planning = manager.loadSession("planning");
    planning.dependsOn = ["requirements"];
    manager.saveSession("planning", planning);

    const resumedManager = createManager(sessionsDirectory, directory);
    const resumed = resumedManager.resumeSession("requirements");
    assert.strictEqual(resumed.sessionId, original.sessionId);
    assert.strictEqual(resumed.status, "IN_PROGRESS");
    assert.deepStrictEqual(resumed.artifacts, [
      { name: "requirements", path: "docs/PET-123/requirements.md" },
    ]);
    assert.deepStrictEqual(resumed.decisions, ["Use local JSON files."]);
    assert.deepStrictEqual(resumed.risks, [
      { severity: "low", description: "Local disk." },
    ]);
    assert.deepStrictEqual(resumed.blockers, ["Awaiting review."]);
    assert.deepStrictEqual(
      resumedManager.loadSession("planning").dependsOn,
      ["requirements"]
    );

    const snapshot = resumedManager.resumeSession("requirements");
    snapshot.artifacts[0].path = "mutated";
    assert.strictEqual(
      resumedManager.loadSession("requirements").artifacts[0].path,
      "docs/PET-123/requirements.md"
    );

    const listed = resumedManager.listSessions();
    assert.strictEqual(listed.length, 8);
    assert.deepStrictEqual(
      listed.map((session) => session.agent),
      SessionManager.AGENTS
    );
    assert.strictEqual(
      listed.find((session) => session.agent === "development").artifacts.length,
      0
    );
  });
}

function testCreationPreservesExistingSessionAndLoadRecreatesMissingFile() {
  withTemporaryDirectory((directory) => {
    const sessionsDirectory = path.join(directory, "sessions");
    const manager = createManager(sessionsDirectory, directory);
    manager.addDecision("orchestrator", "Keep existing state.");
    const before = manager.loadSession("orchestrator");

    const created = manager.createSession("orchestrator");
    assert.deepStrictEqual(created, before);

    const missingFile = path.join(sessionsDirectory, "code-review-session.json");
    fs.unlinkSync(missingFile);
    const recreated = manager.loadSession("code-review");
    assert.strictEqual(recreated.agent, "code-review");
    assert.strictEqual(fs.existsSync(missingFile), true);
  });
}

function testRejectsInvalidAgentsAndSessionData() {
  withTemporaryDirectory((directory) => {
    const manager = createManager(path.join(directory, "sessions"), directory);

    assert.throws(() => manager.loadSession("../outside"), /agentName must be one of/);
    assert.throws(() => manager.createSession("Requirements"), /agentName must be one of/);
    assert.throws(() => manager.updateStatus("testing", " "), /status must be/);
    assert.throws(() => manager.addRisk("testing", () => {}), /JSON-compatible/);

    const session = manager.loadSession("testing");
    const filePath = path.join(directory, "sessions", "testing-session.json");
    const before = fs.readFileSync(filePath, "utf8");

    assert.throws(
      () => manager.saveSession("testing", { ...session, agent: "deployment" }),
      /Session agent must be/
    );
    assert.throws(
      () => manager.saveSession("testing", { ...session, sessionId: "replacement" }),
      /sessionId cannot be changed/
    );
    assert.throws(
      () => manager.saveSession("testing", { ...session, blockers: "not-an-array" }),
      /must be an array/
    );

    const circular = {};
    circular.self = circular;
    assert.throws(() => manager.addArtifact("testing", circular), /circular/);
    assert.strictEqual(fs.readFileSync(filePath, "utf8"), before);
  });
}

function testMalformedSessionIsNotReplaced() {
  withTemporaryDirectory((directory) => {
    const sessionsDirectory = path.join(directory, "sessions");
    fs.mkdirSync(sessionsDirectory, { recursive: true });
    const filePath = path.join(sessionsDirectory, "orchestrator-session.json");
    fs.writeFileSync(filePath, "{ invalid json", "utf8");

    const messages = captureConsoleErrors(() => {
      const manager = createManager(sessionsDirectory, directory);
      assert.throws(
        () => manager.loadSession("orchestrator"),
        /Unable to load session for "orchestrator"/
      );
    });
    assert(messages.some((message) => message.includes("Failed to load session")));
    assert.strictEqual(fs.readFileSync(filePath, "utf8"), "{ invalid json");
  });
}

function testInvalidPersistedSchemaIsNotReplaced() {
  withTemporaryDirectory((directory) => {
    const sessionsDirectory = path.join(directory, "sessions");
    const manager = createManager(sessionsDirectory, directory);
    const filePath = path.join(sessionsDirectory, "testing-session.json");
    const malformed = JSON.stringify({ agent: "testing", status: "NOT_STARTED" });
    fs.writeFileSync(filePath, malformed, "utf8");

    const messages = captureConsoleErrors(() => {
      assert.throws(
        () => manager.loadSession("testing"),
        /Unable to load session for "testing"/
      );
    });

    assert(messages.some((message) => message.includes("Failed to load session")));
    assert.strictEqual(fs.readFileSync(filePath, "utf8"), malformed);
  });
}

function testFilesystemFailuresAreLoggedAndSurfaced() {
  withTemporaryDirectory((directory) => {
    const notDirectory = path.join(directory, "not-a-directory");
    fs.writeFileSync(notDirectory, "file", "utf8");

    const messages = captureConsoleErrors(() => {
      assert.throws(
        () => createManager(notDirectory, directory),
        /Unable to create sessions directory/
      );
    });
    assert(messages.some((message) => message.includes("Failed to create sessions directory")));
  });
}

function testArtifactPathsAreJiraScopedAndValidated() {
  withTemporaryDirectory((directory) => {
    const manager = createManager(
      path.join(directory, "sessions"),
      directory
    );

    assert.strictEqual(
      manager.artifactPath("requirements"),
      path.join(directory, "docs", TEST_JIRA_ID, "requirements.md")
    );
    for (const [stage, filename] of Object.entries(
      artifactPaths.ARTIFACT_FILES
    )) {
      assert.strictEqual(
        manager.artifactPath(stage),
        path.join(directory, "docs", TEST_JIRA_ID, filename)
      );
    }
    assert.strictEqual(
      artifactPaths.normalizeArtifactReference("docs/requirements.md", TEST_JIRA_ID),
      "docs/PET-123/requirements.md"
    );
    assert.strictEqual(
      artifactPaths.normalizeArtifactReference(
        "docs//requirements.md",
        TEST_JIRA_ID
      ),
      "docs/PET-123/requirements.md"
    );
    assert.strictEqual(
      manager.addArtifact("architecture", {
        name: "architecture",
        path: path.join(directory, "docs", "architecture.md"),
      }).artifacts[0].path,
      "docs/PET-123/architecture.md"
    );
    assert.throws(
      () =>
        artifactPaths.normalizeArtifactReference(
          "docs/OTHER-456/requirements.md",
          TEST_JIRA_ID
        ),
      /outside the active Jira folder/
    );
    assert.throws(
      () =>
        artifactPaths.getArtifactRelativePath(
          "../OTHER-456",
          "requirements.md"
        ),
      /valid Jira key/
    );
    assert.strictEqual(
      fs.existsSync(path.join(directory, "docs", TEST_JIRA_ID)),
      true
    );
  });
}

function testArtifactRecordsAreMigratedIntoTheActiveJiraFolder() {
  withTemporaryDirectory((directory) => {
    const manager = createManager(
      path.join(directory, "sessions"),
      directory
    );
    const saved = manager.addArtifact("requirements", {
      name: "requirements",
      path: "docs/requirements.md",
    });

    assert.strictEqual(
      saved.artifacts[0].path,
      "docs/PET-123/requirements.md"
    );
  });
}

function testLegacyArtifactsAreMigratedWhenSessionsAreLoaded() {
  withTemporaryDirectory((directory) => {
    const sessionsDirectory = path.join(directory, "sessions");
    const manager = createManager(sessionsDirectory, directory);
    manager.addArtifact("requirements", {
      name: "requirements",
      path: "docs/PET-123/requirements.md",
    });

    const sessionPath = path.join(
      sessionsDirectory,
      "requirements-session.json"
    );
    const persisted = JSON.parse(fs.readFileSync(sessionPath, "utf8"));
    persisted.artifacts[0].path = "docs/requirements.md";
    fs.writeFileSync(sessionPath, JSON.stringify(persisted), "utf8");

    const resumedManager = createManager(sessionsDirectory, directory);
    const resumed = resumedManager.loadSession("requirements");
    assert.strictEqual(
      resumed.artifacts[0].path,
      "docs/PET-123/requirements.md"
    );
    assert.strictEqual(
      JSON.parse(fs.readFileSync(sessionPath, "utf8")).artifacts[0].path,
      "docs/PET-123/requirements.md"
    );
  });
}

function testArtifactRecordsRequireJiraContext() {
  withTemporaryDirectory((directory) => {
    const manager = new SessionManager(
      path.join(directory, "sessions"),
      { repositoryRoot: directory, branchJiraId: null }
    );

    assert.throws(
      () =>
        manager.addArtifact("requirements", {
          name: "requirements",
          path: "docs/requirements.md",
        }),
      /Jira key is required/
    );
    assert.throws(
      () => manager.artifactPath("requirements"),
      /Jira key is required/
    );
  });
}

function testJiraResolutionSupportsExplicitEnvironmentAndBranchKeys() {
  withTemporaryDirectory((directory) => {
    assert.strictEqual(
      artifactPaths.resolveJiraId({
        repositoryRoot: directory,
        jiraId: TEST_JIRA_ID,
        environment: {},
        branchJiraId: null,
      }),
      TEST_JIRA_ID
    );
    assert.strictEqual(
      artifactPaths.resolveJiraId({
        repositoryRoot: directory,
        environment: { JIRA_KEY: "PET-456" },
        branchJiraId: null,
      }),
      "PET-456"
    );
    assert.strictEqual(
      artifactPaths.resolveJiraId({
        repositoryRoot: directory,
        environment: {},
        branchJiraId: "PET-789",
      }),
      "PET-789"
    );
  });
}

function testStageValidationUsesTheJiraSpecificFolder() {
  withTemporaryDirectory((directory) => {
    const artifactDirectory = artifactPaths.ensureArtifactDirectory(
      directory,
      TEST_JIRA_ID
    );
    const requiredFiles = [
      "intake-summary.md",
      "requirements.md",
      "architecture.md",
      "design-review.md",
      "api-design.md",
      "implementation-plan.md",
    ];
    for (const filename of requiredFiles) {
      fs.writeFileSync(path.join(artifactDirectory, filename), "");
    }

    assert.strictEqual(
      artifactPaths.validateStage(
        directory,
        TEST_JIRA_ID,
        "pre-development"
      ),
      artifactDirectory
    );
    assert.throws(
      () =>
        artifactPaths.validateStage(directory, TEST_JIRA_ID, "testing"),
      /Missing testing prerequisites in docs\/PET-123/
    );
  });
}

function testJiraResolutionRequiresUnambiguousContext() {
  withTemporaryDirectory((directory) => {
    assert.throws(
      () =>
        artifactPaths.resolveJiraId({
          repositoryRoot: directory,
          environment: {},
          branchJiraId: null,
        }),
      /Unable to resolve Jira key/
    );

    for (const jiraId of ["PET-123", "PET-456"]) {
      artifactPaths.ensureArtifactDirectory(directory, jiraId);
    }

    assert.throws(
      () =>
        artifactPaths.resolveJiraId({
          repositoryRoot: directory,
          environment: {},
          branchJiraId: null,
        }),
      /Multiple Jira workflow folders found/
    );
  });
}

const tests = [
  testCreatesAllAgentSessionFiles,
  testPersistsIndependentAgentUpdatesAndResumes,
  testCreationPreservesExistingSessionAndLoadRecreatesMissingFile,
  testRejectsInvalidAgentsAndSessionData,
  testMalformedSessionIsNotReplaced,
  testInvalidPersistedSchemaIsNotReplaced,
  testFilesystemFailuresAreLoggedAndSurfaced,
  testArtifactPathsAreJiraScopedAndValidated,
  testArtifactRecordsAreMigratedIntoTheActiveJiraFolder,
  testLegacyArtifactsAreMigratedWhenSessionsAreLoaded,
  testArtifactRecordsRequireJiraContext,
  testJiraResolutionSupportsExplicitEnvironmentAndBranchKeys,
  testStageValidationUsesTheJiraSpecificFolder,
  testJiraResolutionRequiresUnambiguousContext,
];

for (const test of tests) {
  test();
  console.log(`PASS ${test.name}`);
}
