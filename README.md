# MCP Server: Terraform AWS Provider Docs

[![Language](https://img.shields.io/badge/language-Deno/TypeScript-blue.svg)](https://deno.land/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

A [Model Context Protocol (MCP)](modelcontextprotocol.io) server built with Deno and TypeScript, designed to provide contextual information related to [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest).

## Table of Contents

- [Overview](#overview)
- [Why?](#why)
- [Tools](#tools)
- [Getting Started](#getting-started)
  - [Install and Use with Claude Desktop](#install-and-use-with-claude-desktop)
    - [Using Deno](#using-deno)
    - [Using Docker](#using-docker)
  - [Installing in IDE/Editor(s)](#installing-in-ideeditors)
    - [Install on Cursor](#install-on-cursor)
    - [Install on Windsurf](#install-on-windsurf)
    - [Install on VSCode](#install-on-vscode)
- [Developing & Contributing](#developing--contributing)
  - [Run it directly from JSR](#run-it-directly-from-jsr)
  - [Debugging & Troubleshooting](#debugging--troubleshooting)
  - [Using Docker](#using-docker-1)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)

## Overview

This server acts as an MCP server, exposing tools and resources that allow AI agents or other MCP clients to query information about [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest) information, such as:

- ✅ Resources documentation.
- ✅ Provider's configuration, including ephemeral resources, guides, and functions.
- ✅ GitHub Issues (opened, closed, and all)
- ✅ AWS Resources examples 

---

## Why?

When writing IaC, or designing [terraform modules](https://www.terraform.io/language/modules), it's often required a very good knowledge, understanding and context in the actual AWS resources, features, and capabilities in order to design a production-grade module, with stable interfaces, composable, and reusable.

This MCP server is designed to provide just that, with the latest documentation, issues, and examples from the [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest) registry site. Always up-to-date, and always from the source.

## Tools

> [!IMPORTANT]
> All tools require a valid GitHub token set as an environment variable: `GITHUB_TOKEN`, `GH_TOKEN`, or `GITHUB_PERSONAL_ACCESS_TOKEN`.
>

Currently, the following tools are available (more to come, or feel free to submit an [issue](https://github.com/Excoriate/mcp-terraform-aws-provider/issues) or [PR](https://github.com/Excoriate/mcp-terraform-aws-provider/pulls)):

| Tool Name                   | Purpose                                                                 | Inputs                                   | Outputs                                                                 | Use Case                                                                                          |
|-----------------------------|-------------------------------------------------------------------------|------------------------------------------|-------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `get-all-open-issues`         | Retrieve all open issues from Terraform AWS Provider GitHub repo.                   | all (boolean, optional)                  | Array of objects with `title` (string), `number` (number), `state` (string), `created_at` (string), `updated_at` (string), `body` (string), and `labels` (string[]) | Use when you need to track or analyze current issues in the Terraform AWS Provider project, such as when building an issue dashboard, performing issue triage, or when you need to stay updated with the latest project challenges and discussions. |

## Getting Started

### Install and Use with Claude Desktop

To use this Deno-based MCP server with Claude Desktop, add the following to your `claude_desktop_config.json`:

#### Using Deno

```json
{
  "mcpServers": {
    "tf_aws_provider_docs": {
      "command": "deno",
      "args": [
        "run",
        "-A",
        "main.ts"
      ],
      "env": {
        "GITHUB_TOKEN": "<YOUR_TOKEN>"
      },
    }
  }
}
```

Or, the recommended way, with deno directly from [JSR](https://jsr.io/)

```json
{
  "mcpServers": {
    "tf_aws_provider_docs": {
      "command": "deno",
      "args": [
        "run",
        "-A",
        "jsr:@excoriate/mcp-terraform-aws-provider-docs@0.1.0"
      ],
      "env": {
        "GITHUB_TOKEN": "<YOUR_TOKEN>"
      }
    }
  }
}
```

#### Using Docker

```json
{
  "mcpServers": {
    "tf_aws_provider_docs": {
      "command": "docker",
      "args": [
        "run",
        "-e", "GITHUB_TOKEN=<YOUR_TOKEN>", "mcp-terraform-aws-provider-docs"
      ],
      "env": {
        "GITHUB_TOKEN": "<YOUR_TOKEN>"
      }
    }
  }
}
```

### Installing in IDE/Editor(s)o

#### Install on Cursor 

Go to: `Settings` -> `Cursor Settings` -> `MCP` -> `Add new global MCP server`

Pasting the following configuration into your Cursor `~/.cursor/mcp.json` file is the recommended approach. See [Cursor MCP docs](https://docs.cursor.com/context/model-context-protocol) for more info.

```json
{
  "mcpServers": {
    "tf_aws_provider_docs": {
      "command": "deno",
      "args": ["-A", "jsr:@excoriate/mcp-terraform-aws-provider-docs@latest"]
    }
  }
}
```

#### Install on Windsurf

Add this to your Windsurf MCP config file. See [Windsurf MCP docs](https://docs.windsurf.com/windsurf/mcp) for more info.

```json
{
  "mcpServers": {
    "tf_aws_provider_docs": {
      "command": "deno",
      "args": ["-A", "jsr:@excoriate/mcp-terraform-aws-provider-docs@latest"]
    }
  }
}
```

#### Install on VSCode

Add this to your VSCode MCP config file. See [VSCode MCP docs](https://code.visualstudio.com/docs/copilot/chat/mcp-servers) for more info.

```json
{
  "servers": {
    "Context7": {
      "type": "stdio",
      "command": "deno",
      "args": ["-A", "jsr:@excoriate/mcp-terraform-aws-provider-docs@latest"]
    }
  }
}
```

## Developing & Contributing

### Run it directly from JSR

You can use the MCP server directly from [JSR](https://jsr.io/) (Javascript Registry ❤️)

```sh
# export your github token
export GITHUB_TOKEN=ghp_xxx...

# run it
deno run -A jsr:@excoriate/mcp-terraform-aws-provider-docs@latest
```

### Debugging & Troubleshooting

if you want to debug it, use the built-in debugger ([inspector](https://modelcontextprotocol.io/docs/tools/inspector)). There's a justfile recipe to help you out.

```sh
# start the mcp server, and the inspector
just inspect
```

### Using Docker

Build the Docker image

```sh
docker build -t mcp-terraform-aws-provider-docs .
```

Run the MCP server in Docker
```sh
docker run -it --rm \
  -e GITHUB_TOKEN=ghp_xxx... \
  mcp-terraform-aws-provider-docs
```

> [!TIP]
> Replace `ghp_xxx...` with your [GitHub Personal Access Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) with appropriate permissions.
> 
> You can also use `GH_TOKEN` or `GITHUB_PERSONAL_ACCESS_TOKEN` as the environment variable name.
> 
> If you want to use a local `.env` file, you can pass it with `--env-file .env`.


## Contributing

See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for detailed contribution guidelines, including setup, code style, PR process, and codebase structure reference.

## Security

See [SECURITY.md](SECURITY.md) for the project's security policy, including how to report vulnerabilities and responsible disclosure guidelines.

## License

This project is licensed under the [MIT License](LICENSE).
