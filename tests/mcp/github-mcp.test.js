import assert from "node:assert/strict";
import test from "node:test";
import { createApiClient } from "../../mcp/common/api-client.js";
import { bearerAuthorization } from "../../mcp/common/auth.js";
import { createGitHubTools, registerGitHubTools } from "../../mcp/github-server.js";
import { captureTools, mockApi, unauthorizedFetch } from "./helpers.js";

const config = {
  baseUrl: "https://api.github.com/",
  token: "test-token",
};

test("registers the GitHub tool set with schemas", () => {
  const tools = captureTools((server) => registerGitHubTools(server, mockApi()));
  assert.deepEqual([...tools.keys()].sort(), [
    "createBranch",
    "createPullRequest",
    "getPullRequest",
    "getRepository",
    "searchPullRequests",
  ]);
  assert.equal(tools.get("getRepository").config.inputSchema.safeParse({ owner: "octo-org", repo: "pets" }).success, true);
  assert.equal(tools.get("getRepository").config.inputSchema.safeParse({ owner: "bad/owner", repo: "pets" }).success, false);
});

test("createPullRequest returns the created PR number and URL", async () => {
  const api = mockApi([{ number: 12, html_url: "https://github.com/acme/pets/pull/12" }]);
  const tool = createGitHubTools(api).find(({ name }) => name === "createPullRequest");
  const result = await tool.handler({
    owner: "acme",
    repo: "pets",
    title: "Add adoption filter",
    head: "feature/PET-42-filter",
    base: "main",
    body: "Implements the approved filter.",
    draft: false,
  });
  assert.deepEqual(result, { number: 12, url: "https://github.com/acme/pets/pull/12" });
  assert.equal(api.calls[0].method, "POST");
});

test("createBranch resolves a source ref then creates the branch", async () => {
  const api = mockApi([
    { default_branch: "main" },
    { object: { sha: "abc123" } },
    { ref: "refs/heads/feature/PET-42", object: { sha: "abc123" } },
  ]);
  const tool = createGitHubTools(api).find(({ name }) => name === "createBranch");
  const result = await tool.handler({ owner: "acme", repo: "pets", branch: "feature/PET-42" });
  assert.deepEqual(result, { ref: "refs/heads/feature/PET-42", sha: "abc123" });
  assert.equal(api.calls[2].options.body.sha, "abc123");
});

test("GitHub authentication failures are surfaced", async () => {
  const client = createApiClient({
    baseUrl: config.baseUrl,
    authorization: bearerAuthorization(config.token),
    userAgent: "test",
    apiVersion: "2022-11-28",
    fetchImpl: unauthorizedFetch(),
  });
  await assert.rejects(client.request("GET", "user"), /Authentication or permission check failed/);
});