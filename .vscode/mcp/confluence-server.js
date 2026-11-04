import axios from "axios";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

/*
 * Validate Environment Variables
 */
function validateConfig() {
  const required = [
    "CONFLUENCE_BASE_URL",
    "CONFLUENCE_USERNAME",
    "CONFLUENCE_API_TOKEN"
  ];

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`${key} is missing`);
    }
  }
}

validateConfig();

/*
 * Confluence Client
 */
const confluence = axios.create({
  baseURL: process.env.CONFLUENCE_BASE_URL,
  headers: {
    Authorization:
      "Basic " +
      Buffer.from(
        `${process.env.CONFLUENCE_USERNAME}:${process.env.CONFLUENCE_API_TOKEN}`
      ).toString("base64"),
    Accept: "application/json",
    "Content-Type": "application/json"
  }
});

console.error("=== Confluence MCP Starting ===");
console.error("URL:", process.env.CONFLUENCE_BASE_URL);
console.error("USER:", process.env.CONFLUENCE_USERNAME);

/*
 * MCP Server
 */
const server = new McpServer({
  name: "confluence-mcp",
  version: "1.0.0"
});

/* ===========================================================
   HEALTH CHECK
   =========================================================== */

server.tool(
  "healthCheck",
  "Verify Confluence MCP connectivity",
  {},
  async () => {
    try {
      const response = await confluence.get(
        "/rest/api/user/current"
      );

      return {
        content: [
          {
            type: "text",
            text: `Connected as ${response.data.displayName || response.data.username}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Connection failed: ${error.message}`
          }
        ]
      };
    }
  }
);

/* ===========================================================
   GET PAGE
   =========================================================== */

server.tool(
  "getPage",
  "Get a Confluence page by page ID",
  {
    pageId: z.string()
  },
  async ({ pageId }) => {
    try {
      const response = await confluence.get(
        `/rest/api/content/${pageId}?expand=body.storage,space,version`
      );

      const page = response.data;

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                id: page.id,
                title: page.title,
                space: page.space?.name,
                version: page.version?.number,
                body: page.body?.storage?.value
              },
              null,
              2
            )
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Unable to retrieve page ${pageId}: ${error.message}`
          }
        ]
      };
    }
  }
);

/* ===========================================================
   SEARCH PAGES
   =========================================================== */

server.tool(
  "searchPages",
  "Search Confluence pages using CQL",
  {
    query: z.string()
  },
  async ({ query }) => {
    try {
      const response = await confluence.get(
        "/rest/api/search",
        {
          params: {
            cql: `text ~ "${query}"`
          }
        }
      );

      const pages = (response.data.results || []).map(page => ({
        id: page.content?.id,
        title: page.title,
        url: page.url
      }));

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(pages, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Search failed: ${error.message}`
          }
        ]
      };
    }
  }
);

/* ===========================================================
   LIST SPACES
   =========================================================== */

server.tool(
  "listSpaces",
  "List available Confluence spaces",
  {},
  async () => {
    try {
      const response = await confluence.get(
        "/rest/api/space"
      );

      const spaces = (response.data.results || []).map(space => ({
        key: space.key,
        name: space.name,
        type: space.type
      }));

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(spaces, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Unable to list spaces: ${error.message}`
          }
        ]
      };
    }
  }
);

/*
 * Start MCP Server
 */
const transport = new StdioServerTransport();

await server.connect(transport);

console.error("✅ Confluence MCP Server Started");