import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import path from "node:path";
import { z } from "zod";
import { pathToFileURL } from "node:url";
import { bearerAuthorization } from "./common/auth.js";
import { createApiClient } from "./common/api-client.js";
import { loadGitHubConfig } from "./common/config.js";
import { createLogger } from "./common/logger.js";
import { registerTools } from "./common/tools.js";

const logger = createLogger("github");
const ownerSchema = z.string().trim().min(1).max(100).regex(/^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/);
const repoSchema = z.string().trim().min(1).max(100).regex(/^[A-Za-z0-9_.-]+$/);
const branchSchema = z.string().trim().min(1).max(240).refine((value) =>
  !value.startsWith("-") && !value.includes("..") && !/[ ~^:?*[\\\]]/.test(value),
"branch name contains unsupported Git ref characters");

function encodedRef(ref) {
  return ref.split("/").map(encodeURIComponent).join("/");
}

export function createGitHubTools(api) {
  return [
    {
      name: "getRepository",
      description: "Get GitHub repository metadata by owner and repository name.",
      inputSchema: z.object({ owner: ownerSchema, repo: repoSchema }),
      handler: ({ owner, repo }) => api.request("GET", `repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`),
    },
    {
      name: "getPullRequest",
      description: "Get a GitHub pull request by owner, repository, and number.",
      inputSchema: z.object({
        owner: ownerSchema,
        repo: repoSchema,
        pullNumber: z.number().int().positive(),
      }),
      handler: ({ owner, repo, pullNumber }) => api.request(
        "GET",
        `repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${pullNumber}`,
      ),
    },
    {
      name: "searchPullRequests",
      description: "Search pull requests in a repository using GitHub issue-search terms.",
      inputSchema: z.object({
        owner: ownerSchema,
        repo: repoSchema,
        query: z.string().trim().min(1).max(256),
        perPage: z.number().int().min(1).max(100).default(30),
      }),
      handler: ({ owner, repo, query, perPage }) => api.request("GET", "search/issues", {
        query: {
          q: `repo:${owner}/${repo} is:pr ${query}`,
          per_page: perPage,
        },
      }),
    },
    {
      name: "createPullRequest",
      description: "Create a GitHub pull request. This is an external write and requires user approval.",
      inputSchema: z.object({
        owner: ownerSchema,
        repo: repoSchema,
        title: z.string().trim().min(1).max(256),
        head: branchSchema,
        base: branchSchema,
        body: z.string().max(100000).default(""),
        draft: z.boolean().default(false),
      }),
      handler: async ({ owner, repo, title, head, base, body, draft }) => {
        const result = await api.request(
          "POST",
          `repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls`,
          { body: { title, head, base, body, draft } },
        );
        if (!result.number || !result.html_url) throw new Error("GitHub created the pull request but returned no verified number or URL");
        return { number: result.number, url: result.html_url };
      },
    },
    {
      name: "createBranch",
      description: "Create a GitHub branch from a repository branch or its default branch. This is an external write and requires user approval.",
      inputSchema: z.object({
        owner: ownerSchema,
        repo: repoSchema,
        branch: branchSchema,
        fromRef: branchSchema.optional(),
      }),
      handler: async ({ owner, repo, branch, fromRef }) => {
        const repository = await api.request("GET", `repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`);
        const source = fromRef || repository.default_branch;
        if (!source) throw new Error("Repository response did not provide a default branch; specify fromRef");
        const sourceRef = await api.request(
          "GET",
          `repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/ref/heads/${encodedRef(source)}`,
        );
        const result = await api.request(
          "POST",
          `repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/refs`,
          { body: { ref: `refs/heads/${branch}`, sha: sourceRef.object.sha } },
        );
        return { ref: result.ref, sha: result.object?.sha };
      },
    },
  ];
}

export function registerGitHubTools(server, api) {
  return registerTools(server, "github", createGitHubTools(api));
}

export function createGitHubServer({ config = loadGitHubConfig(), api } = {}) {
  const client = api ?? createApiClient({
    baseUrl: config.baseUrl,
    authorization: bearerAuthorization(config.token),
    userAgent: "pets-workshop-github-mcp/1.0",
    apiVersion: "2022-11-28",
  });
  const server = new McpServer({ name: "pets-workshop-github", version: "1.0.0" });
  registerGitHubTools(server, client);
  return server;
}

export async function startGitHubServer() {
  const server = createGitHubServer();
  await server.connect(new StdioServerTransport());
  logger.info("GitHub MCP server started");
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  startGitHubServer().catch((error) => {
    logger.error("GitHub MCP server failed to start", { message: error.message });
    process.exitCode = 1;
  });
}