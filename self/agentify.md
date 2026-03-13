---
name: agentify
description: Transform any OpenAPI spec into agent-consumable formats — MCP Server, CLAUDE.md, AGENTS.md, .cursorrules, Skills, llms.txt, GEMINI.md, A2A Card, CLI
---

Help the user make their API accessible to AI agents using Agentify.

## What You Should Do

When the user asks you to make their API agent-accessible, generate agent interfaces, set up MCP, or anything related to converting an API for agent consumption:

1. **Find the OpenAPI spec** — ask the user for the path or URL. If they point to a project directory, look for `swagger.json`, `openapi.json`, `openapi.yaml`, or similar files.

2. **Run the transform**:
   ```bash
   npx agentify-cli transform <spec-path-or-url>
   ```

3. **Guide them through the output** — the tool generates a complete project directory with all agent interface formats. Walk them through `cd <output>`, `npm install`, configuring `.env`, and `npm start`.

## Common User Requests

| User says | What to do |
|-----------|------------|
| "Make my API work with Claude" | `npx agentify-cli transform <spec> -f mcp claude.md` |
| "Generate agent interfaces for my product" | `npx agentify-cli transform <spec>` (all formats) |
| "I need an MCP server for this API" | `npx agentify-cli transform <spec> -f mcp` |
| "Create a CLI from my API spec" | `npx agentify-cli transform <spec> -f cli` |
| "Set up agent access for Cursor/Copilot" | `npx agentify-cli transform <spec> -f agents.md cursorrules` |

## Options

- `-o, --output <dir>` — where to write output (default: `<name>-mcp-server`)
- `-n, --name <name>` — override project name
- `-f, --format <formats...>` — pick specific formats: mcp, claude.md, agents.md, cursorrules, skills, llms.txt, gemini.md, a2a, cli

## Supported Inputs

Swagger 2.0 or OpenAPI 3.x, JSON or YAML, URL or local file path.
