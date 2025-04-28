import { z } from "zod";

export const TOOLS_ISSUES_GET_OPEN_ISSUES_ARGS_SCHEMA = z.object({
	all: z.boolean().optional(),
});

export const TOOLS_ISSUES_GET_OPEN_ISSUES = {
	name: "get-open-issues",
	description: `Use this tool to retrieve all open issues from the official Terragrunt GitHub repository. This tool is essential for tracking bugs, feature requests, and ongoing work.

**When to use:**
- When you need to fetch the complete list of open issues for triage, reporting, or analysis.
- When you want to monitor the current state of the Terragrunt issue tracker.
- For building dashboards, reports, or integrations that require up-to-date issue data.

**How to chain:**
- If you need to correlate issues with documentation, use the documentation tools in combination.

**Inputs:**
- all (optional): Whether to retrieve all open issues or just the first 30.

**Outputs:**
- List of open issues with detailed metadata (ID, title, state, URL, labels, author, timestamps, etc.).

**Related tools:**
- Documentation tools (to correlate issues with docs)

**Example workflow:**
1. Call 'get-all-open-issues' with or without the 'all' flag.
2. Present or process the returned issues as needed.
`,
	inputSchema: {
		type: "object",
		properties: {
			all: {
				type: "boolean",
				description: "Whether to retrieve all open issues or not",
			},
		},
	},
};
