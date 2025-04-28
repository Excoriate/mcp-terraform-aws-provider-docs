import type { Resource } from "@modelcontextprotocol/sdk/types.js";

export const TERRAFORM_AWS_PROVIDER_REPOSITORY_URI =
	"https://github.com/hashicorp/terraform-aws-provider";

/**
 * List of all resources available to the MCP server.
 */
export const RESOURCES: Resource[] = [
	{
		name: "terraform-provider-repo",
		uri: "config://repo",
		text: TERRAFORM_AWS_PROVIDER_REPOSITORY_URI,
		mimeType: "text/plain",
	},
	// Add more resources here as needed
];

/**
 * Lookup a resource by its URI.
 * @param uri - The resource URI to find.
 * @returns The resource if found, otherwise undefined.
 */
export function getResourceByUri(uri: string): Resource | undefined {
	return RESOURCES.find((res) => res.uri === uri);
}
