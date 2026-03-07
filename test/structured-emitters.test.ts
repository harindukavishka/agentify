import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { parseOpenAPI } from "../src/parser/index";
import { SkillsEmitter } from "../src/generator/skills-emitter";
import { A2ACardEmitter } from "../src/generator/a2a-emitter";
import { generate, getAvailableFormats, createEmitter } from "../src/generator/index";
import type { AgentifyIR } from "../src/types";

const TEST_OUTPUT_DIR = path.join(
  import.meta.dirname,
  "../tmp/test-structured-emitters",
);
const PETSTORE_URL = "https://petstore3.swagger.io/api/v3/openapi.json";

let petstoreIR: AgentifyIR;

// ─── Shared Setup ───────────────────────────────────────────

beforeAll(async () => {
  await fs.rm(TEST_OUTPUT_DIR, { recursive: true, force: true });
  const { ir } = await parseOpenAPI(PETSTORE_URL);
  petstoreIR = ir;
});

afterAll(async () => {
  await fs.rm(TEST_OUTPUT_DIR, { recursive: true, force: true });
});

// ─── Emitter Registry Updates ───────────────────────────────

describe("Emitter Registry (with new formats)", () => {
  it("lists skills and a2a in available formats", () => {
    const formats = getAvailableFormats();
    expect(formats).toContain("skills");
    expect(formats).toContain("a2a");
  });

  it("creates skills emitter by format name", () => {
    const emitter = createEmitter("skills");
    expect(emitter.name).toBe("skills");
    expect(emitter.format).toBe("skills");
  });

  it("creates a2a emitter by format name", () => {
    const emitter = createEmitter("a2a");
    expect(emitter.name).toBe("a2a-card");
    expect(emitter.format).toBe("a2a");
  });
});

// ─── Skills Emitter ─────────────────────────────────────────

