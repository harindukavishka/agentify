# AI Agent 产品消费模式深度研究报告

> 研究日期: 2026-03-02
> 研究目的: 理解 AI Agent 在 2026 年如何实际消费和交互外部产品，为 Agentify 的"完整转型"愿景提供数据支撑
> 核心洞察: Agent 不是只需要一种接口——不同 Agent 上下文需要不同的接口形态

---

## 目录

1. [Agent-Product 交互的真实模式](#1-agent-product-交互的真实模式)
2. [MCP vs CLI vs API vs Skills: 何时用哪个](#2-mcp-vs-cli-vs-api-vs-skills-何时用哪个)
3. [Claude Code Skills 深度分析](#3-claude-code-skills-深度分析)
4. [Progressive Disclosure for Agents](#4-progressive-disclosure-for-agents)
5. [今天缺失了什么](#5-今天缺失了什么)
6. ["Full Transformation" 概念](#6-full-transformation-概念)
7. [开发者如何手动 Agent 化产品](#7-开发者如何手动-agent-化产品)
8. [对 Agentify 的启示](#8-对-agentify-的启示)

---

## 1. Agent-Product 交互的真实模式

### 1.1 2026 年的 Agent 生态图谱

2026 年的 AI Agent 已经形成了清晰的分层生态:

| Agent 类型 | 代表产品 | 主要交互方式 | 典型场景 |
|-----------|---------|------------|---------|
| **IDE 内嵌 Agent** | Cursor, VS Code + Copilot | MCP + CLI + Context Files | 代码编写、调试、重构 |
| **Terminal Agent** | Claude Code, Gemini CLI, Aider | CLI + MCP + Skills + CLAUDE.md | 全栈开发、DevOps |
| **对话式 Agent** | ChatGPT, Claude.ai | MCP + GPT Actions + MCP Apps | 信息查询、文档生成 |
| **自主 Agent** | Devin, OpenAI Codex | Browser + CLI + API | 端到端任务执行 |
| **编排 Agent** | LangChain, CrewAI, AutoGen | API + MCP | 多步骤 workflow |
| **企业 Agent** | Salesforce Agentforce, ServiceNow | A2A + MCP | 业务流程自动化 |

### 1.2 Agent 消费产品的四种基本模式

通过大量调研，我们发现 Agent 消费外部产品存在四种基本模式:

#### 模式 1: Direct Tool Call（直接工具调用）
```
Agent → MCP/Function Call → Tool → 结果
```
- **触发条件**: Agent 需要执行一个明确的操作（发邮件、查数据库、创建 PR）
- **接口形态**: MCP Tool, GPT Action, Function Call
- **真实例子**: Claude Code 通过 GitHub MCP Server 创建 Pull Request
- **特征**: 结构化 JSON Schema 输入，确定性执行

#### 模式 2: Context Injection（上下文注入）
```
Agent ← Context File/Resource → 获得知识 → 更好地完成任务
```
- **触发条件**: Agent 需要理解项目约定、领域知识、编码规范
- **接口形态**: CLAUDE.md, .cursorrules, AGENTS.md, MCP Resources, Skills
- **真实例子**: Claude Code 读取 CLAUDE.md 了解项目使用 Vitest 而非 Jest
- **特征**: 被动注入，无副作用，增强 Agent 的决策质量

#### 模式 3: CLI Composition（命令行组合）
```
Agent → Shell Command → Pipe → Filter → 结果
```
- **触发条件**: Agent 需要执行 well-known 的操作，或组合多步操作
- **接口形态**: CLI tools (gh, git, npm, docker, curl)
- **真实例子**: Claude Code 用 `gh pr list --json` 查看 PR 列表（而非 MCP）
- **特征**: 低 token 消耗，LLM 训练数据中已有丰富知识，Unix pipe 天然支持组合

#### 模式 4: Code Execution（代码执行）
```
Agent → 写代码 → Sandbox 执行 → 结果
```
- **触发条件**: API 很大（100+ endpoints），需要灵活组合多个操作
- **接口形态**: Cloudflare Code Mode, Anthropic Code Execution with MCP
- **真实例子**: Cloudflare API 有 1000+ endpoints，用 Code Mode 只需 ~1,000 tokens（传统方式需 1.17M tokens）
- **特征**: 极致 token 效率，适合大型 API，需要 sandbox 安全保障

### 1.3 真实世界的混合使用模式

**关键发现: 没有哪个 Agent 只用一种模式。** 以 Claude Code 为例:

| 任务 | 实际使用的模式 | 为什么不用其他模式 |
|------|-------------|-----------------|
| 查看 git status | CLI (`git status`) | 比 MCP 简单 10x，LLM 天然理解 |
| 创建 GitHub PR | CLI (`gh pr create`) | 熟悉的 CLI，低 token |
| 搜索 Notion 文档 | MCP (Notion MCP Server) | 需要认证 + 结构化查询 |
| 遵循编码规范 | Context File (CLAUDE.md) | 被动知识，不需要"调用" |
| 执行代码审查 | Skill (/review) | 多步骤流程，需要 procedural 知识 |
| 操作大型 API | Code Execution | 太多 endpoints 无法逐一暴露为 tool |

**2026 年初 Hacker News 热帖 "MCP is dead. Long live the CLI"（85 points, 66 comments）揭示了一个重要现象**: 有经验的开发者在实际生产中悄悄从 MCP 回退到 CLI 和直接 API 调用。原因不是 MCP 设计得不好，而是 Unix primitives 在组合 AI workflow 方面已经很优秀，MCP 在某些场景增加了不必要的复杂度。

**务实的中间路线正在形成**: 交互式开发用 MCP（Agent 需要丰富上下文和工具访问），自动化 pipeline 用直接 API/CLI（可靠性和可调试性更重要）。

---

## 2. MCP vs CLI vs API vs Skills: 何时用哪个

### 2.1 四种接口的本质差异

| 维度 | MCP Tool | CLI Tool | Direct API | Skill |
|------|---------|---------|------------|-------|
| **本质** | 标准化协议接口 | Shell 命令 | HTTP 调用 | Markdown 指令 |
| **Token 开销** | 高（每 tool ~500-1000 tokens） | 低（5-10x less） | 中等 | 极低（30-50 tokens/skill 待激活） |
| **LLM 先验知识** | 低（需要 schema） | 高（训练数据丰富） | 中（常见 API 有） | N/A |
| **组合能力** | 差（每次 round-trip） | 优（Unix pipe） | 中 | 优（可编排多工具） |
| **认证处理** | OAuth/Token（协议内） | 环境变量/Config | Header/Token | 依赖底层工具 |
| **实时数据** | 强 | 中 | 强 | 弱（主要是静态知识） |
| **跨平台** | 强（标准协议） | 中（需 OS 支持） | 强 | 弱（目前 Claude 生态为主） |
| **适合 API 规模** | <30 tools 最佳 | 无限制 | 无限制 | N/A |

### 2.2 决策矩阵: 什么时候用什么

```
                          需要实时外部数据?
                              │
                    ┌─────────┴──────────┐
                   Yes                   No
                    │                     │
            需要认证/状态管理?        需要 procedural 知识?
                    │                     │
              ┌─────┴─────┐         ┌─────┴─────┐
             Yes         No        Yes          No
              │           │         │            │
        API 规模?    LLM 已知?    多步骤?     简单约定?
              │           │         │            │
         ┌────┴────┐   ┌──┴──┐   ┌──┴──┐      ┌──┴──┐
        <30   >30  Yes  No  Yes  No   Yes    No
         │     │    │    │   │    │     │      │
        MCP  Code  CLI  MCP  Skill CLI  Context  (不需要接口)
        Tool  Exec       Tool          File
```

### 2.3 真实案例分析

#### 案例 1: GitHub 集成

GitHub 提供了几乎所有接口形态，是分析 Agent 选择的绝佳案例:

| 接口 | 实际存在 | Agent 使用频率 | 为什么 |
|------|---------|-------------|--------|
| GitHub MCP Server | 有 (93 tools) | 中等 | 93 tools = 55K tokens，context 灾难 |
| `gh` CLI | 有 (200+ subcommands) | **最高** | LLM 天然理解，低 token，pipe 组合 |
| GitHub REST API | 有 | 低（Agent 直接用） | 需要手动处理认证 |
| GitHub CLAUDE.md | 有（社区提供） | 高 | 项目约定、PR 模板、分支策略 |
| GitHub Skill | 部分存在 | 增长中 | `/review-pr`, `/create-issue` 等 |

**关键洞察**: Claude Code 在简单操作（`gh pr list`, `gh issue view`）时偏好 CLI，在复杂查询（搜索跨仓库的 issue 趋势）时才使用 MCP。这不是随机选择——CLI 的 token 效率比 MCP 高 5-10x。

#### 案例 2: Stripe 集成

| 场景 | 最佳接口 | 原因 |
|------|---------|------|
| 查看账户余额 | MCP Tool | 需要认证，单一操作 |
| 创建复杂的 subscription plan | Code Execution | 多步骤，需要 API 组合 |
| 理解 Stripe webhook 格式 | Context File / Skill | 知识注入，非操作 |
| 调试 payment failure | CLI (`stripe logs tail`) | 实时流，LLM 已知 |

#### 案例 3: Notion 集成

| 场景 | 最佳接口 | 原因 |
|------|---------|------|
| 搜索文档 | MCP Tool | 需要认证 + 结构化查询 |
| 创建页面 | MCP Tool | 复杂的 block 结构 |
| 理解 Notion 数据模型 | Context File | 知识注入 |
| 批量操作 100 页 | Code Execution | 效率需求 |

---

## 3. Claude Code Skills 深度分析

### 3.1 Skill 是什么？

Skill 是 Claude Code 的**核心扩展机制**。从技术角度:

```
Skill = SKILL.md (Markdown 指令) + 可选支撑文件 (scripts/, references/, assets/)
```

**SKILL.md 结构**:
```yaml
---
name: my-skill              # Slash command 名称
description: 做什么用的       # Claude 用来判断何时激活
disable-model-invocation: true  # 仅手动触发
allowed-tools: Read, Grep, Bash(gh *)  # 工具白名单
context: fork               # 在 subagent 中运行
agent: Explore              # 使用哪个 subagent 类型
model: claude-sonnet-4-6    # 指定模型
---

## Instructions
1. 第一步做什么
2. 第二步做什么
3. ...
```

**目录结构**:
```
my-skill/
├── SKILL.md           # 主指令 (必须)
├── template.md        # 模板文件
├── examples/
│   └── sample.md      # 示例输出
├── references/
│   └── api-docs.md    # 参考文档
└── scripts/
    └── helper.py      # 可执行脚本
```

### 3.2 Skill vs MCP Tool: 本质差异

这是 Agentify 最需要理解的对比:

| 维度 | Skill | MCP Tool |
|------|-------|----------|
| **本质** | 教 Agent "怎么做" | 给 Agent "能做什么" |
| **定义方式** | Markdown 文件 | 代码 + JSON Schema |
| **运行方式** | 在 Agent 内部推理 | 外部 Server 执行 |
| **Token 开销** | 30-50 tokens (待激活), ~2000 (激活后) | 500-1000 tokens/tool (始终在 context) |
| **灵活性** | 高（Agent 可自由推理和调整） | 低（严格的 input schema） |
| **副作用** | 取决于内部工具调用 | 确定性执行 |
| **适用场景** | 多步骤 workflow, 领域知识, 编码规范 | 单一操作, 外部数据, API 调用 |
| **配置成本** | 写 Markdown | 写代码 + 部署 Server |
| **分发方式** | 文件系统 / Git / Plugin | MCP Server 注册 / Registry |

**核心洞察**: MCP 连接 Claude 到数据；Skill 教 Claude 如何处理数据。

来自 IntuitionLabs 的精炼概括:
> "Skills are for procedural knowledge; MCP is for external connectivity. They work together."

### 3.3 Skill 的 Progressive Disclosure 机制

这是 Skill 最精妙的设计:

```
Session 启动
    │
    ├── 加载所有 Skill 的 description（每个 ~30-50 tokens）
    │   ├── "explain-code: Explains code with visual diagrams"
    │   ├── "deploy: Deploy the application to production"
    │   └── "review: Code review with team standards"
    │
    │   总计: N skills × 50 tokens = 很低的基线开销
    │
    ├── 用户说 "review this PR" 或 /review
    │
    └── 仅此时加载 review/SKILL.md 完整内容（~2000 tokens）
        ├── 加载引用的 references/code-standards.md（按需）
        └── 执行 scripts/lint.sh（按需）
```

**对比 MCP 的全量加载**:
- 典型 5 个 MCP Server + 58 tools = **~55,000 tokens** 在对话开始前
- Anthropic 的 Tool Search 可减少 85%，但仍比 Skill 的按需加载开销大

### 3.4 Skill 可以做什么 MCP 做不到的

1. **编排多工具调用**: Skill 可以在 Markdown 中描述一个复杂的多步骤流程，Agent 自主推理执行顺序
2. **捕获团队知识**: "我们团队的 PR review 标准是..."——这种 procedural knowledge 不适合编码为 MCP Tool
3. **Subagent 执行**: `context: fork` 让 Skill 在隔离的 subagent 中运行，不影响主对话
4. **动态上下文注入**: `!`gh pr diff\`\` 语法在 Skill 加载时执行 shell 命令并注入结果
5. **参数化模板**: `$ARGUMENTS[0]`, `$ARGUMENTS[1]` 支持灵活的参数传递
6. **内置 Skill**: `/simplify`（自动生成 3 个并行 review agent）, `/batch`（批量变更 + 自动分 worktree）

### 3.5 Skill 的局限

1. **生态封闭**: Skill 目前主要是 Claude Code 生态，虽然遵循 Agent Skills 开放标准，但跨平台采用有限
2. **无实时数据访问**: Skill 本身不能连接外部系统，必须通过内部工具（如 Bash, MCP）间接访问
3. **调试困难**: Markdown 指令的执行路径不像代码那样可追踪
4. **版本管理**: 社区 Skill 缺乏成熟的版本管理和依赖解析机制

### 3.6 Agent Skills 开放标准

值得注意的是，Claude Code Skills 遵循 **Agent Skills 开放标准** (agentskills.io)，这意味着:
- 其他 AI 工具可以实现相同的 Skill 格式
- Skill 不仅仅是 Anthropic 的私有标准
- 为跨平台 Skill 共享铺平了道路

---

## 4. Progressive Disclosure for Agents

### 4.1 为什么 Agent 需要 Progressive Disclosure

**核心问题**: 大型 API 的 Agent 接口面临 context window 灾难。

| API | Endpoint 数 | 传统 MCP 方式 Token 消耗 | 问题 |
|-----|-----------|----------------------|------|
| GitHub | 93 tools | ~55,000 tokens | 接近 Claude 3 context 的 50% |
| Cloudflare | 1000+ endpoints | ~1,170,000 tokens | **超过任何模型的 context window** |
| Stripe | 300+ endpoints | ~300,000 tokens | 不可行 |
| AWS | 10,000+ operations | 理论上数百万 tokens | 完全不可能 |

**Progressive Disclosure 的核心理念**: 不是提供更少的信息，而是**按需逐步揭示**信息。

### 4.2 三种 Progressive Disclosure 策略

#### 策略 1: Tool Search（工具搜索）

Anthropic 官方推荐的方案:

```
Agent 看到 2 个 meta-tool:
  1. search_tools(query) → 返回相关 tool 列表
  2. call_tool(name, params) → 调用具体 tool

而非加载所有 93 个 GitHub tools 到 context
```

**效果**:
- Opus 4 准确率从 49% → 74%
- Opus 4.5 准确率从 79.5% → 88.1%
- Token 消耗减少 ~85%

**Anthropic 的实现**: `defer_loading: true` 标记让工具可被动态发现，而非全部预加载。

#### 策略 2: Code Execution（代码执行）

Cloudflare 和 Anthropic 共同验证的模式:

```
Agent 看到 2 个工具:
  1. search_docs(query) → 搜索 API 文档
  2. execute_code(code) → 在 sandbox 中执行代码

Agent 写代码调用 SDK，而非逐一调用 MCP tools
```

**Cloudflare 实际数据**:
- 传统方式: 1,170,000 tokens（整个 Cloudflare API）
- Code Mode: **~1,000 tokens**（降低 99.9%）
- 安全: 代码在 Dynamic Worker V8 sandbox 中运行，无文件系统、无环境变量泄露

**Anthropic 实际数据**:
- 传统 MCP 工具: ~150,000 tokens
- Code Execution: ~2,000 tokens（降低 98.7%）

#### 策略 3: Bounded Context Packs（有界上下文包）

Synaptic Labs 提出并验证的模式（2026 年 1-2 月博客系列）:

```
Layer 1: Meta-Tools（2 个工具）
  ├── discover(domain) → 列出可用 agent/能力
  └── execute(agent, action, params) → 执行操作

Layer 2: Domain Agents（按领域分组）
  ├── content-agent: 内容操作
  ├── search-agent: 搜索操作
  ├── storage-agent: 存储操作
  └── memory-agent: 记忆操作

Layer 3: Individual Tools（每个 Agent 内的具体工具）
  └── 仅在需要时加载
```

**效果**: Token 开销减少 85-95%，从 10 tools 扩展到 100+ tools 无性能线性退化。

### 4.3 Progressive Disclosure 的统一视角

将上述三种策略统一来看:

```
                    Agent 视角
                        │
              ┌─────────┴──────────┐
              │   Layer 0: Index   │   极少 token（~100-1000）
              │ "我能做什么？"      │   描述/名称/领域列表
              └─────────┬──────────┘
                        │ Agent 判断需要哪些能力
              ┌─────────┴──────────┐
              │  Layer 1: Details  │   按需加载（~2000-5000 tokens）
              │ "具体怎么做？"      │   Tool Schema / Skill 内容 / API 文档
              └─────────┬──────────┘
                        │ Agent 执行具体操作
              ┌─────────┴──────────┐
              │  Layer 2: Execute  │   实际执行
              │ "做！"             │   Tool Call / Code Execution / CLI
              └────────────────────┘
```

**这与 Agentify 的分层生成策略完美对齐**:
- 小型 API (<30 endpoints): 直接暴露所有 tools（无需 progressive disclosure）
- 中型 API (30-100): Tool Search + Lazy Loading
- 大型 API (100+): Code Execution + Docs Search

---

## 5. 今天缺失了什么

### 5.1 Agent 消费产品时的六大痛点

#### 痛点 1: 没有统一的"产品清单"格式

Agent 需要发现一个产品提供了哪些能力，但目前:
- MCP Server 有 Server Cards（但采纳率低）
- A2A 有 Agent Cards（但仅限 Agent-to-Agent）
- 大部分产品**没有任何机器可读的能力描述**

**缺失的东西**: 一个通用的 "Product Card" 格式，描述产品对 Agent 提供的所有接口（MCP, CLI, API, Skills, Context Files）。

#### 痛点 2: 跨 Agent 平台的接口碎片化

同一个产品要为不同 Agent 平台提供不同接口:
- Claude Code: CLAUDE.md + Skills + MCP
- Cursor: .cursor/rules/*.mdc + MCP
- ChatGPT: MCP (以前是 GPT Actions)
- Codex: AGENTS.md + MCP
- Gemini CLI: AGENTS.md + MCP

**缺失的东西**: 一个"定义一次，生成多处"的工具——这正是 Agentify 的机会。

一个已有的尝试是 dev.to 上的 "Define your project once, generate AGENTS.md + .cursorrules + CLAUDE.md + GEMINI.md"，但这只是 context file 层面，没有覆盖 MCP/CLI/Skills。

#### 痛点 3: Tool Description 质量参差不齐

Agent 完全依赖 Tool Description 来理解何时和如何使用工具。但:
- 大部分 OpenAPI spec 的 description 是为**人类开发者**写的
- Agent 需要更精确的语义描述: 输入约束、副作用、关联操作、错误处理指引
- GitHub MCP Server 的 93 个工具中，许多 description 不够"agent-friendly"

**缺失的东西**: 自动将 human-oriented description 转换为 agent-optimized description 的工具。

#### 痛点 4: 认证和授权的混乱

当前 MCP 的 OAuth 实现被批评为 "a mess for enterprise":
- MCP Server 被迫同时充当 Authorization Server 和 OAuth Client
- 与企业现有的 SSO/SAML 基础设施不兼容
- Agent 跨多个服务时的 token 管理极其复杂

**缺失的东西**: 统一的 Agent Authentication Hub。

#### 痛点 5: 无法优雅处理大型 API

如本报告 Section 4 所述，100+ endpoint 的 API 会导致 context window 灾难。虽然 Cloudflare Code Mode 和 Anthropic Code Execution 提供了解决方案，但:
- 这些方案需要高度定制化
- 没有自动化的"大型 API → 高效 Agent 接口"转换工具
- 每个 API 提供商需要自己实现

**缺失的东西**: 自动检测 API 规模并选择最佳 Agent 接口策略的工具——Agentify 的分层生成策略。

#### 痛点 6: Agent 缺乏产品的"领域知识"

Agent 可以调用 Stripe 的 API，但不理解:
- Stripe 的最佳实践（如何正确处理 webhook retry）
- 常见陷阱（idempotency key 的重要性）
- 领域术语（subscription vs. payment intent vs. setup intent 的区别）

MCP Tool 只提供"能力"，不提供"知识"。Skill 和 Context File 可以填补这个空白，但目前**没有工具自动从产品文档中提取这些知识**。

**缺失的东西**: 自动将产品文档 → Agent-consumable 领域知识（Skill / Context File）的工具。

### 5.2 现有解决方案的覆盖盲区

| 需求 | Stainless | Speakeasy | 手动配置 | Agentify (愿景) |
|------|-----------|-----------|---------|---------------|
| OpenAPI → MCP Server | 有 | 有 | 手动 | **有** |
| OpenAPI → CLI | 无 | 无 | 手动 | **有** |
| OpenAPI → Skills | 无 | 部分 (Agent Skills) | 手动 | **有** |
| OpenAPI → Context Files | 无 | 无 | 手动 | **有** |
| 分层策略 (小/中/大) | 部分 (Code Exec) | 部分 | 手动 | **有** |
| 领域知识提取 | 无 | 无 | 手动 | **Phase 2** |
| 跨平台生成 | 无 | 无 | 手动 | **有** |
| 安全扫描 | 无 | 无 | 手动 | **有** |

---

## 6. "Full Transformation" 概念

### 6.1 什么是真正的 "Agent-Native" 产品

一个产品真正 "Agent-Native" 不是只有一个 MCP Server。它意味着：**为不同 Agent 上下文提供最合适的接口形态。**

```
一个完全 Agent 化的产品
    │
    ├── 🔧 MCP Server（标准协议接口）
    │   ├── 小型 API: 每个 endpoint 一个 tool
    │   ├── 中型 API: Tool Search + Lazy Loading
    │   └── 大型 API: Code Execution + Docs Search
    │
    ├── 🖥 CLI Tool（命令行接口）
    │   ├── 常用操作的 CLI commands
    │   └── Unix pipe friendly output
    │
    ├── 📘 Skills（过程性知识）
    │   ├── 最佳实践和 workflow
    │   ├── 常见任务的 step-by-step 指南
    │   └── 领域特定的 troubleshooting
    │
    ├── 📄 Context Files（项目上下文）
    │   ├── CLAUDE.md: Claude Code 约定
    │   ├── .cursor/rules/*.mdc: Cursor 规则
    │   ├── AGENTS.md: 跨平台约定
    │   └── copilot-instructions.md: GitHub Copilot
    │
    ├── 📡 API（传统 HTTP 接口）
    │   ├── REST / GraphQL
    │   ├── Agent-optimized descriptions
    │   └── SDK with TypeScript types
    │
    └── 🎨 MCP Apps（交互式 UI）
        ├── Dashboard 组件
        ├── 配置向导
        └── 数据可视化
```

### 6.2 "Full Transformation" 的层级模型

我们提出一个五层成熟度模型:

| Level | 名称 | 描述 | 接口 | 代表 |
|-------|------|------|------|------|
| L0 | **人类专有** | 只有 GUI/Web | 无 Agent 接口 | 大部分传统 SaaS |
| L1 | **API 可用** | 有 REST API + 文档 | API only | 大部分 B2B SaaS |
| L2 | **MCP 就绪** | 有 MCP Server | MCP + API | GitHub, Notion, Stripe |
| L3 | **Agent 友好** | 有 MCP + CLI + Context Files | MCP + CLI + Context | Cloudflare (Code Mode) |
| L4 | **Agent 原生** | 完整接口套件 + 领域知识 | 全部 6 种 | **尚不存在（Agentify 愿景）** |

**关键洞察**: 当前市场上没有任何产品达到 L4。最先进的如 Cloudflare 也只在 L3。Agentify 的使命是让任何产品从 L1 快速到达 L4。

### 6.3 各接口形态的最佳场景映射

```
Agent 在 Claude Code 中编码
  │
  ├─ 需要查看 Stripe 余额 → MCP Tool (结构化数据, 需认证)
  ├─ 需要创建 git commit → CLI (git commit -m "...") (天然理解)
  ├─ 需要遵循支付处理规范 → Skill (/stripe-best-practices)
  ├─ 需要知道项目用的 Stripe 版本 → Context File (CLAUDE.md)
  ├─ 需要调试复杂的 payment flow → MCP App (可视化 dashboard)
  └─ 需要批量更新 1000 个 subscription → Code Execution (效率)
```

### 6.4 Stainless 模式: 代表性的 L3 方案

Stainless（为 OpenAI, Cloudflare, Anthropic 生成 SDK 的公司）的 MCP Server 生成方案值得特别分析:

**架构**: 生成的 MCP Server 只包含 2 个 tools:
1. `search_docs(query)` — 搜索 API 文档
2. `execute_code(code)` — 执行调用 SDK 的代码

**优势**:
- 极致 token 效率
- 适用于任何规模的 API
- 多操作组合在一次代码执行中完成

**局限**:
- 不生成 CLI tools
- 不生成 Skills 或 Context Files
- 不处理跨平台适配
- 是 SDK 生成的附产品，非独立产品

---

## 7. 开发者如何手动 Agent 化产品

### 7.1 当前手动流程

通过调研开发者社区，我们发现"Agent 化"一个产品的典型手动流程:

#### Step 1: 创建 Context Files

开发者首先为自己的产品/项目创建各类 Agent context files:

```
my-product/
├── CLAUDE.md              # Claude Code 用户的项目约定
├── AGENTS.md              # 跨平台约定 (Codex, Gemini CLI)
├── .cursor/rules/
│   ├── general.mdc        # Cursor 通用规则
│   └── api-conventions.mdc  # API 相关规则
├── .github/
│   └── copilot-instructions.md  # GitHub Copilot 指令
└── .gemini/
    └── instructions.md    # Gemini 指令
```

**AGENTS.md 的兴起**: 作为跨平台标准正在被广泛采纳（40,000+ 开源项目使用）。研究表明 AGENTS.md 可减少 AI Agent 28.64% 的运行时间和 16.58% 的 output token 消耗。

**痛点**: 每个平台的格式不同，内容大量重复，维护成本高。

#### Step 2: 构建 MCP Server

```typescript
// 典型的手动 MCP Server 构建流程
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const server = new McpServer({ name: "my-product", version: "1.0.0" });

// 逐一定义每个 tool (手动、重复、易错)
server.tool(
  "get-user",
  "Get user by ID",
  { id: z.string() },
  async ({ id }) => {
    const user = await api.getUser(id);
    return { content: [{ type: "text", text: JSON.stringify(user) }] };
  }
);

// ... 重复 N 次，每个 endpoint 一次
```

**痛点**:
- 纯手工，每个 endpoint 需要 10-20 行代码
- Tool description 质量取决于开发者的 Agent 理解
- 无分层策略（大型 API 会爆 context）
- 安全审查完全依赖人工

#### Step 3: 提供 CLI（如果有的话）

大部分产品没有 CLI。有 CLI 的产品（如 gh, stripe, aws）是因为它们本身就面向开发者。

**痛点**: 非 developer-facing 产品几乎不会投资 CLI，但 Agent 可能更喜欢 CLI。

#### Step 4: 编写 Skills（极少数产品）

只有非常前沿的产品会为 Agent 编写 Skills:
- Speakeasy 发布了 OpenAPI + CLI 使用的 Agent Skills
- Anthropic 自己维护了一些官方 Skills（如 developer platform skill）

**痛点**: 大多数产品开发者不知道 Skill 是什么，更不会去创建。

#### Step 5: 调试和迭代

```
发现 Agent 不会用 → 改 tool description
发现 context 溢出 → 减少 tool 数量
发现认证失败 → 重新实现 OAuth
发现安全漏洞 → 打补丁
```

**痛点**: 没有标准化的测试框架来验证 Agent 是否能正确使用你的接口。

### 7.2 这个过程中 Agentify 可以自动化的部分

| 手动步骤 | 自动化可行性 | Agentify 方案 |
|---------|------------|-------------|
| 解析 OpenAPI spec | 完全可自动化 | parser/ 模块 |
| 选择生成策略 | 完全可自动化 | 基于 endpoint 数量的分层策略 |
| 生成 MCP Server | 完全可自动化 | generator/ + templates/ |
| 生成 CLI wrapper | 大部分可自动化 | **新增**: CLI 生成模块 |
| 生成 Context Files | 大部分可自动化 | **新增**: CLAUDE.md / AGENTS.md / .cursorrules 生成 |
| 生成 Skills | 部分可自动化 | **新增**: 基于 API 分组生成 SKILL.md |
| Tool Description 优化 | 部分可自动化 | Phase 1: LLM 辅助优化 |
| 领域知识提取 | 需要 LLM | Phase 2: 从文档提取 |
| 安全扫描 | 完全可自动化 | security/ 模块 |
| 跨平台适配 | 完全可自动化 | **新增**: 多格式输出 |

---

## 8. 对 Agentify 的启示

### 8.1 核心重新定位

基于本研究，Agentify 的定位应从:

**旧定位**: "OpenAPI spec → MCP Server"
**新定位**: "OpenAPI spec → 完整的 Agent 接口套件"

一条命令不是只生成一个 MCP Server，而是生成 Agent 消费这个产品所需的**一切**。

### 8.2 建议的输出矩阵

```
npx agentify <openapi-url>
    │
    ├── 📦 mcp-server/          # MCP Server（核心输出）
    │   ├── src/server.ts        # 分层策略自动选择
    │   ├── Dockerfile
    │   └── package.json
    │
    ├── 📄 context/              # Context Files（跨平台）
    │   ├── CLAUDE.md            # Claude Code 约定
    │   ├── AGENTS.md            # 跨平台约定
    │   ├── .cursor/rules/       # Cursor 规则
    │   └── copilot-instructions.md
    │
    ├── 🔧 skills/               # Claude Code Skills
    │   ├── quick-start/SKILL.md # 快速入门 Skill
    │   └── <domain>/SKILL.md    # 按领域分组的 Skills
    │
    └── 📘 README.md             # 使用文档
```

### 8.3 Phase 0.5 的调整建议

Phase 0.5 的 MVP 应聚焦于:

1. **MCP Server 生成**（已计划）— 这是核心
2. **CLAUDE.md 生成**（新增，低成本）— 从 OpenAPI spec 的 info/description 自动生成项目约定
3. **AGENTS.md 生成**（新增，低成本）— 从 CLAUDE.md 变体生成跨平台格式

**Phase 1 加入**:
4. Skills 生成 — 从 API 的 tag 分组自动生成领域 Skills
5. CLI wrapper 生成 — 为 top-N 常用 endpoint 生成 CLI 命令
6. .cursorrules 生成

**Phase 2 加入**:
7. MCP Apps 生成（交互式 UI 组件）
8. 领域知识提取（从产品文档）
9. Agent-optimized description（LLM 辅助优化）

### 8.4 关键差异化机会

1. **"Define Once, Generate Everywhere"**: 没有竞品做到从一个 OpenAPI spec 生成面向所有 Agent 平台的完整接口套件
2. **Progressive Disclosure 内置**: 分层策略不是可选功能，而是核心智能
3. **Context File 生成**: Stainless 和 Speakeasy 都不生成 CLAUDE.md / AGENTS.md / .cursorrules
4. **Skill 生成**: 目前没有任何工具自动从 API spec 生成 Claude Code Skills

### 8.5 风险提示

1. **生态碎片化加速**: CLAUDE.md, AGENTS.md, .cursorrules 的格式可能在 6 个月内再次变化
2. **MCP 2.0**: MCP spec 的快速演进可能使生成的代码需要频繁更新
3. **Skills 标准尚未稳定**: Agent Skills 开放标准处于早期，采纳广度有限
4. **CLI 的"够用就好"效应**: 很多 Agent 场景下，一个好的 CLI 就够了，不需要 MCP

---

## 参考资料

### Agent 接口与工具
- [MCP vs CLI for AI Agents: Why Direct APIs Win (ModelsLab)](https://modelslab.com/blog/api/mcp-vs-cli-ai-agents-developers-2026)
- [Why CLIs Beat MCP for AI Agents (Medium)](https://lalatenduswain.medium.com/why-clis-beat-mcp-for-ai-agents-and-how-to-build-your-own-cli-army-8db9e0467dd8)
- [Code execution with MCP (Anthropic)](https://www.anthropic.com/engineering/code-execution-with-mcp)
- [Code Mode: give agents an entire API in 1,000 tokens (Cloudflare)](https://blog.cloudflare.com/code-mode-mcp/)
- [Cloudflare Code Mode Cuts Token Usage by 81% (WorkOS)](https://workos.com/blog/cloudflare-code-mode-cuts-token-usage-by-81)
- [Advanced Tool Use (Anthropic)](https://www.anthropic.com/engineering/advanced-tool-use)

### Claude Code Skills
- [Extend Claude with Skills (Claude Code Docs)](https://code.claude.com/docs/en/skills)
- [Skills Explained: How Skills Compares (Claude Blog)](https://claude.com/blog/skills-explained)
- [Claude Skills vs MCP: A Technical Comparison (IntuitionLabs)](https://intuitionlabs.ai/articles/claude-skills-vs-mcp)
- [Claude Agent Skills: A First Principles Deep Dive](https://leehanchung.github.io/blogs/2025/10/26/claude-skills-deep-dive/)
- [Skill Authoring Best Practices (Anthropic)](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
- [Agent Skills Open Standard (GitHub)](https://github.com/anthropics/skills)
- [MCP, Skills, and Agents (cra.mr)](https://cra.mr/mcp-skills-and-agents/)

### Context Files
- [AGENTS.md Specification (GitHub)](https://github.com/agentsmd/agents.md)
- [AGENTS.md: One File to Guide Them All (Layer5)](https://layer5.io/blog/ai/agentsmd-one-file-to-guide-them-all/)
- [Define your project once, generate AGENTS.md + .cursorrules + CLAUDE.md (DEV Community)](https://dev.to/wolfejam/define-your-project-once-generate-agentsmd-cursorrules-claudemd-geminimd-bc3)
- [Rules for AI (Cursor Docs)](https://docs.cursor.com/context/rules-for-ai)
- [The Complete Guide to AI Agent Memory Files (Medium)](https://medium.com/data-science-collective/the-complete-guide-to-ai-agent-memory-files-claude-md-agents-md-and-beyond-49ea0df5c5a9)

### Progressive Disclosure
- [Progressive Disclosure Matters: Applying 90s UX Wisdom to 2026 AI Agents (Substack)](https://aipositive.substack.com/p/progressive-disclosure-matters)
- [Progressive Disclosure for AI Agents (Medium)](https://medium.com/@martia_es/progressive-disclosure-the-technique-that-helps-control-context-and-tokens-in-ai-agents-8d6108b09289)
- [The Meta-Tool Pattern: Progressive Disclosure for MCP (Synaptic Labs)](https://blog.synapticlabs.ai/bounded-context-packs-meta-tool-pattern)
- [Why AI Agents Need Progressive Disclosure (Honra)](https://www.honra.io/articles/progressive-disclosure-for-ai-agents)

### SDK/MCP 生成工具
- [Generate MCP servers from OpenAPI specs (Stainless)](https://www.stainless.com/docs/guides/generate-mcp-server-from-openapi/)
- [Generate MCP servers from OpenAPI documents (Speakeasy)](https://www.speakeasy.com/blog/generate-mcp-from-openapi)
- [Speakeasy vs Stainless vs Postman: MCP Server Generation Showdown (Speakeasy)](https://www.speakeasy.com/blog/comparison-mcp-server-generators)
- [Agent Skills for OpenAPI and SDK Generation (Speakeasy)](https://www.speakeasy.com/blog/release-agent-skills)

### Agent-Native 设计
- [CLIs as Agent-Native Interfaces: 2026 Analysis (Blockchain.news)](https://blockchain.news/ainews/clis-as-agent-native-interfaces-2026-analysis-on-polymarket-cli-github-cli-and-mcp-for-ai-automation)
- [State of Design 2026: When Interfaces Become Agents (Medium)](https://tejjj.medium.com/state-of-design-2026-when-interfaces-become-agents-fc967be10cba)
- [Emerging Developer Patterns for the AI Era (a16z)](https://a16z.com/nine-emerging-developer-patterns-for-the-ai-era/)
- [GPT Actions vs MCP: Complete Comparison (Fast.io)](https://fast.io/resources/gpt-actions-vs-mcp/)

### Agent 工具与平台
- [Devin vs Cursor: How developers choose AI coding tools (Builder.io)](https://www.builder.io/blog/devin-vs-cursor)
- [AI Coding Agents in 2026: Claude Code vs Codex vs Gemini CLI (Optijara)](https://www.optijara.ai/en/blog/ai-coding-agents-2026-complete-guide)
- [New Capabilities for Building Agents on the Anthropic API (Anthropic)](https://www.anthropic.com/news/agent-capabilities-api)
- [Agentic Coding with Claude Code and Cursor (Softcery)](https://softcery.com/lab/softcerys-guide-agentic-coding-best-practices)
