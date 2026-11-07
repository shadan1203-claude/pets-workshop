import { createLogger } from "./logger.js";

export function registerTools(server, serverName, definitions) {
  const logger = createLogger(serverName);
  for (const definition of definitions) {
    server.registerTool(
      definition.name,
      {
        description: definition.description,
        inputSchema: definition.inputSchema,
      },
      async (input) => {
        try {
          const result = await definition.handler(input);
          return {
            content: [{ type: "text", text: JSON.stringify(result) }],
            structuredContent: result,
          };
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unexpected tool failure";
          logger.error("Tool call failed", { tool: definition.name, message });
          return {
            isError: true,
            content: [{ type: "text", text: message }],
          };
        }
      },
    );
  }
  return definitions.map(({ name }) => name);
}