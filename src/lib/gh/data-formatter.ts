import { parse as parseYaml } from "jsr:@std/yaml@^1.0.6";
import type { Issue, Release } from "../adapters/github-api.ts";
import {
	TERRAFORM_AWS_PROVIDER_REPOSITORY_NAME,
	TERRAFORM_AWS_PROVIDER_REPOSITORY_URL,
} from "../utils/constants.ts";

/**
 * Type representing a GitHub Issue (partial, extend as needed)
 */

type ContentItem = { type: "text"; text: string };

/**
 * Formats a single GitHub Issue into a metadata-rich text snippet.
 *
 * @param issue - The GitHub Issue to format
 * @param baseUrl - Base URL of the GitHub repository (e.g. "https://github.com/org/repo")
 * @returns A ContentItem containing the formatted text representation of the issue
 *
 * @example
 * ```typescript
 * const issue = {
 *   number: 123,
 *   title: "Example Issue",
 *   state: "open",
 *   // ... other issue properties
 * };
 * const formatted = formatIssueSnippet(issue, "https://github.com/org/repo");
 * // Returns: { type: "text", text: "..." }
 * ```
 */
export function formatGhIssueDataAsTXT(
	issue: Issue,
	baseUrl: string,
): ContentItem {
	const description = issue.body
		? issue.body.trim().split(/(?<=\.)\s+/)[0]
		: "No description provided.";

	const issueUrl = `${baseUrl}/issues/${issue.number}`;
	const labels = issue.labels.length
		? issue.labels.map((l) => l.name).join(", ")
		: "none";

	const lines = [
		"----------------------------------------",
		`ID:          ${issue.number}`,
		`TITLE:       #${issue.number}: ${issue.title}`,
		`DESCRIPTION: ${description}`,
		`SOURCE:      ${issueUrl}`,
		`STATE:       ${issue.state}`,
		`USER:        ${issue.user.login}`,
		`LABELS:      ${labels}`,
		`CREATED_AT:  ${issue.created_at}`,
		`UPDATED_AT:  ${issue.updated_at}`,
		issue.closed_at ? `CLOSED_AT:   ${issue.closed_at}` : null,
		`COMMENTS:    ${issue.comments}`,
		"",
		"BODY:",
		issue.body ?? "*(no body)*",
	];

	return {
		type: "text",
		text: lines.filter(Boolean).join("\n"),
	};
}

/**
 * Formats an array of GitHub Issues into a structured text response.
 *
 * @param issues - Array of GitHub Issues to format
 * @param baseUrl - Base URL of the GitHub repository (e.g. "https://github.com/org/repo")
 * @returns Object containing an array of formatted content items, where each item represents a single issue
 *
 * @example
 * ```typescript
 * const response = formatGhIssuesDataAsTXT(issues, "https://github.com/org/repo");
 * // Returns: { content: [{ type: "text", text: "..." }, ...] }
 * ```
 */
export function formatGhIssuesDataAsTXT(
	issues: Issue[],
	baseUrl: string,
): { content: ContentItem[] } {
	return {
		content: issues.map((issue) => formatGhIssueDataAsTXT(issue, baseUrl)),
	};
}

/**
 * Formats a single GitHub Release into a metadata-rich text snippet.
 *
 * @param release - The GitHub Release to format
 * @param baseUrl - Base URL of the GitHub repository (e.g. "https://github.com/org/repo")
 * @returns A ContentItem containing the formatted text representation of the release
 */
function formatGhReleaseDataAsTXT(
	release: Release,
	baseUrl: string,
): ContentItem {
	const releaseUrl =
		release.html_url || `${baseUrl}/releases/tag/${release.tag_name}`;
	const description = release.body
		? release.body.trim().split(/(?<=\.)\s+/)[0]
		: "No description provided.";
	const lines = [
		"----------------------------------------",
		`ID:           ${release.id}`,
		`TAG:          ${release.tag_name}`,
		`NAME:         ${release.name ?? "(no name)"}`,
		`AUTHOR:       ${release.author?.login ?? "unknown"}`,
		`PUBLISHED_AT: ${release.published_at}`,
		`URL:          ${releaseUrl}`,
		`ASSET_COUNT:  ${release.assets?.length ?? 0}`,
		"",
		"BODY:",
		description,
	];
	return {
		type: "text",
		text: lines.filter(Boolean).join("\n"),
	};
}

/**
 * Formats an array of GitHub Releases into a structured text response.
 *
 * @param releases - Array of GitHub Releases to format
 * @param baseUrl - Base URL of the GitHub repository (e.g. "https://github.com/org/repo")
 * @returns Object containing an array of formatted content items, where each item represents a single release
 */
