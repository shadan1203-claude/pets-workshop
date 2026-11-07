import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MCP_ROOT = fileURLToPath(new URL("..", import.meta.url));
// mcp/.env wins; dotenv never overrides variables that are already set.
dotenv.config({ path: path.join(MCP_ROOT, ".env"), quiet: true });
dotenv.config({ path: path.join(MCP_ROOT, "..", ".env"), quiet: true });

function required(name) {
  const value = process.env[name]?.trim();
  if (!value || /^\$\{[^}]+\}$/.test(value) || /^(change.?me|your[_ -])/i.test(value)) {
    throw new Error(`Missing or placeholder environment variable: ${name}`);
  }
  return value;
}

function baseUrl(name, { appendPath = "", optionalDefault } = {}) {
  const raw = optionalDefault && !process.env[name]?.trim()
    ? optionalDefault
    : required(name);
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(`${name} must be a valid absolute URL`);
  }

  const localHttp = parsed.protocol === "http:" && ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname);
  if (parsed.protocol !== "https:" && !localHttp) {
    throw new Error(`${name} must use HTTPS (HTTP is allowed only for localhost)`);
  }
  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error(`${name} must not contain credentials, query parameters, or a fragment`);
  }

  let pathname = parsed.pathname.replace(/\/+$/, "");
  if (appendPath && !pathname.endsWith(appendPath)) pathname += appendPath;
  parsed.pathname = `${pathname}/`;
  return parsed.toString();
}

export function loadJiraConfig() {
  return {
    baseUrl: baseUrl("JIRA_BASE_URL"),
    username: required("JIRA_USERNAME"),
    token: required("JIRA_API_TOKEN"),
  };
}

export function loadConfluenceConfig() {
  return {
    baseUrl: baseUrl("CONFLUENCE_BASE_URL", { appendPath: "/wiki" }),
    username: required("CONFLUENCE_USERNAME"),
    token: required("CONFLUENCE_API_TOKEN"),
  };
}

export function loadGitHubConfig() {
  return {
    baseUrl: baseUrl("GITHUB_API_URL", { optionalDefault: "https://api.github.com" }),
    token: required("GITHUB_TOKEN"),
  };
}

export function getMcpRoot() {
  return MCP_ROOT;
}