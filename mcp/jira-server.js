import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import path from "node:path";
import { z } from "zod";
import { pathToFileURL } from "node:url";
import { basicAuthorization } from "./common/auth.js";
import { createApiClient } from "./common/api-client.js";
import { loadJiraConfig } from "./common/config.js";
import { createLogger } from "./common/logger.js";
import { registerTools } from "./common/tools.js";

const logger = createLogger("jira");
const issueKeySchema = z.string().trim().min(2).max(64).regex(/^[A-Za-z][A-Za-z0-9_]*-\d+$/);
const projectKeySchema = z.string().trim().min(1).max(64).regex(/^[A-Za-z][A-Za-z0-9_]*$/);

function adfFromText(text) {
  return {
    type: "doc",
    version: 1,
    content: text.split(/\r?\n/).map((line) => ({
      type: "paragraph",
      content: line ? [{ type: "text", text: line }] : [],
    })),
  };
}

const issueFields = ["summary", "description", "labels", "assignee", "priority", "duedate", "components", "fixVersions"];

export function createJiraTools(api, config) {
  return [
    {
      name: "getIssue",
      description: "Get a Jira issue by key, including its fields and current status.",
      inputSchema: z.object({ issueKey: issueKeySchema }),
      handler: ({ issueKey }) => api.request("GET", `rest/api/2/issue/${encodeURIComponent(issueKey)}`),
    },
    {
      name: "searchIssues",
      description: "Search Jira issues using a read-only JQL query. Returns at most 50 issues.",
      inputSchema: z.object({ jql: z.string().trim().min(1).max(2000) }),
      handler: ({ jql }) => api.request("GET", "rest/api/2/search/jql", {
        query: {
          jql,
          maxResults: 50,
          fields: "summary,status,issuetype,priority,assignee,labels,project",
        },
      }),
    },
    {
      name: "getProject",
      description: "Get Jira project metadata by project key.",
      inputSchema: z.object({ projectKey: projectKeySchema }),
      handler: ({ projectKey }) => api.request("GET", `rest/api/2/project/${encodeURIComponent(projectKey)}`),
    },
    {
      name: "createIssue",
      description: "Create a Jira Story in a project. This is an external write and requires user approval.",
      inputSchema: z.object({
        projectKey: projectKeySchema,
        issueType: z.literal("Story"),
        summary: z.string().trim().min(1).max(255),
        description: z.string().max(20000),
        labels: z.array(z.string().trim().min(1).max(255)).max(50).default([]),
      }),
      handler: async ({ projectKey, issueType, summary, description, labels }) => {
        const result = await api.request("POST", "rest/api/2/issue", {
          body: {
            fields: {
              
              project: { key: projectKey },
              issuetype: { name: issueType },
              summary,
              description: adfFromText(description),
              labels,
            },
          },
        });
        if (!result.key || !result.id) throw new Error("Jira created the issue but returned no issue key or ID");
        return {
          issueKey: result.key,
          issueId: String(result.id),
          url: new URL(`browse/${encodeURIComponent(result.key)}`, config.baseUrl).toString(),
        };
      },
    },
    {
      name: "updateIssue",
      description: "Update an allowlisted set of Jira issue fields. This is an external write and requires user approval.",
      inputSchema: z.object({
        issueKey: issueKeySchema,
        fields: z.record(z.string(), z.unknown()).refine((fields) => Object.keys(fields).length > 0, "fields must not be empty"),
      }),
      handler: async ({ issueKey, fields }) => {
        const unsupported = Object.keys(fields).filter((field) => !issueFields.includes(field));
        if (unsupported.length) throw new Error(`Unsupported Jira update fields: ${unsupported.join(", ")}`);
        const normalized = { ...fields };
        if (typeof normalized.description === "string") normalized.description = adfFromText(normalized.description);
        await api.request("PUT", `rest/api/2/issue/${encodeURIComponent(issueKey)}`, { body: { fields: normalized } });
        return { success: true };
      },
    },
    {
      name: "addComment",
      description: "Add a comment to a Jira issue. This is an external write and requires user approval.",
      inputSchema: z.object({
        issueKey: issueKeySchema,
        comment: z.string().trim().min(1).max(20000),
      }),
      handler: async ({ issueKey, comment }) => {
        const result = await api.request("POST", `rest/api/2/issue/${encodeURIComponent(issueKey)}/comment`, {
          body: { body: adfFromText(comment) },
        });
        return { commentId: String(result.id ?? "") };
      },
    },
    {
      name: "transitionIssue",
      description: "Transition a Jira issue by transition ID or exact name. This is an external write and requires user approval.",
      inputSchema: z.object({
        issueKey: issueKeySchema,
        transition: z.string().trim().min(1).max(128),
      }),
      handler: async ({ issueKey, transition }) => {
        const encodedKey = encodeURIComponent(issueKey);
        const result = await api.request("GET", `rest/api/2/issue/${encodedKey}/transitions`);
        const matches = (result.transitions ?? []).filter((entry) =>
          String(entry.id) === transition || entry.name?.toLowerCase() === transition.toLowerCase());
        if (matches.length !== 1) throw new Error("Transition must match exactly one available Jira transition by ID or name");
        await api.request("POST", `rest/api/2/issue/${encodedKey}/transitions`, {
          body: { transition: { id: String(matches[0].id) } },
        });
        return { success: true };
      },
    },
  ];
}

export function registerJiraTools(server, api, config) {
  return registerTools(server, "jira", createJiraTools(api, config));
}

export function createJiraServer({ config = loadJiraConfig(), api } = {}) {
  const client = api ?? createApiClient({
    baseUrl: config.baseUrl,
    authorization: basicAuthorization(config.username, config.token),
    userAgent: "pets-workshop-jira-mcp/1.0",
  });
  const server = new McpServer({ name: "pets-workshop-jira", version: "1.0.0" });
  registerJiraTools(server, client, config);
  return server;
}

export async function startJiraServer() {
  const server = createJiraServer();
  await server.connect(new StdioServerTransport());
  logger.info("Jira MCP server started");
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  startJiraServer().catch((error) => {
    logger.error("Jira MCP server failed to start", { message: error.message });
    process.exitCode = 1;
  });
}