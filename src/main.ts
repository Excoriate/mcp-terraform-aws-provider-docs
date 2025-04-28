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
import { GitHubAdapter } from "./lib/adapters/github-api.ts";
import type { Issue } from "./lib/adapters/github-api.ts";
import { formatGhIssuesDataAsTXT } from "./lib/gh/data-formatter.ts";
import { formatGhReleasesDataAsTXT } from "./lib/gh/data-formatter.ts";
import { formatGhReleaseWithIssuesDataAsTXT } from "./lib/gh/data-formatter.ts";
import { getAndValidateGithubToken } from "./lib/gh/token.ts";
import { McpNotificationLogger } from "./lib/mcp/logger-events.ts";
import { RESOURCES, getResourceByUri } from "./lib/mcp/resources.ts";
import {
	TOOLS_ISSUES_GET_ISSUE,
	TOOLS_ISSUES_GET_ISSUE_ARGS_SCHEMA,
	TOOLS_ISSUES_GET_OPEN_ISSUES,
	TOOLS_ISSUES_GET_OPEN_ISSUES_ARGS_SCHEMA,
} from "./lib/mcp/tools-issues.ts";
import {
	TOOLS_RELEASES_GET_BY_TAG,
	TOOLS_RELEASES_GET_BY_TAG_ARGS_SCHEMA,
	TOOLS_RELEASES_GET_LATEST,
	TOOLS_RELEASES_GET_LATEST_ARGS_SCHEMA,
	TOOLS_RELEASES_LIST_ALL,
	TOOLS_RELEASES_LIST_ALL_ARGS_SCHEMA,
} from "./lib/mcp/tools-releases.ts";
import {
	MCP_SERVER_NAME,
	MCP_SERVER_VERSION,
	TERRAFORM_AWS_PROVIDER_REPOSITORY_URI,
} from "./lib/utils/constants.ts";

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

server.setRequestHandler(ReadResourceRequestSchema, (request) => {
	const resource = getResourceByUri(request.params.uri);
	if (resource) {
		return { contents: [resource] };
	}

	throw new Error(
		`Resource with URI "${request.params.uri}" not found in available resources`,
	);
});

