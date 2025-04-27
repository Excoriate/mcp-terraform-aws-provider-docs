import { z } from "zod";

/**
 * Retrieves and validates a GitHub token from environment variables.
 *
 * @description
 * This function attempts to get a GitHub token from one of the following environment variables:
 * - GITHUB_TOKEN
 * - GH_TOKEN
 * - GITHUB_PERSONAL_ACCESS_TOKEN
 *
 * The token is then validated against the GitHubTokenSchema to ensure it meets the required format.
 *
 * @throws {Error} If no token is found in the environment variables
 * @throws {Error} If the token fails validation against GitHubTokenSchema
 *
 * @returns {string} The validated GitHub token
 */
export const getAndValidateGithubToken = (): string => {
  const token = Deno.env.get("GITHUB_TOKEN") || Deno.env.get("GH_TOKEN") ||
    Deno.env.get("GITHUB_PERSONAL_ACCESS_TOKEN");
  if (!token) {
    throw new Error(
      "GitHub token is not set in the environment (GITHUB_TOKEN or GH_TOKEN or GITHUB_PERSONAL_ACCESS_TOKEN)",
    );
  }
  const result = GitHubTokenSchema.safeParse({ githubToken: token });
  if (!result.success) {
    throw new Error(result.error.message);
  }
  return token;
};

// Base schema for GitHub Token validation - reusable for env var validation only
export const GitHubTokenSchema = z.object({
  githubToken: z
    .string({
      required_error:
        "A valid GitHub token is required for authenticating and accessing the documentation data.",
      invalid_type_error: "The GitHub token must be a string.",
    })
    .min(1, {
      message: "The GitHub token must not be empty.",
    })
    .regex(/^(gh[a-z]_[A-Za-z0-9_]{16,})$|^[a-f0-9]{40}$/, {
      message: "The GitHub token must be a valid GitHub Personal Access Token.",
    })
    .describe(
      "A valid GitHub token required for authenticating and accessing the documentation data.",
    ),
});
