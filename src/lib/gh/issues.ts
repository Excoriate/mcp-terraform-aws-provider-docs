/**
 * Type representing a GitHub Issue (partial, extend as needed)
 */
export interface Issue {
	number: number;
	title: string;
	state: "open" | "closed";
	body?: string;
	user: { login: string };
	labels: Array<{ name: string }>;
	created_at: string;
	updated_at: string;
	closed_at?: string;
	comments: number;
}

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
