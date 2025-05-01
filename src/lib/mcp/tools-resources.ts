import { z } from "zod";
import { listLocalAwsResourceDocsWithMetadata } from "../adapters/local-docs-api.ts";
import { formatAwsResourceDocsAsTXT } from "../gh/data-formatter.ts";

export const TOOLS_RESOURCES_LIST_RESOURCES_ARGS_SCHEMA = z.object({
	// No arguments required for now, but allow for future pagination/filtering
});

export const TOOLS_RESOURCES_LIST_RESOURCES = {
	name: "list-resources",
	description: `
Purpose:
This tool retrieves all AWS resource documentation file names and metadata for LLMs and MCP clients to enable real-time discovery, triage, and contextualization of all available AWS resources supported by the provider, with file name, path, and inferred AWS resource name for each resource.

When to Use:
- To enumerate all AWS resources supported by the Terraform AWS Provider, with direct links to their documentation files.
- To build dashboards, summaries, or analytics based on the full set of provider resources.
- To provide LLMs with a comprehensive, up-to-date resource index for code generation, validation, or explanation tasks.

Arguments:
- (none required)

Output Format:
Each result is returned as an object with these fields:
  AWS_RESOURCE: inferred resource name (from filename, e.g. accessanalyzer_analyzer)
  FILE_NAME:    file name (e.g. accessanalyzer_analyzer.html.markdown)
  FILE_PATH:    path in the repo (e.g. website/docs/r/accessanalyzer_analyzer.html.markdown)
  SOURCE:       direct link to the file on GitHub

----------------------------------------

Edge Case Handling:
- Large number of files: Pagination is handled internally; all files are returned.
- Non-resource files: Only files ending in '.html.markdown' are included.
- Authentication Errors: Requires a valid GitHub token set as GITHUB_TOKEN, GH_TOKEN, or GITHUB_PERSONAL_ACCESS_TOKEN in the environment. If missing or invalid, an error will be returned.

Integration and Chaining:
- Can be combined with issue and release tools to correlate resources with known issues or changes.
- Use the output to drive dashboards, analytics, or automated documentation workflows.

Example Usage:
1. List all AWS resources:
   { tool: 'list-resources', args: {} }

Success Criteria:
- Returns a list of file name/path/source/resource objects, one per resource file.
- Each object includes the inferred AWS resource name, file name, file path, and a direct GitHub link.
- Output is LLM-optimized and ready for downstream use.
`,
	inputSchema: {
		type: "object",
		properties: {},
	},
};

/**
 * List all AWS resource documentation files and extract metadata from local files.
 *
 * @returns Array of resource metadata objects
 */
export async function listAwsResourceDocsWithMetadataFromLocal(): Promise<
	ReturnType<typeof formatAwsResourceDocsAsTXT>["content"]
> {
	// Use absolute path for local resource docs directory
	const dirPath = new URL(
		"../../data/remote-docs/tf-aws-resources",
		import.meta.url,
	).pathname;
	const resources = await listLocalAwsResourceDocsWithMetadata(dirPath);
	return formatAwsResourceDocsAsTXT(resources).content;
}
