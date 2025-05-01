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
