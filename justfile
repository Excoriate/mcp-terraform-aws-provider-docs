# 🐚 Set the default shell to bash with error handling
set shell := ["bash", "-uce"]

set dotenv-load

# --- Variables ---
# Add any project-specific variables here if needed
MAIN_FILE := "main.ts"
# Permissions needed for running/testing the server (adjust as necessary)
PERMISSIONS := "--allow-read --allow-net --allow-env"
# MCP server name, ensure you're also updating the src/lib/mcp/constants.ts file
MCP_SERVER_NAME := "mcp-terraform-aws-provider-docs"

# 📋 Default recipe: List all available commands
default:
    @just --list

# 🚀 Run the development server using the task defined in deno.json
run-dev:
    @echo ">>> Starting development server via 'deno task dev'..."
    @deno task dev

# 🚀 Run the development server using the task defined in deno.json
run-dev-watch:
    @echo ">>> Starting development server via 'deno task dev-watch'..."
    @deno task dev-watch

# 🐳 Run the MCP server in Docker (pass GITHUB_TOKEN as env var) Usage: just run-docker GITHUB_TOKEN=ghp_xxx...
run-docker:
    @echo ">>> Running MCP server in Docker with provided GITHUB_TOKEN..."
    @docker run -it --rm -e GITHUB_TOKEN="$GITHUB_TOKEN" {{MCP_SERVER_NAME}}

# 🔧 Install pre-commit hooks in local environment for code consistency
hooks-install:
    @echo "🧰 Installing pre-commit hooks locally..."
    @./scripts/hooks/pre-commit-init.sh init

# 🕵️ Run pre-commit hooks across all files in local environment
hooks-run:
    @echo "🔍 Running pre-commit hooks from .pre-commit-config.yaml..."
    @./scripts/hooks/pre-commit-init.sh run

# Alias for run
serve: run-dev

# 🕵️ Run the MCP server with the MCP Inspector attached via stdio
[working-directory:'src']
inspect:
    @echo ">>> Starting MCP server with Inspector via stdio..."
    @export DENO_ALLOW_ENV=true
    @export DENO_ALLOW_NET=true
    @export DENO_ALLOW_READ=true
    @export MCP_INSPECTOR=true
    @export MCP_DISABLE_CONSOLE=true
    @npx -y @modelcontextprotocol/inspector deno run {{PERMISSIONS}} {{MAIN_FILE}}

# 🧪 Run tests using deno test
[working-directory:'src']
test:
    @echo ">>> Running tests using 'deno test'..."
    @deno test {{PERMISSIONS}}

# 🧹 Run the Deno linter
lint:
    @echo ">>> Linting code with 'deno lint'..."
    @deno run lint

# 🧹 Run the Deno linter and fix errors
lint-fix:
    @echo ">>> Fixing linting errors with 'deno lint:fix'..."
    @deno run lint:fix

# 🎨 Run the Deno formatter
fmt:
    @echo ">>> Formatting code with 'deno fmt'..."
    @deno run fmt

# 🧪 Run the Deno linter and formatter
ci: (lint-fix) (lint) (fmt) (test) (hooks-run)
    @echo ">>> Running CI checks..."
    @deno run update-deps

# 🧹 Clean common build artifacts (customize if needed)
clean:
    @echo ">>> Cleaning common build artifacts..."
    @rm -rf build/ dist/ out/
    @find . -type f -name ".DS_Store" -delete

# 🐳 Build the Docker image for the MCP server
build-docker:
    @echo ">>> Building Docker image '$(MCP_SERVER_NAME)'..."
    @docker build -t {{MCP_SERVER_NAME}} .
