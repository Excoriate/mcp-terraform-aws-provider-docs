import { z } from "zod";

export const TOOLS_RELEASES_LIST_ALL_ARGS_SCHEMA = z.object({});

export const TOOLS_RELEASES_LIST_ALL = {
	name: "list-all-releases",
	description: `
Purpose:
This tool retrieves all releases from the official Terraform AWS Provider GitHub repository. It enables LLMs and MCP clients to analyze, summarize, or report on all published versions of the provider, including metadata such as tag, name, author, published date, and asset count.

When to Use:
- To list all available versions/releases of the Terraform AWS Provider.
- To build dashboards, changelogs, or analytics based on release data.
- To correlate provider versions with documentation, issues, or upgrade guides.
- To investigate release history, release frequency, or author activity.

Arguments:
(none)
This tool does not require any arguments. It always returns the latest 100 releases (GitHub API maximum per call).

Output Format:
Each result is returned as a text content item formatted with these fields:
  ID:           release id
  TAG:          release tag (e.g. v5.96.0)
  NAME:         release name or '(no name)'
  AUTHOR:       login of the release author
  PUBLISHED_AT: ISO timestamp of publication
  URL:          direct link to the release on GitHub
  ASSET_COUNT:  number of assets attached to the release

BODY:
First sentence of the release body or 'No description provided.'

Edge Case Handling:
- No Releases: Returns an empty list.
- Large Number of Releases: Only the first 100 releases are returned per call (GitHub API limit).
- Missing Fields: If a release is missing optional fields (such as name or body), the field will be present but may be empty or a placeholder.
- Authentication Errors: Requires a valid GitHub token set as GITHUB_TOKEN, GH_TOKEN, or GITHUB_PERSONAL_ACCESS_TOKEN in the environment. If missing or invalid, an error will be returned.

Integration and Chaining:
- Can be combined with other tools to correlate releases with issues, documentation, or upgrade guides.
- Use the output to drive dashboards, analytics, or automated release workflows.

Example Usage:
1. List all releases:
   { tool: 'list-all-releases', args: {} }
2. Use the TAG or ID to fetch more details with a future tool (not yet implemented).

Success Criteria:
- Returns a list of formatted releases with clear metadata and summaries.
- Enables downstream analysis or integration with other MCP tools.
`,
	inputSchema: {
		type: "object",
		properties: {},
	},
};

export const TOOLS_RELEASES_GET_BY_TAG_ARGS_SCHEMA = z.object({
	tag: z
		.string({
			required_error:
				"The tag parameter is required and must be a valid release tag (e.g. 'v5.96.0'). Please provide a non-empty string.",
			invalid_type_error:
				"The tag parameter must be a string. Please provide a valid release tag (e.g. 'v5.96.0').",
		})
		.min(1, {
			message:
				"The tag parameter must be a non-empty string. Please provide a valid release tag (e.g. 'v5.96.0').",
		})
		.regex(/^v\d+\.\d+\.\d+$/, {
			message:
				"The tag parameter must be a valid semantic version tag (e.g. 'v5.96.0'). Please provide a tag in the format vX.Y.Z where X, Y, and Z are numbers.",
		})
		.describe("The exact release tag to retrieve (e.g. 'v5.96.0')."),
	include_issues: z
		.boolean()
		.optional()
		.default(false)
		.describe(
			"If true, will also fetch and include details for any GitHub issues referenced in the release notes (by #number pattern). Default is false.",
		),
});

