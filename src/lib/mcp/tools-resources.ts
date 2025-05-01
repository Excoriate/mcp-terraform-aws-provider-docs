import { z } from "zod";
import { GitHubAdapter } from "../adapters/github-api.ts";
import { listLocalAwsResourceDocsWithMetadata } from "../adapters/local-docs-api.ts";
import {
	formatAwsResourceDocAsTXT,
	parseAwsResourceDocMarkdown,
} from "../gh/data-formatter.ts";
import { getAndValidateGithubToken } from "../gh/token.ts";
import {
	TERRAFORM_AWS_PROVIDER_REPOSITORY_URI,
	TERRAFORM_AWS_PROVIDER_RESOURCE_DOCS_PATH,
} from "../utils/constants.ts";
import {
	findBestFuzzyMatch,
	normaliseAWSResourceNameOrSubcategory,
	removeAwsPrefixFromFileName,
} from "../utils/fuzzy-finder.ts";
export const TOOLS_RESOURCES_LIST_RESOURCES_ARGS_SCHEMA = z.object({});

export const TOOLS_RESOURCES_LIST_RESOURCES = {
	name: "list-resources",
	description: `
Purpose:
Lists all AWS resource documentation files available in the Terraform AWS Provider repository, including their resource names, file names, file paths, and direct GitHub links. This enables LLMs and clients to discover which resources are documented and to obtain the exact file name or path needed for further queries.

When to Use:
- Use this tool as the FIRST STEP when you do NOT know the exact file name or path for a resource documentation file you want to retrieve.
- Use to enumerate all AWS resources supported by the Terraform AWS Provider, with direct links to their documentation files.
- Use to build dashboards, summaries, or analytics based on the full set of provider resources.
- Use to provide LLMs with a comprehensive, up-to-date resource index for code generation, validation, or explanation tasks.
- Use in combination with the enhanced fuzzy search in 'get-resource-doc' to resolve ambiguous or natural language queries to the correct resource documentation.

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
- Use this tool to discover the correct file name or path for a resource before calling 'get-resource-doc'.
- Combine with 'get-resource-doc' for robust, content-based fuzzy search and retrieval of documentation, especially for ambiguous or natural language queries.
- Can be combined with issue and release tools to correlate resources with known issues or changes.
- Use the output to drive dashboards, analytics, or automated documentation workflows.

Example Usage:
1. List all AWS resources:
   { tool: 'list-resources', args: {} }
2. To fetch a specific resource doc, first use 'list-resources' to get the FILE_NAME or FILE_PATH, then use 'get-resource-doc' with that value.
3. For ambiguous or natural language queries, use 'get-resource-doc' directly; it will leverage content-based fuzzy search to find the best match.

Success Criteria:
- Returns a list of file name/path/source/resource objects, one per resource file.
- Each object includes the inferred AWS resource name, file name, file path, and a direct GitHub link.
- Output is LLM-optimized and ready for downstream use.
- Supports robust integration with content-based fuzzy search for advanced query resolution.
`,
	inputSchema: {
		type: "object",
		properties: {},
	},
};

export const TOOLS_RESOURCES_GET_RESOURCE_DOC_ARGS_SCHEMA = z.object({
	aws_resource: z
		.string({
			description: "The AWS resource name, e.g. accessanalyzer_analyzer",
		})
		.optional(),
	file_name: z
		.string({
			description:
				"The full file name, e.g. accessanalyzer_analyzer.html.markdown",
		})
		.optional(),
});

