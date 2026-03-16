import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { parseOpenAPI } from "../src/parser/index";
import { CursorRulesEmitter } from "../src/generator/cursorrules-emitter";
import { LlmsTxtEmitter } from "../src/generator/llmstxt-emitter";
import { GeminiMdEmitter } from "../src/generator/geminimd-emitter";
import { generate, getAvailableFormats, createEmitter } from "../src/generator/index";
import type { AgentifyIR } from "../src/types";

const TEST_OUTPUT_DIR = path.join(import.meta.dirname, "../tmp/test-new-emitters");
const PETSTORE_URL = "https://petstore3.swagger.io/api/v3/openapi.json";

let petstoreIR: AgentifyIR;

beforeAll(async () => {
  await fs.rm(TEST_OUTPUT_DIR, { recursive: true, force: true });
  const { ir } = await parseOpenAPI(PETSTORE_URL);
  petstoreIR = ir;
});

afterAll(async () => {
  await fs.rm(TEST_OUTPUT_DIR, { recursive: true, force: true });
});

// ─── Emitter Registry (updated) ─────────────────────────

describe("Emitter Registry includes new formats", () => {
  it("lists cursorrules format", () => {
    const formats = getAvailableFormats();
    expect(formats).toContain("cursorrules");
  });

  it("lists llms.txt format", () => {
    const formats = getAvailableFormats();
    expect(formats).toContain("llms.txt");
  });

  it("lists gemini.md format", () => {
    const formats = getAvailableFormats();
    expect(formats).toContain("gemini.md");
  });

  it("creates cursorrules emitter by format name", () => {
    const emitter = createEmitter("cursorrules");
    expect(emitter.name).toBe("cursorrules");
    expect(emitter.format).toBe("cursorrules");
  });

  it("creates llms-txt emitter by format name", () => {
    const emitter = createEmitter("llms.txt");
    expect(emitter.name).toBe("llms-txt");
    expect(emitter.format).toBe("llms.txt");
  });

  it("creates gemini-md emitter by format name", () => {
    const emitter = createEmitter("gemini.md");
    expect(emitter.name).toBe("gemini-md");
    expect(emitter.format).toBe("gemini.md");
  });
});

// ─── .cursorrules Emitter ───────────────────────────────

describe(".cursorrules Emitter", () => {
  it("generates a .cursorrules file", async () => {
    const emitter = new CursorRulesEmitter();
    const outputDir = path.join(TEST_OUTPUT_DIR, "cursorrules-test");
    const result = await emitter.emit(petstoreIR, { outputDir });

    expect(result.format).toBe("cursorrules");
    expect(result.filesWritten).toHaveLength(1);
    expect(result.filesWritten[0]).toContain(".cursorrules");
    expect(result.warnings).toHaveLength(0);
  });

  it("contains project header with name and version", async () => {
    const outputDir = path.join(TEST_OUTPUT_DIR, "cursorrules-header");
    const emitter = new CursorRulesEmitter();
    await emitter.emit(petstoreIR, { outputDir });

    const content = await fs.readFile(path.join(outputDir, ".cursorrules"), "utf-8");

    expect(content).toContain(`# Project: ${petstoreIR.product.name}`);
    expect(content).toContain(`# Version: ${petstoreIR.product.version}`);
    expect(content).toContain(`# Base URL: ${petstoreIR.product.baseUrl}`);
  });

  it("contains API context section", async () => {
    const outputDir = path.join(TEST_OUTPUT_DIR, "cursorrules-context");
    const emitter = new CursorRulesEmitter();
    await emitter.emit(petstoreIR, { outputDir });

    const content = await fs.readFile(path.join(outputDir, ".cursorrules"), "utf-8");

    expect(content).toContain("## API Context");
    expect(content).toContain(petstoreIR.product.description);
  });

  it("contains domain-grouped operations", async () => {
    const outputDir = path.join(TEST_OUTPUT_DIR, "cursorrules-ops");
    const emitter = new CursorRulesEmitter();
    await emitter.emit(petstoreIR, { outputDir });

    const content = await fs.readFile(path.join(outputDir, ".cursorrules"), "utf-8");

    expect(content).toContain("## Available Operations");
    expect(content).toContain("### Pet");
    expect(content).toContain("GET");
    expect(content).toContain("POST");
  });

  it("contains authentication details", async () => {
    const outputDir = path.join(TEST_OUTPUT_DIR, "cursorrules-auth");
    const emitter = new CursorRulesEmitter();
    await emitter.emit(petstoreIR, { outputDir });

    const content = await fs.readFile(path.join(outputDir, ".cursorrules"), "utf-8");

    expect(content).toContain("## Authentication");
  });

  it("contains important rules section", async () => {
    const outputDir = path.join(TEST_OUTPUT_DIR, "cursorrules-rules");
    const emitter = new CursorRulesEmitter();
    await emitter.emit(petstoreIR, { outputDir });

    const content = await fs.readFile(path.join(outputDir, ".cursorrules"), "utf-8");

    expect(content).toContain("## Code Generation Rules");
    expect(content).toContain("fetch");
    expect(content).toContain("Path parameters");
  });
});

