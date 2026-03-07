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

interface SkillParameter {
  readonly name: string;
  readonly type: string;
  readonly required: boolean;
  readonly description: string;
  readonly in: string;
}

interface Skill {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly domain: string;
  readonly operation: string;
  readonly method: string;
  readonly path: string;
  readonly sideEffects: boolean;
  readonly parameters: readonly SkillParameter[];
}

interface SkillsDomain {
  readonly name: string;
  readonly skillCount: number;
}

interface SkillsMeta {
  readonly generator: string;
  readonly generatedAt: string;
  readonly strategy: string;
}

interface SkillsDocument {
  readonly name: string;
  readonly description: string;
  readonly version: string;
  readonly baseUrl: string;
  readonly auth: {
    readonly type: string;
    readonly envVariable: string;
  };
  readonly skills: readonly Skill[];
  readonly domains: readonly SkillsDomain[];
  readonly meta: SkillsMeta;
}

export class SkillsEmitter implements Emitter {
  readonly name = "skills";
  readonly format = "skills";

  async emit(ir: AgentifyIR, options: EmitterOptions): Promise<EmitterResult> {
    const outputDir = path.resolve(options.outputDir);
    await fs.mkdir(outputDir, { recursive: true });

    const document = buildSkillsDocument(ir);
    const content = JSON.stringify(document, null, 2);
    const filePath = path.join(outputDir, "skills.json");
    await fs.writeFile(filePath, content, "utf-8");

    return {
      format: this.format,
      filesWritten: [filePath],
      warnings: [],
    };
  }
}

function buildSkillsDocument(ir: AgentifyIR): SkillsDocument {
  return {
    name: ir.product.name,
    description: ir.product.description,
    version: ir.product.version,
    baseUrl: ir.product.baseUrl,
    auth: {
      type: ir.auth.type,
      envVariable: ir.auth.envVariable,
    },
    skills: ir.capabilities.map(capabilityToSkill),
    domains: ir.domains.map(domain => ({
      name: domain.name,
      skillCount: domain.capabilityIds.length,
    })),
    meta: {
      generator: "agentify",
      generatedAt: new Date().toISOString(),
      strategy: ir.strategy.scale,
    },
  };
}

function capabilityToSkill(cap: Capability): Skill {
  return {
    id: cap.id,
    name: cap.name,
    description: cap.agentDescription,
    domain: cap.domain,
    operation: cap.operation,
    method: cap.http.method,
    path: cap.http.path,
    sideEffects: cap.sideEffects,
    parameters: cap.input.properties.map(propertyToParameter),
  };
}

function propertyToParameter(prop: SchemaProperty): SkillParameter {
  return {
    name: prop.name,
    type: prop.type,
    required: prop.required,
    description: prop.description,
    in: prop.in ?? "body",
  };
}
