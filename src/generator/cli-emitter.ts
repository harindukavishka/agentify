import * as fs from "node:fs/promises";
import * as path from "node:path";
import type {
  AgentifyIR,
  Capability,
  Emitter,
  EmitterOptions,
  EmitterResult,
  SchemaProperty,
} from "../types";
import { scanMultipleFiles } from "../security/scanner";

export class CLIEmitter implements Emitter {
  readonly name = "cli";
  readonly format = "cli";

  async emit(ir: AgentifyIR, options: EmitterOptions): Promise<EmitterResult> {
    const warnings: string[] = [];
    const filesWritten: string[] = [];
    const outputDir = path.resolve(options.outputDir);
    const srcDir = path.join(outputDir, "src");
    await fs.mkdir(srcDir, { recursive: true });

    const filesToWrite = this.generateFiles(ir);

    const scanResult = scanMultipleFiles(filesToWrite);
    if (!scanResult.passed) {
      const criticals = scanResult.violations
        .filter(v => v.severity === "critical")
        .map(v => v.message);
      throw new Error(
        `Security scan FAILED: ${criticals.join("; ")}`,
      );
    }

    for (const v of scanResult.violations) {
      warnings.push(`[SECURITY:${v.severity}] ${v.message}`);
    }

    for (const [filePath, content] of filesToWrite) {
      const fullPath = path.join(outputDir, filePath);
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, content, "utf-8");
      filesWritten.push(fullPath);
    }

    return { format: this.format, filesWritten, warnings };
  }

  private generateFiles(ir: AgentifyIR): Map<string, string> {
    const files = new Map<string, string>();
    files.set("src/cli.ts", generateCliEntry(ir));
    files.set("src/api-client.ts", generateApiClient(ir));
    files.set("src/commands.ts", generateCommands(ir));
    files.set("package.json", generatePackageJson(ir));
    files.set("tsconfig.json", generateTsConfig());
    files.set(".env.example", generateEnvExample(ir));
    files.set("README.md", generateReadme(ir));
    return files;
  }
}

// ─── Helpers ─────────────────────────────────

function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function escapeStr(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? str.slice(0, maxLen - 3) + "..." : str;
}

function extractPathParams(pathStr: string): string[] {
  const matches = pathStr.match(/\{(\w+)\}/g);
  return matches ? matches.map(m => m.slice(1, -1)) : [];
}

function isQueryParam(prop: SchemaProperty, cap: Capability): boolean {
  if (prop.in) return prop.in === "query";
  const isPath = cap.http.path.includes(`{${prop.name}}`);
  if (isPath) return false;
  return cap.http.method === "get" || cap.http.method === "delete" || cap.http.method === "head";
}

// ─── File Generators ─────────────────────────

function generateCliEntry(ir: AgentifyIR): string {
  const name = toKebabCase(ir.product.name);
  return [
    '#!/usr/bin/env node',
    'import { Command } from "commander";',
    'import { registerCommands } from "./commands";',
    '',
    'const program = new Command();',
    '',
    'program',
    `  .name("${escapeStr(name)}")`,
    `  .description("${escapeStr(ir.product.description)}")`,
    '  .version("0.1.0");',
    '',
    'registerCommands(program);',
    '',
    'program.parse();',
    '',
  ].join('\n');
}

