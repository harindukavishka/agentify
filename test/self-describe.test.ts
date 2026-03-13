import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { getAvailableFormats } from "../src/generator/index";

const SELF_DIR = path.resolve(process.cwd(), "self");

describe("Self-Description Files", () => {
  describe("skills.json", () => {
    it("exists and is valid JSON", () => {
      const raw = fs.readFileSync(path.join(SELF_DIR, "skills.json"), "utf-8");
      const doc = JSON.parse(raw);
      expect(doc.name).toBe("Agentify");
    });

    it("has correct structure", () => {
      const raw = fs.readFileSync(path.join(SELF_DIR, "skills.json"), "utf-8");
      const doc = JSON.parse(raw);
      expect(doc.description).toContain("Agent Interface Compiler");
      expect(doc.auth.type).toBe("none");
      expect(doc.skills).toBeInstanceOf(Array);
      expect(doc.skills.length).toBeGreaterThan(0);
      expect(doc.domains).toBeInstanceOf(Array);
    });

    it("describes the transform skill correctly", () => {
      const raw = fs.readFileSync(path.join(SELF_DIR, "skills.json"), "utf-8");
      const doc = JSON.parse(raw);
      const transform = doc.skills.find(
        (s: { id: string }) => s.id === "transform",
      );
      expect(transform).toBeDefined();
      expect(transform.name).toBe("transform");
      expect(transform.parameters).toBeInstanceOf(Array);
      expect(transform.parameters.length).toBeGreaterThanOrEqual(1);

      const inputParam = transform.parameters.find(
        (p: { name: string }) => p.name === "input",
      );
      expect(inputParam).toBeDefined();
      expect(inputParam.required).toBe(true);
    });

    it("lists all available formats in the format parameter description", () => {
      const raw = fs.readFileSync(path.join(SELF_DIR, "skills.json"), "utf-8");
      const doc = JSON.parse(raw);
      const transform = doc.skills.find(
        (s: { id: string }) => s.id === "transform",
      );
      const formatParam = transform.parameters.find(
        (p: { name: string }) => p.name === "format",
      );
      expect(formatParam).toBeDefined();

      const available = getAvailableFormats();
      for (const fmt of available) {
        expect(formatParam.description).toContain(fmt);
      }
    });
  });

  describe("CLAUDE.md", () => {
    it("exists and contains usage instructions", () => {
      const content = fs.readFileSync(
        path.join(SELF_DIR, "CLAUDE.md"),
        "utf-8",
      );
      expect(content).toContain("npx agentify-cli transform");
      expect(content).toContain("## When to Use");
      expect(content).toContain("## Examples");
    });

    it("lists all available formats", () => {
      const content = fs.readFileSync(
        path.join(SELF_DIR, "CLAUDE.md"),
        "utf-8",
      );
      const available = getAvailableFormats();
      for (const fmt of available) {
        expect(content).toContain(fmt);
      }
    });
  });

  describe("AGENTS.md", () => {
    it("exists and follows the standard structure", () => {
      const content = fs.readFileSync(
        path.join(SELF_DIR, "AGENTS.md"),
        "utf-8",
      );
      expect(content).toContain("## Identity");
      expect(content).toContain("## Capabilities");
      expect(content).toContain("## Authentication");
      expect(content).toContain("## Protocols");
      expect(content).toContain("## Constraints");
    });

    it("contains the transform command", () => {
      const content = fs.readFileSync(
        path.join(SELF_DIR, "AGENTS.md"),
        "utf-8",
      );
      expect(content).toContain("npx agentify-cli transform");
    });
  });
});
