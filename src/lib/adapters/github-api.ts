// GitHubAdapter: A reusable Deno-compatible GitHub API client using Octokit
// Requires: https://esm.sh/@octokit/rest (Octokit for Deno)

import { Octokit } from "https://esm.sh/@octokit/rest@20.0.2";
import type { Issue } from "../utils/types.ts";

/**
 * GitHubAdapter provides authenticated, reusable methods for interacting with the GitHub API.
 *
 * All methods throw on error and require a valid GitHub personal access token.
 */
export class GitHubAdapter {
  private octokit: Octokit;

  /**
   * Create a new GitHubAdapter instance.
   * @param token - GitHub personal access token (required)
   */
  constructor(token: string) {
	if (!token || typeof token !== "string" || token.trim() === "") {
		throw new Error("GitHubAdapter: A valid GitHub personal access token is required.");
	}
    this.octokit = new Octokit({ auth: token });
  }

  /**
   * List files in a given repository and path (folder).
   * @param repo - Repository in 'owner/repo' format
   * @param path - Path within the repository (e.g. 'docs/')
   * @returns Array of file/folder names (strings)
   */
  async listFiles(repo: string, path: string): Promise<string[]> {
    const [owner, repoName] = this.#parseRepo(repo);
    try {
      const res = await this.octokit.repos.getContent({
        owner,
        repo: repoName,
        path,
      });
      if (Array.isArray(res.data)) {
        return res.data.map((
          item,
        ) => (typeof item.name === "string" ? item.name : ""));
      }
      throw new Error(`Path '${path}' is not a directory in ${repo}`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(`listFiles: ${err.message}`);
      }
      throw err;
    }
  }

  /**
   * Retrieve the full content of a file in a repository.
   * @param repo - Repository in 'owner/repo' format
   * @param path - File path within the repository
   * @returns File content as a string
   */
  async getFileContent(repo: string, path: string): Promise<string> {
    const [owner, repoName] = this.#parseRepo(repo);
    try {
      const res = await this.octokit.repos.getContent({
        owner,
        repo: repoName,
        path,
      });
      if (
        !Array.isArray(res.data) && res.data.type === "file" &&
        typeof res.data.content === "string"
      ) {
        // Deno supports atob for base64 decoding
        return atob(res.data.content.replace(/\n/g, ""));
      }
      throw new Error(
        `getFileContent: Path '${path}' is not a file in ${repo}`,
      );
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(`getFileContent: ${err.message}`);
      }
      throw err;
    }
  }

  /**
   * List issues for a repository, paginated. If 'all' is true, retrieves all issues (paginated).
   * @param repo - Repository in 'owner/repo' format
   * @param all - If true, retrieves all issues (paginated); if false, retrieves first page only
   * @returns Array of Issue objects
   */
  async listIssues(repo: string, all = false): Promise<Issue[]> {
    const [owner, repoName] = this.#parseRepo(repo);
    const perPage = 100;
    let page = 1;
    let issues: Issue[] = [];
    try {
      let keepGoing = true;
      while (keepGoing) {
        const res = await this.octokit.issues.listForRepo({
          owner,
          repo: repoName,
          per_page: perPage,
          page,
        });
        issues = issues.concat(res.data as Issue[]);
        if (!all || res.data.length < perPage) {
          keepGoing = false;
        } else {
          page++;
        }
      }
      return issues;
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(`listIssues: ${err.message}`);
      }
      throw err;
    }
  }

  /**
   * List issues for a repository by state (open, closed, all).
   * @param repo - Repository in 'owner/repo' format
   * @param state - Issue state: 'open', 'closed', or 'all'
   * @returns Array of Issue objects
   */
  async listIssuesByState(
    repo: string,
    state: "open" | "closed" | "all" = "open",
  ): Promise<Issue[]> {
    const [owner, repoName] = this.#parseRepo(repo);
    const perPage = 100;
    let page = 1;
    let issues: Issue[] = [];
    try {
      let keepGoing = true;
      while (keepGoing) {
        const res = await this.octokit.issues.listForRepo({
          owner,
          repo: repoName,
          state,
          per_page: perPage,
          page,
        });
        issues = issues.concat(res.data as Issue[]);
        if (res.data.length < perPage) {
          keepGoing = false;
        } else {
          page++;
        }
      }
      return issues;
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(`listIssuesByState: ${err.message}`);
      }
      throw err;
    }
  }

  /**
   * Retrieve the content of a specific GitHub issue.
   * @param repo - Repository in 'owner/repo' format
   * @param issueNumber - Issue number
   * @returns Issue object
   */
  async getIssueContent(repo: string, issueNumber: number): Promise<Issue> {
    const [owner, repoName] = this.#parseRepo(repo);
    try {
      const res = await this.octokit.issues.get({
        owner,
        repo: repoName,
        issue_number: issueNumber,
      });
      return res.data as Issue;
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(`getIssueContent: ${err.message}`);
      }
      throw err;
    }
  }

  /**
   * Parse a 'owner/repo' string into [owner, repo].
   * @param repo - Repository string
   * @returns [owner, repo]
   * @private
   */
  #parseRepo(repo: string): [string, string] {
    const parts = repo.split("/");
    if (parts.length !== 2) {
      throw new Error(
        `Repository must be in 'owner/repo' format, got '${repo}'`,
      );
    }
    return [parts[0], parts[1]];
  }
}
