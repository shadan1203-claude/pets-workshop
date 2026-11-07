import assert from "node:assert/strict";
import test from "node:test";
import { createApiClient } from "../../mcp/common/api-client.js";
import { basicAuthorization } from "../../mcp/common/auth.js";
import { createJiraTools, registerJiraTools } from "../../mcp/jira-server.js";
import { captureTools, mockApi, unauthorizedFetch } from "./helpers.js";

const config = {
  baseUrl: "https://example.atlassian.net/",
  username: "service@example.com",
  token: "test-token",
};

test("registers the Jira tool set with input schemas", () => {
  const tools = captureTools((server) => registerJiraTools(server, mockApi(), config));
  assert.deepEqual([...tools.keys()].sort(), [
    "addComment",
    "createIssue",
    "getIssue",
    "getProject",
    "searchIssues",
    "transitionIssue",
    "updateIssue",
  ]);
  assert.equal(tools.get("getIssue").config.inputSchema.safeParse({ issueKey: "PET-1" }).success, true);
  assert.equal(tools.get("getIssue").config.inputSchema.safeParse({ issueKey: "../1" }).success, false);
  assert.equal(tools.get("createIssue").config.inputSchema.safeParse({}).success, false);
});

test("createIssue sends a Jira Story request and returns verified identifiers", async () => {
  const api = mockApi([{ key: "PET-42", id: "10042" }]);
  const tool = createJiraTools(api, config).find(({ name }) => name === "createIssue");
  const result = await tool.handler({
    projectKey: "PET",
    issueType: "Story",
    summary: "Add adoption filter",
    description: "Allow filtering dogs by adoption status.",
    labels: ["shelter"],
  });

  assert.deepEqual(result, {
    issueKey: "PET-42",
    issueId: "10042",
    url: "https://example.atlassian.net/browse/PET-42",
  });
  assert.equal(api.calls[0].method, "POST");
  assert.equal(api.calls[0].options.body.fields.issuetype.name, "Story");
  assert.equal(api.calls[0].options.body.fields.description, "Allow filtering dogs by adoption status.");
});

test("addComment and updateIssue send plain-text bodies for Jira REST API v2", async () => {
  const api = mockApi([{ id: "7" }, {}]);
  const tools = createJiraTools(api, config);
  await tools.find(({ name }) => name === "addComment").handler({ issueKey: "PET-1", comment: "Line one\nLine two" });
  await tools.find(({ name }) => name === "updateIssue").handler({ issueKey: "PET-1", fields: { description: "Updated" } });

  assert.equal(api.calls[0].options.body.body, "Line one\nLine two");
  assert.equal(api.calls[1].options.body.fields.description, "Updated");
});

test("updateIssue rejects fields outside its allowlist", async () => {
  const api = mockApi();
  const tools = captureTools((server) => registerJiraTools(server, api, config));
  const result = await tools.get("updateIssue").handler({
    issueKey: "PET-1",
    fields: { project: { key: "OTHER" } },
  });
  assert.equal(result.isError, true);
  assert.match(result.content[0].text, /Unsupported Jira update fields/);
  assert.equal(api.calls.length, 0);
});

test("Jira authentication failures are surfaced without credentials", async () => {
  const client = createApiClient({
    baseUrl: config.baseUrl,
    authorization: basicAuthorization(config.username, config.token),
    userAgent: "test",
    fetchImpl: unauthorizedFetch(),
  });
  await assert.rejects(client.request("GET", "rest/api/3/myself"), /Authentication or permission check failed/);
});