function generateApiClient(ir: AgentifyIR): string {
  const lines: string[] = [];

  lines.push(`const BASE_URL = process.env.API_BASE_URL ?? "${ir.product.baseUrl}";`);
  if (ir.auth.type !== "none") {
    lines.push(`const AUTH_KEY = process.env.${ir.auth.envVariable} ?? "";`);
  }
  lines.push('');
  lines.push('export async function apiRequest(');
  lines.push('  method: string,');
  lines.push('  pathTemplate: string,');
  lines.push('  params?: Record<string, unknown>,');
  lines.push('  queryParamNames?: readonly string[],');
  lines.push('): Promise<unknown> {');
  lines.push('  let url = BASE_URL + pathTemplate;');
  lines.push('  const usedKeys = new Set<string>();');
  lines.push('');
  lines.push('  if (params) {');
  lines.push('    for (const [key, value] of Object.entries(params)) {');
  lines.push('      if (url.includes(`{${key}}`)) {');
  lines.push('        url = url.replace(`{${key}}`, encodeURIComponent(String(value)));');
  lines.push('        usedKeys.add(key);');
  lines.push('      }');
  lines.push('    }');
  lines.push('  }');
  lines.push('');
  lines.push('  const queryKeys = new Set<string>();');
  lines.push('  if (params) {');
  lines.push('    const isBodyMethod = method !== "GET" && method !== "DELETE" && method !== "HEAD";');
  lines.push('    const entries: string[] = [];');
  lines.push('    for (const [key, value] of Object.entries(params)) {');
  lines.push('      if (usedKeys.has(key) || value === undefined) continue;');
  lines.push('      const isQuery = isBodyMethod ? (queryParamNames ?? []).includes(key) : true;');
  lines.push('      if (isQuery) {');
  lines.push('        entries.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);');
  lines.push('        queryKeys.add(key);');
  lines.push('      }');
  lines.push('    }');
  lines.push('    if (entries.length > 0) url += "?" + entries.join("&");');
  lines.push('  }');
  lines.push('');
  lines.push('  const headers: Record<string, string> = {');
  lines.push('    "Content-Type": "application/json",');
  lines.push('    Accept: "application/json",');
  lines.push('  };');
  lines.push('');

  if (ir.auth.type === "bearer") {
    lines.push('  if (AUTH_KEY) headers["Authorization"] = `Bearer ${AUTH_KEY}`;');
  } else if (ir.auth.type === "apiKey") {
    const headerName = ir.auth.headerName ?? "api_key";
    lines.push(`  if (AUTH_KEY) headers["${headerName}"] = AUTH_KEY;`);
  } else if (ir.auth.type === "basic") {
    lines.push('  if (AUTH_KEY) headers["Authorization"] = `Basic ${AUTH_KEY}`;');
  } else if (ir.auth.type !== "none") {
    lines.push('  if (AUTH_KEY) headers["Authorization"] = AUTH_KEY;');
  }

  lines.push('');
  lines.push('  const fetchOptions: RequestInit = { method, headers };');
  lines.push('');
  lines.push('  if (method !== "GET" && method !== "DELETE" && method !== "HEAD" && params) {');
  lines.push('    const bodyParams: Record<string, unknown> = {};');
  lines.push('    for (const [key, value] of Object.entries(params)) {');
  lines.push('      if (!usedKeys.has(key) && !queryKeys.has(key)) bodyParams[key] = value;');
  lines.push('    }');
  lines.push('    if (Object.keys(bodyParams).length > 0) {');
  lines.push('      fetchOptions.body = JSON.stringify(bodyParams);');
  lines.push('    }');
  lines.push('  }');
  lines.push('');
  lines.push('  const response = await fetch(url, fetchOptions);');
  lines.push('');
  lines.push('  if (!response.ok) {');
  lines.push('    const errorText = await response.text();');
  lines.push('    throw new Error(`API error ${response.status}: ${errorText}`);');
  lines.push('  }');
  lines.push('');
  lines.push('  const ct = response.headers.get("content-type") ?? "";');
  lines.push('  return ct.includes("application/json") ? response.json() : response.text();');
  lines.push('}');
  lines.push('');

  return lines.join('\n');
}

function generateCommands(ir: AgentifyIR): string {
  const lines: string[] = [
    'import type { Command } from "commander";',
    'import { apiRequest } from "./api-client";',
    '',
    'export function registerCommands(program: Command): void {',
  ];

  for (const cap of ir.capabilities) {
    const cmdName = toKebabCase(cap.name);
    const pathParams = extractPathParams(cap.http.path);
    const pathParamSet = new Set(pathParams);

    const flagParams = cap.input.properties.filter(
      p => !pathParamSet.has(p.name) && p.in !== "header" && p.in !== "cookie",
    );

    const queryParamNames = flagParams
      .filter(p => isQueryParam(p, cap))
      .map(p => p.name);

    const positionals = pathParams.map(p => `<${p}>`).join(" ");
    const cmdSig = positionals ? `${cmdName} ${positionals}` : cmdName;

    lines.push('  program');
    lines.push(`    .command("${cmdSig}")`);
    lines.push(`    .description("${escapeStr(truncate(cap.description, 120))}")`);

    for (const param of flagParams) {
      const desc = escapeStr(truncate(param.description, 80));
      if (param.type === "boolean") {
        lines.push(`    .option("--${param.name}", "${desc}")`);
      } else if (param.required) {
        lines.push(`    .requiredOption("--${param.name} <value>", "${desc}")`);
      } else {
        lines.push(`    .option("--${param.name} <value>", "${desc}")`);
      }
    }

    if (pathParams.length > 0) {
      lines.push(`    .action(async (${pathParams.join(", ")}, options) => {`);
    } else {
      lines.push('    .action(async (options) => {');
    }

    lines.push('      try {');
    lines.push('        const params: Record<string, unknown> = {};');

    for (const pp of pathParams) {
      const prop = cap.input.properties.find(p => p.name === pp);
      const isNum = prop?.type === "integer" || prop?.type === "number";
      lines.push(`        params["${pp}"] = ${isNum ? `Number(${pp})` : pp};`);
    }

    for (const param of flagParams) {
      const isNum = param.type === "integer" || param.type === "number";
      const coerce = isNum ? `Number(options.${param.name})` : `options.${param.name}`;
      lines.push(`        if (options.${param.name} !== undefined) params["${param.name}"] = ${coerce};`);
    }

    lines.push(`        const result = await apiRequest("${cap.http.method.toUpperCase()}", "${cap.http.path}", params, ${JSON.stringify(queryParamNames)});`);
    lines.push('        console.log(JSON.stringify(result, null, 2));');
    lines.push('      } catch (err) {');
    lines.push('        const msg = err instanceof Error ? err.message : String(err);');
    lines.push('        console.error(msg);');
    lines.push('        process.exit(1);');
    lines.push('      }');
    lines.push('    });');
    lines.push('');
  }

  lines.push('}');
  lines.push('');
  return lines.join('\n');
}

