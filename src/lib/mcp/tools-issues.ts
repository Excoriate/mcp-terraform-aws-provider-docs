import { z } from "zod";

export const TOOLS_ISSUES_GET_OPEN_ISSUES_ARGS_SCHEMA = z.object({
	all: z.boolean().optional(),
});

export const TOOLS_ISSUES_GET_OPEN_ISSUES = {
	name: "get-open-issues",
	description: `
Purpose:
This tool retrieves all open issues from the official Terraform AWS Provider GitHub repository. It is designed for LLMs and MCP clients to enable real-time issue triage, dashboarding, and integration with documentation or workflow automation.

When to Use:
- To analyze, triage, or report on current open issues in the Terraform AWS Provider project.
- To build dashboards, summaries, or analytics based on live issue data.
- To correlate open issues with documentation, code, or other terraform example or troubleshooting resources.
- To understand if a given terraform behavior is expected or not, or it's related to a known issue.

Arguments:
- all (boolean, optional):
    If true, retrieves the complete list of all open issues (may be slow for large repositories).
    If false or omitted, retrieves only the first 30 open issues (recommended for most use cases).
    Use all: true only when exhaustive analysis is required, as this may be subject to GitHub API rate limits.

Output Format:
Returns a list of GitHub issues, each as an object with the following fields:
  number (number): Unique issue number.
  title (string): Issue title.
  state (string): Issue state (always 'open' for this tool).
  body (string): Full issue description (may be empty).
  user (object): Author information (login: string).
  labels (array): List of label objects (name: string).
  created_at (string): ISO timestamp of issue creation.
  updated_at (string): ISO timestamp of last update.
  closed_at (string or null): Always null for open issues.
  comments (number): Number of comments on the issue.
  url (string): Direct link to the issue on GitHub.

The output is returned as a list of text content items, each containing a formatted issue summary and full body, as defined in the GitHub issue formatter (see src/lib/gh/issues.ts and main.ts for details).

Edge Case Handling:
- No Open Issues: Returns an empty list.
- Large Number of Issues: If all is true, the response may be paginated or truncated by the GitHub API. For most use cases, omit all to retrieve the first 30 issues.
- Missing Fields: If an issue is missing optional fields (such as body or labels), the field will be present but may be empty or an empty array.
- Authentication Errors: Requires a valid GitHub token set as GITHUB_TOKEN, GH_TOKEN, or GITHUB_PERSONAL_ACCESS_TOKEN in the environment. If missing or invalid, an error will be returned.

Integration and Chaining:
- Can be combined with documentation tools to correlate issues with specific resources or guides.
- Use the output to drive dashboards, analytics, or automated triage workflows.
- For closed issues or additional filtering, use related tools or specify additional arguments if available.

Example Usage:
Retrieve the first 30 open issues:
  { tool: 'get-open-issues', args: {} }

Retrieve all open issues (may be slow):
  { tool: 'get-open-issues', args: { all: true } }

Success Criteria:
- Returns a structured list of open issues with all documented fields.
- Handles empty results, large volumes, and error conditions gracefully.
- Output is optimized for LLM parsing and downstream workflow integration.
`,
	inputSchema: {
		type: "object",
		properties: {
			all: {
				type: "boolean",
				description:
					"Controls pagination behavior - when true, fetches all pages of issues; when false, only returns the first page (30 issues)",
			},
		},
	},
};
