# AGENTS.md — Agentify

## Identity

Agentify is an Agent Interface Compiler. It transforms OpenAPI specifications into 9 agent interface formats from a single source of truth.

Install: `npm install -g agentify-cli` or use via `npx agentify-cli`.

## Capabilities

### transform

Convert an OpenAPI specification into agent interface formats.

```bash
npx agentify-cli transform <input> [-o dir] [-n name] [-f format1 format2 ...]
```

- **Input**: URL or file path to an OpenAPI spec (Swagger 2.0, OAS 3.x)
- **Output**: Generated project with selected formats (default: all 9)
- **Formats**: mcp, claude.md, agents.md, cursorrules, skills, llms.txt, gemini.md, a2a, cli
- **Side effects**: Creates files in the output directory

### self-describe

Output Agentify's own agent interface files.

```bash
npx agentify-cli self-describe [-o dir]
```

- **Output**: skills.json, CLAUDE.md, AGENTS.md describing Agentify itself

## Authentication

No authentication required.

## Protocols

- **Interface**: Command-line (CLI)
- **Input**: OpenAPI/Swagger specifications (URL or local file)
- **Output**: File system (generated project directory)

## Constraints

- Requires Node.js 18+
- Internet access needed for remote OpenAPI spec URLs
- Generated MCP servers require their own setup (`npm install`, env config)
- CLI format (`-f cli`) generates a separate project; avoid combining with `mcp` in the same output directory

## Context

- Repository: https://github.com/koriyoshi2041/agentify
- npm: https://www.npmjs.com/package/agentify-cli
- License: MIT