export const TOOLS_RELEASES_GET_BY_TAG = {
	name: "get-release-by-tag",
	description: `
Purpose:
This tool retrieves detailed information for a specific release of the Terraform AWS Provider GitHub repository, identified by its tag (e.g. 'v5.96.0'). It enables LLMs and MCP clients to investigate a particular version in depth, including metadata such as tag, name, author, published date, asset count, and release notes. Optionally, it can also fetch and include details for any GitHub issues referenced in the release notes.

When to Use:
- Use this tool after 'list-all-releases' when you have identified a release tag of interest.
- Use this tool directly if a release tag is already known (e.g. from documentation, changelogs, or user input).
- Use this tool to obtain full metadata and summary for a single release version.
- Use this tool with 'include_issues: true' to enrich the output with details of referenced issues.

Arguments:
- tag (string, required): The exact release tag to retrieve (e.g. 'v5.96.0').
- include_issues (boolean, optional, default false): If true, will also fetch and include details for any GitHub issues referenced in the release notes (by #number pattern).

Output Format:
Returns one text content item formatted with these fields:
  ID:           release id
  TAG:          release tag (e.g. v5.96.0)
  NAME:         release name or '(no name)'
  AUTHOR:       login of the release author
  PUBLISHED_AT: ISO timestamp of publication
  URL:          direct link to the release on GitHub
  ASSET_COUNT:  number of assets attached to the release

BODY:
First sentence of the release body or 'No description provided.'

If 'include_issues' is true and issues are referenced, the output will also include a section for each referenced issue, formatted as:

  REFERENCED ISSUE:
  (issue details as in the get-issue tool)

Edge Case Handling:
- Tag Not Found: Returns an error if the specified tag does not exist.
- No Issue References: If no issues are referenced, only the release is returned.
- Missing Issues: If a referenced issue cannot be found, a note is included.
- Missing Fields: If a release or issue is missing optional fields (such as name or body), the field will be present but may be empty or a placeholder.
- Authentication Errors: Requires a valid GitHub token set as GITHUB_TOKEN, GH_TOKEN, or GITHUB_PERSONAL_ACCESS_TOKEN in the environment. If missing or invalid, an error will be returned.

Integration and Chaining:
- This tool complements 'list-all-releases'. First list releases, then invoke 'get-release-by-tag' with a selected tag.
- Use the output to correlate release details and referenced issues with documentation or upgrade guides.

Example Usage:
1. List all releases, then fetch a specific release and its referenced issues:
   { tool: 'list-all-releases', args: {} }
   { tool: 'get-release-by-tag', args: { tag: 'v5.96.0', include_issues: true } }
2. Fetch a release directly by tag (without issues):
   { tool: 'get-release-by-tag', args: { tag: 'v5.96.0' } }

Success Criteria:
- Returns a single formatted release matching the provided tag.
- If 'include_issues' is true, includes formatted details for all referenced issues found in the release notes.
- Works seamlessly after 'list-all-releases' in a two-step lookup workflow.
- Enables downstream analysis or integration with other MCP tools.
`,
	inputSchema: {
		type: "object",
		properties: {
			tag: {
				type: "string",
				description: "The exact release tag to retrieve (e.g. 'v5.96.0').",
			},
			include_issues: {
				type: "boolean",
				description:
					"If true, will also fetch and include details for any GitHub issues referenced in the release notes (by #number pattern). Default is false.",
			},
		},
		required: ["tag"],
	},
};

export const TOOLS_RELEASES_GET_LATEST_ARGS_SCHEMA = z.object({
	include_issues: z
		.boolean()
		.optional()
		.default(false)
		.describe(
			"If true, will also fetch and include details for any GitHub issues referenced in the release notes (by #number pattern). Default is false.",
		),
});

export const TOOLS_RELEASES_GET_LATEST = {
	name: "get-latest-release",
	description: `
Purpose:
This tool retrieves detailed information for the latest release of the Terraform AWS Provider GitHub repository. It enables LLMs and MCP clients to quickly access the most recent version, including metadata such as tag, name, author, published date, asset count, and release notes. Optionally, it can also fetch and include details for any GitHub issues referenced in the release notes.

When to Use:
- Use this tool to get the latest available version/release of the Terraform AWS Provider.
- Use this tool to check for new features, enhancements, or bug fixes in the most recent release.
- Use this tool with 'include_issues: true' to enrich the output with details of referenced issues.

Arguments:
- include_issues (boolean, optional, default false): If true, will also fetch and include details for any GitHub issues referenced in the release notes (by #number pattern).

Output Format:
Returns one text content item formatted with these fields:
  ID:           release id
  TAG:          release tag (e.g. v5.96.0)
  NAME:         release name or '(no name)'
  AUTHOR:       login of the release author
  PUBLISHED_AT: ISO timestamp of publication
  URL:          direct link to the release on GitHub
  ASSET_COUNT:  number of assets attached to the release

BODY:
First sentence of the release body or 'No description provided.'

If 'include_issues' is true and issues are referenced, the output will also include a section for each referenced issue, formatted as:

  REFERENCED ISSUE:
  (issue details as in the get-issue tool)

Edge Case Handling:
- No Releases: Returns an error or empty result if no releases are found.
- No Issue References: If no issues are referenced, only the release is returned.
- Missing Issues: If a referenced issue cannot be found, a note is included.
- Missing Fields: If a release or issue is missing optional fields (such as name or body), the field will be present but may be empty or a placeholder.
- Authentication Errors: Requires a valid GitHub token set as GITHUB_TOKEN, GH_TOKEN, or GITHUB_PERSONAL_ACCESS_TOKEN in the environment. If missing or invalid, an error will be returned.

Integration and Chaining:
- Use this tool to quickly check the latest version, then use 'get-release-by-tag' for historical versions.
- Use the output to correlate release details and referenced issues with documentation or upgrade guides.

Example Usage:
1. Get the latest release and its referenced issues:
   { tool: 'get-latest-release', args: { include_issues: true } }
2. Get the latest release only:
   { tool: 'get-latest-release', args: {} }

Success Criteria:
- Returns a single formatted release for the latest version.
- If 'include_issues' is true, includes formatted details for all referenced issues found in the release notes.
- Enables downstream analysis or integration with other MCP tools.
`,
	inputSchema: {
		type: "object",
		properties: {
			include_issues: {
				type: "boolean",
				description:
					"If true, will also fetch and include details for any GitHub issues referenced in the release notes (by #number pattern). Default is false.",
			},
		},
	},
};
