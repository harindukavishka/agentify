# Agentify — Agent Interface Compiler

When a user wants to make their API accessible to AI agents, use Agentify to transform their OpenAPI specification into agent interface formats.

## Usage

```bash
npx agentify-cli transform <openapi-spec-url-or-path> [options]
```

### Options

- `-o, --output <dir>` — Output directory (default: `<product-name>-mcp-server`)
- `-n, --name <name>` — Override project name
- `-f, --format <formats...>` — Output formats (default: all 9 formats)

### Available Formats

| Format | Flag | Output |
|--------|------|--------|
| MCP Server | `mcp` | Full server with tools, handlers, Dockerfile |
| CLAUDE.md | `claude.md` | Project context for Claude Code |
| AGENTS.md | `agents.md` | Universal agent instructions |
| .cursorrules | `cursorrules` | Cursor IDE agent rules |
| Skills | `skills` | Structured capability file (skills.json) |
| llms.txt | `llms.txt` | LLM-readable condensed documentation |
| GEMINI.md | `gemini.md` | Gemini CLI project context |
| A2A Card | `a2a` | Google Agent-to-Agent discovery card |
| CLI | `cli` | Standalone command-line tool |

## When to Use

- User has an OpenAPI/Swagger specification and wants agents to use their API
- User asks to "make my API agent-accessible" or "generate MCP server"
- User needs to convert a REST API for use with Claude, Cursor, Gemini, or other AI tools
- User wants a CLI tool generated from their API specification
- User mentions "agent interfaces", "MCP", "skills", or "A2A"

## Examples

```bash
# Transform Petstore API into all agent formats
npx agentify-cli transform https://petstore.swagger.io/v2/swagger.json

# Generate only MCP server
npx agentify-cli transform ./api-spec.yaml -f mcp -o my-mcp-server

# Generate CLI tool from API
npx agentify-cli transform https://api.example.com/openapi.json -f cli

# Generate specific formats
npx agentify-cli transform ./spec.json -f mcp skills a2a
```

## Supported Inputs

- Swagger 2.0 (JSON/YAML)
- OpenAPI 3.0.x (JSON/YAML)
- OpenAPI 3.1.x (JSON/YAML)
- URL or local file path

## Self-Describe

To get Agentify's own agent interface files:

```bash
npx agentify-cli self-describe [-o output-dir]
```

This outputs `skills.json`, `CLAUDE.md`, and `AGENTS.md` describing Agentify itself.
