import { z } from "zod";
import { listLocalAwsDatasourceDocsWithMetadata } from "../adapters/local-docs-api.ts";
import {
	formatAwsDatasourceDocAsTXT,
	parseAwsDatasourceDocMarkdown,
} from "../gh/data-formatter.ts";
import { TERRAFORM_AWS_PROVIDER_DOCS_DATASOURCES_LOCAL_DIR } from "../utils/constants.ts";
import {
	findBestFuzzyMatch,
	normaliseAWSResourceNameOrSubcategory,
	removeAwsPrefixFromFileName,
} from "../utils/fuzzy-finder.ts";

export const TOOLS_DATASOURCES_LIST_DATASOURCES_ARGS_SCHEMA = z.object({});

export const TOOLS_DATASOURCES_LIST_DATASOURCES = {
	name: "list-datasources",
	description: `
Purpose:
Lists all AWS datasource documentation files available in the Terraform AWS Provider repository, including their datasource names, file names, file paths, and direct links. Enables LLMs and clients to discover which datasources are documented and to obtain the exact file name or path needed for further queries.

When to Use:
- Use as the FIRST STEP when you do NOT know the exact file name or path for a datasource documentation file you want to retrieve.
- Use to enumerate all AWS datasources supported by the Terraform AWS Provider, with direct links to their documentation files.
- Use to build dashboards, summaries, or analytics based on the full set of provider datasources.
- Use to provide LLMs with a comprehensive, up-to-date datasource index for code generation, validation, or explanation tasks.
- Use in combination with the enhanced fuzzy search in 'get-datasource-doc' to resolve ambiguous or natural language queries to the correct datasource documentation.

Arguments:
- (none required)

Output Format:
Each result is returned as an object with these fields:
  AWS_DATASOURCE: inferred datasource name (from filename, e.g. ami)
  FILE_NAME:     file name (e.g. ami.html.markdown)
  FILE_PATH:     path in the repo (e.g. website/docs/d/ami.html.markdown)
  SOURCE:        direct link to the file on GitHub

----------------------------------------

Edge Case Handling:
- Large number of files: Pagination is handled internally; all files are returned.
- Non-datasource files: Only files ending in '.html.markdown' are included.
- Authentication Errors: Not applicable for local docs. If missing, returns an error.

Integration and Chaining:
- Use this tool to discover the correct file name or path for a datasource before calling 'get-datasource-doc'.
- Combine with 'get-datasource-doc' for robust, content-based fuzzy search and retrieval of documentation, especially for ambiguous or natural language queries.
- Use the output to drive dashboards, analytics, or automated documentation workflows.

Example Usage:
1. List all AWS datasources:
   { tool: 'list-datasources', args: {} }
2. To fetch a specific datasource doc, first use 'list-datasources' to get the FILE_NAME or FILE_PATH, then use 'get-datasource-doc' with that value.
3. For ambiguous or natural language queries, use 'get-datasource-doc' directly; it will leverage content-based fuzzy search to find the best match.

Success Criteria:
- Returns a list of file name/path/source/datasource objects, one per datasource file.
- Each object includes the inferred AWS datasource name, file name, file path, and a direct link.
- Output is LLM-optimized and ready for downstream use.
- Supports robust integration with content-based fuzzy search for advanced query resolution.
`,
	inputSchema: {
		type: "object",
		properties: {},
	},
};

export const TOOLS_DATASOURCES_GET_DATASOURCE_DOC_ARGS_SCHEMA = z.object({
	aws_datasource: z
		.string({
			description: "The AWS datasource name, e.g. ami",
		})
		.optional(),
	file_name: z
		.string({
			description: "The full file name, e.g. ami.html.markdown",
		})
		.optional(),
});

