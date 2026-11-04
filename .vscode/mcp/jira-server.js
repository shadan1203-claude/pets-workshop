import axios from "axios";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

/*
 * Validate Environment Variables
 */
function validateConfig() {
  const required = [
    "JIRA_BASE_URL",
    "JIRA_USERNAME",
    "JIRA_API_TOKEN"
  ];

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`${key} is missing`);
    }
  }
}

validateConfig();

const jira = axios.create({
  baseURL: process.env.JIRA_BASE_URL,
  headers: {
    Authorization:
      "Basic " +
      Buffer.from(
        `${process.env.JIRA_USERNAME}:${process.env.JIRA_API_TOKEN}`
      ).toString("base64"),
    Accept: "application/json"
  }
});

console.error("=== Jira MCP Starting ===");
console.error("URL:", process.env.JIRA_BASE_URL);
console.error("USER:", process.env.JIRA_USERNAME);

/*
 * MCP Server
 */
const server = new McpServer({
  name: "jira-mcp",
  version: "1.0.0"
});

/* ===========================================================
   HEALTH CHECK
   =========================================================== */

server.tool(
  "healthCheck",
  "Verify Jira MCP server connectivity",
  {},
  async () => {
    try {
      const response = await jira.get("/rest/api/2/myself");

      return {
        content: [
          {
            type: "text",
            text: `Connected to Jira as ${response.data.displayName}`
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
   GET ISSUE
   =========================================================== */

server.tool(
  "getIssue",
  "Get Jira issue by issue key",
  {
    issueKey: z.string()
  },
  async ({ issueKey }) => {
    try {
      const response = await jira.get(
        `/rest/api/2/issue/${issueKey}`
      );

      const issue = response.data;

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                key: issue.key,
                summary: issue.fields.summary,
                description: issue.fields.description,
                status: issue.fields.status?.name,
                issueType: issue.fields.issuetype?.name,
                assignee:
                  issue.fields.assignee?.displayName ??
                  "Unassigned",
                reporter:
                  issue.fields.reporter?.displayName ?? "Unknown"
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
            text: `Unable to retrieve issue: ${issueKey}\n${error.message}`
          }
        ]
      };
    }
  }
);

/* ===========================================================
   SEARCH ISSUES
   =========================================================== */

server.tool(
  "searchIssues",
  "Search Jira issues using JQL",
  {
    jql: z.string()
  },
  async ({ jql }) => {
    try {
      const response = await jira.post(
        "/rest/api/2/search",
        {
          jql,
          maxResults: 20
        }
      );

      const results = response.data.issues.map(issue => ({
        key: issue.key,
        summary: issue.fields.summary,
        status: issue.fields.status?.name
      }));

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(results, null, 2)
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
   GET PROJECT
   =========================================================== */

server.tool(
  "getProject",
  "Get Jira project details",
  {
    projectKey: z.string()
  },
  async ({ projectKey }) => {
    try {
      const response = await jira.get(
        `/rest/api/2/project/${projectKey}`
      );

      const project = response.data;

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                key: project.key,
                name: project.name,
                projectTypeKey: project.projectTypeKey,
                lead: project.lead?.displayName
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
            text: `Unable to retrieve project: ${projectKey}\n${error.message}`
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

console.error("✅ Jira MCP Server Started");