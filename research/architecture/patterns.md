# Agentify 架构研究报告

> 研究日期：2026-03-02
> 研究员：Architect Agent
> 目标：为 Agentify meta-tool 设计可行的技术架构方案

---

## 目录

1. [产品能力解析技术](#1-产品能力解析技术)
2. [产品能力图谱表示](#2-产品能力图谱表示)
3. [转换管线设计](#3-转换管线设计)
4. [Schema 推断和 API 生成](#4-schema-推断和-api-生成)
5. [MCP Server 脚手架和生成](#5-mcp-server-脚手架和生成)
6. [Dog-fooding 设计](#6-dog-fooding-设计)
7. [技术栈选择](#7-技术栈选择)
8. [可扩展性设计](#8-可扩展性设计)
9. [推荐架构方案](#推荐架构方案)

---

## 1. 产品能力解析技术

### 1.1 问题定义

Agentify 的核心挑战是：给定一个传统产品（SaaS、数据库、CLI 工具等），如何自动化地解析出该产品的所有能力（capabilities），并将其转化为 agent 可理解、可调用的格式。

### 1.2 解析渠道分类

```
┌─────────────────────────────────────────────────────────────┐
│                    产品能力解析入口                           │
├──────────────┬──────────────┬──────────────┬────────────────┤
│  API Spec    │  文档解析     │  UI 爬取     │  代码分析       │
│  (结构化)     │  (半结构化)   │  (非结构化)   │  (源码级)      │
├──────────────┼──────────────┼──────────────┼────────────────┤
│ OpenAPI/     │ Markdown     │ Headless     │ AST 分析       │
│ Swagger      │ 文档         │ Browser      │ 函数签名提取    │
│ GraphQL      │ API 参考     │ DOM 分析     │ 类型推断       │
│ gRPC Proto   │ README       │ 交互录制     │ 依赖图         │
│ WSDL         │ Man pages    │ Screenshot   │                │
└──────────────┴──────────────┴──────────────┴────────────────┘
```

### 1.3 各渠道技术方案

#### A. OpenAPI/Swagger Spec 解析（最高优先级）

这是最成熟的路径。现有工具链已非常完善：

- **Stainless**: 从 OpenAPI spec 自动生成 MCP server，采用 "code execution tool + docs search tool" 双工具架构。其核心思路是：不为每个 endpoint 生成一个 tool，而是生成一个可执行代码的沙盒工具 + 一个文档搜索工具，让 LLM 自主编写调用代码
- **FastMCP (v3.0+)**: Python 框架，提供 `FastMCP.from_openapi()` 方法，内部使用 `OpenAPIProvider` 自动将 OpenAPI spec 转为 MCP components。采用 RouteMap 系统控制 endpoint -> MCP component 映射
- **openapi-mcp-generator**: 解析 OpenAPI paths/operations/schemas，通过 Jinja2 模板渲染生成 Python MCP server
- **openapi-mcp-codegen (CNOE)**: 类似方案，生成结构化 Python package
- **AWS OpenAPI MCP Server**: 动态创建 MCP tools，运行时解析 spec 而非预生成代码

**关键发现**: Stainless 的 "code execution + docs search" 双工具模式比 "一个 endpoint 一个 tool" 更优，因为：
1. 占用 LLM context window 更少
2. 单次调用可执行任意复杂操作
3. 更好的 composability

#### B. 文档解析（LLM 辅助）

对于没有 OpenAPI spec 的产品，需要从文档中推断 API 结构：

- **Crawl4AI**: 提供 LLM-powered schema 生成，可从 HTML 文档自动提取结构化数据
- **Firecrawl**: 将网站转为 LLM-ready markdown 或结构化数据
- 核心流程：爬取文档 -> LLM 解析 -> 生成 intermediate representation -> 人工审核 -> 生成 spec

#### C. UI 爬取（最复杂）

对于纯 GUI 产品，需要通过浏览器自动化来理解产品能力：

- **Browser-Use / Playwright**: Headless browser 自动化
- **Browse AI**: 点击式 web scraping，自动结构化数据
- **Bright Data Browser API**: 企业级 browser automation
- 核心挑战：从 UI 交互中推断出底层的 action model

#### D. 源码分析

对于开源产品：
- AST 解析提取 public API
- TypeScript compiler API 获取完整类型信息
- 函数签名 + JSDoc/docstring 自动提取

### 1.4 技术权衡

| 解析方式 | 准确度 | 自动化程度 | 适用范围 | 开发成本 |
|---------|--------|-----------|---------|---------|
| OpenAPI Spec | 极高 | 极高 | 有 spec 的 API | 低 |
| 文档解析 | 中-高 | 中 | 任何有文档的产品 | 中 |
| UI 爬取 | 低-中 | 低 | GUI-only 产品 | 高 |
| 源码分析 | 极高 | 高 | 开源产品 | 中 |

**建议**: Phase 1 聚焦 OpenAPI spec 解析，Phase 2 扩展到文档解析，Phase 3 考虑 UI 爬取。

---

## 2. 产品能力图谱表示

### 2.1 为什么需要 Capability Graph

Agent 需要理解：
1. 一个产品能做什么（capabilities）
2. 能力之间的依赖关系（dependencies）
3. 如何组合能力完成复杂任务（composition）
4. 每个能力的输入/输出 schema（contracts）

这不是简单的 tool 列表，而是一个结构化的 capability graph。

### 2.2 图谱数据模型

```
┌─────────────────────────────────────────────────────────────┐
│                    Capability Graph                         │
│                                                             │
│  ┌──────────┐    requires    ┌──────────┐                  │
│  │ Capability├──────────────►│ Capability│                  │
│  │ (Action)  │               │ (Auth)    │                  │
│  └─────┬─────┘               └──────────┘                  │
│        │                                                    │
│        │ has_input            has_output                     │
│        ▼                        │                           │
│  ┌──────────┐               ┌───▼──────┐                   │
│  │  Schema   │               │  Schema   │                  │
│  │ (Input)   │               │ (Output)  │                  │
│  └──────────┘               └──────────┘                   │
│                                                             │
│  Entity Types:                                              │
│  - Product: 顶层产品节点                                      │
│  - Domain: 功能域 (e.g., "用户管理", "支付")                   │
│  - Capability: 具体能力 (e.g., "创建用户", "发起支付")          │
│  - Schema: 数据结构定义                                       │
│  - Auth: 认证/授权要求                                        │
│                                                             │
│  Relationship Types:                                        │
│  - belongs_to: Capability -> Domain                         │
│  - requires: Capability -> Capability (依赖)                │
│  - produces: Capability -> Schema (输出)                    │
│  - consumes: Capability -> Schema (输入)                    │
│  - authenticates_with: Capability -> Auth                   │
│  - composes: Capability -> [Capability] (组合)              │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 技术实现选项

#### A. 内存图结构（推荐 Phase 1）

```typescript
interface CapabilityNode {
  id: string
  type: 'product' | 'domain' | 'capability' | 'schema' | 'auth'
  name: string
  description: string
  metadata: Record<string, unknown>
}

interface CapabilityEdge {
  source: string
  target: string
  type: 'belongs_to' | 'requires' | 'produces' | 'consumes' | 'authenticates_with' | 'composes'
  metadata: Record<string, unknown>
}

interface CapabilityGraph {
  nodes: Map<string, CapabilityNode>
  edges: CapabilityEdge[]
}
```

#### B. Knowledge Graph（Phase 2+）

- **Graphiti (Zep)**: 专为 AI Agent 设计的实时 knowledge graph 框架
- **Neo4j + MCP**: PuppyGraph 等已有 MCP knowledge graph 集成
- 适合大规模产品图谱存储和跨产品能力查询

### 2.4 与 Agent 推理的集成

Knowledge graph 的关键价值在于支持 agent 推理。例如：

> Agent 看到 graph："`创建订单` requires `用户认证`，`用户认证` consumes `{email, password}`"
> Agent 自动规划：先调用认证 -> 再创建订单

这使得 Agent 可以通过图谱进行 **计划推理（planning）** 和 **工具选择（tool selection）**。

---

## 3. 转换管线设计

### 3.1 管线总览

```
┌──────────────────────────────────────────────────────────────────────┐
│                        Agentify 转换管线                              │
│                                                                      │
│  ┌─────────┐   ┌──────────┐   ┌───────────┐   ┌──────────┐         │
│  │  Input   │──►│ Analyzer │──►│ Capability│──►│Transformer│         │
│  │ Sources  │   │          │   │  Graph    │   │  Engine   │         │
│  └─────────┘   └──────────┘   └───────────┘   └────┬─────┘         │
│                                                      │               │
│       ┌──────────────────────────────────────────────┤               │
│       │                    │                         │               │
│       ▼                    ▼                         ▼               │
│  ┌─────────┐        ┌──────────┐             ┌──────────┐           │
│  │   MCP   │        │   API    │             │  Skills  │           │
│  │ Server  │        │ Wrapper  │             │  Spec    │           │
│  └─────────┘        └──────────┘             └──────────┘           │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 3.2 管线阶段详解

#### Stage 1: Input Ingestion

```
Input Sources:
├── OpenAPI Spec (JSON/YAML)
├── GraphQL Schema (SDL)
├── API Documentation (HTML/Markdown)
├── CLI Help Output (--help text)
├── UI Screenshots + DOM
└── Source Code (TypeScript/Python)
```

每种 input 对应一个 `Ingestor` plugin：

```typescript
interface Ingestor {
  readonly supportedTypes: InputType[]
  ingest(source: InputSource): Promise<RawCapabilities>
}
```

#### Stage 2: Analysis & Normalization

将不同来源的 raw data 统一为 Capability Graph：

```typescript
interface Analyzer {
  analyze(raw: RawCapabilities): Promise<CapabilityGraph>
  enrich(graph: CapabilityGraph): Promise<CapabilityGraph>  // LLM 辅助补充
}
```

关键步骤：
1. **Schema Normalization**: 统一不同格式的 schema 表示（OpenAPI 3.0 vs 3.1, JSON Schema drafts）
2. **Capability Extraction**: 从原始数据中识别出 capabilities
3. **Relationship Inference**: 推断 capabilities 之间的依赖关系
4. **Description Enhancement**: 使用 LLM 增强 capability 描述，使其更适合 agent 理解

#### Stage 3: Transformation

将 Capability Graph 转化为目标格式：

```typescript
interface Transformer<T> {
  readonly targetType: OutputType
  transform(graph: CapabilityGraph, config: TransformConfig): Promise<T>
  validate(output: T): Promise<ValidationResult>
}
```

目标格式包括：
- **MCP Server**: 完整的 MCP server 代码
- **API Wrapper**: REST/GraphQL API 封装层
- **Skills Spec**: Claude Code Skills 定义
- **Agent Config**: 各 agent 框架的配置文件

### 3.3 GUI -> API -> MCP -> Skills 完整转换流

```
GUI 产品
    │
    ▼ (Browser Automation + LLM 分析)
Action Model (用户可执行的操作列表)
    │
    ▼ (Schema Inference)
API Spec (OpenAPI 格式)
    │
    ▼ (MCP Transformer)
MCP Server (Tools + Resources + Prompts)
    │
    ▼ (Skills Transformer)
Skills Definition (prompt template + tool bindings)
```

每一步都生成 intermediate artifact，可以人工审核和修改。

---

## 4. Schema 推断和 API 生成

### 4.1 Schema 推断技术

#### A. 从 API Response 推断

```
HTTP Response (JSON) ──► JSON Schema Inference ──► OpenAPI Schema
```

技术方案：
- 多次调用同一 endpoint，收集 response samples
- 使用 quicktype 或自研推断引擎从 samples 推断 JSON Schema
- 处理 nullable fields, optional fields, union types
- LLM 辅助补充语义信息（field 描述、约束）

#### B. 从 UI 推断

```
UI Form ──► Form Field 提取 ──► Input Schema
UI Table ──► Column 提取 ──► Output Schema
UI Workflow ──► Step 分析 ──► Action Sequence Schema
```

技术方案：
- Crawl4AI 的 LLM extraction strategy：提供 Pydantic schema 描述目标字段，LLM 将 raw text 转为结构化 JSON
- DOM 分析提取 form elements -> input schema
- 表格结构分析 -> output schema

#### C. 从文档推断

```
API 文档 ──► LLM 解析 ──► Request/Response Schema ──► OpenAPI Spec
```

关键挑战：
- 文档中的代码示例可能不完整
- 需要处理文档版本不一致
- LLM hallucination 风险——需要 validation 步骤

### 4.2 API 生成架构

```typescript
interface SchemaInferrer {
  inferFromSamples(samples: JsonSample[]): JsonSchema
  inferFromDom(dom: DomTree): JsonSchema
  inferFromDocs(docs: string, context: string): Promise<JsonSchema>
  merge(schemas: JsonSchema[]): JsonSchema
}

interface ApiGenerator {
  generateOpenApiSpec(graph: CapabilityGraph): OpenApiSpec
  generateEndpoints(spec: OpenApiSpec): EndpointDefinition[]
  generateSdkClient(spec: OpenApiSpec, language: Language): string
}
```

### 4.3 Schema Transformation 核心问题

参考 Stainless 和 FastMCP 的经验：

1. **$ref 解析**: 某些 client 不支持 $ref，需要 inline 展开所有引用
2. **Union Types 拆分**: 将 union input 的 tool 拆分为多个独立 tools
3. **OpenAPI 3.0 vs 3.1 差异**: nullable 表示方式不同，需要统一处理
4. **Parameter Collision**: path parameter 和 body property 同名时的冲突解决
5. **Array Serialization**: 不同 style/explode 组合的序列化方式

---

## 5. MCP Server 脚手架和生成

### 5.1 MCP 协议核心概念

MCP (Model Context Protocol) 是 Anthropic 发布的开放协议，已被 OpenAI、Google DeepMind 采纳，并于 2025 年 12 月捐赠给 Linux Foundation 的 Agentic AI Foundation。

**核心架构**：Client-Host-Server 模型
- **Host**: 容器和协调者，管理多个 client 实例
- **Client**: 与 server 建立 1:1 stateful session
- **Server**: 暴露 Resources, Tools, Prompts

**MCP Server 暴露的三种 primitives**:

| Primitive | 用途 | 触发方式 |
|-----------|------|---------|
| **Tools** | 可执行的操作 | LLM 主动调用 |
| **Resources** | 结构化数据（文件、DB 查询） | Client 读取 |
| **Prompts** | 动态工作流模板 | 用户选择 |

**2025-11-25 规范更新**：
- Sampling 增强：Server 可在 sampling request 中包含 tool definitions，使 MCP server 可运行自己的 agentic loops
- Enterprise-grade 安全和治理特性
- Streamable HTTP transport（替代旧的 SSE）

### 5.2 MCP Server 生成策略

#### 策略 A: Template-Based Code Generation（推荐）

```
Capability Graph
    │
    ▼
Template Engine (Handlebars / EJS / Custom AST)
    │
    ├── server.ts (entry point + transport setup)
    ├── tools/ (每个 capability -> 一个 tool 定义)
    ├── resources/ (数据读取 capabilities -> resources)
    ├── prompts/ (workflow capabilities -> prompt templates)
    ├── schemas/ (Zod schemas for validation)
    ├── config.ts (环境变量验证)
    └── package.json + tsconfig.json
```

**优点**: 生成的代码是静态可审查的，可以进一步手动定制
**参考**: openapi-mcp-generator 使用 Jinja2 模板

#### 策略 B: Runtime Dynamic Server

```
Capability Graph ──► Runtime MCP Server (动态注册 tools)
```

**优点**: 无需代码生成步骤，配置即运行
**参考**: AWS OpenAPI MCP Server 的动态方式
**缺点**: 不可定制，调试困难

#### 策略 C: Hybrid (Stainless 方式)

只生成两个 tools：
1. **Code Execution Tool**: 沙盒执行 TypeScript/Python 代码
2. **Docs Search Tool**: 搜索 API 文档

**优点**: 极简，context window 友好
**缺点**: 依赖 LLM 编写正确的调用代码

### 5.3 推荐方案

**Phase 1**: 采用 Template-Based Code Generation，因为：
1. 生成物可审查、可版本控制
2. 用户可以进一步定制
3. 与现有 MCP 工具链兼容（如 Claude Desktop 的 stdio transport）
4. 调试方便

**Phase 2**: 增加 Runtime Dynamic Server 模式，用于快速预览和测试

### 5.4 生成代码结构

```
generated-mcp-server/
├── src/
│   ├── index.ts              # Server entry, transport setup
│   ├── config.ts             # Env vars with Zod validation
│   ├── tools/
│   │   ├── index.ts          # Tool registry
│   │   ├── create-user.ts    # Tool: createUser
│   │   └── list-orders.ts    # Tool: listOrders
│   ├── resources/
│   │   ├── index.ts          # Resource registry
│   │   └── user-profile.ts   # Resource: userProfile
│   ├── prompts/
│   │   ├── index.ts          # Prompt registry
│   │   └── onboarding.ts     # Prompt: onboarding workflow
│   └── lib/
│       ├── api-client.ts     # HTTP client for target API
│       ├── auth.ts           # Auth handling
│       └── schemas.ts        # Shared Zod schemas
├── package.json
├── tsconfig.json
└── README.md
```

---

## 6. Dog-fooding 设计

### 6.1 核心理念

Agentify 本身应该是 agent-native 的——即 Agentify 自己也应该作为 MCP server 被 agent 使用。这形成一个 self-referential 闭环：

```
Agent
  │
  ▼ (使用 Agentify MCP Server)
Agentify
  │
  ▼ (分析目标产品)
Target Product
  │
  ▼ (生成 MCP Server)
Generated MCP Server
  │
  ▼ (被 Agent 使用)
Agent
```

### 6.2 Agentify 自身的 MCP Server 设计

Agentify 应暴露以下 MCP tools：

```typescript
// Tool: analyze_product
// 分析一个产品的能力
{
  name: "analyze_product",
  description: "Analyze a product's capabilities from its API spec, documentation, or URL",
  inputSchema: {
    source: "string (URL, file path, or inline spec)",
    sourceType: "openapi | graphql | documentation | url",
    options: { depth: "shallow | deep", includeAuth: "boolean" }
  }
}

// Tool: generate_mcp_server
// 从 capability graph 生成 MCP server
{
  name: "generate_mcp_server",
  description: "Generate a complete MCP server from analyzed capabilities",
  inputSchema: {
    capabilityGraphId: "string",
    outputDir: "string",
    config: { transport: "stdio | sse | streamable-http", language: "typescript | python" }
  }
}

// Tool: preview_capabilities
// 预览产品能力图谱
{
  name: "preview_capabilities",
  description: "Preview the capability graph of an analyzed product",
  inputSchema: {
    capabilityGraphId: "string",
    format: "summary | detailed | graph"
  }
}

// Tool: validate_mcp_server
// 验证生成的 MCP server
{
  name: "validate_mcp_server",
  description: "Validate a generated MCP server for correctness and completeness",
  inputSchema: {
    serverDir: "string"
  }
}
```

### 6.3 Dog-fooding 反馈循环

参考 Cursor 和 Anthropic (Claude Code) 的 dog-fooding 实践：

1. **开发 Agentify 时使用 Agentify**: 团队使用 Agentify 的 MCP server 来分析和改进 Agentify 自身
2. **紧密反馈循环**: 通过 dog-fooding 发现的问题可快速修复并在下一轮使用中验证
3. **Capability 自省**: Agentify 可以分析自己的 API，确保生成质量
4. **Bootstrapping**: 初始版本手动构建核心功能，然后用自身生成后续功能的 MCP 接口

### 6.4 Self-improvement 机制

```
Agentify v1 (手动构建)
    │
    ▼ (分析自身 API)
Agentify MCP Server v1
    │
    ▼ (Agent 使用发现问题)
改进 Agentify v2
    │
    ▼ (重新生成)
Agentify MCP Server v2 (更好的 tool descriptions, 更完整的 capabilities)
    │
    ▼ 循环...
```

---

## 7. 技术栈选择

### 7.1 核心语言：TypeScript

**选择理由**：

| 考量 | TypeScript | Python | 备注 |
|------|-----------|--------|------|
| MCP SDK 成熟度 | 官方 SDK | FastMCP (社区) | TS SDK 是 Anthropic 官方维护 |
| 类型安全 | 原生 | 需要 mypy/Pydantic | Schema 生成需要强类型 |
| 前端集成 | 原生 | 需要 bridge | 未来可能需要 UI |
| 代码生成 | AST 操作成熟 | 也可以 | TypeScript Compiler API |
| AI 生态 | 良好 | 最好 | Python 有更多 AI 库 |
| 运行时性能 | 优秀 (Node.js/Bun) | 一般 | MCP server 是 I/O bound |
| 开发者生态 | 庞大 | 庞大 | 两者都不错 |

**结论**: TypeScript 是更好的选择，因为：
1. MCP 官方 TypeScript SDK (`@modelcontextprotocol/sdk`) 由 Anthropic 直接维护
2. 代码生成场景中 TypeScript Compiler API 提供 AST-level 操作能力
3. Zod 提供运行时 schema validation，与 TypeScript 类型系统无缝集成
4. Node.js 22.18.0+ 内置 type stripping，开发体验极佳

### 7.2 运行时：Node.js 22+ (可选 Bun)

- Node.js 22.18.0+ 自带 type stripping，无需编译步骤即可运行 TypeScript
- Bun 作为备选，性能更好但生态稍弱
- 生产构建使用 Vite/tsup

### 7.3 核心依赖

```
框架和工具:
├── @modelcontextprotocol/sdk   # MCP 官方 TypeScript SDK
├── zod                         # Schema validation
├── typescript                  # 类型系统 + Compiler API
├── openapi-types               # OpenAPI 类型定义
├── @apidevtools/swagger-parser # OpenAPI spec 解析
├── handlebars / ejs            # 代码模板引擎
├── commander                   # CLI 框架
├── crawl4ai (via API) / cheerio # 文档爬取和解析
├── playwright                  # Browser automation (UI 爬取)
└── vitest                      # 测试框架

代码生成:
├── ts-morph                    # TypeScript AST 操作
├── prettier                    # 代码格式化
└── eslint                      # Lint 生成代码

AI/LLM:
├── @anthropic-ai/sdk           # Claude API (用于 LLM 辅助分析)
└── tiktoken                    # Token 计数
```

### 7.4 项目结构

```
agentify/
├── packages/
│   ├── core/                   # 核心库
│   │   ├── src/
│   │   │   ├── analyzers/      # 产品能力解析器
│   │   │   ├── graph/          # Capability Graph 数据结构
│   │   │   ├── transformers/   # 转换器 (Graph -> MCP/API/Skills)
│   │   │   ├── generators/     # 代码生成器
│   │   │   ├── validators/     # 验证器
│   │   │   └── types/          # 核心类型定义
│   │   └── package.json
│   ├── cli/                    # CLI 入口
│   │   ├── src/
│   │   │   ├── commands/       # CLI 命令
│   │   │   └── index.ts
│   │   └── package.json
│   ├── mcp-server/             # Agentify 自身的 MCP Server (dog-fooding)
│   │   ├── src/
│   │   │   ├── tools/
│   │   │   ├── resources/
│   │   │   └── index.ts
│   │   └── package.json
│   └── templates/              # MCP server 代码模板
│       ├── typescript/
│       └── python/
├── plugins/                    # 可扩展 plugins
│   ├── ingestor-openapi/
│   ├── ingestor-graphql/
│   ├── ingestor-docs/
│   ├── transformer-mcp/
│   └── transformer-skills/
├── tests/
├── package.json                # Workspace root
├── turbo.json                  # Monorepo 构建
└── tsconfig.base.json
```

---

## 8. 可扩展性设计

### 8.1 Plugin 系统架构

借鉴 FastMCP 3.0 的 Provider/Transform 架构：

```
┌─────────────────────────────────────────────────────────┐
│                    Plugin System                         │
│                                                          │
│  ┌───────────────┐  ┌───────────────┐  ┌──────────────┐│
│  │   Ingestor    │  │  Transformer  │  │  Validator   ││
│  │   Plugins     │  │   Plugins     │  │  Plugins     ││
│  ├───────────────┤  ├───────────────┤  ├──────────────┤│
│  │ OpenAPI       │  │ MCP Server    │  │ Schema       ││
│  │ GraphQL       │  │ REST API      │  │ Security     ││
│  │ Documentation │  │ Skills        │  │ Completeness ││
│  │ UI Crawl      │  │ Agent Config  │  │ Compatibility││
│  │ Source Code   │  │ Custom        │  │ Custom       ││
│  └───────────────┘  └───────────────┘  └──────────────┘│
│                                                          │
│  Plugin Interface:                                       │
│  ┌──────────────────────────────────────────────────────┐│
│  │ interface AgentifyPlugin {                           ││
│  │   name: string                                      ││
│  │   version: string                                   ││
│  │   type: 'ingestor' | 'transformer' | 'validator'    ││
│  │   register(registry: PluginRegistry): void          ││
│  │ }                                                   ││
│  └──────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

### 8.2 Plugin 接口定义

```typescript
// Plugin registry
interface PluginRegistry {
  registerIngestor(ingestor: Ingestor): void
  registerTransformer(transformer: Transformer): void
  registerValidator(validator: Validator): void
}

// Ingestor plugin
interface Ingestor {
  readonly name: string
  readonly supportedInputTypes: InputType[]
  canHandle(source: InputSource): boolean
  ingest(source: InputSource): Promise<RawCapabilities>
}

// Transformer plugin
interface Transformer<T = unknown> {
  readonly name: string
  readonly targetType: OutputType
  transform(graph: CapabilityGraph, config: TransformConfig): Promise<T>
  validate(output: T): Promise<ValidationResult>
}

// Validator plugin
interface Validator {
  readonly name: string
  readonly validationTarget: 'schema' | 'security' | 'completeness' | 'compatibility'
  validate(artifact: unknown): Promise<ValidationResult>
}
```

### 8.3 Transform Pipeline

借鉴 FastMCP 的 Transform 概念：

```typescript
interface Transform {
  readonly name: string
  readonly order: number  // 执行顺序
  apply(graph: CapabilityGraph): CapabilityGraph  // 纯函数，不修改原图
}

// 示例 transforms:
// - NamespaceTransform: 给所有 capabilities 加命名空间前缀
// - FilterTransform: 过滤掉不需要的 capabilities
// - SecurityTransform: 添加安全相关的 metadata
// - DescriptionEnhanceTransform: 使用 LLM 增强描述
```

### 8.4 第三方 Plugin 开发

```typescript
// 用户自定义 ingestor 示例
import { definePlugin, type Ingestor } from '@agentify/core'

export default definePlugin({
  name: 'my-custom-ingestor',
  version: '1.0.0',
  type: 'ingestor',
  register(registry) {
    registry.registerIngestor(new MyCustomIngestor())
  }
})
```

---

## 推荐架构方案

### 总体架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Agentify Architecture                       │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                     Interface Layer                          │   │
│  │  ┌─────────┐  ┌──────────────┐  ┌────────────────────┐    │   │
│  │  │   CLI   │  │  MCP Server  │  │  Programmatic API  │    │   │
│  │  │ (human) │  │  (agent)     │  │  (SDK)             │    │   │
│  │  └────┬────┘  └──────┬───────┘  └────────┬───────────┘    │   │
│  └───────┼──────────────┼───────────────────┼────────────────┘   │
│          │              │                   │                     │
│  ┌───────▼──────────────▼───────────────────▼────────────────┐   │
│  │                   Core Engine                              │   │
│  │                                                            │   │
│  │  ┌──────────┐  ┌───────────────┐  ┌──────────────────┐   │   │
│  │  │ Ingestor │  │  Capability   │  │   Transformer    │   │   │
│  │  │ Pipeline │──│  Graph Engine │──│   Pipeline       │   │   │
│  │  └──────────┘  └───────────────┘  └──────────────────┘   │   │
│  │                                                            │   │
│  │  ┌──────────┐  ┌───────────────┐  ┌──────────────────┐   │   │
│  │  │  Schema  │  │   Code        │  │   Validation     │   │   │
│  │  │ Inferrer │  │   Generator   │  │   Engine         │   │   │
│  │  └──────────┘  └───────────────┘  └──────────────────┘   │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Plugin Layer                              │   │
│  │  ┌──────────────┐  ┌────────────────┐  ┌───────────────┐  │   │
│  │  │  Ingestors   │  │  Transformers  │  │  Validators   │  │   │
│  │  │  (OpenAPI,   │  │  (MCP, Skills, │  │  (Schema,     │  │   │
│  │  │   GraphQL,   │  │   API, Agent   │  │   Security,   │  │   │
│  │  │   Docs, UI)  │  │   Config)      │  │   Compat)     │  │   │
│  │  └──────────────┘  └────────────────┘  └───────────────┘  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                   Foundation Layer                           │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │   │
│  │  │  MCP SDK │  │  Zod     │  │ ts-morph │  │ LLM API  │  │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### 核心设计原则

1. **Pipeline-Oriented**: 所有操作都是管线式的：Ingest -> Analyze -> Transform -> Generate -> Validate
2. **Graph-Centric**: Capability Graph 是核心数据结构，所有操作都围绕图谱进行
3. **Plugin-First**: 核心引擎尽可能小，所有具体实现都通过 plugin 提供
4. **Immutable Data Flow**: 管线中的数据流是不可变的，每步产生新的数据结构
5. **Agent-Native**: Agentify 自身通过 MCP Server 暴露所有能力
6. **Progressive Enhancement**: 从 OpenAPI 开始，逐步扩展到更复杂的解析方式

### 分阶段实施路线

#### Phase 1: Core Foundation（4-6 周）

**目标**: 实现 OpenAPI -> MCP Server 的完整流程

```
输入: OpenAPI 3.0/3.1 Spec
  ↓
OpenAPI Ingestor (解析 spec)
  ↓
Capability Graph (内存图结构)
  ↓
MCP Transformer (生成代码)
  ↓
输出: 可运行的 MCP Server (TypeScript)
```

核心交付物：
- `@agentify/core`: 图引擎 + 管线框架
- `@agentify/cli`: 基础 CLI (`agentify analyze`, `agentify generate`)
- `@agentify/plugin-openapi`: OpenAPI ingestor
- `@agentify/plugin-mcp`: MCP server transformer
- `@agentify/templates`: TypeScript MCP server 模板

#### Phase 2: Enhancement（4-6 周）

**目标**: 增加更多解析方式 + Dog-fooding

- GraphQL ingestor plugin
- 文档解析 ingestor (LLM-powered)
- Skills transformer plugin
- Agentify 自身的 MCP Server (`@agentify/mcp-server`)
- 验证引擎（schema validation, security checks）
- Runtime dynamic server 模式（快速预览）

#### Phase 3: Advanced（6-8 周）

**目标**: UI 爬取 + Knowledge Graph + 高级特性

- UI crawling ingestor (Playwright-based)
- Knowledge Graph 持久化 (Neo4j / SQLite-based graph)
- 跨产品 capability composition
- Plugin marketplace / registry
- Python MCP server 模板支持

### 关键技术决策总结

| 决策点 | 选择 | 理由 |
|--------|------|------|
| 核心语言 | TypeScript | MCP 官方 SDK、类型安全、AST 操作 |
| 运行时 | Node.js 22+ | 原生 TS 支持、稳定生态 |
| Schema Validation | Zod | 运行时验证 + 类型推断 |
| 代码生成 | ts-morph + Handlebars | AST 级精确生成 + 模板灵活性 |
| MCP SDK | @modelcontextprotocol/sdk | 官方维护，spec 同步更新 |
| Monorepo 工具 | Turborepo | 快速、增量构建 |
| 测试 | Vitest | 快速、原生 TS 支持 |
| OpenAPI 解析 | @apidevtools/swagger-parser | 成熟、支持 3.0/3.1 |
| MCP Server 生成策略 | Template-Based (Phase 1) | 可审查、可定制、可调试 |
| Capability Graph | 内存图 (Phase 1) -> Neo4j (Phase 3) | 渐进式复杂度 |

### 与竞品的差异化

Agentify 不同于现有工具的关键差异：

1. **不只是 OpenAPI -> MCP**: 现有工具（Stainless, FastMCP, openapi-mcp-generator）都是单一方向的转换器。Agentify 是一个 meta-tool，支持多种输入源和多种输出目标
2. **Capability Graph 中间表示**: 通过统一的图谱表示，实现任意 input -> 任意 output 的转换
3. **Plugin 架构**: 第三方可扩展，而非封闭系统
4. **Dog-fooding**: Agentify 自身就是 agent-native 的，可被 agent 直接使用
5. **渐进式解析**: 从高精度（OpenAPI）到低精度（UI 爬取）的渐进式能力提取

---

## 参考来源

- [MCP 官方架构规范](https://modelcontextprotocol.io/specification/2025-06-18/architecture)
- [MCP 2025-11-25 Spec Release](https://blog.modelcontextprotocol.io/posts/2025-11-25-first-mcp-anniversary/)
- [Stainless MCP Server Generator](https://www.stainless.com/mcp/mcp-server-generator)
- [Stainless API MCP Server Architecture Guide](https://www.stainless.com/mcp/api-mcp-server-architecture-guide)
- [FastMCP OpenAPI Integration](https://gofastmcp.com/integrations/openapi)
- [FastMCP 3.0 Provider Architecture](https://deepwiki.com/jlowin/fastmcp/9.1-openapi-provider-and-tool-generation)
- [openapi-mcp-generator](https://github.com/harsha-iiiv/openapi-mcp-generator)
- [openapi-mcp-codegen (CNOE)](https://github.com/cnoe-io/openapi-mcp-codegen)
- [AWS OpenAPI MCP Server](https://awslabs.github.io/mcp/servers/openapi-mcp-server/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Crawl4AI Documentation](https://docs.crawl4ai.com/core/quickstart/)
- [Firecrawl](https://github.com/firecrawl/firecrawl)
- [Graphiti - Knowledge Graphs for AI Agents](https://github.com/getzep/graphiti)
- [MetaGPT Meta-Programming Framework](https://github.com/FoundationAgents/MetaGPT)
- [Speakeasy: Generate MCP tools from OpenAPI](https://www.speakeasy.com/mcp/tool-design/generate-mcp-tools-from-openapi)
- [MCP Features Guide (WorkOS)](https://workos.com/blog/mcp-features-guide)
- [Dogfooding with Rapid Iteration (Agentic Patterns)](https://agentic-patterns.com/patterns/dogfooding-with-rapid-iteration-for-agent-improvement/)
- [Agent Design Patterns (Lance Martin, 2026)](https://rlancemartin.github.io/2026/01/09/agent_design/)
