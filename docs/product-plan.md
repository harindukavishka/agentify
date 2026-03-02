# Agentify 产品计划

> 版本: v1.0 | 日期: 2026-03-02
> 基于四份调研报告综合制定

---

## 一、产品愿景

**Agentify 是产品 Agent 化的一站式转型平台。**

在 2026 年的 Agent 时代，每个产品都需要被 AI Agent 理解和使用。但从"人类用的产品"到"Agent 用的产品"之间存在巨大鸿沟。Agentify 就是这座桥——它帮助 AI Agent 理解任何传统产品的能力，并将其转化为 MCP Server、API、Skills 等 Agent 可消费的形态。

**一句话定位:** "The Meta-Tool that makes every product Agent-Native."

### 为什么是现在？

- MCP 已成为事实标准（18,000+ servers），但大量产品尚未接入
- Agentic AI 市场 $9.89B（2026），CAGR 42%
- 端到端转型工具完全空白——现有工具只覆盖单一环节
- 时间窗口 12-18 个月（云厂商尚未构建原生方案）
- "SaaSpocalypse" 焦虑推动产品团队急需 Agent 化方案

---

## 二、核心洞察（调研综合）

### 2.1 四份报告的交叉结论

| 维度 | 关键发现 | 来源 |
|------|---------|------|
| **范式** | 从 GUI-first 到 MCP-first 的设计范式转变已确立 | Agent-Native 调研 |
| **标准** | MCP（Agent↔Tool）+ A2A（Agent↔Agent）双协议体系 | Agent-Native + 传统产品 |
| **市场** | 端到端转型平台是最大空白点 | 市场分析 |
| **技术** | Capability Graph + Pipeline 架构最适合 meta-tool | 架构调研 |
| **模式** | 六大转型模式：MCP Wrapper、Agent-Native 重构、聚合层、Edge Agent、DB 直连、协议桥接 | 传统产品调研 |
| **竞品** | Stainless/FastMCP/Composio 各占一隅，无人做全链路 | 市场分析 |

### 2.2 市场空白地图

```
                    评估          规划          生成          测试          部署
                  ┌──────┐    ┌──────┐    ┌──────┐    ┌──────┐    ┌──────┐
  Stainless       │      │    │      │    │  ██  │    │      │    │      │
  FastMCP         │      │    │      │    │  ██  │    │      │    │      │
  Composio        │      │    │      │    │      │    │      │    │  ██  │
  Smithery        │      │    │      │    │      │    │      │    │  ██  │
  Agentify        │  ██  │    │  ██  │    │  ██  │    │  ██  │    │  ██  │
                  └──────┘    └──────┘    └──────┘    └──────┘    └──────┘
```

**Agentify 是唯一覆盖全链路的方案。**

---

## 三、目标用户

### 主要用户群

| 优先级 | 用户 | 痛点 | Agentify 价值 |
|--------|------|------|---------------|
| **P0** | SaaS 产品团队 | 不知道如何让产品被 Agent 使用 | 全链路评估 + 转型方案 + 自动生成 |
| **P0** | API-first 公司 | 有 API 但没有 MCP server | 一键生成 + 持续同步 |
| **P1** | 独立开发者 | 想让工具 agent-friendly | 快速生成 + 测试 + 发布 |
| **P1** | 传统软件公司 | 只有 UI，没有 API | 多形态输入（UI/CLI/DB）支持 |
| **P2** | 企业 IT 部门 | 评估内部工具 agent-readiness | 批量评估 + 治理报告 |

### 特殊用户：AI Agent 本身

Agentify 自身是 Agent-Native 的（dog-fooding）。AI Agent 可以直接调用 Agentify 来：
- 分析一个产品的能力
- 生成 MCP Server
- 测试和验证生成的工具
- 这是真正的 "meta" 能力

---

## 四、核心功能

### 4.1 全链路转型管线

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  扫描     │ ──→ │  评估     │ ──→ │  规划     │ ──→ │  生成     │ ──→ │  验证     │
│ Scanning │     │ Assessment│     │ Planning │     │ Generate │     │ Validate │
│          │     │           │     │          │     │          │     │          │
│ 解析产品  │     │ Readiness │     │ 转型路线  │     │ MCP/API  │     │ 测试+    │
│ 能力      │     │ Score     │     │ 图       │     │ /Skills  │     │ 部署     │
└──────────┘     └──────────┘     └──────────┘     └──────────┘     └──────────┘
```

### 4.2 多形态输入

| 输入源 | 解析方式 | Phase |
|--------|---------|-------|
| OpenAPI/Swagger Spec | 结构化解析 | Phase 1 |
| GraphQL Schema | Schema 解析 | Phase 2 |
| REST API 文档 | LLM 辅助推断 | Phase 2 |
| CLI 工具（help/man） | 文本解析 + LLM | Phase 2 |
| 数据库 Schema | DDL/Schema 解析 | Phase 2 |
| Web UI | Headless Browser + AI | Phase 3 |
| SDK 源码 | AST 分析 | Phase 3 |

### 4.3 Agent-Readiness Score

量化评估产品的 Agent 化程度（0-100）：

- **API 覆盖度** — 产品功能中有多少通过 API 暴露
- **Schema 质量** — API schema 的完整性和类型安全
- **认证友好度** — 是否支持 OAuth、API Key 等标准认证
- **错误处理** — 错误响应是否结构化、Agent 可理解
- **文档质量** — API 文档是否机器可读
- **幂等性** — 操作是否安全可重试

### 4.4 Capability Graph（核心数据结构）

所有产品能力通过统一的图谱表示：

```
Product ──has──→ Domain ──contains──→ Capability
                                        │
                                   ┌────┼────┐
                                   ▼    ▼    ▼
                                Input Output Auth
                               Schema Schema Config
