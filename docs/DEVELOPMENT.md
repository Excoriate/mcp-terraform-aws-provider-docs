# Development Guide

This document provides a comprehensive overview of the development workflow for maintainers and contributors to the MCP Terraform AWS Provider Docs project. It covers all available `justfile` recipes, usage patterns, and best practices for debugging and maintaining the MCP server.

---

## Table of Contents
- [Project Structure](#project-structure)
- [Justfile Recipes](#justfile-recipes)
  - [Development and Running](#development-and-running)
  - [Testing](#testing)
  - [Linting and Formatting](#linting-and-formatting)
  - [Pre-commit Hooks](#pre-commit-hooks)
  - [Docker](#docker)
  - [Cleaning Artifacts](#cleaning-artifacts)
- [Debugging and Troubleshooting](#debugging-and-troubleshooting)
- [Best Practices](#best-practices)
- [Getting Help](#getting-help)

---

## Project Structure

- **src/**: Main source code for the MCP server (entry point: `src/main.ts`).
- **src/lib/**: Core libraries, adapters, and utilities.
- **src/tests/**: Deno test files for unit and integration testing.
- **docs/**: Project documentation, including debugging guides and this development guide.
- **justfile**: Task runner recipes for development, testing, linting, Docker, and more.
- **deno.json**: Deno configuration, including tasks and import mappings.

---

## Justfile Recipes

The `justfile` provides a set of standardized commands for common development tasks. These recipes are designed for maintainers and contributors to streamline workflows and ensure consistency.

### Development and Running

- **run-dev**
  - Starts the development server using the Deno task defined in `deno.json`.
  - Usage: `just run-dev`
  - _Tip: Use this for local development and quick iteration._

- **serve**
  - Alias for `run-dev`.

- **inspect**
  - Starts the MCP server with the MCP Inspector attached via stdio for interactive debugging.
  - Usage: `just inspect`
  - _Inspector provides a direct interface for testing and debugging the server. See [Inspector Guide](https://modelcontextprotocol.io/docs/tools/inspector) for details._

### Testing

- **test**
  - Runs all Deno tests in the `src/tests/` directory.
  - Usage: `just test`
  - _Ensure all new features and bug fixes are covered by tests. See [Deno Testing Docs](https://docs.deno.com/runtime/fundamentals/testing/)._

### Linting and Formatting

- **lint**
  - Runs the Deno linter using the configuration in `biome.json`.
  - Usage: `just lint`

- **lint-fix**
  - Automatically fixes linting errors using the Deno linter.
  - Usage: `just lint-fix`

- **fmt**
  - Formats all code using the Deno formatter.
  - Usage: `just fmt`

- **ci**
  - Runs lint, format, and test checks as a CI preflight.
  - Usage: `just ci`
  - _Recommended before submitting a pull request._

### Pre-commit Hooks

- **hooks-install**
  - Installs pre-commit hooks for code consistency.
  - Usage: `just hooks-install`

- **hooks-run**
  - Runs all pre-commit hooks manually.
  - Usage: `just hooks-run`

### Docker

- **build-docker**
  - Builds the Docker image for the MCP server.
  - Usage: `just build-docker`
  - _Image name is set by `MCP_SERVER_NAME` (default: `mcp-terraform-aws-provider-docs`)._

- **run-docker**
  - Runs the MCP server in Docker, passing the `GITHUB_TOKEN` as an environment variable.
  - Usage: `just run-docker GITHUB_TOKEN=ghp_xxx...`
  - _Ensure you have built the image with `just build-docker` first._

### Cleaning Artifacts

- **clean**
  - Removes build artifacts and cleans up common files (e.g., `build/`, `dist/`, `out/`, `.DS_Store`).
  - Usage: `just clean`

---

## Debugging and Troubleshooting

Refer to the [Debugging - Model Context Protocol](./mcp-debugging/Debugging%20-%20Model%20Context%20Protocol.md) guide for in-depth debugging strategies. Key points:

- **Inspector**: Use `just inspect` to launch the MCP Inspector for interactive debugging and direct server testing.
- **Logs**: Monitor server logs for connection events, errors, and tool execution. Use structured logging for clarity.
- **Environment Variables**: Always use absolute paths and explicitly set required environment variables (e.g., `GITHUB_TOKEN`).
- **Docker**: If debugging in Docker, ensure all config files (e.g., `deno.json`) are copied before running the server.
- **Common Issues**:
  - Path or permission errors: Use absolute paths and check Docker context.
  - Configuration errors: Validate JSON and environment variables.
  - Connection problems: Use Inspector and logs to diagnose.

---

## Best Practices

- **Consistent Formatting**: Always run `just fmt` and `just lint` before committing.
- **Testing**: Write and run tests for all new features and bug fixes (`just test`).
- **Pre-commit Hooks**: Use `just hooks-install` to enforce code quality.
- **Docker**: Use `just build-docker` and `just run-docker` for containerized development and deployment.
- **Debugging**: Leverage Inspector and logs for troubleshooting. See [Debugging Guide](./mcp-debugging/Debugging%20-%20Model%20Context%20Protocol.md).
- **Documentation**: Update this guide and other docs as workflows evolve.

---

## Getting Help

- **First Steps**: Check logs, use Inspector, and review configuration.
- **Support Channels**: Open issues or discussions on GitHub.
- **When Reporting Issues**: Include log excerpts, configuration files, steps to reproduce, and environment details.

---

_This guide is maintained for contributors and maintainers. Please keep it up to date as workflows and tools evolve._
