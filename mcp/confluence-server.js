import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import path from "node:path";
import { z } from "zod";
import { pathToFileURL } from "node:url";
import { basicAuthorization } from "./common/auth.js";
import { createApiClient } from "./common/api-client.js";
import { loadConfluenceConfig } from "./common/config.js";
import { createLogger } from "./common/logger.js";
import { registerTools } from "./common/tools.js";

const logger = createLogger("confluence");
const pageIdSchema = z.string().trim().min(1).max(128).regex(/^[A-Za-z0-9_-]+$/);
const spaceKeySchema = z.string().trim().min(1).max(128).regex(/^[A-Za-z0-9_-]+$/);

function webUrl(config, page) {
  const webui = page._links?.webui;
  if (webui) return new URL(webui, config.baseUrl).toString();
  return new URL(`pages/${encodeURIComponent(page.id)}`, config.baseUrl).toString();
}

function escapeCql(value) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
}

export function createConfluenceTools(api, config) {
  return [
    {
      name: "getPage",
      description: "Get a Confluence page by ID, including storage-format content.",
      inputSchema: z.object({ pageId: pageIdSchema }),
      handler: async ({ pageId }) => {
        const page = await api.request("GET", `api/v2/pages/${encodeURIComponent(pageId)}`, {
          query: { "body-format": "storage" },
        });
        return { ...page, url: webUrl(config, page) };
      },
    },
    {
      name: "searchPages",
      description: "Search Confluence page text. The query is treated as literal text, not arbitrary CQL.",
      inputSchema: z.object({ query: z.string().trim().min(1).max(256) }),
      handler: async ({ query }) => {
        const result = await api.request("GET", "rest/api/search", {
          query: { cql: `type=page AND text~"${escapeCql(query)}"`, limit: 25 },
        });
        const results = (result.results ?? []).map((entry) => {
          const page = entry.content ?? entry;
          return {
            pageId: String(page.id ?? ""),
            title: page.title ?? "",
            url: webUrl(config, page),
            spaceKey: page.space?.key ?? "",
          };
        });
        return { results, totalSize: result.totalSize ?? results.length };
      },
    },
    {
      name: "listSpaces",
      description: "List up to 100 Confluence spaces.",
      inputSchema: z.object({}),
      handler: async () => {
        const result = await api.request("GET", "api/v2/spaces", { query: { limit: 100 } });
        return { results: result.results ?? [], next: result._links?.next ?? null };
      },
    },
    {
      name: "createPage",
      description: "Create a Confluence page. Content must be Confluence storage-format XHTML. This is an external write and requires user approval.",
      inputSchema: z.object({
        spaceKey: spaceKeySchema,
        title: z.string().trim().min(1).max(255),
        content: z.string().min(1).max(100000),
      }),
      handler: async ({ spaceKey, title, content }) => {
        const spaces = await api.request("GET", "api/v2/spaces", {
          query: { keys: spaceKey, limit: 100 },
        });
        const matches = (spaces.results ?? []).filter((space) => space.key === spaceKey);
        if (matches.length !== 1) throw new Error(`Confluence space key '${spaceKey}' did not resolve to exactly one space`);
        const page = await api.request("POST", "api/v2/pages", {
          body: {
            spaceId: String(matches[0].id),
            status: "current",
            title,
            body: { representation: "storage", value: content },
          },
        });
        if (!page.id) throw new Error("Confluence created the page but returned no page ID");
        return { pageId: String(page.id), url: webUrl(config, page) };
      },
    },
    {
      name: "updatePage",
      description: "Replace a Confluence page's storage-format content using optimistic versioning. This is an external write and requires user approval.",
      inputSchema: z.object({
        pageId: pageIdSchema,
        content: z.string().min(1).max(100000),
      }),
      handler: async ({ pageId, content }) => {
        const encodedId = encodeURIComponent(pageId);
        const current = await api.request("GET", `api/v2/pages/${encodedId}`, {
          query: { "body-format": "storage" },
        });
        const version = Number(current.version?.number);
        if (!Number.isInteger(version) || version < 1 || !current.spaceId || !current.title) {
          throw new Error("Confluence page response lacks the version, space, or title required for a safe update");
        }
        await api.request("PUT", `api/v2/pages/${encodedId}`, {
          body: {
            id: String(current.id ?? pageId),
            status: current.status ?? "current",
            title: current.title,
            spaceId: String(current.spaceId),
            body: { representation: "storage", value: content },
            version: { number: version + 1, message: "Updated via PetWorkshop MCP" },
          },
        });
        return { success: true };
      },
    },
  ];
}

export function registerConfluenceTools(server, api, config) {
  return registerTools(server, "confluence", createConfluenceTools(api, config));
}

export function createConfluenceServer({ config = loadConfluenceConfig(), api } = {}) {
  const client = api ?? createApiClient({
    baseUrl: config.baseUrl,
    authorization: basicAuthorization(config.username, config.token),
    userAgent: "pets-workshop-confluence-mcp/1.0",
  });
  const server = new McpServer({ name: "pets-workshop-confluence", version: "1.0.0" });
  registerConfluenceTools(server, client, config);
  return server;
}

export async function startConfluenceServer() {
  const server = createConfluenceServer();
  await server.connect(new StdioServerTransport());
  logger.info("Confluence MCP server started");
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  startConfluenceServer().catch((error) => {
    logger.error("Confluence MCP server failed to start", { message: error.message });
    process.exitCode = 1;
  });
}