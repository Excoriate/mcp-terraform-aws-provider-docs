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
import { listLocalAwsResourceDocsWithMetadata } from "./lib/adapters/local-docs-api.ts";
import {
	formatAwsResourceDocAsTXT,
	formatAwsResourceDocsAsTXT,
} from "./lib/gh/data-formatter.ts";
import { formatGhIssuesDataAsTXT } from "./lib/gh/data-formatter.ts";
import { formatGhReleasesDataAsTXT } from "./lib/gh/data-formatter.ts";
import { formatGhReleaseWithIssuesDataAsTXT } from "./lib/gh/data-formatter.ts";
import {
	formatAwsDatasourceDocAsTXT,
	formatAwsDatasourceDocsAsTXT,
} from "./lib/gh/data-formatter.ts";
import { getAndValidateGithubToken } from "./lib/gh/token.ts";
import { McpNotificationLogger } from "./lib/mcp/logger-events.ts";
import { RESOURCES, getResourceByUri } from "./lib/mcp/resources.ts";
import {
	TOOLS_DATASOURCES_GET_DATASOURCE_DOC,
	TOOLS_DATASOURCES_GET_DATASOURCE_DOC_ARGS_SCHEMA,
	TOOLS_DATASOURCES_LIST_DATASOURCES,
	TOOLS_DATASOURCES_LIST_DATASOURCES_ARGS_SCHEMA,
	getDatasourceDocFromFileName,
	listDatasourcesWithMetadata,
	resolveDatasourceDocFileNameFromAWSDatasourceName,
} from "./lib/mcp/tools-datasources.ts";
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
	TOOLS_RESOURCES_GET_RESOURCE_DOC,
	TOOLS_RESOURCES_GET_RESOURCE_DOC_ARGS_SCHEMA,
	TOOLS_RESOURCES_LIST_RESOURCES,
	TOOLS_RESOURCES_LIST_RESOURCES_ARGS_SCHEMA,
	getResourceDocFromFileName,
	resolveResourceDocFileNameFromAWSResourceName,
} from "./lib/mcp/tools-resources.ts";
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
		TOOLS_RESOURCES_LIST_RESOURCES,
		TOOLS_RESOURCES_GET_RESOURCE_DOC,
		TOOLS_DATASOURCES_LIST_DATASOURCES,
		TOOLS_DATASOURCES_GET_DATASOURCE_DOC,
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
			case TOOLS_RESOURCES_LIST_RESOURCES.name:
				try {
					const argsValidationResult =
						TOOLS_RESOURCES_LIST_RESOURCES_ARGS_SCHEMA.safeParse(toolArgs);
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

					// List by now, from local directoy.
					// FIXME: Change it in the future, for the backend that'll sync these docs with the GitHub repo.
					const resources = await listLocalAwsResourceDocsWithMetadata();
					const formatted = formatAwsResourceDocsAsTXT(resources).content;
					return { content: formatted };
				} catch (error: unknown) {
					return {
						content: [
							{
								type: "text" as const,
								text: `Error handling ${TOOLS_RESOURCES_LIST_RESOURCES.name}: ${error instanceof Error ? error.message : String(error)}`,
							},
						],
					};
				}
			case TOOLS_RESOURCES_GET_RESOURCE_DOC.name:
				try {
					const argsValidationResult =
						TOOLS_RESOURCES_GET_RESOURCE_DOC_ARGS_SCHEMA.safeParse(toolArgs);

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

					const { aws_resource, file_name } = argsValidationResult.data;

					if (file_name) {
						const result = await getResourceDocFromFileName(file_name);
						if ("type" in result && result.type === "text") {
							return { content: [result] };
						}
						// At this point, result is { content, markdown }
						const { markdown, content } = result as Exclude<
							typeof result,
							{ type: string; text: string }
						>;
						const formatted = formatAwsResourceDocAsTXT(markdown, content);
						return { content: [formatted] };
					}

					if (aws_resource) {
						const fileNameByAWSResourceName =
							await resolveResourceDocFileNameFromAWSResourceName(aws_resource);
						if (
							"type" in fileNameByAWSResourceName &&
							fileNameByAWSResourceName.type === "text"
						) {
							// If the resolver returns an error, propagate it
							if (fileNameByAWSResourceName.text.startsWith("Error:")) {
								return { content: [fileNameByAWSResourceName] };
							}
							// Otherwise, treat the text as the file path
							const result = await getResourceDocFromFileName(
								fileNameByAWSResourceName.text,
							);
							if ("type" in result && result.type === "text") {
								return { content: [result] };
							}
							// At this point, result is { content, markdown }
							const { markdown, content } = result as Exclude<
								typeof result,
								{ type: string; text: string }
							>;
							const formatted = formatAwsResourceDocAsTXT(markdown, content);
							return { content: [formatted] };
						}
					}

					// If neither file_name nor aws_resource is provided, return an error
					return {
						content: [
							{
								type: "text",
								text: "Error: file_name or aws_resource must be provided.",
							},
						],
					};
				} catch (error: unknown) {
					return {
						content: [
							{
								type: "text" as const,
								text: `Error: ${error instanceof Error ? error.message : String(error)}`,
							},
						],
					};
				}
			case TOOLS_DATASOURCES_LIST_DATASOURCES.name:
				try {
					const argsValidationResult =
						TOOLS_DATASOURCES_LIST_DATASOURCES_ARGS_SCHEMA.safeParse(toolArgs);
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
					const datasources = await listDatasourcesWithMetadata();
					const formatted = formatAwsDatasourceDocsAsTXT(datasources).content;
					return { content: formatted };
				} catch (error: unknown) {
					return {
						content: [
							{
								type: "text" as const,
								text: `Error handling ${TOOLS_DATASOURCES_LIST_DATASOURCES.name}: ${error instanceof Error ? error.message : String(error)}`,
							},
						],
					};
				}
			case TOOLS_DATASOURCES_GET_DATASOURCE_DOC.name:
				try {
					const argsValidationResult =
						TOOLS_DATASOURCES_GET_DATASOURCE_DOC_ARGS_SCHEMA.safeParse(
							toolArgs,
						);
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
					const { aws_datasource, file_name } = argsValidationResult.data;
					if (file_name) {
						const result = await getDatasourceDocFromFileName(file_name);
						if ("type" in result && result.type === "text") {
							return { content: [result] };
						}
						const { markdown, content } = result as Exclude<
							typeof result,
							{ type: string; text: string }
						>;
						const formatted = formatAwsDatasourceDocAsTXT(markdown, content);
						return { content: [formatted] };
					}
					if (aws_datasource) {
						const fileNameByAWSDatasourceName =
							await resolveDatasourceDocFileNameFromAWSDatasourceName(
								aws_datasource,
							);
						if (
							"type" in fileNameByAWSDatasourceName &&
							fileNameByAWSDatasourceName.type === "text"
						) {
							if (fileNameByAWSDatasourceName.text.startsWith("Error:")) {
								return { content: [fileNameByAWSDatasourceName] };
							}
							const result = await getDatasourceDocFromFileName(
								fileNameByAWSDatasourceName.text,
							);
							if ("type" in result && result.type === "text") {
								return { content: [result] };
							}
							const { markdown, content } = result as Exclude<
								typeof result,
								{ type: string; text: string }
							>;
							const formatted = formatAwsDatasourceDocAsTXT(markdown, content);
							return { content: [formatted] };
						}
					}
					return {
						content: [
							{
								type: "text",
								text: "Error: file_name or aws_datasource must be provided.",
							},
						],
					};
				} catch (error: unknown) {
					return {
						content: [
							{
								type: "text" as const,
								text: `Error: ${error instanceof Error ? error.message : String(error)}`,
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
