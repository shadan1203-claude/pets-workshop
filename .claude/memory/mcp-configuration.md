# MCP Configuration and Capability Register

## Source of Truth

- Project MCP definitions are in repository-root `.mcp.json`; `.claude/settings.json` supplies server allowlisting and first-use approval policy.
- Current configured server keys are `jira`, `confluence`, `github`, and `filesystem`. The Jira, Confluence, and GitHub package names/endpoints are placeholders in `.mcp.json`; they are not verified connectors until valid package names/endpoints, credentials, and a successful connection are confirmed.
- `PROJECT_ROOT` scopes the filesystem server. Verify it resolves to the intended repository root and least-privilege directory before approving the server.
- Never put actual tokens, passwords, private keys, or sensitive environment values in this file or committed config. Supply credentials through approved environment/secret storage.

## Capability Register

Do not assume a server's capability from its name. Verify the live tool list from `/mcp` or the connected server's discovery output and record the date/version/source before relying on it.

| Server | Verified supported tools | Verified unsupported tools | Current status |
| --- | --- | --- | --- |
| Jira MCP (`jira`) | Not Found - verify after connection | Not Found - verify after connection | Configured with package placeholder; unverified |
| Confluence MCP (`confluence`) | Not Found - verify after connection | Not Found - verify after connection | Configured with package placeholder; unverified |
| GitHub MCP (`github`) | Not Found - verify after connection | Not Found - verify after connection | Configured with package placeholder; unverified |
| Filesystem MCP (`filesystem`) | Not Found - verify installed server's advertised tools | Not Found - verify installed server's advertised tools | Official package configured; verify connection and root scope |

## Update Rules

- Update this register only after observing actual server/tool discovery or a verified configuration change. Include server version, verified date, and evidence location.
- Never claim connection, tool support, write capability, authentication, or success from config presence alone.
- Record known unsupported tools only when the server explicitly omits/rejects them or authoritative server documentation establishes the limitation.

## Illustrative Entry

`jira_search` may be written as a sample tool name only. It is not asserted to exist on the configured Jira server until verified in its discovered tool list.