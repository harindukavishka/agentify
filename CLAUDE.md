# Agentify - The Meta-Tool for Agent-Native Product Transformation

## Project Vision

Agentify 是产品 Agent 化的一站式转型平台。一条命令将任何 OpenAPI spec 转化为可运行的 MCP Server。

**一句话定位:** "The Meta-Tool that makes every product Agent-Native."

**核心体验:** `npx agentify <openapi-url>` → 可运行的 MCP Server 项目

## Project Status

- [x] 项目初始化
- [x] 调研阶段（4 份报告）
- [x] 产品规划 v1 → `docs/product-plan.md`
- [x] 七人专家评审 → `research/reviews/`
- [x] 计划修订 → `research/reviews/SYNTHESIS.md`
- [ ] **Phase 0.5: "One Command" MVP（1-2 周）** ← 当前
- [ ] Phase 1: Enhancement（2-4 周）
- [ ] Phase 2: Scale（4-8 周）

## Key Decisions

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-02 | 项目启动，代号 Agentify | 产品核心是将传统产品 "Agent化" |
| 2026-03-02 | 定位：端到端 Agent 化转型平台 | 市场空白点，无竞品覆盖全链路 |
| 2026-03-02 | GTM：开源核心 + 付费增值 | 建立 developer mindshare |
| 2026-03-02 | **[修订] 单包结构，砍掉 monorepo** | 7 人评审一致认为 monorepo 过早 |
| 2026-03-02 | **[修订] 扁平 IR 替代 Capability Graph** | Graph 推迟到 Phase 2，Phase 0.5 用 ParsedCapability[] |
| 2026-03-02 | **[修订] 安全是 Day 1，不是 Phase 3** | Hacker 发现 3 个 CRITICAL 安全威胁 |
| 2026-03-02 | **[修订] 分层生成策略** | Agent 科学家发现 context window 灾难 |
| 2026-03-02 | **[修订] 移除 ts-morph** | 老派开发者：15MB 依赖，Handlebars 足够 |
| 2026-03-02 | **[修订] 窗口期 6-9 月（非 12-18）** | 创业者调研发现云厂商已在行动 |

## Key Research Findings

- **MCP 是事实标准**: 18,000+ servers, Anthropic/OpenAI/Google 全面采纳
- **双协议体系**: MCP (Agent↔Tool) + A2A (Agent↔Agent)
- **市场**: Agentic AI $9.89B (2026), CAGR 42%
- **空白**: 无端到端转型工具、无 Readiness 评估
- **Context Window 问题**: 大型 API 不能每个 endpoint 一个 tool（GitHub MCP = 93 tools = 55K tokens）
- **安全威胁**: OpenAPI spec 投毒可导致代码注入和 prompt injection

## Tech Stack (修订后)

| 组件 | 选择 | 备注 |
|------|------|------|
| 语言 | TypeScript (strict mode) | |
| 运行时 | tsx（开发）/ tsup（构建） | 不依赖 Node 22 实验特性 |
| Schema | Zod | 输入验证 + 类型推断 |
| 代码生成 | Handlebars 模板 | 移除 ts-morph |
| MCP SDK | @modelcontextprotocol/sdk | |
| 测试 | Vitest | |
| OpenAPI | @apidevtools/swagger-parser | |
| 包管理 | 单包 agentify | 不要 monorepo |

## Project Structure (修订后)

```
agentify/
├── src/
│   ├── cli.ts              # CLI 入口
│   ├── parser/             # OpenAPI 解析 + sanitization
│   ├── generator/          # MCP Server 代码生成
│   │   ├── strategies/     # 分层生成策略 (small/medium/large)
│   │   └── templates/      # Handlebars 模板
│   ├── security/           # 输入净化 + 生成代码扫描
│   └── types.ts            # 扁平 IR 类型定义
├── templates/              # 生成项目模板 (Dockerfile, .env.example, etc.)
├── test/
├── research/               # 调研报告 (不随 npm 发布)
├── docs/                   # 产品文档
└── package.json
```

## Security Requirements (NEW)

- **ALL** OpenAPI spec 字段必须经过 sanitization
- 生成的代码禁止 eval/exec/Function 构造
- 生成的代码必须通过安全扫描
- Dog-fooding MCP Server 必须有 SSRF 防护
- .env.example 不包含真实密钥

## 分层生成策略 (NEW)

| API 规模 | endpoint 数 | 策略 | 理由 |
|---------|------------|------|------|
| 小型 | <30 | 每个 endpoint 一个 tool | 简单直接 |
| 中型 | 30-100 | Tool Search + Lazy Loading | 减少 context 占用 |
| 大型 | 100+ | Code Execution + Docs Search | Stainless 模式，减 98.7% tokens |

## Coding Conventions

- TypeScript strict mode
- 不可变数据模式（NEVER mutate）
- 小文件原则（200-400 行，最大 800 行）
- TDD 开发流程（Red → Green → Refactor）
- 所有讨论和见解记录到 research/ 目录
- 安全优先：输入验证、输出扫描

## Reference Documents

- 产品计划 v1: `docs/product-plan.md`
- 计划修订综合: `research/reviews/SYNTHESIS.md`
- 调研报告: `research/agent-native/`, `research/traditional-products/`, `research/market-analysis/`, `research/architecture/`
- 专家评审: `research/reviews/`
