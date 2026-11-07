import assert from "node:assert/strict";
import test from "node:test";
import { createApiClient } from "../../mcp/common/api-client.js";
import { basicAuthorization } from "../../mcp/common/auth.js";
import { createConfluenceTools, registerConfluenceTools } from "../../mcp/confluence-server.js";
import { captureTools, mockApi, unauthorizedFetch } from "./helpers.js";

const config = {
  baseUrl: "https://example.atlassian.net/wiki/",
  username: "service@example.com",
  token: "test-token",
};

test("registers the Confluence tool set with input schemas", () => {
  const tools = captureTools((server) => registerConfluenceTools(server, mockApi(), config));
  assert.deepEqual([...tools.keys()].sort(), ["createPage", "getPage", "listSpaces", "searchPages", "updatePage"]);
  assert.equal(tools.get("listSpaces").config.inputSchema.safeParse({}).success, true);
  assert.equal(tools.get("getPage").config.inputSchema.safeParse({ pageId: "abc-1" }).success, true);
  assert.equal(tools.get("getPage").config.inputSchema.safeParse({ pageId: "../secret" }).success, false);
});

test("createPage resolves the space key and returns the created page URL", async () => {
  const api = mockApi([
    { results: [{ id: "77", key: "TEAM" }] },
    { id: "9001", _links: { webui: "/wiki/spaces/TEAM/pages/9001" } },
  ]);
  const tool = createConfluenceTools(api, config).find(({ name }) => name === "createPage");
  const result = await tool.handler({ spaceKey: "TEAM", title: "Release Notes", content: "<p>Ready</p>" });

  assert.deepEqual(result, { pageId: "9001", url: "https://example.atlassian.net/wiki/spaces/TEAM/pages/9001" });
  assert.equal(api.calls[0].path, "api/v2/spaces");
  assert.equal(api.calls[1].options.body.spaceId, "77");
  assert.equal(api.calls[1].options.body.body.representation, "storage");
});

test("updatePage increments the fetched version", async () => {
  const api = mockApi([
    { id: "9001", spaceId: "77", title: "Release Notes", status: "current", version: { number: 4 } },
    {},
  ]);
  const tool = createConfluenceTools(api, config).find(({ name }) => name === "updatePage");
  assert.deepEqual(await tool.handler({ pageId: "9001", content: "<p>Updated</p>" }), { success: true });
  assert.equal(api.calls[1].method, "PUT");
  assert.equal(api.calls[1].options.body.version.number, 5);
});

test("Confluence authentication failures are surfaced", async () => {
  const client = createApiClient({
    baseUrl: config.baseUrl,
    authorization: basicAuthorization(config.username, config.token),
    userAgent: "test",
    fetchImpl: unauthorizedFetch(),
  });
  await assert.rejects(client.request("GET", "api/v2/spaces"), /Authentication or permission check failed/);
});