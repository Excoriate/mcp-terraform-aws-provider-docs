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
Each result is returned as a text content item formatted with these fields:
  ID:          issue number
  TITLE:       #issue_number: issue title
  DESCRIPTION: first sentence of the issue body or 'No description provided.'
  SOURCE:      direct link to the issue on GitHub
  STATE:       open
  USER:        login of the issue author
  LABELS:      comma-separated list of label names or 'none'
  CREATED_AT:  ISO timestamp of creation
  UPDATED_AT:  ISO timestamp of last update
  COMMENTS:    number of comments

BODY:
Full issue body text.

Edge Case Handling:
- No Open Issues: Returns an empty list.
- Large Number of Issues: If all is true, the response may be paginated or truncated by the GitHub API. For most use cases, omit all to retrieve the first 30 issues.
- Missing Fields: If an issue is missing optional fields (such as body or labels), the field will be present but may be empty or an empty array.
- Authentication Errors: Requires a valid GitHub token set as GITHUB_TOKEN, GH_TOKEN, or GITHUB_PERSONAL_ACCESS_TOKEN in the environment. If missing or invalid, an error will be returned.

Integration and Chaining:
- Can be combined with the get-issue tool to correlate issues with specific resources or guides, or to fetch the full issue details.
- Use the output to drive dashboards, analytics, or automated triage workflows.

Example Usage:
1. List open issues:
   { tool: 'get-open-issues', args: { all: false } }
2. Select an issue number (e.g. 1234) and fetch details:
   { tool: 'get-issue', args: { issueNumber: 1234 } }

Success Criteria:
- Returns a list of formatted open issues with clear numbers and summaries.
- Enables following up with get-issue for detailed investigation.
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

export const TOOLS_ISSUES_GET_ISSUE_ARGS_SCHEMA = z.object({
	issueNumber: z.number({
		required_error: "The issueNumber parameter is required and must be a valid GitHub issue number. Please provide a numeric value to fetch the specific issue details.",
		invalid_type_error: "The issueNumber parameter must be a valid number. Please provide a numeric value to fetch the specific issue details.",
	}).min(1, {
		message: "The issueNumber parameter must be a positive number greater than 0. Please provide a valid issue number to fetch the specific issue details.",
	}).describe("The exact GitHub issue number to retrieve."),
});

export const TOOLS_ISSUES_GET_ISSUE = {
	name: "get-issue",
	description: `
Use this tool to fetch detailed information for a specific github issue by number from the Terraform AWS Provider GitHub repository. It's very useful to investigate a specific issue in detail, or to use in a two-step lookup workflow after using get-open-issues to list issues.

When to Use:
- Use this tool after get-open-issues when you have identified an issue number of interest.
- Use this tool directly if a github issue number is already known.
- Use this tool to obtain full description, labels, timestamps, and comment count for a single issue.

Arguments:
- issueNumber (number, required): The exact GitHub issue number to retrieve.

Output Format:
Returns one text content item formatted with these fields:
  ID:          issue number
  TITLE:       #issue_number: issue title
  DESCRIPTION: first sentence of the issue body or 'No description provided.'
  SOURCE:      direct link to the issue on GitHub
  STATE:       open or closed
  USER:        login of the issue author
  LABELS:      comma-separated list of label names or 'none'
  CREATED_AT:  ISO timestamp of creation
  UPDATED_AT:  ISO timestamp of last update
  CLOSED_AT:   ISO timestamp if closed, otherwise omitted
  COMMENTS:    number of comments

BODY:
Full issue body text.

Chaining Pattern:
This tool complements get-open-issues. First list issues, then invoke get-issue with a selected number.

Example Usage:
{ tool: 'get-open-issues', args: {} }
{ tool: 'get-issue', args: { issueNumber: 1234 } }

Success Criteria:
- Returns a single formatted issue matching the provided number.
- Works seamlessly after get-open-issues in a two-step lookup workflow.
`,
	inputSchema: {
		type: "object",
		properties: {
			issueNumber: {
				type: "number",
				description: "The GitHub issue number to retrieve",
			},
		},
		required: ["issueNumber"],
	},
};
