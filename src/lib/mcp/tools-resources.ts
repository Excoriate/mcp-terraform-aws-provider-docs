import { parse as parseYaml } from "jsr:@std/yaml@^1.0.6";
import { z } from "zod";
import type { GitHubAdapter } from "../adapters/github-api.ts";
import { GitHubGraphQLAdapter } from "../adapters/github-graphql-api.ts";
import {
	TERRAFORM_AWS_PROVIDER_REPOSITORY_URI,
	TERRAFORM_AWS_PROVIDER_REPOSITORY_URL,
	TERRAFORM_AWS_PROVIDER_RESOURCE_DOCS_PATH,
} from "../utils/constants.ts";

export const TOOLS_RESOURCES_LIST_RESOURCES_ARGS_SCHEMA = z.object({
	// No arguments required for now, but allow for future pagination/filtering
});

export const TOOLS_RESOURCES_LIST_RESOURCES = {
	name: "list-resources",
	description: `
Purpose:
This tool retrieves all AWS resource documentation files from the official Terraform AWS Provider GitHub repository (in the 'website/docs/r/' directory). It is designed for LLMs and MCP clients to enable real-time discovery, triage, and contextualization of all available AWS resources supported by the provider, with rich metadata for each resource.

When to Use:
- To enumerate all AWS resources supported by the Terraform AWS Provider, with direct links to their documentation.
- To build dashboards, summaries, or analytics based on the full set of provider resources.
- To correlate resources with issues, releases, or documentation for troubleshooting or learning.
- To provide LLMs with a comprehensive, up-to-date resource index for code generation, validation, or explanation tasks.

Arguments:
- (none required)

Output Format:
Each result is returned as a text content item formatted with these fields:
  ID:                  resource name (from the first '# Resource:' heading)
  SUBCATEGORY:         AWS service or subcategory (from YAML frontmatter)
  PAGE_TITLE:          page_title (from YAML frontmatter)
  DESCRIPTION:         description (from YAML frontmatter)
  RESOURCE:            resource name (from heading)
  RESOURCE_DESCRIPTION:first paragraph after the heading
  SOURCE:              direct link to the file on GitHub
  FILE_PATH:           path in the repo (e.g. website/docs/r/aws_s3_bucket.html.markdown)

----------------------------------------

Edge Case Handling:
- Files missing YAML frontmatter: Mark fields as '(missing)' or skip as appropriate.
- Files missing '# Resource:' heading: Mark as '(missing)' or skip.
- Malformed YAML: Mark fields as '(malformed)' and continue.
- Large number of files: May be paginated in future; currently returns all.
- Non-resource files: Only files ending in '.html.markdown' are included.
- Authentication Errors: Requires a valid GitHub token set as GITHUB_TOKEN, GH_TOKEN, or GITHUB_PERSONAL_ACCESS_TOKEN in the environment. If missing or invalid, an error will be returned.

Integration and Chaining:
- Can be combined with issue and release tools to correlate resources with known issues or changes.
- Use the output to drive dashboards, analytics, or automated documentation workflows.

Example Usage:
1. List all AWS resources:
   { tool: 'list-resources', args: {} }
2. Select a resource and fetch related issues or releases:
   { tool: 'get-open-issues', args: {} }
   { tool: 'get-release-by-tag', args: { tag: 'v5.96.0' } }

Success Criteria:
- Returns a list of formatted resource metadata blocks, one per resource.
- Each block includes all required fields and a direct GitHub link.
- Handles missing or malformed files gracefully.
- Output is LLM-optimized and ready for downstream use.
`,
	inputSchema: {
		type: "object",
		properties: {},
	},
};
