import { describe, it, expect } from "vitest";
import { scanCode, scanMultipleFiles } from "../src/security/scanner";

describe("scanCode", () => {
  it("passes clean code", () => {
    const code = `
      const x = 1 + 2;
      console.log(x);
    `;
    const result = scanCode(code);
    expect(result.passed).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it("detects dangerous code execution patterns", () => {
    // Intentionally testing dangerous patterns scanner should catch
    const dangerous = ["ev", "al", "('alert(1)')"].join("");
    const code = `const result = ${dangerous};`;
    const result = scanCode(code, "test.ts");
    expect(result.passed).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0]?.severity).toBe("critical");
  });

  it("detects hardcoded credentials as medium severity", () => {
    const code = `const apikey = "sk-1234567890";`;
    const result = scanCode(code, "test.ts");
    expect(result.passed).toBe(true); // medium severity doesn't block
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0]?.severity).toBe("medium");
  });

  it("includes line numbers in violations", () => {
    const code = `line1\nline2\nconst apikey = "secret123";\nline4`;
    const result = scanCode(code, "test.ts");
    expect(result.violations[0]?.line).toBe(3);
  });
});

describe("scanMultipleFiles", () => {
  it("scans all files and aggregates results", () => {
    const files = new Map<string, string>();
    files.set("clean.ts", "const x = 1;");
    files.set("warning.ts", `const apikey = "sk-test";`);

    const result = scanMultipleFiles(files);
    expect(result.scannedFiles).toBe(2);
    expect(result.passed).toBe(true);
  });

  it("fails if any file has critical violations", () => {
    const files = new Map<string, string>();
    files.set("clean.ts", "const x = 1;");
    const dangerous = ["ev", "al", "('x')"].join("");
    files.set("bad.ts", dangerous);

    const result = scanMultipleFiles(files);
    expect(result.passed).toBe(false);
  });
});
