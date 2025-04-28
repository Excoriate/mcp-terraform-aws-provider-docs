import type { Resource } from "@modelcontextprotocol/sdk/types.js";
import {
	TERRAFORM_AWS_PROVIDER_REGISTRY_URL,
	TERRAFORM_AWS_PROVIDER_REPOSITORY_URI,
} from "../utils/constants.ts";

/**
 * List of all resources available to the MCP server.
 */
export const RESOURCES: Resource[] = [
	{
		name: "terraform-aws-provider-repo",
		uri: "config://repo",
		text: TERRAFORM_AWS_PROVIDER_REPOSITORY_URI,
		mimeType: "text/plain",
	},
	{
		name: "terraform-aws-provider-registry",
		uri: "config://registry",
		text: TERRAFORM_AWS_PROVIDER_REGISTRY_URL,
		mimeType: "text/plain",
	},
];

/**
 * Lookup a resource by its URI.
 * @param uri - The resource URI to find.
 * @returns The resource if found, otherwise undefined.
 */
export function getResourceByUri(uri: string): Resource | undefined {
	return RESOURCES.find((res) => res.uri === uri);
}
