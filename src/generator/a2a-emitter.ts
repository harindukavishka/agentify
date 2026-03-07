import * as fs from "node:fs/promises";
import * as path from "node:path";
import type {
  AgentifyIR,
  Capability,
  Emitter,
  EmitterOptions,
  EmitterResult,
} from "../types";

interface A2ASkill {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly tags: readonly string[];
  readonly examples: readonly unknown[];
}

interface A2ACard {
  readonly name: string;
  readonly description: string;
  readonly url: string;
  readonly version: string;
  readonly capabilities: {
    readonly streaming: boolean;
    readonly pushNotifications: boolean;
    readonly stateTransitionHistory: boolean;
  };
  readonly authentication: {
    readonly schemes: readonly string[];
  };
  readonly defaultInputModes: readonly string[];
  readonly defaultOutputModes: readonly string[];
  readonly skills: readonly A2ASkill[];
  readonly provider: {
    readonly organization: string;
    readonly url: string;
  };
  readonly meta: {
    readonly generator: string;
    readonly generatedAt: string;
  };
}

export class A2ACardEmitter implements Emitter {
  readonly name = "a2a-card";
  readonly format = "a2a";

  async emit(ir: AgentifyIR, options: EmitterOptions): Promise<EmitterResult> {
    const outputDir = path.resolve(options.outputDir);
    await fs.mkdir(outputDir, { recursive: true });

    const card = buildA2ACard(ir);
    const content = JSON.stringify(card, null, 2);
    const filePath = path.join(outputDir, "a2a-card.json");
    await fs.writeFile(filePath, content, "utf-8");

    return {
      format: this.format,
      filesWritten: [filePath],
      warnings: [],
    };
  }
}

function buildA2ACard(ir: AgentifyIR): A2ACard {
  return {
    name: ir.product.name,
    description: ir.product.description,
    url: ir.product.baseUrl,
    version: ir.product.version,
    capabilities: {
      streaming: false,
      pushNotifications: false,
      stateTransitionHistory: false,
    },
    authentication: {
      schemes: [ir.auth.type],
    },
    defaultInputModes: ["application/json"],
    defaultOutputModes: ["application/json"],
    skills: ir.capabilities.map(capabilityToA2ASkill),
    provider: {
      organization: ir.product.name,
      url: ir.product.baseUrl,
    },
    meta: {
      generator: "agentify",
      generatedAt: new Date().toISOString(),
    },
  };
}

function capabilityToA2ASkill(cap: Capability): A2ASkill {
  return {
    id: cap.id,
    name: cap.name,
    description: cap.agentDescription,
    tags: [cap.domain, cap.operation],
    examples: [],
  };
}