server.setRequestHandler(ListToolsRequestSchema, () => ({
	tools: [
		TOOLS_ISSUES_GET_OPEN_ISSUES,
		TOOLS_ISSUES_GET_ISSUE,
		TOOLS_RELEASES_LIST_ALL,
		TOOLS_RELEASES_GET_BY_TAG,
		TOOLS_RELEASES_GET_LATEST,
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
					const argsValidationResult =
						TOOLS_ISSUES_GET_OPEN_ISSUES_ARGS_SCHEMA.safeParse(toolArgs);

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

					// Initialize the GitHub adapter
					const gh = new GitHubAdapter(ghTokenFromEnv);

					// List all open issues
					const issues = await gh.listIssuesByState(
						TERRAFORM_AWS_PROVIDER_REPOSITORY_URI,
						"open",
						args.all,
					);

					// format, and parse gh issues
					const formattedGhIssues = formatGhIssuesDataAsTXT(
						issues,
						TERRAFORM_AWS_PROVIDER_REPOSITORY_URI,
					);

					// Return the issues as a list of text items
					return {
						content: formattedGhIssues.content,
					};
				} catch (error: unknown) {
					return {
						content: [
							{
								type: "text" as const,
								text: `Error handling ${TOOLS_ISSUES_GET_OPEN_ISSUES.name}: ${error}`,
							},
						],
					};
				}
			case TOOLS_ISSUES_GET_ISSUE.name:
				// Get a specific issue by number
				try {
					const result = TOOLS_ISSUES_GET_ISSUE_ARGS_SCHEMA.safeParse(toolArgs);
					if (!result.success) {
						return {
							content: [
								{
									type: "text" as const,
									text: `Invalid arguments: ${result.error.message}`,
								},
							],
						};
					}
					const { issueNumber } = result.data;
					const gh = new GitHubAdapter(ghTokenFromEnv);
					const issue = await gh.getIssueContent(
						TERRAFORM_AWS_PROVIDER_REPOSITORY_URI,
						issueNumber,
					);
					const formatted = formatGhIssuesDataAsTXT(
						[issue],
						TERRAFORM_AWS_PROVIDER_REPOSITORY_URI,
					);
					return { content: formatted.content };
				} catch (error: unknown) {
					return {
						content: [
							{
								type: "text" as const,
								text: `Error handling ${TOOLS_ISSUES_GET_ISSUE.name}: ${error instanceof Error ? error.message : String(error)}`,
							},
						],
					};
				}
			case TOOLS_RELEASES_LIST_ALL.name:
				try {
					const argsValidationResult =
						TOOLS_RELEASES_LIST_ALL_ARGS_SCHEMA.safeParse(toolArgs);
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
					const gh = new GitHubAdapter(ghTokenFromEnv);
					const releases = await gh.listReleases(
						TERRAFORM_AWS_PROVIDER_REPOSITORY_URI,
					);
					const formatted = formatGhReleasesDataAsTXT(
						releases,
						TERRAFORM_AWS_PROVIDER_REPOSITORY_URI,
					);
					return { content: formatted.content };
				} catch (error: unknown) {
					return {
						content: [
							{
								type: "text" as const,
								text: `Error handling ${TOOLS_RELEASES_LIST_ALL.name}: ${error instanceof Error ? error.message : String(error)}`,
							},
						],
					};
				}
			case TOOLS_RELEASES_GET_BY_TAG.name:
				try {
					const argsValidationResult =
						TOOLS_RELEASES_GET_BY_TAG_ARGS_SCHEMA.safeParse(toolArgs);
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
					const { tag, include_issues = false } = argsValidationResult.data;
					const gh = new GitHubAdapter(ghTokenFromEnv);
					const release = await gh.getReleaseByTag(
						TERRAFORM_AWS_PROVIDER_REPOSITORY_URI,
						tag,
					);
					if (include_issues) {
						const body = release.body || "";
						const issueNumbers = Array.from(body.matchAll(/#(\d{2,7})/g)).map(
							(m) => Number(m[1]),
						);
						const uniqueIssueNumbers = Array.from(new Set(issueNumbers));
						const issues: Issue[] = [];
						for (const issueNumber of uniqueIssueNumbers) {
							try {
								const issue = await gh.getIssueContent(
									TERRAFORM_AWS_PROVIDER_REPOSITORY_URI,
									issueNumber,
								);
								issues.push(issue);
							} catch (_) {
								issues.push({
									number: issueNumber,
									title: `Referenced issue #${issueNumber} could not be fetched`,
									state: "open",
									user: { login: "unknown" },
									labels: [],
									created_at: "",
									updated_at: "",
									comments: 0,
									body: "(Referenced issue could not be fetched or does not exist)",
								} as Issue);
							}
						}
						const formatted = formatGhReleaseWithIssuesDataAsTXT(
							release,
							issues,
							TERRAFORM_AWS_PROVIDER_REPOSITORY_URI,
						);
						return { content: [formatted] };
					}
					const formatted = formatGhReleasesDataAsTXT(
						[release],
						TERRAFORM_AWS_PROVIDER_REPOSITORY_URI,
					);
					return { content: formatted.content };
				} catch (error: unknown) {
					return {
						content: [
							{
								type: "text" as const,
								text: `Error handling ${TOOLS_RELEASES_GET_BY_TAG.name}: ${error instanceof Error ? error.message : String(error)}`,
							},
						],
					};
				}
			case TOOLS_RELEASES_GET_LATEST.name:
				try {
					const argsValidationResult =
						TOOLS_RELEASES_GET_LATEST_ARGS_SCHEMA.safeParse(toolArgs);
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
					const { include_issues = false } = argsValidationResult.data;
					const gh = new GitHubAdapter(ghTokenFromEnv);
					const releases = await gh.listReleases(
						TERRAFORM_AWS_PROVIDER_REPOSITORY_URI,
					);
					if (!releases || releases.length === 0) {
						return {
							content: [
								{
									type: "text" as const,
									text: "No releases found for the Terraform AWS Provider repository.",
								},
							],
						};
					}
					const latest = releases[0];
					if (include_issues) {
						const body = latest.body || "";
						const issueNumbers = Array.from(body.matchAll(/#(\d{2,7})/g)).map(
							(m) => Number(m[1]),
						);
						const uniqueIssueNumbers = Array.from(new Set(issueNumbers));
						const issues: Issue[] = [];
						for (const issueNumber of uniqueIssueNumbers) {
							try {
								const issue = await gh.getIssueContent(
									TERRAFORM_AWS_PROVIDER_REPOSITORY_URI,
									issueNumber,
								);
								issues.push(issue);
							} catch (_) {
								issues.push({
									number: issueNumber,
									title: `Referenced issue #${issueNumber} could not be fetched`,
									state: "open",
									user: { login: "unknown" },
									labels: [],
									created_at: "",
									updated_at: "",
									comments: 0,
									body: "(Referenced issue could not be fetched or does not exist)",
								} as Issue);
							}
						}
						const formatted = formatGhReleaseWithIssuesDataAsTXT(
							latest,
							issues,
							TERRAFORM_AWS_PROVIDER_REPOSITORY_URI,
						);
						return { content: [formatted] };
					}
					const formatted = formatGhReleasesDataAsTXT(
						[latest],
						TERRAFORM_AWS_PROVIDER_REPOSITORY_URI,
					);
					return { content: formatted.content };
				} catch (error: unknown) {
					return {
						content: [
							{
								type: "text" as const,
								text: `Error handling ${TOOLS_RELEASES_GET_LATEST.name}: ${error instanceof Error ? error.message : String(error)}`,
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
		message: `MCP server ${MCP_SERVER_NAME} version ${MCP_SERVER_VERSION} initialized`,
	});

	mcpLogger.sendInfoLogMessage({
		message: `MCP server ${MCP_SERVER_NAME} version ${MCP_SERVER_VERSION} successfully connected and ready`,
	});

	mcpLogger.sendInfoLogMessage({
		message: `MCP server ${MCP_SERVER_NAME} version ${MCP_SERVER_VERSION} setup complete`,
	});
} catch (error: unknown) {
	const errorMessage = error instanceof Error ? error.message : String(error);
	console.error(`Failed to connect server: ${errorMessage}`);

	throw error;
}

globalThis.addEventListener("error", (event) => {
	console.error(`Uncaught error: ${event.error?.message || event.message}`);
});
