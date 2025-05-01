import { parse as parseYaml } from "jsr:@std/yaml@^1.0.6";
import {
	TERRAFORM_AWS_PROVIDER_DOCS_DATASOURCES_LOCAL_DIR,
	TERRAFORM_AWS_PROVIDER_DOCS_RESOURCES_LOCAL_DIR,
} from "../utils/constants.ts";
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
		headings: string[];
		argument_names: string[];
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
		headings: string[];
		argument_names: string[];
	}> = [];

	for await (const entry of Deno.readDir(
		TERRAFORM_AWS_PROVIDER_DOCS_RESOURCES_LOCAL_DIR,
	)) {
		if (!entry.isFile || !entry.name.endsWith(".html.markdown")) continue;
		const file_path = `${TERRAFORM_AWS_PROVIDER_DOCS_RESOURCES_LOCAL_DIR}/${entry.name}`;
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
		// Extract all top-level headings (## ...)
		const headings = Array.from(content.matchAll(/^##\s+(.+)$/gm)).map((m) =>
			m[1].trim(),
		);
		// Extract argument names from Argument Reference section
		let argument_names: string[] = [];
		const argRefMatch = content.match(
			/## Argument Reference([\s\S]+?)(^## |^# |\n# |\n## |$)/m,
		);
		if (argRefMatch) {
			const argSection = argRefMatch[1];
			argument_names = Array.from(argSection.matchAll(/\*\s*`([^`]+)`/g)).map(
				(m) => m[1].trim(),
			);
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
			headings,
			argument_names,
		});
	}
	return results;
}

/**
 * List all AWS datasource documentation files in a local directory, extracting metadata from each file.
 *
 * @returns Array of datasource metadata objects
 */
export async function listLocalAwsDatasourceDocsWithMetadata(): Promise<
	Array<{
		id: string;
		subcategory: string;
		page_title: string;
		description: string;
		datasource: string;
		datasource_description: string;
		source: string;
		file_path: string;
		headings: string[];
		argument_names: string[];
	}>
> {
	const results: Array<{
		id: string;
		subcategory: string;
		page_title: string;
		description: string;
		datasource: string;
		datasource_description: string;
		source: string;
		file_path: string;
		headings: string[];
		argument_names: string[];
	}> = [];

	for await (const entry of Deno.readDir(
		TERRAFORM_AWS_PROVIDER_DOCS_DATASOURCES_LOCAL_DIR,
	)) {
		if (!entry.isFile || !entry.name.endsWith(".html.markdown")) continue;
		const file_path = `${TERRAFORM_AWS_PROVIDER_DOCS_DATASOURCES_LOCAL_DIR}/${entry.name}`;
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
		// Extract # Data Source: heading and first paragraph
		let datasource = "(missing)";
		let datasource_description = "(missing)";
		let id = "(missing)";
		const datasourceMatch = content.match(/^# Data Source: ([^\n]+)$/m);
		if (datasourceMatch) {
			datasource = datasourceMatch[1].trim();
			id = datasource;
			// Find the paragraph after the heading
			const afterHeading = content.split(datasourceMatch[0])[1] || "";
			const paraMatch = afterHeading.match(/\n\s*([\s\S]+?)(\n{2,}|$)/);
			if (paraMatch) {
				datasource_description = paraMatch[1].replace(/\n/g, " ").trim();
			}
		} else {
			// fallback: use filename as id
			id = entry.name.replace(/\.html\.markdown$/, "");
		}
		// Extract all top-level headings (## ...)
		const headings = Array.from(content.matchAll(/^##\s+(.+)$/gm)).map((m) =>
			m[1].trim(),
		);
		// Extract argument names from Argument Reference section
		let argument_names: string[] = [];
		const argRefMatch = content.match(
			/## Argument Reference([\s\S]+?)(^## |^# |\n# |\n## |$)/m,
		);
		if (argRefMatch) {
			const argSection = argRefMatch[1];
			argument_names = Array.from(argSection.matchAll(/\*\s*`([^`]+)`/g)).map(
				(m) => m[1].trim(),
			);
		}
		// Build source (relative path)
		const source = file_path;
		results.push({
			id,
			subcategory,
			page_title,
			description,
			datasource,
			datasource_description,
			source,
			file_path,
			headings,
			argument_names,
		});
	}
	return results;
}
