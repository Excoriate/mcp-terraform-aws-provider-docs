import { assertEquals, assertThrows } from "jsr:@std/assert";
import {
	GitHubTokenSchema,
	getAndValidateGithubToken,
} from "../lib/utils/github-token.ts";

Deno.test("GitHubTokenSchema: valid token passes validation", () => {
	const validToken = "ghp_abcdefghijklmnopqrstuvwxyz123456";
	const result = GitHubTokenSchema.safeParse({ githubToken: validToken });
	assertEquals(result.success, true);
});

Deno.test("GitHubTokenSchema: empty token fails validation", () => {
	const result = GitHubTokenSchema.safeParse({ githubToken: "" });
	assertEquals(result.success, false);
});

Deno.test("getAndValidateGithubToken: throws if no token in env", () => {
	const original = { ...Deno.env.toObject() };
	Deno.env.delete("GITHUB_TOKEN");
	Deno.env.delete("GH_TOKEN");
	Deno.env.delete("GITHUB_PERSONAL_ACCESS_TOKEN");
	assertThrows(
		() => getAndValidateGithubToken(),
		Error,
		"GitHub token is not set in the environment",
	);
	// Restore env
	for (const [k, v] of Object.entries(original)) {
		Deno.env.set(k, v);
	}
});

Deno.test("getAndValidateGithubToken: returns valid token from GITHUB_TOKEN", () => {
	const original = { ...Deno.env.toObject() };
	const validToken = "ghp_abcdefghijklmnopqrstuvwxyz123456";
	Deno.env.set("GITHUB_TOKEN", validToken);
	const token = getAndValidateGithubToken();
	assertEquals(token, validToken);
	// Restore env
	for (const [k, v] of Object.entries(original)) {
		Deno.env.set(k, v);
	}
});