function generatePackageJson(ir: AgentifyIR): string {
  const name = toKebabCase(ir.product.name) + "-cli";
  return JSON.stringify(
    {
      name,
      version: "0.1.0",
      description: `CLI for ${ir.product.name} — generated by Agentify`,
      type: "module",
      bin: { [toKebabCase(ir.product.name)]: "./dist/cli.js" },
      scripts: {
        start: "tsx src/cli.ts",
        build: "tsc",
      },
      dependencies: {
        commander: "^14.0.3",
        tsx: "^4.19.4",
      },
      devDependencies: {
        typescript: "^5.8.3",
        "@types/node": "^22.15.2",
      },
    },
    null,
    2,
  );
}

function generateTsConfig(): string {
  return JSON.stringify(
    {
      compilerOptions: {
        target: "ES2022",
        module: "ESNext",
        moduleResolution: "bundler",
        lib: ["ES2022"],
        outDir: "./dist",
        rootDir: "./src",
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        resolveJsonModule: true,
        declaration: true,
        sourceMap: true,
      },
      include: ["src/**/*"],
    },
    null,
    2,
  );
}

function generateEnvExample(ir: AgentifyIR): string {
  const lines = [
    `# ${ir.product.name} CLI Configuration`,
    "# Generated by Agentify",
    "",
  ];

  if (ir.auth.type !== "none") {
    lines.push(`# Authentication (${ir.auth.type})`);
    lines.push(`${ir.auth.envVariable}=your-key-here`);
    lines.push("");
  }

  lines.push("# API Base URL");
  lines.push(`API_BASE_URL=${ir.product.baseUrl}`);
  lines.push("");

  return lines.join("\n");
}

function generateReadme(ir: AgentifyIR): string {
  const name = toKebabCase(ir.product.name);
  const lines: string[] = [
    `# ${ir.product.name} CLI`,
    "",
    `> Generated by [Agentify](https://github.com/koriyoshi2041/agentify) — Agent Interface Compiler`,
    "",
    ir.product.description,
    "",
    "## Quick Start",
    "",
    "```bash",
    "npm install",
    "cp .env.example .env  # add your API key",
    `npx tsx src/cli.ts --help`,
    "```",
    "",
    `## Commands (${ir.capabilities.length})`,
    "",
  ];

  for (const cap of ir.capabilities) {
    const cmdName = toKebabCase(cap.name);
    const pathParams = extractPathParams(cap.http.path);
    const positionals = pathParams.map(p => `<${p}>`).join(" ");
    const sig = positionals ? `${cmdName} ${positionals}` : cmdName;
    lines.push(`- \`${name} ${sig}\` — ${truncate(cap.description, 80)}`);
  }

  lines.push("");

  if (ir.auth.type !== "none") {
    lines.push("## Authentication");
    lines.push("");
    lines.push(`Set \`${ir.auth.envVariable}\` in your \`.env\` file or environment.`);
    lines.push("");
  }

  lines.push("---");
  lines.push("");
  lines.push("*Generated by Agentify — One command. Every agent speaks your product.*");
  lines.push("");

  return lines.join("\n");
}
