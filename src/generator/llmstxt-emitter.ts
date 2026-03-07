import * as fs from "node:fs/promises";
import * as path from "node:path";
import type {
  AgentifyIR,
  Capability,
  Domain,
  Emitter,
  EmitterOptions,
  EmitterResult,
} from "../types";

export class LlmsTxtEmitter implements Emitter {
  readonly name = "llms-txt";
  readonly format = "llms.txt";

  async emit(ir: AgentifyIR, options: EmitterOptions): Promise<EmitterResult> {
    const outputDir = path.resolve(options.outputDir);
    await fs.mkdir(outputDir, { recursive: true });

    const content = generateLlmsTxt(ir);
    const filePath = path.join(outputDir, "llms.txt");
    await fs.writeFile(filePath, content, "utf-8");

    return {
      format: this.format,
      filesWritten: [filePath],
      warnings: [],
    };
  }
}

function generateLlmsTxt(ir: AgentifyIR): string {
  const sections: string[] = [];

  // Title
  sections.push(`# ${ir.product.name}`);
  sections.push("");
  sections.push(`> ${truncate(ir.product.description, 200)}`);
  sections.push("");

  // Overview
  sections.push("## Overview");
  sections.push("");
  sections.push(`- Base URL: ${ir.product.baseUrl}`);
  sections.push(`- Version: ${ir.product.version}`);
  sections.push(`- Auth: ${ir.auth.type === "none" ? "None" : `${ir.auth.type} via ${ir.auth.envVariable}`}`);
  sections.push(`- Endpoints: ${ir.capabilities.length} across ${ir.domains.length} domains`);
  sections.push("");

  // Endpoints by domain
  sections.push("## Endpoints");
  sections.push("");

  for (const domain of ir.domains) {
    const caps = ir.capabilities.filter(c => c.domain === domain.name);
    sections.push(...renderDomainEndpoints(domain, caps));
  }

  // Authentication
  sections.push("## Authentication");
  sections.push("");
  if (ir.auth.type === "none") {
    sections.push("No authentication required.");
  } else {
    sections.push(`Type: ${ir.auth.type}`);
    sections.push(`Environment Variable: ${ir.auth.envVariable}`);
    if (ir.auth.description) {
      sections.push(ir.auth.description);
    }
  }
  sections.push("");

  // Links
  sections.push("## Links");
  sections.push("");
  if (ir.product.docsUrl) {
    sections.push(`- Documentation: ${ir.product.docsUrl}`);
  }
  sections.push("- MCP Server: Available (stdio transport)");
  sections.push("");

  return sections.join("\n");
}

function renderDomainEndpoints(domain: Domain, caps: readonly Capability[]): string[] {
  const lines: string[] = [];

  lines.push(`### ${capitalize(domain.name)}`);
  lines.push("");

  for (const cap of caps) {
    const desc = truncate(cap.description, 100);
    lines.push(`- ${cap.http.method.toUpperCase()} ${cap.http.path}: ${desc}`);
  }

  lines.push("");
  return lines;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? str.slice(0, maxLen - 3) + "..." : str;
}
