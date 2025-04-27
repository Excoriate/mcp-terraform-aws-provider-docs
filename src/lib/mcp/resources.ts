import type { Resource } from "@modelcontextprotocol/sdk/types.js";

/**
 * List of all resources available to the MCP server.
 */
export const RESOURCES: Resource[] = [
  {
    name: "terraform-provider-repo",
    uri: "config://repo",
    text: "https://github.com/terraform-providers/terraform-provider-aws",
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