export function formatGhReleasesDataAsTXT(
	releases: Release[],
	baseUrl: string,
): { content: ContentItem[] } {
	return {
		content: releases.map((release) =>
			formatGhReleaseDataAsTXT(release, baseUrl),
		),
	};
}

/**
 * Formats a single GitHub Release and its referenced issues into a metadata-rich text snippet.
 *
 * @param release - The GitHub Release to format
 * @param issues - Array of GitHub Issues referenced in the release
 * @param baseUrl - Base URL of the GitHub repository (e.g. "https://github.com/org/repo")
 * @returns A ContentItem containing the formatted text representation of the release and its referenced issues
 */
export function formatGhReleaseWithIssuesDataAsTXT(
	release: Release,
	issues: Issue[],
	baseUrl: string,
): ContentItem {
	const releaseContent = formatGhReleaseDataAsTXT(release, baseUrl).text;
	let issuesContent = "";
	if (issues.length > 0) {
		issuesContent = issues
			.map((issue) =>
				[
					"",
					"REFERENCED ISSUE:",
					formatGhIssueDataAsTXT(issue, baseUrl).text,
				].join("\n"),
			)
			.join("\n");
	}
	return {
		type: "text",
		text: [releaseContent, issuesContent].filter(Boolean).join("\n"),
	};
}

/**
 * Formats an array of AWS resource documentation metadata into LLM-optimized text blocks.
 *
 * @param resources - Array of resource metadata objects
 * @returns Object containing an array of formatted content items, one per resource
 */
export function formatAwsResourceDocsAsTXT(
	resources: Array<{
		id: string;
		subcategory: string;
		page_title: string;
		description: string;
		resource: string;
		resource_description: string;
		source: string;
		file_path: string;
	}>,
): { content: { type: "text"; text: string }[] } {
	return {
		content: resources.map((res) => {
			const lines = [
				"----------------------------------------",
				`ID:                   ${res.id}`,
				`SUBCATEGORY:          ${res.subcategory}`,
				`PAGE_TITLE:           ${res.page_title}`,
				`DESCRIPTION:          ${res.description}`,
				`RESOURCE:             ${res.resource}`,
				`RESOURCE_DESCRIPTION: ${res.resource_description}`,
				`SOURCE:               ${res.source}`,
				`FILE_PATH:            ${res.file_path}`,
				`FILE_PATH_REMOTE_GIT: ${`${TERRAFORM_AWS_PROVIDER_REPOSITORY_URL}/website/docs/r/${res.file_path.split("/").pop()}`}`,
			];
			return {
				type: "text",
				text: lines.join("\n"),
			};
		}),
	};
}

/**
 * Formats an array of AWS resource doc file info into LLM-optimized text blocks.
 *
 * @param resources - Array of resource file info objects
 * @returns Object containing an array of formatted content items, one per resource
 */
export function formatAwsResourceDocFilesAsTXT(
	resources: Array<{
		aws_resource: string;
		file_name: string;
		file_path: string;
		source: string;
	}>,
): { content: { type: "text"; text: string }[] } {
	return {
		content: resources.map((res) => {
			const lines = [
				"----------------------------------------",
				`AWS_RESOURCE: ${res.aws_resource}`,
				`FILE_NAME:    ${res.file_name}`,
				`FILE_PATH:    ${res.file_path}`,
				`SOURCE:       ${res.source}`,
			];
			return {
				type: "text",
				text: lines.join("\n"),
			};
		}),
	};
}

/**
 * Parses a single AWS resource doc markdown file (frontmatter and headings) and returns metadata.
 *
 * @param content - The markdown content of the resource doc
 * @param file_path - The file path (for source field)
 * @returns Metadata object with id, subcategory, page_title, description, resource, resource_description, source, file_path
 */