export const TOOLS_RESOURCES_GET_RESOURCE_DOC = {
	name: "get-resource-doc",
	description: `
Purpose:
Fetches a single AWS resource documentation file from the Terraform AWS Provider GitHub repository, parses its metadata and content, and returns an LLM-optimized, decorated metadata block. Now supports advanced, content-based fuzzy search to resolve ambiguous, partial, or natural language queries to the most relevant resource documentation.

When to Use:
- Use this tool when you know the exact file name or resource name for the documentation you want to retrieve. If you do NOT know the file name or path, FIRST use 'list-resources' to discover it, then call this tool.
- Use to retrieve the full documentation for a specific AWS resource, given its resource name or file name.
- Use to provide LLMs or clients with detailed, structured information about a single AWS resource.
- Use for natural language, partial, or ambiguous queries: the tool will leverage content-based fuzzy search (including headings, argument names, and descriptions) to find the best match and return the relevant documentation.

Arguments:
- aws_resource (string, optional): The AWS resource name (e.g. accessanalyzer_analyzer), or any natural language/partial description. Used to construct the file path or to perform fuzzy search if file_name is not provided.
- file_name (string, optional): The full file name (e.g. accessanalyzer_analyzer.html.markdown). Takes precedence if provided.

Output Format:
A single object with all parsed metadata fields and decorated text, as in the list tool, but for one resource.

Edge Case Handling:
- Returns a clear error if the file does not exist or cannot be fetched.
- Returns a clear error if neither aws_resource nor file_name is provided.
- Handles malformed YAML or missing headings gracefully, with placeholder values.
- Requires a valid GitHub token in the environment.
- If the query is ambiguous or no close match is found, returns the top suggestions with the matched field for each.

Integration and Chaining:
- If you do not know the file name or path, use 'list-resources' first to discover it, then call this tool with the correct value.
- For ambiguous or natural language queries, call this tool directly with your query; it will use content-based fuzzy search to find the best match.
- Can be used in conjunction with the list-resources tool to fetch details for a selected resource.
- Output is LLM-optimized and ready for downstream use.

Example Usage:
1. Fetch by resource name:
   { tool: 'get-resource-doc', args: { aws_resource: 'accessanalyzer_analyzer' } }
2. Fetch by file name:
   { tool: 'get-resource-doc', args: { file_name: 'accessanalyzer_analyzer.html.markdown' } }
3. Fetch by natural language or partial query:
   { tool: 'get-resource-doc', args: { aws_resource: 'ecr Container registry policies' } }
4. If you do not know the file name, first call:
   { tool: 'list-resources', args: {} }
   then use the FILE_NAME or FILE_PATH from the result in 'get-resource-doc'.

Success Criteria:
- Returns the parsed and formatted documentation for the requested resource.
- Handles all error cases with clear messages and suggestions.
- Supports robust, content-based fuzzy search for advanced query resolution.
`,
	inputSchema: {
		type: "object",
		properties: {
			aws_resource: {
				type: "string",
				description:
					"The AWS resource name, e.g. accessanalyzer_analyzer, or any natural language/partial description.",
			},
			file_name: {
				type: "string",
				description:
					"The full file name, e.g. accessanalyzer_analyzer.html.markdown.",
			},
		},
		required: [],
		anyOf: [{ required: ["aws_resource"] }, { required: ["file_name"] }],
		description: "Either aws_resource or file_name must be provided.",
	},
};

export async function getResourceDocFromFileName(fileName: string): Promise<
	| {
			content: string;
			markdown: ReturnType<typeof parseAwsResourceDocMarkdown>;
	  }
	| { type: "text"; text: string }
> {
	// Remove "aws-" or "aws_" prefix from file name
	const normalisedFileName = removeAwsPrefixFromFileName(fileName);
	let filePathInGit = `${TERRAFORM_AWS_PROVIDER_RESOURCE_DOCS_PATH}${normalisedFileName}`;

	if (!filePathInGit.endsWith(".html.markdown")) {
		filePathInGit = `${filePathInGit}.html.markdown`;
	}

	try {
		const ghToken = getAndValidateGithubToken();
		if (!ghToken) {
			return {
				type: "text",
				text: "Error: Could not get GitHub token.",
			};
		}

		const gh = new GitHubAdapter(ghToken);
		const content = await gh.getFileContent(
			TERRAFORM_AWS_PROVIDER_REPOSITORY_URI,
			filePathInGit,
		);
		const markdown = parseAwsResourceDocMarkdown(content, filePathInGit);

		return {
			content,
			markdown,
		};
	} catch (err) {
		return {
			type: "text",
			text: `Error: Could not fetch file '${filePathInGit}' from GitHub: ${err instanceof Error ? err.message : String(err)}`,
		};
	}
}

export async function getAwsResourceDocFromGithub(args: {
	fileName: string;
}): Promise<{ type: "text"; text: string }> {
	// Validate input
	if (!args.fileName) {
		return {
			type: "text",
			text: "Error: fileName must be provided.",
		};
	}
	const fname = args.fileName;
	const file_path = `${TERRAFORM_AWS_PROVIDER_RESOURCE_DOCS_PATH}${fname}`;
	// Fetch file from GitHub
	let ghToken: string;
	try {
		ghToken = getAndValidateGithubToken();
	} catch (err) {
		return {
			type: "text",
			text: `Error: ${err instanceof Error ? err.message : String(err)}`,
		};
	}
	const gh = new GitHubAdapter(ghToken);
	let content: string;
	try {
		content = await gh.getFileContent(
			TERRAFORM_AWS_PROVIDER_REPOSITORY_URI,
			file_path,
		);
	} catch (err) {
		return {
			type: "text",
			text: `Error: Could not fetch file '${file_path}' from GitHub: ${err instanceof Error ? err.message : String(err)}`,
		};
	}
	// Parse and format
	const metadata = parseAwsResourceDocMarkdown(content, file_path);
	return formatAwsResourceDocAsTXT(metadata);
}

