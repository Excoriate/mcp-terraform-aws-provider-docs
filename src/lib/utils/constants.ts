export const MCP_SERVER_NAME = "mcp-terraform-aws-provider-docs";
export const MCP_SERVER_VERSION = "0.0.1";
// Use this for GitHub API calls (owner/repo format)
export const TERRAFORM_AWS_PROVIDER_REPOSITORY_URI =
	"hashicorp/terraform-provider-aws";
// Use this for documentation or hyperlinks
export const TERRAFORM_AWS_PROVIDER_REPOSITORY_URL =
	"https://github.com/hashicorp/terraform-provider-aws";
export const TERRAFORM_AWS_PROVIDER_REPOSITORY_OWNER = "hashicorp";
export const TERRAFORM_AWS_PROVIDER_REPOSITORY_NAME = "terraform-provider-aws";
export const TERRAFORM_AWS_PROVIDER_REGISTRY_URL =
	"https://registry.terraform.io/providers/hashicorp/aws/latest";
export const TERRAFORM_AWS_PROVIDER_RESOURCE_DOCS_PATH = "website/docs/r/";
export const TERRAFORM_AWS_PROVIDER_DOCS_LOCAL_DIR = new URL(
	"../../data/remote-docs/tf-aws-resources",
	import.meta.url,
).pathname;