// ─── llms.txt Emitter ───────────────────────────────────

describe("llms.txt Emitter", () => {
  it("generates a llms.txt file", async () => {
    const emitter = new LlmsTxtEmitter();
    const outputDir = path.join(TEST_OUTPUT_DIR, "llmstxt-test");
    const result = await emitter.emit(petstoreIR, { outputDir });

    expect(result.format).toBe("llms.txt");
    expect(result.filesWritten).toHaveLength(1);
    expect(result.filesWritten[0]).toContain("llms.txt");
    expect(result.warnings).toHaveLength(0);
  });

  it("contains product name as heading", async () => {
    const outputDir = path.join(TEST_OUTPUT_DIR, "llmstxt-heading");
    const emitter = new LlmsTxtEmitter();
    await emitter.emit(petstoreIR, { outputDir });

    const content = await fs.readFile(path.join(outputDir, "llms.txt"), "utf-8");

    expect(content).toContain(`# ${petstoreIR.product.name}`);
  });

  it("contains overview section with key metadata", async () => {
    const outputDir = path.join(TEST_OUTPUT_DIR, "llmstxt-overview");
    const emitter = new LlmsTxtEmitter();
    await emitter.emit(petstoreIR, { outputDir });

    const content = await fs.readFile(path.join(outputDir, "llms.txt"), "utf-8");

    expect(content).toContain("## Overview");
    expect(content).toContain(`Base URL: ${petstoreIR.product.baseUrl}`);
    expect(content).toContain(`Version: ${petstoreIR.product.version}`);
    expect(content).toContain(`Endpoints: ${petstoreIR.capabilities.length}`);
    expect(content).toContain(`${petstoreIR.domains.length} domains`);
  });

  it("contains endpoints grouped by domain", async () => {
    const outputDir = path.join(TEST_OUTPUT_DIR, "llmstxt-endpoints");
    const emitter = new LlmsTxtEmitter();
    await emitter.emit(petstoreIR, { outputDir });

    const content = await fs.readFile(path.join(outputDir, "llms.txt"), "utf-8");

    expect(content).toContain("## Endpoints");
    expect(content).toContain("### Pet");
    expect(content).toContain("GET");
    expect(content).toContain("POST");
  });

  it("contains authentication section", async () => {
    const outputDir = path.join(TEST_OUTPUT_DIR, "llmstxt-auth");
    const emitter = new LlmsTxtEmitter();
    await emitter.emit(petstoreIR, { outputDir });

    const content = await fs.readFile(path.join(outputDir, "llms.txt"), "utf-8");

    expect(content).toContain("## Authentication");
  });

  it("contains links section with MCP server reference", async () => {
    const outputDir = path.join(TEST_OUTPUT_DIR, "llmstxt-links");
    const emitter = new LlmsTxtEmitter();
    await emitter.emit(petstoreIR, { outputDir });

    const content = await fs.readFile(path.join(outputDir, "llms.txt"), "utf-8");

    expect(content).toContain("## Links");
    expect(content).toContain("MCP Server");
  });
});

// ─── GEMINI.md Emitter ──────────────────────────────────

