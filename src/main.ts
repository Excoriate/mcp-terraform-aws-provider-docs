import "jsr:@std/dotenv@0.225.3/load";

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  type CallToolRequest,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { McpNotificationLogger } from "./lib/mcp/logger-events.ts";
import { MCP_SERVER_NAME, MCP_SERVER_VERSION } from "./lib/mcp/server-config.ts";
import { RESOURCES, getResourceByUri } from "./lib/mcp/resources.ts";
import { TOOLS_ISSUES_GET_OPEN_ISSUES, TOOLS_ISSUES_GET_OPEN_ISSUES_ARGS_SCHEMA } from "./lib/mcp/tools-issues.ts";
import { getAndValidateGithubToken } from "./lib/utils/github-token.ts";
import { GitHubAdapter } from "./lib/github-adater.ts";

const server = new Server(
  {
    name: MCP_SERVER_NAME,
    version: MCP_SERVER_VERSION,
  },
  {
    capabilities: {
      logging: { enabled: true },
      tools: { enabled: true },
      resources: { enabled: true },
    },
  },
);

// Logger (MCP Notification Logger)
const mcpLogger = new McpNotificationLogger(server);

// Register all resources
server.setRequestHandler(ListResourcesRequestSchema, () => ({
  resources: RESOURCES,
}));

server.setRequestHandler(
  ReadResourceRequestSchema,
  (request) => {

    const resource = getResourceByUri(request.params.uri);
    if (resource) {
      return { contents: [resource] };
    }

    throw new Error(`Resource with URI "${request.params.uri}" not found in available resources`);
  },
);

server.setRequestHandler(ListToolsRequestSchema, () => ({
  tools: [
    TOOLS_ISSUES_GET_OPEN_ISSUES,
  ],
}));

server.setRequestHandler(
  CallToolRequestSchema,
  async (request: CallToolRequest) => {
    const toolNameParam = request.params.name;
    const toolArgs = request.params.arguments;

    let ghTokenFromEnv: string;

    try {
      ghTokenFromEnv = getAndValidateGithubToken();
    } catch (error: unknown) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error handling ${toolNameParam}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
      };
    }

    switch (toolNameParam) {
      // Get all open issues
      case TOOLS_ISSUES_GET_OPEN_ISSUES.name:
        try {

          const argsValidationResult = TOOLS_ISSUES_GET_OPEN_ISSUES_ARGS_SCHEMA.safeParse(toolArgs);

          if (!argsValidationResult.success) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: `Invalid arguments: ${argsValidationResult.error.message}`,
                },
              ],
            };
          }

          // extract the validated args
          const args = argsValidationResult.data;

          const gh = new GitHubAdapter(ghTokenFromEnv);

          const issues = await gh.listIssuesByState("open");

          return {
            content: issues.map((issue) => ({
              type: "text" as const,
              text: `#${issue.number}: ${issue.title}`,
            })),
          };
        } catch (error: unknown) {
          return {
            content: [
              {
                type: "text" as const,
                text:
                  `Error handling ${TOOLS_ISSUES_GET_OPEN_ISSUES.name}: ${error}`,
              },
            ],
          };
        }
      default:
        return {
          content: [
            {
              type: "text" as const,
              text: `Unknown tool: ${toolNameParam}`,
            },
          ],
        };
    }
  },
);

const transport = new StdioServerTransport();

try {
  await server.connect(transport);

  mcpLogger.sendInfoLogMessage({
    message: "Server initialized",
  });

  mcpLogger.sendInfoLogMessage({
    message: "MCP server successfully connected and ready",
  });

  mcpLogger.sendInfoLogMessage({
    message: "Server setup complete",
  });
} catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`Failed to connect server: ${errorMessage}`);

  throw error;
}

globalThis.addEventListener("error", (event) => {
  console.error(`Uncaught error: ${event.error?.message || event.message}`);
});
