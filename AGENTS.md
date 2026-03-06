# AGENTS.md

Agentify is an Agent Interface Compiler that transforms OpenAPI specifications into multiple agent-consumable formats (MCP Server, Skills, CLAUDE.md, .cursorrules, AGENTS.md, llms.txt, A2A Card).

## Build & Run

```bash
npm install
npm run build        # Build with tsup
npm run dev          # Dev mode with tsx
npm test             # Run tests with Vitest
npm run lint         # TypeScript type check
```

## Architecture

- **Parser** (`src/parser/`): OpenAPI spec parsing + input sanitization
- **Generator** (`src/generator/`): Pluggable emitters for each output format
- **Security** (`src/security/`): Generated code scanning for dangerous patterns
- **IR** (`src/types.ts`): Canonical intermediate representation (AgentifyIR)
- **CLI** (`src/cli.ts`): Commander.js CLI entry point

## Code Conventions

- TypeScript strict mode (all strict flags enabled)
- Immutable data patterns — never mutate objects, always spread
- Small files: 200-400 lines typical, 800 max
- Emitter interface: implement `emit(ir, options) => EmitterResult`
- All OpenAPI spec fields must pass through sanitizer before use
- Generated code must pass security scanner before output

## Testing

- Framework: Vitest
- Coverage target: 80%+
- Test files: `test/*.test.ts`
- Integration tests use live Petstore API

## Security

- Input sanitization blocks: eval, exec, Function constructor, require/import in descriptions
- Handlebars template injection prevention
- Prompt injection pattern detection
- Generated code scanner checks for critical patterns before writing files