describe("Skills Emitter", () => {
  it("generates a skills.json file", async () => {
    const emitter = new SkillsEmitter();
    const outputDir = path.join(TEST_OUTPUT_DIR, "skills-basic");
    const result = await emitter.emit(petstoreIR, { outputDir });

    expect(result.format).toBe("skills");
    expect(result.filesWritten).toHaveLength(1);
    expect(result.filesWritten[0]).toContain("skills.json");
    expect(result.warnings).toHaveLength(0);
  });

  it("generates valid JSON that can be parsed without error", async () => {
    const emitter = new SkillsEmitter();
    const outputDir = path.join(TEST_OUTPUT_DIR, "skills-json");
    await emitter.emit(petstoreIR, { outputDir });

    const raw = await fs.readFile(path.join(outputDir, "skills.json"), "utf-8");
    const parsed = JSON.parse(raw);

    expect(parsed).toBeDefined();
    expect(typeof parsed).toBe("object");
  });

  it("contains product metadata at top level", async () => {
    const emitter = new SkillsEmitter();
    const outputDir = path.join(TEST_OUTPUT_DIR, "skills-meta");
    await emitter.emit(petstoreIR, { outputDir });

    const raw = await fs.readFile(path.join(outputDir, "skills.json"), "utf-8");
    const parsed = JSON.parse(raw);

    expect(parsed.name).toBe(petstoreIR.product.name);
    expect(parsed.description).toBe(petstoreIR.product.description);
    expect(parsed.version).toBe(petstoreIR.product.version);
    expect(parsed.baseUrl).toBe(petstoreIR.product.baseUrl);
  });

  it("contains auth configuration", async () => {
    const emitter = new SkillsEmitter();
    const outputDir = path.join(TEST_OUTPUT_DIR, "skills-auth");
    await emitter.emit(petstoreIR, { outputDir });

    const raw = await fs.readFile(path.join(outputDir, "skills.json"), "utf-8");
    const parsed = JSON.parse(raw);

    expect(parsed.auth).toBeDefined();
    expect(parsed.auth.type).toBe(petstoreIR.auth.type);
    expect(parsed.auth.envVariable).toBe(petstoreIR.auth.envVariable);
  });

  it("contains all capabilities from the IR as skills", async () => {
    const emitter = new SkillsEmitter();
    const outputDir = path.join(TEST_OUTPUT_DIR, "skills-caps");
    await emitter.emit(petstoreIR, { outputDir });

    const raw = await fs.readFile(path.join(outputDir, "skills.json"), "utf-8");
    const parsed = JSON.parse(raw);

    expect(parsed.skills).toHaveLength(petstoreIR.capabilities.length);

    // Verify each skill has required fields
    for (const skill of parsed.skills) {
      expect(skill.id).toBeTruthy();
      expect(skill.name).toBeTruthy();
      expect(skill.description).toBeTruthy();
      expect(skill.domain).toBeTruthy();
      expect(skill.operation).toBeTruthy();
      expect(skill.method).toBeTruthy();
      expect(skill.path).toBeTruthy();
      expect(typeof skill.sideEffects).toBe("boolean");
      expect(Array.isArray(skill.parameters)).toBe(true);
    }
  });

  it("maps skill fields correctly from capability data", async () => {
    const emitter = new SkillsEmitter();
    const outputDir = path.join(TEST_OUTPUT_DIR, "skills-mapping");
    await emitter.emit(petstoreIR, { outputDir });

    const raw = await fs.readFile(path.join(outputDir, "skills.json"), "utf-8");
    const parsed = JSON.parse(raw);

    // Find a known capability from Petstore
    const addPetCap = petstoreIR.capabilities.find(c => c.name === "add_pet");
    expect(addPetCap).toBeDefined();

    const addPetSkill = parsed.skills.find((s: Record<string, unknown>) => s.id === addPetCap!.id);
    expect(addPetSkill).toBeDefined();
    expect(addPetSkill.name).toBe(addPetCap!.name);
    expect(addPetSkill.description).toBe(addPetCap!.agentDescription);
    expect(addPetSkill.domain).toBe(addPetCap!.domain);
    expect(addPetSkill.operation).toBe(addPetCap!.operation);
    expect(addPetSkill.method).toBe(addPetCap!.http.method);
    expect(addPetSkill.path).toBe(addPetCap!.http.path);
    expect(addPetSkill.sideEffects).toBe(addPetCap!.sideEffects);
  });

  it("includes parameter details for each skill", async () => {
    const emitter = new SkillsEmitter();
    const outputDir = path.join(TEST_OUTPUT_DIR, "skills-params");
    await emitter.emit(petstoreIR, { outputDir });

    const raw = await fs.readFile(path.join(outputDir, "skills.json"), "utf-8");
    const parsed = JSON.parse(raw);

    // Find a capability that has parameters (e.g., get_pet_by_id has petId)
    const getPetCap = petstoreIR.capabilities.find(c => c.name === "get_pet_by_id");
    expect(getPetCap).toBeDefined();

    const getPetSkill = parsed.skills.find((s: Record<string, unknown>) => s.id === getPetCap!.id);
    expect(getPetSkill).toBeDefined();
    expect(getPetSkill.parameters.length).toBeGreaterThan(0);

    for (const param of getPetSkill.parameters) {
      expect(param.name).toBeTruthy();
      expect(param.type).toBeTruthy();
      expect(typeof param.required).toBe("boolean");
      expect(typeof param.description).toBe("string");
    }
  });

  it("contains domains with skill counts", async () => {
    const emitter = new SkillsEmitter();
    const outputDir = path.join(TEST_OUTPUT_DIR, "skills-domains");
    await emitter.emit(petstoreIR, { outputDir });

    const raw = await fs.readFile(path.join(outputDir, "skills.json"), "utf-8");
    const parsed = JSON.parse(raw);

    expect(parsed.domains).toHaveLength(petstoreIR.domains.length);

    for (const domain of parsed.domains) {
      expect(domain.name).toBeTruthy();
      expect(typeof domain.skillCount).toBe("number");
      expect(domain.skillCount).toBeGreaterThan(0);
    }
  });

  it("contains generation meta information", async () => {
    const emitter = new SkillsEmitter();
    const outputDir = path.join(TEST_OUTPUT_DIR, "skills-gen-meta");
    await emitter.emit(petstoreIR, { outputDir });

    const raw = await fs.readFile(path.join(outputDir, "skills.json"), "utf-8");
    const parsed = JSON.parse(raw);

    expect(parsed.meta).toBeDefined();
    expect(parsed.meta.generator).toBe("agentify");
    expect(parsed.meta.generatedAt).toBeTruthy();
    expect(parsed.meta.strategy).toBe(petstoreIR.strategy.scale);

    // generatedAt should be a valid ISO date
    const date = new Date(parsed.meta.generatedAt);
    expect(date.getTime()).not.toBeNaN();
  });

  it("uses 2-space indentation in output JSON", async () => {
    const emitter = new SkillsEmitter();
    const outputDir = path.join(TEST_OUTPUT_DIR, "skills-indent");
    await emitter.emit(petstoreIR, { outputDir });

    const raw = await fs.readFile(path.join(outputDir, "skills.json"), "utf-8");

    // 2-space indented JSON has lines starting with "  "
    const lines = raw.split("\n");
    const indentedLines = lines.filter(l => l.startsWith("  "));
    expect(indentedLines.length).toBeGreaterThan(0);

    // Verify it is NOT tab-indented or 4-space
    const tabLines = lines.filter(l => l.startsWith("\t"));
    expect(tabLines).toHaveLength(0);
  });
});

