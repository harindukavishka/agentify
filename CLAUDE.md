# Agentify - The Meta-Tool for Agent-Native Product Transformation

## Project Vision

Agentify 是产品 Agent 化的一站式转型平台。帮助 AI Agent 理解任何传统产品的能力，并将其转化为 MCP Server、API、Skills 等 Agent 可消费的形态。

**一句话定位:** "The Meta-Tool that makes every product Agent-Native."

## Project Status

- [x] 项目初始化
- [x] 调研阶段
  - [x] Agent-Native 产品范式调研 → `research/agent-native/paradigms.md`
  - [x] 传统产品（SaaS/DB/etc）转型调研 → `research/traditional-products/transformation.md`
  - [x] 市场分析与竞品调研 → `research/market-analysis/landscape.md`
  - [x] 技术架构调研 → `research/architecture/patterns.md`
- [x] 产品规划 → `docs/product-plan.md`
- [ ] Phase 1: Core Foundation（开发中）
- [ ] Phase 2: Enhancement
- [ ] Phase 3: Advanced

## Key Decisions

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-02 | 项目启动，代号 Agentify | 产品核心是将传统产品 "Agent化" |
| 2026-03-02 | 定位：端到端 Agent 化转型平台 | 市场空白点，无竞品覆盖全链路 |
| 2026-03-02 | 核心数据结构：Capability Graph | 统一的图谱中间表示，支持任意输入→输出 |
| 2026-03-02 | 技术栈：TypeScript + Node.js 22+ | MCP 官方 SDK 生态、类型安全 |
| 2026-03-02 | 架构：Pipeline-Oriented + Plugin-First | 可扩展、可组合、渐进式复杂度 |
| 2026-03-02 | Dog-fooding：自身暴露 MCP Server | Agent-Native 的 meta tool 必须自身也是 Agent-Native |
| 2026-03-02 | GTM：开源核心 + 付费增值 | 建立 developer mindshare，12-18 月窗口期 |

## Key Research Findings

- **MCP 是事实标准**: 18,000+ servers, Anthropic/OpenAI/Google 全面采纳
- **双协议体系**: MCP (Agent↔Tool) + A2A (Agent↔Agent)
- **六大转型模式**: MCP Wrapper、Agent-Native 重构、聚合层、Edge Agent、DB 直连、协议桥接
- **市场**: Agentic AI $9.89B (2026), CAGR 42%, 12-18 月窗口
- **空白**: 无端到端转型工具、无 Readiness 评估、无非 API 产品转换

## Tech Stack

| 组件 | 选择 |
|------|------|
| 语言 | TypeScript (strict mode) |
| 运行时 | Node.js 22+ |
| Schema | Zod |
| 代码生成 | ts-morph + Handlebars |
| MCP SDK | @modelcontextprotocol/sdk |
| Monorepo | Turborepo |
| 测试 | Vitest |
| OpenAPI | @apidevtools/swagger-parser |

## Package Structure

```
@agentify/core          — Capability Graph 引擎 + Pipeline 框架
@agentify/cli           — CLI 工具 (agentify analyze/generate/score)
@agentify/mcp-server    — 自身 MCP Server (dog-fooding)
@agentify/plugin-openapi — OpenAPI ingestor
@agentify/plugin-mcp     — MCP server transformer
@agentify/templates      — 代码生成模板
@agentify/validator      — 验证引擎
```

## Directory Structure

```
research/               # 调研报告
├── agent-native/       # Agent-Native 产品范式
├── traditional-products/ # 传统产品转型
├── market-analysis/    # 市场分析
└── architecture/       # 架构方案
docs/                   # 产品文档
├── product-plan.md     # 完整产品计划
packages/               # Monorepo 包（开发中）
```

## Coding Conventions

- TypeScript strict mode，所有代码类型安全
- 不可变数据模式（NEVER mutate）
- 小文件原则（200-400 行，最大 800 行）
- TDD 开发流程（Red → Green → Refactor）
- Pipeline 中的数据流不可变
- Plugin 接口清晰定义
- 所有讨论和见解记录到 research/ 目录