export async function resolveResourceDocFileNameFromAWSResourceName(
	awsResourceName: string,
): Promise<{ type: "text"; text: string }> {
	if (!awsResourceName) {
		return {
			type: "text",
			text: "Error: awsResourceName must be provided.",
		};
	}

	const normalise = normaliseAWSResourceNameOrSubcategory;
	const userNorm = normalise(awsResourceName);
	const resources = await listLocalAwsResourceDocsWithMetadata();

	// Build candidate strings for each resource: subcategory, file name (no ext), page title, description, resource_description, headings, argument_names
	const candidates = resources.map((r) => {
		const fileName = r.file_path.split("/").pop() || "";
		const fileNameNoExt = fileName.replace(/\.html\.markdown$/, "");
		const subcat = normalise(r.subcategory);
		const fileNorm = normalise(fileNameNoExt);
		const pageTitleNorm = r.page_title ? normalise(r.page_title) : "";
		const descNorm = r.description ? normalise(r.description) : "";
		const resDescNorm = r.resource_description
			? normalise(r.resource_description)
			: "";
		const headingsNorm = (r.headings || []).map(normalise);
		const argNamesNorm = (r.argument_names || []).map(normalise);
		return [
			subcat,
			fileNorm,
			pageTitleNorm,
			descNorm,
			resDescNorm,
			...headingsNorm,
			...argNamesNorm,
		];
	});

	let bestMatchIdx = -1;
	let bestScore = Number.POSITIVE_INFINITY;
	let bestField = "";
	const threshold = 3; // Use 3 if findBestFuzzyMatch only accepts 3, otherwise increase if supported
	const allScores: {
		idx: number;
		score: number;
		field: string;
		value: string;
	}[] = [];
	const fieldNames = [
		"subcategory",
		"fileName",
		"pageTitle",
		"description",
		"resource_description",
		"heading",
		"argument_name",
	];

	for (let i = 0; i < candidates.length; i++) {
		for (let j = 0; j < candidates[i].length; j++) {
			const candidate = candidates[i][j];
			if (!candidate) continue;
			const score =
				findBestFuzzyMatch(userNorm, [candidate], threshold)?.distance ??
				Number.POSITIVE_INFINITY;
			const field = fieldNames[j] || `extra_${j}`;
			allScores.push({ idx: i, score, field, value: candidate });
			if (score < bestScore) {
				bestScore = score;
				bestMatchIdx = i;
				bestField = field;
			}
		}
	}

	if (bestMatchIdx === -1) {
		return {
			type: "text",
			text: `Error: No matching AWS resource documentation found for '${awsResourceName}'.`,
		};
	}

	const resource = resources[bestMatchIdx];
	if (!resource || !resource.file_path) {
		return {
			type: "text",
			text: `Error: Resource found but file_path is missing for '${awsResourceName}'.`,
		};
	}

	return {
		type: "text",
		text: resource.file_path,
	};
}

export async function getResourceDocsByAWSResourceName(
	awsResourceName: string,
): Promise<{ type: "text"; text: string }> {
	const normalise = normaliseAWSResourceNameOrSubcategory;
	const userNorm = normalise(awsResourceName);
	const resources = await listLocalAwsResourceDocsWithMetadata();
	const matches = resources.filter(
		(r) => normalise(r.subcategory) === userNorm,
	);
	if (matches.length === 0) {
		return {
			type: "text",
			text: `Error: No matching AWS resource documentation found for subcategory '${awsResourceName}'.`,
		};
	}
	const results = matches.map((r) => {
		const fileName = r.file_path.split("/").pop() || r.file_path;
		return {
			file_path: r.file_path,
			remote_file_path: `website/docs/r/${fileName}`,
			subcategory: r.subcategory,
		};
	});
	return {
		type: "text",
		text: JSON.stringify(results, null, 2),
	};
}