// ─── A2A Card Emitter ───────────────────────────────────────

describe("A2A Card Emitter", () => {
  it("generates an a2a-card.json file", async () => {
    const emitter = new A2ACardEmitter();
    const outputDir = path.join(TEST_OUTPUT_DIR, "a2a-basic");
    const result = await emitter.emit(petstoreIR, { outputDir });

    expect(result.format).toBe("a2a");
    expect(result.filesWritten).toHaveLength(1);
    expect(result.filesWritten[0]).toContain("a2a-card.json");
    expect(result.warnings).toHaveLength(0);
  });

  it("generates valid JSON that can be parsed without error", async () => {
    const emitter = new A2ACardEmitter();
    const outputDir = path.join(TEST_OUTPUT_DIR, "a2a-json");
    await emitter.emit(petstoreIR, { outputDir });

    const raw = await fs.readFile(path.join(outputDir, "a2a-card.json"), "utf-8");
    const parsed = JSON.parse(raw);

    expect(parsed).toBeDefined();
    expect(typeof parsed).toBe("object");
  });

  it("contains product identity fields", async () => {
    const emitter = new A2ACardEmitter();
    const outputDir = path.join(TEST_OUTPUT_DIR, "a2a-identity");
    await emitter.emit(petstoreIR, { outputDir });

    const raw = await fs.readFile(path.join(outputDir, "a2a-card.json"), "utf-8");
    const parsed = JSON.parse(raw);

    expect(parsed.name).toBe(petstoreIR.product.name);
    expect(parsed.description).toBe(petstoreIR.product.description);
    expect(parsed.url).toBe(petstoreIR.product.baseUrl);
    expect(parsed.version).toBe(petstoreIR.product.version);
  });

  it("contains capabilities flags", async () => {
    const emitter = new A2ACardEmitter();
    const outputDir = path.join(TEST_OUTPUT_DIR, "a2a-capabilities");
    await emitter.emit(petstoreIR, { outputDir });

    const raw = await fs.readFile(path.join(outputDir, "a2a-card.json"), "utf-8");
    const parsed = JSON.parse(raw);

    expect(parsed.capabilities).toBeDefined();
    expect(parsed.capabilities.streaming).toBe(false);
    expect(parsed.capabilities.pushNotifications).toBe(false);
    expect(parsed.capabilities.stateTransitionHistory).toBe(false);
  });

  it("contains authentication schemes", async () => {
    const emitter = new A2ACardEmitter();
    const outputDir = path.join(TEST_OUTPUT_DIR, "a2a-auth");
    await emitter.emit(petstoreIR, { outputDir });

    const raw = await fs.readFile(path.join(outputDir, "a2a-card.json"), "utf-8");
    const parsed = JSON.parse(raw);

    expect(parsed.authentication).toBeDefined();
    expect(Array.isArray(parsed.authentication.schemes)).toBe(true);
    expect(parsed.authentication.schemes).toContain(petstoreIR.auth.type);
  });

  it("contains default input/output modes", async () => {
    const emitter = new A2ACardEmitter();
    const outputDir = path.join(TEST_OUTPUT_DIR, "a2a-modes");
    await emitter.emit(petstoreIR, { outputDir });

    const raw = await fs.readFile(path.join(outputDir, "a2a-card.json"), "utf-8");
    const parsed = JSON.parse(raw);

    expect(parsed.defaultInputModes).toEqual(["application/json"]);
    expect(parsed.defaultOutputModes).toEqual(["application/json"]);
  });

  it("contains all capabilities from the IR as skills", async () => {
    const emitter = new A2ACardEmitter();
    const outputDir = path.join(TEST_OUTPUT_DIR, "a2a-skills");
    await emitter.emit(petstoreIR, { outputDir });

    const raw = await fs.readFile(path.join(outputDir, "a2a-card.json"), "utf-8");
    const parsed = JSON.parse(raw);

    expect(parsed.skills).toHaveLength(petstoreIR.capabilities.length);

    for (const skill of parsed.skills) {
      expect(skill.id).toBeTruthy();
      expect(skill.name).toBeTruthy();
      expect(skill.description).toBeTruthy();
      expect(Array.isArray(skill.tags)).toBe(true);
      expect(skill.tags.length).toBeGreaterThanOrEqual(2);
      expect(Array.isArray(skill.examples)).toBe(true);
    }
  });

  it("maps skill tags from domain and operation type", async () => {
    const emitter = new A2ACardEmitter();
    const outputDir = path.join(TEST_OUTPUT_DIR, "a2a-tags");
    await emitter.emit(petstoreIR, { outputDir });

    const raw = await fs.readFile(path.join(outputDir, "a2a-card.json"), "utf-8");
    const parsed = JSON.parse(raw);

    const addPetCap = petstoreIR.capabilities.find(c => c.name === "add_pet");
    expect(addPetCap).toBeDefined();

    const addPetSkill = parsed.skills.find((s: Record<string, unknown>) => s.id === addPetCap!.id);
    expect(addPetSkill).toBeDefined();
    expect(addPetSkill.tags).toContain(addPetCap!.domain);
    expect(addPetSkill.tags).toContain(addPetCap!.operation);
  });

  it("contains provider information", async () => {
    const emitter = new A2ACardEmitter();
    const outputDir = path.join(TEST_OUTPUT_DIR, "a2a-provider");
    await emitter.emit(petstoreIR, { outputDir });

    const raw = await fs.readFile(path.join(outputDir, "a2a-card.json"), "utf-8");
    const parsed = JSON.parse(raw);

    expect(parsed.provider).toBeDefined();
    expect(parsed.provider.organization).toBe(petstoreIR.product.name);
    expect(parsed.provider.url).toBe(petstoreIR.product.baseUrl);
  });

  it("contains generation meta information", async () => {
    const emitter = new A2ACardEmitter();
    const outputDir = path.join(TEST_OUTPUT_DIR, "a2a-gen-meta");
    await emitter.emit(petstoreIR, { outputDir });

    const raw = await fs.readFile(path.join(outputDir, "a2a-card.json"), "utf-8");
    const parsed = JSON.parse(raw);

    expect(parsed.meta).toBeDefined();
    expect(parsed.meta.generator).toBe("agentify");
    expect(parsed.meta.generatedAt).toBeTruthy();

    const date = new Date(parsed.meta.generatedAt);
    expect(date.getTime()).not.toBeNaN();
  });

  it("uses 2-space indentation in output JSON", async () => {
    const emitter = new A2ACardEmitter();
    const outputDir = path.join(TEST_OUTPUT_DIR, "a2a-indent");
    await emitter.emit(petstoreIR, { outputDir });

    const raw = await fs.readFile(path.join(outputDir, "a2a-card.json"), "utf-8");

    const lines = raw.split("\n");
    const indentedLines = lines.filter(l => l.startsWith("  "));
    expect(indentedLines.length).toBeGreaterThan(0);

    const tabLines = lines.filter(l => l.startsWith("\t"));
    expect(tabLines).toHaveLength(0);
  });
});

