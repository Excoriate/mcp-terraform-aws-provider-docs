import { parse as parseYaml } from "jsr:@std/yaml@^1.0.6";
import { TERRAFORM_AWS_PROVIDER_DOCS_LOCAL_DIR } from "../utils/constants.ts";
/**
 * List all AWS resource documentation files in a local directory, extracting metadata from each file.
 *
 * @param dirPath - Path to the directory containing .html.markdown files
 * @returns Array of resource metadata objects
 */
export async function listLocalAwsResourceDocsWithMetadata(): Promise<
	Array<{
		id: string;
		subcategory: string;
		page_title: string;
		description: string;
		resource: string;
		resource_description: string;
		source: string;
		file_path: string;
	}>
> {
	const results: Array<{
		id: string;
		subcategory: string;
		page_title: string;
		description: string;
		resource: string;
		resource_description: string;
		source: string;
		file_path: string;
	}> = [];

	for await (const entry of Deno.readDir(
		TERRAFORM_AWS_PROVIDER_DOCS_LOCAL_DIR,
	)) {
		if (!entry.isFile || !entry.name.endsWith(".html.markdown")) continue;
		const file_path = `${TERRAFORM_AWS_PROVIDER_DOCS_LOCAL_DIR}/${entry.name}`;
		let content = "";
		try {
			content = await Deno.readTextFile(file_path);
		} catch {
			continue;
		}
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
			id = entry.name.replace(/\.html\.markdown$/, "");
		}
		// Build source (relative path)
		const source = file_path;
		results.push({
			id,
			subcategory,
			page_title,
			description,
			resource,
			resource_description,
			source,
			file_path,
		});
	}
	return results;
}
