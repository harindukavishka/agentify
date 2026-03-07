import { describe, it, expect, beforeAll } from "vitest";
import { parseOpenAPI } from "../src/parser/index";
import type { AgentifyIR, Capability, SchemaProperty } from "../src/types";

const PETSTORE_V2_URL = "https://petstore.swagger.io/v2/swagger.json";

let ir: AgentifyIR;
let warnings: readonly string[];

beforeAll(async () => {
  const result = await parseOpenAPI(PETSTORE_V2_URL);
  ir = result.ir;
  warnings = result.warnings;
}, 30000);

describe("Swagger 2.0 parsing — basic IR structure", () => {
  it("returns a valid AgentifyIR", () => {
    expect(ir).toBeDefined();
    expect(ir.product).toBeDefined();
    expect(ir.capabilities).toBeDefined();
    expect(ir.domains).toBeDefined();
    expect(ir.auth).toBeDefined();
    expect(ir.strategy).toBeDefined();
  });

  it("extracts product meta correctly", () => {
    expect(ir.product.name).toBe("Swagger Petstore");
    expect(ir.product.version).toBe("1.0.7");
    expect(ir.product.description).toBeTruthy();
  });

  it("extracts multiple capabilities", () => {
    expect(ir.capabilities.length).toBeGreaterThan(10);
  });
});

describe("Swagger 2.0 — base URL construction", () => {
  it("constructs base URL from host + basePath + schemes", () => {
    // Petstore v2: host=petstore.swagger.io, basePath=/v2, schemes=[https, http]
    expect(ir.product.baseUrl).toMatch(/^https?:\/\/petstore\.swagger\.io\/v2$/);
  });
});

describe("Swagger 2.0 — auth from securityDefinitions", () => {
  it("detects apiKey auth type", () => {
    // Petstore v2 has api_key in securityDefinitions (apiKey type)
    expect(ir.auth.type).toBe("apiKey");
  });

  it("sets envVariable based on API name and auth type", () => {
    expect(ir.auth.envVariable).toContain("API_KEY");
  });

  it("has a description", () => {
    expect(ir.auth.description).toBeTruthy();
  });
});

describe("Swagger 2.0 — domains from tags", () => {
  it("groups capabilities into domains", () => {
    expect(ir.domains.length).toBeGreaterThanOrEqual(3);
  });

  it("has a pet domain", () => {
    const petDomain = ir.domains.find(d => d.name === "pet");
    expect(petDomain).toBeDefined();
    expect(petDomain!.capabilityIds.length).toBeGreaterThan(0);
  });

  it("has a store domain", () => {
    const storeDomain = ir.domains.find(d => d.name === "store");
    expect(storeDomain).toBeDefined();
    expect(storeDomain!.capabilityIds.length).toBeGreaterThan(0);
  });

  it("has a user domain", () => {
    const userDomain = ir.domains.find(d => d.name === "user");
    expect(userDomain).toBeDefined();
    expect(userDomain!.capabilityIds.length).toBeGreaterThan(0);
  });
});

describe("Swagger 2.0 — body parameter extraction (Issue #7)", () => {
  function findCapability(operationId: string): Capability | undefined {
    return ir.capabilities.find(c => c.id === operationId);
  }

  function getBodyProperties(cap: Capability): SchemaProperty[] {
    return cap.input.properties.filter(p => p.in === "body") as SchemaProperty[];
  }

  it("addPet has body properties from pet schema", () => {
    const addPet = findCapability("addPet");
    expect(addPet).toBeDefined();

    const bodyProps = getBodyProperties(addPet!);
    // Swagger 2.0 addPet has in:body param with schema referencing Pet
    // Pet schema has: id, category, name, photoUrls, tags, status
    expect(bodyProps.length).toBeGreaterThanOrEqual(4);

    const propNames = bodyProps.map(p => p.name);
    expect(propNames).toContain("name");
    expect(propNames).toContain("status");
    expect(propNames).toContain("photoUrls");
  });

  it("updatePet has body properties from pet schema", () => {
    const updatePet = findCapability("updatePet");
    expect(updatePet).toBeDefined();

    const bodyProps = getBodyProperties(updatePet!);
    expect(bodyProps.length).toBeGreaterThanOrEqual(4);

    const propNames = bodyProps.map(p => p.name);
    expect(propNames).toContain("name");
    expect(propNames).toContain("status");
  });

  it("placeOrder has body properties from order schema", () => {
    const placeOrder = findCapability("placeOrder");
    expect(placeOrder).toBeDefined();

    const bodyProps = getBodyProperties(placeOrder!);
    // Order schema has: id, petId, quantity, shipDate, status, complete
    expect(bodyProps.length).toBeGreaterThanOrEqual(4);

    const propNames = bodyProps.map(p => p.name);
    expect(propNames).toContain("petId");
    expect(propNames).toContain("quantity");
    expect(propNames).toContain("status");
  });

  it("createUser has body properties from user schema", () => {
    const createUser = findCapability("createUser");
    expect(createUser).toBeDefined();

    const bodyProps = getBodyProperties(createUser!);
    // User schema has: id, username, firstName, lastName, email, password, phone, userStatus
    expect(bodyProps.length).toBeGreaterThanOrEqual(5);

    const propNames = bodyProps.map(p => p.name);
    expect(propNames).toContain("username");
    expect(propNames).toContain("email");
    expect(propNames).toContain("password");
  });

  it("body properties are marked with in: body", () => {
    const addPet = findCapability("addPet");
    expect(addPet).toBeDefined();

    const bodyProps = getBodyProperties(addPet!);
    for (const prop of bodyProps) {
      expect(prop.in).toBe("body");
    }
  });

  it("required fields from body schema are tracked", () => {
    const addPet = findCapability("addPet");
    expect(addPet).toBeDefined();

    // Pet schema requires: name, photoUrls
    const bodyProps = getBodyProperties(addPet!);
    const nameField = bodyProps.find(p => p.name === "name");
    const photoUrlsField = bodyProps.find(p => p.name === "photoUrls");

    expect(nameField?.required).toBe(true);
    expect(photoUrlsField?.required).toBe(true);
  });

  it("non-body params (path, query) are preserved alongside body params", () => {
    const updatePetWithForm = findCapability("updatePetWithForm");
    expect(updatePetWithForm).toBeDefined();

    // updatePetWithForm has a path param (petId) and formData params
    const pathProps = updatePetWithForm!.input.properties.filter(p => p.in === "path");
    expect(pathProps.length).toBeGreaterThanOrEqual(1);
    expect(pathProps.map(p => p.name)).toContain("petId");
  });

  it("does not create a single flat 'body' property for body params with schema.properties", () => {
    const addPet = findCapability("addPet");
    expect(addPet).toBeDefined();

    // Should NOT have a single property named "body" — should have expanded properties
    const singleBodyProp = addPet!.input.properties.find(
      p => p.name === "body" && p.in === "body"
    );
    expect(singleBodyProp).toBeUndefined();
  });
});