// ─── Multi-format generation with new emitters ──────────────

describe("Multi-format generation (with skills and a2a)", () => {
  it("generates all five formats in one call", async () => {
    const outputDir = path.join(TEST_OUTPUT_DIR, "all-formats");
    const results = await generate(petstoreIR, outputDir, [
      "mcp",
      "claude.md",
      "agents.md",
      "skills",
      "a2a",
    ]);

    expect(results).toHaveLength(5);

    const formatNames = results.map(r => r.format);
    expect(formatNames).toContain("mcp");
    expect(formatNames).toContain("claude.md");
    expect(formatNames).toContain("agents.md");
    expect(formatNames).toContain("skills");
    expect(formatNames).toContain("a2a");

    // Verify JSON files exist and parse
    const skillsRaw = await fs.readFile(path.join(outputDir, "skills.json"), "utf-8");
    expect(() => JSON.parse(skillsRaw)).not.toThrow();

    const a2aRaw = await fs.readFile(path.join(outputDir, "a2a-card.json"), "utf-8");
    expect(() => JSON.parse(a2aRaw)).not.toThrow();
  });

  it("generates only skills when specified alone", async () => {
    const outputDir = path.join(TEST_OUTPUT_DIR, "skills-only");
    const results = await generate(petstoreIR, outputDir, ["skills"]);

    expect(results).toHaveLength(1);
    expect(results[0]!.format).toBe("skills");
  });

  it("generates only a2a when specified alone", async () => {
    const outputDir = path.join(TEST_OUTPUT_DIR, "a2a-only");
    const results = await generate(petstoreIR, outputDir, ["a2a"]);

    expect(results).toHaveLength(1);
    expect(results[0]!.format).toBe("a2a");
  });
});