describe("GEMINI.md Emitter", () => {
  it("generates a GEMINI.md file", async () => {
    const emitter = new GeminiMdEmitter();
    const outputDir = path.join(TEST_OUTPUT_DIR, "geminimd-test");
    const result = await emitter.emit(petstoreIR, { outputDir });

    expect(result.format).toBe("gemini.md");
    expect(result.filesWritten).toHaveLength(1);
    expect(result.filesWritten[0]).toContain("GEMINI.md");
    expect(result.warnings).toHaveLength(0);
  });

  it("contains product name and Agentify attribution", async () => {
    const outputDir = path.join(TEST_OUTPUT_DIR, "geminimd-header");
    const emitter = new GeminiMdEmitter();
    await emitter.emit(petstoreIR, { outputDir });

    const content = await fs.readFile(path.join(outputDir, "GEMINI.md"), "utf-8");

    expect(content).toContain(`# ${petstoreIR.product.name}`);
    expect(content).toContain("Agentify");
  });

  it("contains API overview with base URL and version", async () => {
    const outputDir = path.join(TEST_OUTPUT_DIR, "geminimd-overview");
    const emitter = new GeminiMdEmitter();
    await emitter.emit(petstoreIR, { outputDir });

    const content = await fs.readFile(path.join(outputDir, "GEMINI.md"), "utf-8");

    expect(content).toContain("## API Overview");
    expect(content).toContain(petstoreIR.product.baseUrl);
    expect(content).toContain(petstoreIR.product.version);
    expect(content).toContain(`${petstoreIR.capabilities.length}`);
  });

  it("contains domain-grouped operations table", async () => {
    const outputDir = path.join(TEST_OUTPUT_DIR, "geminimd-ops");
    const emitter = new GeminiMdEmitter();
    await emitter.emit(petstoreIR, { outputDir });

    const content = await fs.readFile(path.join(outputDir, "GEMINI.md"), "utf-8");

    expect(content).toContain("## Available Operations");
    expect(content).toContain("### Pet");
    expect(content).toContain("| Operation |");
    expect(content).toContain("add_pet");
    expect(content).toContain("get_pet_by_id");
  });

  it("contains authentication section", async () => {
    const outputDir = path.join(TEST_OUTPUT_DIR, "geminimd-auth");
    const emitter = new GeminiMdEmitter();
    await emitter.emit(petstoreIR, { outputDir });

    const content = await fs.readFile(path.join(outputDir, "GEMINI.md"), "utf-8");

    if (petstoreIR.auth.type !== "none") {
      expect(content).toContain("## Authentication");
      expect(content).toContain(petstoreIR.auth.envVariable);
    }
  });

  it("contains MCP integration section for Gemini CLI", async () => {
    const outputDir = path.join(TEST_OUTPUT_DIR, "geminimd-mcp");
    const emitter = new GeminiMdEmitter();
    await emitter.emit(petstoreIR, { outputDir });

    const content = await fs.readFile(path.join(outputDir, "GEMINI.md"), "utf-8");

    expect(content).toContain("## Gemini CLI Integration");
    expect(content).toContain("Gemini CLI");
  });

  it("contains endpoint reference with parameter details", async () => {
    const outputDir = path.join(TEST_OUTPUT_DIR, "geminimd-notes");
    const emitter = new GeminiMdEmitter();
    await emitter.emit(petstoreIR, { outputDir });

    const content = await fs.readFile(path.join(outputDir, "GEMINI.md"), "utf-8");

    expect(content).toContain("## Endpoint Reference");
    expect(content).toContain("**Parameters:**");
  });
});

// ─── Multi-format generation with new emitters ──────────

describe("Multi-format generation with new emitters", () => {
  it("generates all six formats in one call", async () => {
    const outputDir = path.join(TEST_OUTPUT_DIR, "all-formats");
    const results = await generate(petstoreIR, outputDir, [
      "mcp",
      "claude.md",
      "agents.md",
      "cursorrules",
      "llms.txt",
      "gemini.md",
    ]);

    expect(results).toHaveLength(6);

    const formats = results.map(r => r.format);
    expect(formats).toContain("mcp");
    expect(formats).toContain("claude.md");
    expect(formats).toContain("agents.md");
    expect(formats).toContain("cursorrules");
    expect(formats).toContain("llms.txt");
    expect(formats).toContain("gemini.md");

    // Verify new files exist on disk
    const cursorrules = await fs.readFile(path.join(outputDir, ".cursorrules"), "utf-8");
    expect(cursorrules).toContain("## Available Operations");

    const llmstxt = await fs.readFile(path.join(outputDir, "llms.txt"), "utf-8");
    expect(llmstxt).toContain("## Endpoints");

    const geminiMd = await fs.readFile(path.join(outputDir, "GEMINI.md"), "utf-8");
    expect(geminiMd).toContain("## Gemini CLI Integration");
  });

  it("generates only new formats when specified", async () => {
    const outputDir = path.join(TEST_OUTPUT_DIR, "new-only");
    const results = await generate(petstoreIR, outputDir, [
      "cursorrules",
      "llms.txt",
      "gemini.md",
    ]);

    expect(results).toHaveLength(3);
    expect(results[0]!.format).toBe("cursorrules");
    expect(results[1]!.format).toBe("llms.txt");
    expect(results[2]!.format).toBe("gemini.md");
  });
});