export const TOOLS_DATASOURCES_GET_DATASOURCE_DOC = {
	name: "get-datasource-doc",
	description: `
Purpose:
Fetches a single AWS datasource documentation file from the Terraform AWS Provider local docs, parses its metadata and content, and returns an LLM-optimized, decorated metadata block. Supports advanced, content-based fuzzy search to resolve ambiguous, partial, or natural language queries to the most relevant datasource documentation.

When to Use:
- Use when you know the exact file name or datasource name for the documentation you want to retrieve. If you do NOT know the file name or path, FIRST use 'list-datasources' to discover it, then call this tool.
- Use to retrieve the full documentation for a specific AWS datasource, given its datasource name or file name.
- Use to provide LLMs or clients with detailed, structured information about a single AWS datasource.
- Use for natural language, partial, or ambiguous queries: the tool will leverage content-based fuzzy search (including headings, argument names, and descriptions) to find the best match and return the relevant documentation.

Arguments:
- aws_datasource (string, optional): The AWS datasource name (e.g. ami), or any natural language/partial description. Used to construct the file path or to perform fuzzy search if file_name is not provided.
- file_name (string, optional): The full file name (e.g. ami.html.markdown). Takes precedence if provided.

Output Format:
A single object with all parsed metadata fields and decorated text, as in the list tool, but for one datasource.

Edge Case Handling:
- Returns a clear error if the file does not exist or cannot be fetched.
- Returns a clear error if neither aws_datasource nor file_name is provided.
- Handles malformed YAML or missing headings gracefully, with placeholder values.
- If the query is ambiguous or no close match is found, returns the top suggestions with the matched field for each.

Integration and Chaining:
- If you do not know the file name or path, use 'list-datasources' first to discover it, then call this tool with the correct value.
- For ambiguous or natural language queries, call this tool directly with your query; it will use content-based fuzzy search to find the best match.
- Can be used in conjunction with the list-datasources tool to fetch details for a selected datasource.
- Output is LLM-optimized and ready for downstream use.

Example Usage:
1. Fetch by datasource name:
   { tool: 'get-datasource-doc', args: { aws_datasource: 'ami' } }
2. Fetch by file name:
   { tool: 'get-datasource-doc', args: { file_name: 'ami.html.markdown' } }
3. Fetch by natural language or partial query:
   { tool: 'get-datasource-doc', args: { aws_datasource: 'EC2 AMI image' } }
4. If you do not know the file name, first call:
   { tool: 'list-datasources', args: {} }
   then use the FILE_NAME or FILE_PATH from the result in 'get-datasource-doc'.

Success Criteria:
- Returns the parsed and formatted documentation for the requested datasource.
- Handles all error cases with clear messages and suggestions.
- Supports robust, content-based fuzzy search for advanced query resolution.
`,
	inputSchema: {
		type: "object",
		properties: {
			aws_datasource: {
				type: "string",
				description:
					"The AWS datasource name, e.g. ami, or any natural language/partial description.",
			},
			file_name: {
				type: "string",
				description: "The full file name, e.g. ami.html.markdown.",
			},
		},
		required: [],
		anyOf: [{ required: ["aws_datasource"] }, { required: ["file_name"] }],
		description: "Either aws_datasource or file_name must be provided.",
	},
};

export async function listDatasourcesWithMetadata() {
	return await listLocalAwsDatasourceDocsWithMetadata();
}

export async function getDatasourceDocFromFileName(fileName: string): Promise<
	| {
			content: string;
			markdown: ReturnType<typeof parseAwsDatasourceDocMarkdown>;
	  }
	| { type: "text"; text: string }
> {
	const normalisedFileName = removeAwsPrefixFromFileName(fileName);
	let filePath = `${TERRAFORM_AWS_PROVIDER_DOCS_DATASOURCES_LOCAL_DIR}/${normalisedFileName}`;
	if (!filePath.endsWith(".html.markdown")) {
		filePath = `${filePath}.html.markdown`;
	}
	try {
		const content = await Deno.readTextFile(filePath);
		const markdown = parseAwsDatasourceDocMarkdown(content, filePath);
		return { content, markdown };
	} catch (err) {
		return {
			type: "text",
			text: `Error: Could not fetch file '${filePath}': ${err instanceof Error ? err.message : String(err)}`,
		};
	}
}

export async function resolveDatasourceDocFileNameFromAWSDatasourceName(
	awsDatasourceName: string,
): Promise<{ type: "text"; text: string }> {
	if (!awsDatasourceName) {
		return {
			type: "text",
			text: "Error: awsDatasourceName must be provided.",
		};
	}
	const normalise = normaliseAWSResourceNameOrSubcategory;
	const userNorm = normalise(awsDatasourceName);
	const datasources = await listLocalAwsDatasourceDocsWithMetadata();
	const candidates = datasources.map((d) => {
		const fileName = d.file_path.split("/").pop() || "";
		const fileNorm = normalise(fileName.replace(/\.html\.markdown$/, ""));
		const subcat = normalise(d.subcategory);
		const pageTitleNorm = d.page_title ? normalise(d.page_title) : "";
		const descNorm = d.description ? normalise(d.description) : "";
		const dsNorm = d.datasource ? normalise(d.datasource) : "";
		const headingsNorm = (d.headings || []).map(normalise);
		const argNamesNorm = (d.argument_names || []).map(normalise);
		return [
			subcat,
			fileNorm,
			pageTitleNorm,
			descNorm,
			dsNorm,
			...headingsNorm,
			...argNamesNorm,
		];
	});
	let bestMatchIdx = -1;
	let bestScore = Number.POSITIVE_INFINITY;
	let bestField = "";
	const threshold = 3;
	const fieldNames = [
		"subcategory",
		"fileName",
		"pageTitle",
		"description",
		"datasource",
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
			text: `Error: No matching AWS datasource documentation found for '${awsDatasourceName}'.`,
		};
	}
	const datasource = datasources[bestMatchIdx];
	if (!datasource || !datasource.file_path) {
		return {
			type: "text",
			text: `Error: Datasource found but file_path is missing for '${awsDatasourceName}'.`,
		};
	}
	return {
		type: "text",
		text: datasource.file_path.split("/").pop() || datasource.file_path,
	};
}