```

5 种实体类型：Product, Domain, Capability, Schema, Auth
6 种关系类型：has_domain, contains_capability, requires_input, produces_output, requires_auth, depends_on

**这是 Agentify 的核心竞争力**——通过图谱的中间表示，实现任意输入→任意输出的转换。

### 4.5 Dog-fooding: Agentify 自身的 MCP Server

Agentify 暴露自身能力为 MCP Server：

| Tool | 功能 |
|------|------|
| `analyze_product` | 分析产品能力，生成 Capability Graph |
| `assess_readiness` | 评估 Agent-Readiness Score |
| `generate_mcp_server` | 生成 MCP Server 代码 |
| `preview_capabilities` | 预览转换后的工具列表 |
| `validate_mcp_server` | 验证生成的 MCP Server |

---

## 五、技术架构

### 5.1 分层架构

```
┌─────────────────────────────────────────────────┐
│              Interface Layer                     │
│   CLI (human)  │  MCP Server (agent)  │  SDK    │
├─────────────────────────────────────────────────┤
│              Core Engine                         │
│  Ingestor Pipeline → Capability Graph → Transformer Pipeline │
│  Schema Inferrer  │  Code Generator  │  Validation Engine    │
├─────────────────────────────────────────────────┤
│              Plugin Layer                        │
│  Ingestors        │  Transformers    │  Validators           │
│  (OpenAPI,GraphQL │  (MCP,Skills,    │  (Schema,Security,    │
│   Docs,UI,CLI)    │   API,Agent)     │   Compat)             │
├─────────────────────────────────────────────────┤
│              Foundation                          │
│  MCP SDK  │  Zod  │  ts-morph  │  LLM API       │
└─────────────────────────────────────────────────┘
```

### 5.2 核心设计原则

1. **Pipeline-Oriented**: 所有操作都是管线式的（Ingest → Analyze → Transform → Generate → Validate）
2. **Graph-Centric**: Capability Graph 是核心数据结构
3. **Plugin-First**: 核心引擎最小化，所有实现通过 plugin
4. **Immutable Data Flow**: 管线中数据不可变，每步产生新结构
5. **Agent-Native**: 自身通过 MCP Server 暴露所有能力
6. **Progressive Enhancement**: 从 OpenAPI 开始，逐步扩展

### 5.3 技术栈

| 组件 | 选择 | 理由 |
|------|------|------|
| 语言 | TypeScript (strict) | MCP 官方 SDK、类型安全、AST 操作 |
| 运行时 | Node.js 22+ | 原生 TS 支持、稳定生态 |
| Schema 验证 | Zod | 运行时验证 + 类型推断 |
| 代码生成 | ts-morph + Handlebars | AST 级精确生成 + 模板灵活性 |
| MCP SDK | @modelcontextprotocol/sdk | 官方维护，spec 同步 |
| Monorepo | Turborepo | 快速增量构建 |
| 测试 | Vitest | 快速、原生 TS 支持 |
| OpenAPI 解析 | @apidevtools/swagger-parser | 成熟、支持 3.0/3.1 |
| Capability Graph | 内存图 (Phase 1) → 持久化 (Phase 3) | 渐进式复杂度 |

### 5.4 包结构（Monorepo）

```
@agentify/core          — 图引擎 + 管线框架
@agentify/cli           — CLI 工具
@agentify/mcp-server    — Agentify 自身的 MCP Server (dog-fooding)
@agentify/plugin-openapi — OpenAPI ingestor
@agentify/plugin-graphql — GraphQL ingestor
@agentify/plugin-docs    — 文档解析 ingestor
@agentify/plugin-mcp     — MCP server transformer
@agentify/plugin-skills  — Skills transformer
@agentify/templates      — 代码生成模板
@agentify/validator      — 验证引擎
```

---

## 六、差异化竞争

### 6.1 vs 现有工具

| 能力 | Agentify | Stainless | FastMCP | Composio | Smithery |
|------|----------|-----------|---------|----------|----------|
| OpenAPI → MCP | ✅ | ✅ | ✅ | - | - |
| GraphQL → MCP | ✅ | - | - | - | - |
| Web UI → MCP | ✅ | - | - | - | - |
| CLI → MCP | ✅ | - | - | - | - |
| DB → MCP | ✅ | - | - | - | - |
| Readiness 评估 | ✅ | - | - | - | - |
| 自动化测试 | ✅ | - | - | - | - |
| 全链路端到端 | ✅ | - | - | - | - |
| 自身 Agent-Native | ✅ | - | - | - | - |
| Plugin 生态 | ✅ | - | ✅ | - | - |

### 6.2 护城河

1. **Capability Graph** — 产品能力的语义理解，不是简单的 API 透传
2. **多形态输入** — 唯一支持 UI/CLI/DB/文档等非 API 输入的工具
3. **Plugin 生态** — 第三方可扩展，网络效应
4. **Dog-fooding 飞轮** — Agent 用 Agentify → 生成更多 MCP Server → 更多 Agent 用 Agentify
5. **数据壁垒** — 积累的产品 Capability Graph 数据越多，转换质量越高

---

## 七、商业模式

| 层级 | 内容 | 价格 |
|------|------|------|
| **开源核心 (Core)** | OpenAPI → MCP 转换引擎、CLI、基础模板 | Free |
| **Pro** | Readiness 评估、Web UI/CLI/DB 转换、自动测试、持续同步 | $29-99/mo |
| **Enterprise** | 批量评估、自定义 workflow、SSO、audit logs、SLA、A2A 支持 | Custom |
| **Marketplace** | 帮助优质 MCP Server 分发到 Smithery/Claude 等平台 | 佣金 |

**GTM 策略**: 开源核心建立 developer mindshare → Pro 版转化 → Enterprise 上探

---

## 八、实施路线图

### Phase 1: Core Foundation（4-6 周）

**目标**: OpenAPI → MCP Server 的完整流程 + Readiness 评估 MVP

- [ ] 项目脚手架（Turborepo monorepo）
- [ ] `@agentify/core` — Capability Graph 引擎
- [ ] `@agentify/plugin-openapi` — OpenAPI 解析器
- [ ] `@agentify/plugin-mcp` — MCP Server 生成器（Template-Based）
- [ ] `@agentify/cli` — `agentify analyze` / `agentify generate` / `agentify score`
- [ ] `@agentify/validator` — 基础验证（schema + 运行时）
- [ ] Readiness Score 算法 v1
- [ ] 5 个知名产品的 OpenAPI → MCP 转换 demo
- [ ] 开源发布

### Phase 2: Enhancement（4-6 周）

**目标**: 多输入支持 + Dog-fooding + 更多 Transformer

- [ ] `@agentify/plugin-graphql` — GraphQL ingestor
- [ ] `@agentify/plugin-docs` — 文档解析 ingestor（LLM-powered）
- [ ] `@agentify/mcp-server` — Agentify 自身 MCP Server
- [ ] `@agentify/plugin-skills` — Skills transformer
- [ ] 验证引擎增强（security checks, edge cases）
- [ ] Runtime preview 模式（快速预览生成效果）
- [ ] Plugin SDK 发布（第三方可开发 plugin）
- [ ] 内容营销："Product Agent-Readiness Report" 系列

### Phase 3: Advanced（6-8 周）

**目标**: 高级能力 + 企业特性

- [ ] UI crawling ingestor（Playwright-based）
- [ ] CLI 工具 ingestor
- [ ] 数据库 schema ingestor
- [ ] Capability Graph 持久化
- [ ] 跨产品 capability composition
- [ ] A2A Protocol 支持
- [ ] 企业安全特性（SSO, RBAC, audit）
- [ ] Plugin marketplace

---

## 九、风险与应对

| 风险 | 可能性 | 影响 | 应对策略 |
|------|--------|------|---------|
| 云厂商构建原生方案 | 中 | 高 | 抢占时间窗口，构建社区和数据壁垒 |
| MCP 协议快速变化 | 高 | 中 | 紧跟 spec 更新，Plugin 架构解耦 |
| Stainless 等扩展为全链路 | 中 | 中 | 差异化于多输入 + 评估 + 语义理解 |
| LLM 辅助解析质量不稳定 | 中 | 中 | 人机协作模式，渐进式改进 |
| 开源社区活跃度不足 | 中 | 低 | 先聚焦核心质量，再扩展社区 |

---

## 十、成功指标

### Phase 1 (发布后 3 个月)

- GitHub Stars: 1,000+
- 成功转换的 OpenAPI → MCP: 100+ 产品
- Readiness 评估报告: 500+
- CLI 周活跃用户: 200+

### Phase 2 (发布后 6 个月)

- GitHub Stars: 5,000+
- Plugin 生态: 10+ 第三方 plugin
- Pro 付费用户: 50+
- 支持的输入格式: 5+ 种

### Phase 3 (发布后 12 个月)

- GitHub Stars: 15,000+
- Enterprise 客户: 5+
- Capability Graph 中的产品: 1,000+
- 月活 Agent 调用量: 10,000+

---

## 附录：调研报告索引

1. [Agent-Native 产品范式研究](../research/agent-native/paradigms.md)
2. [传统产品 Agent 化转型研究](../research/traditional-products/transformation.md)
3. [市场全景分析](../research/market-analysis/landscape.md)
4. [架构方案研究](../research/architecture/patterns.md)