export function parseAwsResourceDocMarkdown(
	content: string,
	file_path: string,
): {
	id: string;
	subcategory: string;
	page_title: string;
	description: string;
	resource: string;
	resource_description: string;
	source: string;
	file_path: string;
} {
	// Extract YAML frontmatter
	let yamlBlock = "";
	let yamlObj: unknown = {};
	let yamlMalformed = false;
	if (content.startsWith("---")) {
		const endIdx = content.indexOf("---", 3);
		if (endIdx !== -1) {
			yamlBlock = content.slice(3, endIdx).trim();
			try {
				yamlObj = parseYaml(yamlBlock) || {};
			} catch {
				yamlMalformed = true;
			}
		} else {
			yamlMalformed = true;
		}
	}
	// Extract fields from YAML
	let subcategory = "(missing)";
	let page_title = "(missing)";
	let description = "(missing)";
	if (!yamlMalformed && typeof yamlObj === "object" && yamlObj !== null) {
		const y = yamlObj as Record<string, unknown>;
		if (typeof y.subcategory === "string") subcategory = y.subcategory;
		if (typeof y.page_title === "string") page_title = y.page_title;
		if (typeof y.description === "string") description = y.description;
	} else if (yamlMalformed) {
		subcategory = "(malformed)";
		page_title = "(malformed)";
		description = "(malformed)";
	}
	// Extract # Resource: heading and first paragraph
	let resource = "(missing)";
	let resource_description = "(missing)";
	let id = "(missing)";
	const resourceMatch = content.match(/^# Resource: ([^\n]+)$/m);
	if (resourceMatch) {
		resource = resourceMatch[1].trim();
		id = resource;
		// Find the paragraph after the heading
		const afterHeading = content.split(resourceMatch[0])[1] || "";
		const paraMatch = afterHeading.match(/\n\s*([\s\S]+?)(\n{2,}|$)/);
		if (paraMatch) {
			resource_description = paraMatch[1].replace(/\n/g, " ").trim();
		}
	} else {
		// fallback: use filename as id
		id =
			file_path
				.split("/")
				.pop()
				?.replace(/\.html\.markdown$/, "") || "(missing)";
	}
	// Build source (relative path)
	const source = file_path;
	return {
		id,
		subcategory,
		page_title,
		description,
		resource,
		resource_description,
		source,
		file_path,
	};
}

/**
 * Formats a single AWS resource documentation metadata object into an LLM-optimized text block.
 *
 * @param res - Resource metadata object (as returned by parseAwsResourceDocMarkdown)
 * @param fullMarkdownBody - (optional) The full markdown body of the document
 * @returns Object with { type: 'text', text: string }
 */
export function formatAwsResourceDocAsTXT(
	res: {
		id: string;
		subcategory: string;
		page_title: string;
		description: string;
		resource: string;
		resource_description: string;
		source: string;
		file_path: string;
	},
	fullMarkdownBody?: string,
): { type: "text"; text: string } {
	const lines = [
		"----------------------------------------",
		`ID:                   ${res.id}`,
		`SUBCATEGORY:          ${res.subcategory}`,
		`PAGE_TITLE:           ${res.page_title}`,
		`DESCRIPTION:          ${res.description}`,
		`RESOURCE:             ${res.resource}`,
		`RESOURCE_DESCRIPTION: ${res.resource_description}`,
		`SOURCE:               ${res.source}`,
		`FILE_PATH:            ${res.file_path}`,
		`FILE_PATH_REMOTE_GIT: ${`${TERRAFORM_AWS_PROVIDER_REPOSITORY_URL}/website/docs/r/${res.file_path.split("/").pop()}`}`,
	];
	let text = lines.join("\n");
	if (fullMarkdownBody) {
		text += `\n\n----------------------------------------\nFULL_MARKDOWN_BODY:\n${fullMarkdownBody}`;
	}
	return {
		type: "text",
		text,
	};
}

/**
 * Formats multiple AWS resource documentation files (markdown content) into a single merged, LLM-optimized text block.
 * Each document is parsed and formatted with metadata and clear separators.
 *
 * @param docs - Array of { content: string, file_path: string }
 * @returns { type: 'text', text: string } - Single merged, formatted response
 */
export function formatAwsResourceDocsMergedAsTXT(
	docs: Array<{ content: string; file_path: string }>,
): { type: "text"; text: string } {
	const formattedDocs: string[] = [];
	for (const doc of docs) {
		const metadata = parseAwsResourceDocMarkdown(doc.content, doc.file_path);
		const formatted = formatAwsResourceDocAsTXT(metadata, doc.content);
		formattedDocs.push(formatted.text);
	}
	return {
		type: "text",
		text: formattedDocs.join("\n\n----------------------------------------\n"),
	};
}

/**
 * Parses a single AWS datasource doc markdown file (frontmatter and headings) and returns metadata.
 *
 * @param content - The markdown content of the datasource doc
 * @param file_path - The file path (for source field)
 * @returns Metadata object with id, subcategory, page_title, description, datasource, datasource_description, source, file_path
 */
export function parseAwsDatasourceDocMarkdown(
	content: string,
	file_path: string,
): {
	id: string;
	subcategory: string;
	page_title: string;
	description: string;
	datasource: string;
	datasource_description: string;
	source: string;
	file_path: string;
} {
	// Extract YAML frontmatter
	let yamlBlock = "";
	let yamlObj: unknown = {};
	let yamlMalformed = false;
	if (content.startsWith("---")) {
		const endIdx = content.indexOf("---", 3);
		if (endIdx !== -1) {
			yamlBlock = content.slice(3, endIdx).trim();
			try {
				yamlObj = parseYaml(yamlBlock) || {};
			} catch {
				yamlMalformed = true;
			}
		} else {
			yamlMalformed = true;
		}
	}
	// Extract fields from YAML
	let subcategory = "(missing)";
	let page_title = "(missing)";
	let description = "(missing)";
	if (!yamlMalformed && typeof yamlObj === "object" && yamlObj !== null) {
		const y = yamlObj as Record<string, unknown>;
		if (typeof y.subcategory === "string") subcategory = y.subcategory;
		if (typeof y.page_title === "string") page_title = y.page_title;
		if (typeof y.description === "string") description = y.description;
	} else if (yamlMalformed) {
		subcategory = "(malformed)";
		page_title = "(malformed)";
		description = "(malformed)";
	}
	// Extract # Data Source: heading and first paragraph
	let datasource = "(missing)";
	let datasource_description = "(missing)";
	let id = "(missing)";
	const datasourceMatch = content.match(/^# Data Source: ([^\n]+)$/m);
	if (datasourceMatch) {
		datasource = datasourceMatch[1].trim();
		id = datasource;
		// Find the paragraph after the heading
		const afterHeading = content.split(datasourceMatch[0])[1] || "";
		const paraMatch = afterHeading.match(/\n\s*([\s\S]+?)(\n{2,}|$)/);
		if (paraMatch) {
			datasource_description = paraMatch[1].replace(/\n/g, " ").trim();
		}
	} else {
		// fallback: use filename as id
		id =
			file_path
				.split("/")
				.pop()
				?.replace(/\.html\.markdown$/, "") || "(missing)";
	}
	// Build source (relative path)
	const source = file_path;
	return {
		id,
		subcategory,
		page_title,
		description,
		datasource,
		datasource_description,
		source,
		file_path,
	};
}

/**
 * Formats a single AWS datasource documentation metadata object into an LLM-optimized text block.
 *
 * @param res - Datasource metadata object (as returned by parseAwsDatasourceDocMarkdown)
 * @param fullMarkdownBody - (optional) The full markdown body of the document
 * @returns Object with { type: 'text', text: string }
 */
export function formatAwsDatasourceDocAsTXT(
	res: {
		id: string;
		subcategory: string;
		page_title: string;
		description: string;
		datasource: string;
		datasource_description: string;
		source: string;
		file_path: string;
	},
	fullMarkdownBody?: string,
): { type: "text"; text: string } {
	const lines = [
		"----------------------------------------",
		`ID:                   ${res.id}`,
		`SUBCATEGORY:          ${res.subcategory}`,
		`PAGE_TITLE:           ${res.page_title}`,
		`DESCRIPTION:          ${res.description}`,
		`DATASOURCE:           ${res.datasource}`,
		`DATASOURCE_DESCRIPTION: ${res.datasource_description}`,
		`SOURCE:               ${res.source}`,
		`FILE_PATH:            ${res.file_path}`,
		`FILE_PATH_REMOTE_GIT: ${`${TERRAFORM_AWS_PROVIDER_REPOSITORY_URL}/website/docs/d/${res.file_path.split("/").pop()}`}`,
	];
	let text = lines.join("\n");
	if (fullMarkdownBody) {
		text += `\n\n----------------------------------------\nFULL_MARKDOWN_BODY:\n${fullMarkdownBody}`;
	}
	return {
		type: "text",
		text,
	};
}

/**
 * Formats an array of AWS datasource documentation metadata into LLM-optimized text blocks.
 *
 * @param datasources - Array of datasource metadata objects
 * @returns Object containing an array of formatted content items, one per datasource
 */
export function formatAwsDatasourceDocsAsTXT(
	datasources: Array<{
		id: string;
		subcategory: string;
		page_title: string;
		description: string;
		datasource: string;
		datasource_description: string;
		source: string;
		file_path: string;
	}>,
): { content: { type: "text"; text: string }[] } {
	return {
		content: datasources.map((ds) => {
			const lines = [
				"----------------------------------------",
				`ID:                   ${ds.id}`,
				`SUBCATEGORY:          ${ds.subcategory}`,
				`PAGE_TITLE:           ${ds.page_title}`,
				`DESCRIPTION:          ${ds.description}`,
				`DATASOURCE:           ${ds.datasource}`,
				`DATASOURCE_DESCRIPTION: ${ds.datasource_description}`,
				`SOURCE:               ${ds.source}`,
				`FILE_PATH:            ${ds.file_path}`,
				`FILE_PATH_REMOTE_GIT: ${`${TERRAFORM_AWS_PROVIDER_REPOSITORY_URL}/website/docs/d/${ds.file_path.split("/").pop()}`}`,
			];
			return {
				type: "text",
				text: lines.join("\n"),
			};
		}),
	};
}
