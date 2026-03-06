# Contributing to Agentify

Thank you for your interest in contributing to Agentify!

## What We Welcome

- **New emitters** (output formats) — this is the most valuable contribution type
- **Bug fixes** (please include a failing test)
- **Documentation improvements**
- **OpenAPI spec compatibility fixes**

## What We Don't Accept (Yet)

- Large architectural refactors (open a Discussion first)
- New parser frontends (only OpenAPI supported currently)
- Breaking changes without prior discussion

## Getting Started

```bash
git clone https://github.com/koriyoshi2041/agentify.git
cd agentify
npm install
npm test          # Run tests (should all pass)
npm run lint      # TypeScript type check
```

## Development Workflow

1. **Open an Issue first** for changes > 50 lines
2. Fork the repo and create a feature branch
3. Write tests first (TDD: Red -> Green -> Refactor)
4. Ensure all tests pass: `npm test`
5. Ensure TypeScript compiles: `npm run lint`
6. Submit a Pull Request

## Code Style

- TypeScript strict mode
- Immutable patterns (never mutate, always spread)
- Small files (200-400 lines, max 800)
- No dynamic code evaluation or unsafe constructors in generated code

## Adding a New Emitter

Emitters are the best way to contribute. Each emitter:

1. Implements the `Emitter` interface from `src/types.ts`
2. Lives in `src/generator/` as a single file (200-600 lines)
3. Accepts `AgentifyIR` and returns `EmitterResult`
4. Includes at least 3 test cases
5. Must pass the security scanner

```typescript
import type { Emitter, AgentifyIR, EmitterOptions, EmitterResult } from "../types";

export class MyFormatEmitter implements Emitter {
  readonly name = "my-format";
  readonly format = "my-format";

  async emit(ir: AgentifyIR, options: EmitterOptions): Promise<EmitterResult> {
    // Generate output files
    return { filesWritten: [...], warnings: [] };
  }
}
```

## Commit Messages

Follow conventional commits:

```
feat: add skills emitter
fix: handle missing auth in parser
docs: update README examples
test: add edge case for large APIs
```

## Questions?

Open a [Discussion](https://github.com/koriyoshi2041/agentify/discussions) on GitHub.
