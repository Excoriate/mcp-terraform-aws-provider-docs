# Developer Guide

This guide provides a clear, actionable overview for contributors and maintainers of the MCP Terraform AWS Provider Docs project. It covers project structure, setup, workflows, best practices, and troubleshooting for a modern Deno/TypeScript/DevOps codebase.

---

## 1. Overview

**Project Purpose:**
- The MCP Terraform AWS Provider Docs project is a Deno/TypeScript server that provides contextual documentation and developer tools for the AWS provider in Terragrunt workflows.
- Focus: DevOps, automation, documentation, and developer experience for infrastructure-as-code (IaC) teams.

**Audience:**
- New contributors, maintainers, and DevOps engineers.

---

## 2. Project Structure

| Path/Dir         | Purpose/Contents                                      |
|------------------|------------------------------------------------------|
| `src/`           | Main source code (entry: `src/main.ts`)              |
| `src/lib/`       | Core libraries, adapters, and utilities              |
| `src/tests/`     | Deno test files                                      |
| `docs/`          | Documentation (including this guide)                 |
| `scripts/`       | Automation scripts and pre-commit hooks              |
| `.github/`       | Workflows, issue templates, repo settings            |
| `justfile`       | Task runner for all workflows                        |
| `deno.json`      | Deno configuration and tasks                         |
| `Dockerfile`     | Containerization for local/dev/prod                  |
| `.env*`          | Environment variable files (never commit secrets)     |

---

## 3. Setup & Environment

**Prerequisites:**
- [Deno](https://deno.com/manual/getting_started/installation)
- [Docker](https://docs.docker.com/get-docker/)
- [Node.js](https://nodejs.org/) (for some scripts/hooks)

**Environment Variables:**
- `GITHUB_TOKEN` (required for some workflows and API access)

**Setup Steps:**
1. Clone the repo: `git clone <repo-url>`
2. Install Deno, Docker, Node.js as needed
3. Copy `.env.example` to `.env` and fill in required values
4. Install pre-commit hooks: `just hooks-install`

---

## 4. Development Workflow

- **Start Dev Server:** `just run-dev` or `just serve`
- **Inspector (Debug):** `just inspect` (interactive debugging)
- **Code Navigation:**
  - Main entry: `src/main.ts`
  - Core logic: `src/lib/`
  - Utilities: `src/lib/utils/`

---

## 5. Testing

- **Run All Tests:** `just test`
- **Test Location:** `src/tests/`
- **Add New Tests:** Place in `src/tests/` and follow Deno conventions
- **Coverage:** (If enabled) Use Deno's built-in coverage tools

---

## 6. Linting & Formatting

- **Lint:** `just lint`
- **Auto-fix Lint:** `just lint-fix`
- **Format:** `just fmt`
- **Config:** See `biome.json` and Deno's built-in tools

---

## 7. CI/CD & Automation

- **CI Workflows:** See `.github/workflows/` for TypeScript, Docker, labeler, etc.
- **Pre-commit Hooks:**
  - Install: `just hooks-install`
  - Run manually: `just hooks-run`
- **Branch Protection:** See `.github/settings.yml` for required checks and rules

---

## 8. Docker & Deployment

- **Build Image:** `just build-docker`
- **Run in Docker:** `just run-docker GITHUB_TOKEN=...`
- **Deployment:**
  - Ensure all config files are present
  - Use Docker best practices for production

---

## 9. Debugging & Troubleshooting

- **Inspector:** `just inspect` for live debugging
- **Logs:** Check server output and logs for errors
- **Common Issues:**
  - Path/permission errors: Use absolute paths, check Docker context
  - Config errors: Validate JSON and env vars
  - API/auth errors: Ensure `GITHUB_TOKEN` is set
- **Debugging Guide:** See `docs/mcp-debugging/Debugging - Model Context Protocol.md`

---

## 10. Contribution Guidelines

- **Formatting:** Always run `just fmt` and `just lint` before committing
- **Testing:** Cover all new features and bug fixes with tests
- **Pre-commit Hooks:** Use `just hooks-install` to enforce code quality
- **PR Etiquette:**
  - Use clear titles and descriptions
  - Reference related issues
  - Follow the [Code of Conduct](../CODE_OF_CONDUCT.md)
- **How to Contribute:**
  - Open issues or discussions for bugs/ideas
  - Use the provided issue/PR templates

---

## 11. Metadata & Versioning

| Metadata Attribute | Value Example | File Location(s) |
|-------------------|--------------|------------------|
| MCP Server Name   | `mcp-terraform-aws-provider-docs` | `README.md`, `justfile`, `deno.json`, `.github/settings.yml`, `src/lib/mcp/constants.ts` |
| MCP Server Version| `0.0.1`      | `deno.json`, `src/lib/mcp/constants.ts` |

> **Always keep these values in sync across all files when updating project metadata.**

---

## 12. Resources & Support

- [Deno Manual](https://deno.com/manual)
- [Terragrunt Docs](https://terragrunt.gruntwork.io/docs/)
- [AWS Provider Docs](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Project README](../README.md)
- [Debugging Guide](./mcp-debugging/Debugging%20-%20Model%20Context%20Protocol.md)
- **Getting Help:**
  - Open issues or discussions on GitHub
  - Review logs and Inspector output for troubleshooting

---

_This guide is maintained for contributors and maintainers. Please keep it up to date as workflows and tools evolve._
