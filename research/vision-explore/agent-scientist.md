# Agent Scientist 视野探索：多格式输出的科学基础

> 作者: Agent Scientist (LLM Agent 工具使用研究专家)
> 日期: 2026-03-02
> 范围: Agentify 多格式输出愿景的 Agent 科学分析
> 输入: CLAUDE.md, SYNTHESIS.md, 前一轮评审, 2026 年最新研究

---

## 核心洞察

Agentify 的新愿景——从 "生成 MCP Server" 扩展到 "生成所有 agent 接口"——**不是功能膨胀，而是对 agent 消费模式科学现实的回应**。2026 年的 agent 生态已经证明：**没有单一接口能满足所有 agent 场景**。MCP 在结构化工具调用上无可替代，但 Skills 在 workflow 指导上更优，CLI 在 token 效率上胜出 33%，AGENTS.md 在跨工具兼容上是唯一标准。

这份报告从 Agent 科学角度论证：为什么多格式输出是必要的，哪些格式适合哪些场景，以及如何科学地评估这一策略。

---

## 1. Agent 消费偏好矩阵

### 1.1 格式全景

Agentify 可以为一个产品生成以下 agent 接口：

| 格式 | 本质 | Token 成本 | 适用 Agent 类型 |
|------|------|-----------|---------------|
| **MCP Server** | 结构化工具（Tools + Resources + Prompts） | 高 (~600 tokens/tool) | 通用 AI agent |
| **Skill** | Markdown 指令 + 可选脚本 | 低 (~50 tokens/描述，按需加载) | Claude Code, Claude Agent SDK |
| **CLI** | 命令行接口 | 极低 (~20 tokens/命令) | Terminal-first agent |
| **.cursorrules / AGENTS.md** | 项目级指令文件 | 中 (~2K-5K tokens) | IDE agent (Cursor/Windsurf/Copilot) |
| **A2A Agent Card** | JSON 能力清单 | 低 (~500 tokens) | 其他 AI agent（agent-to-agent） |
| **SDK (TypeScript/Python)** | 类型安全的客户端库 | 零（编译时消费） | 程序化 agent |
| **文档 (API Docs)** | 人可读文档 | 按需检索 | Code Execution 模式 agent |

### 1.2 Agent x 场景 x 格式偏好矩阵

```
                    ┌─────────┬──────────┬──────────┬──────────┬──────────┐
                    │ MCP     │ Skill    │ CLI      │ Rules    │ A2A Card │
                    │ Server  │          │          │ (.md)    │          │
┌───────────────────┼─────────┼──────────┼──────────┼──────────┼──────────┤
│ Claude Code       │ ★★★☆   │ ★★★★★   │ ★★★★☆   │ ★★★★★   │ ☆☆☆☆☆   │
│ (编码任务)         │         │          │          │          │          │
├───────────────────┼─────────┼──────────┼──────────┼──────────┼──────────┤
│ Claude Code       │ ★★★★★  │ ★★★☆☆   │ ★★☆☆☆   │ ★★★☆☆   │ ☆☆☆☆☆   │
│ (API 交互)        │         │          │          │          │          │
├───────────────────┼─────────┼──────────┼──────────┼──────────┼──────────┤
│ ChatGPT           │ ★★★★☆  │ ☆☆☆☆☆   │ ☆☆☆☆☆   │ ☆☆☆☆☆   │ ☆☆☆☆☆   │
│ (对话式 agent)     │ (MCP)   │ (不支持)  │ (无终端)  │ (不支持)  │          │
├───────────────────┼─────────┼──────────┼──────────┼──────────┼──────────┤
│ Cursor / Windsurf │ ★★★☆☆  │ ☆☆☆☆☆   │ ★★★☆☆   │ ★★★★★   │ ☆☆☆☆☆   │
│ (IDE agent)       │         │ (无原生)  │          │          │          │
├───────────────────┼─────────┼──────────┼──────────┼──────────┼──────────┤
│ Devin / Codex     │ ★★☆☆☆  │ ☆☆☆☆☆   │ ★★★★★   │ ★★★★☆   │ ☆☆☆☆☆   │
│ (自主编码 agent)   │         │          │          │          │          │
├───────────────────┼─────────┼──────────┼──────────┼──────────┼──────────┤
│ LangChain /       │ ★★★★★  │ ☆☆☆☆☆   │ ★★☆☆☆   │ ☆☆☆☆☆   │ ★★★☆☆   │
│ CrewAI agent      │ (MCP)   │          │          │          │ (A2A)    │
├───────────────────┼─────────┼──────────┼──────────┼──────────┼──────────┤
│ 企业编排 agent     │ ★★★★☆  │ ☆☆☆☆☆   │ ★★★☆☆   │ ☆☆☆☆☆   │ ★★★★★   │
│ (multi-agent)     │         │          │          │          │          │
├───────────────────┼─────────┼──────────┼──────────┼──────────┼──────────┤
│ 开发者 (人类)      │ ☆☆☆☆☆  │ ☆☆☆☆☆   │ ★★★★★   │ ☆☆☆☆☆   │ ☆☆☆☆☆   │
│ (直接使用)         │         │          │ (CLI)    │          │          │
└───────────────────┴─────────┴──────────┴──────────┴──────────┴──────────┘
```

### 1.3 矩阵背后的科学解释

**为什么 Claude Code 编码时更偏好 Skill 而非 MCP？**

Claude Code 在编码场景中已经拥有完整的文件系统访问（Read/Write/Edit 工具）和终端访问（Bash 工具）。此时它不需要 MCP 提供的结构化工具——它需要的是 **"知道怎么做"的指令**。例如，一个 Stripe 集成 Skill 会告诉 Claude："使用 Stripe SDK 时，总是用 `stripe.paymentIntents.create()` 而非手动构造 API 请求，错误处理要用 `StripeError` 类型"。这种 procedural knowledge 是 Skill 的本质优势。

根据 Anthropic 的 Skills 文档，Skill 加载采用 progressive disclosure：描述只占 ~50 tokens，完整内容按需加载。对比 MCP 的 ~600 tokens/tool，在 50 个 tool 的场景下，**Skill 的 context 占用仅为 MCP 的 1/12**。

**为什么 Claude Code 做 API 交互时切换到 MCP？**

当任务从 "写代码" 变为 "调用外部 API 获取数据"，agent 需要的不再是指令，而是 **实时的工具调用能力**。MCP 提供类型安全的 JSON Schema、结构化的输入输出、错误处理协议——这些是 Skill（纯文本指令）无法提供的。

**为什么 Devin/Codex 更偏好 CLI？**

自主编码 agent 运行在沙盒环境中，拥有完整的终端访问权限。2026 年的 benchmark 数据表明，CLI 比 MCP 在开发者任务上 **token 效率高 33%**（Token Efficiency Score: CLI 202 vs MCP 152），任务完成率高 28%。原因是 CLI 利用了数十年的 Unix 工具链生态——`pipe`、`grep`、`jq` 等组合的表达力远超结构化 tool call。

**为什么 ChatGPT 只能用 MCP？**

ChatGPT 作为对话式 agent，没有终端访问、没有文件系统、没有 IDE。MCP 是它 **唯一的外部连接通道**。但值得注意的是，OpenAI 已经在 MCP 基础上扩展了 MCP Apps（交互式 UI 组件），表明即使在 MCP-only 的环境中，也需要超越 "纯工具" 的能力。

**为什么企业编排 agent 偏好 A2A？**

在多 agent 系统中，agent 之间需要的是 **能力发现 + 任务委派**，而非直接工具调用。Google 的 A2A Protocol v0.3 通过 Agent Card（JSON 能力清单）实现了标准化的 agent 间发现机制。一个编排 agent 不需要知道下游 agent 的具体 tool schema——它只需要知道 "这个 agent 能处理退款" 即可委派任务。

### 1.4 关键发现

**没有任何单一格式覆盖所有场景**。矩阵清楚地表明：

1. **MCP 是通用基础**——几乎所有 agent 都能消费 MCP，但不是所有场景的最优选择
2. **Skills 是 Claude 生态的差异化**——仅 Claude Code/Agent SDK 支持，但在支持的场景下效率远超 MCP
3. **CLI 是被低估的格式**——在自主编码 agent 和 terminal-first 场景下，CLI 的 token 效率和任务完成率均领先
4. **Rules 文件是 IDE agent 的核心**——.cursorrules / AGENTS.md 是 Cursor/Windsurf 等 IDE 的主要指令来源
5. **A2A Card 是 agent-to-agent 的未来**——目前生态尚小，但 Linux Foundation 的支持意味着标准化在加速

---

## 2. Skills vs MCP 的根本区别

### 2.1 本体论区别

```
MCP (Model Context Protocol)
├── 本质: 给 agent 工具用 (Tool Access)
├── 类比: USB 接口 —— 标准化的外部设备连接
├── 运行时: 独立进程（MCP Server），通过 stdio/HTTP 通信
├── Token 模型: 工具定义常驻 context (~600 tokens/tool)
├── 能力范围: Tools (操作) + Resources (数据) + Prompts (模板)
└── 适用: "连接到 X" —— agent 需要访问外部系统

Skills
├── 本质: 教 agent 怎么做 (Procedural Knowledge)
├── 类比: 员工手册 —— 领域专家的操作指南
├── 运行时: 文本注入 context（无独立进程）
├── Token 模型: 描述 ~50 tokens，内容按需加载 (~2K-5K tokens)
├── 能力范围: Instructions (指令) + Scripts (脚本) + References (参考)
└── 适用: "如何做 X" —— agent 需要领域知识和最佳实践
```

### 2.2 产品能力的格式选择决策树

```
一个产品能力（如 Stripe 的"创建支付"）应该生成什么格式？

                    这个能力需要实时外部交互吗？
                    /                           \
                  是                             否
                  |                              |
          需要结构化输入输出吗？           涉及复杂的多步骤流程吗？
          /                \              /                    \
        是                  否           是                     否
        |                   |            |                      |
    → MCP Tool          → CLI       → Skill              → AGENTS.md 规则
    (结构化 API 调用)  (简单命令)   (workflow 指导)       (简单约定)

    示例:                示例:         示例:                 示例:
    stripe.charges      stripe CLI    "Stripe 集成最佳       "使用 Stripe
    .create()           支付命令       实践和错误处理"        时总是用 v3 API"
```

### 2.3 格式选择的具体示例

| 产品能力 | MCP Tool | Skill | CLI | 两者都需要 |
|---------|----------|-------|-----|-----------|
| Stripe: 创建支付 | **YES** (实时 API 调用) | **YES** (错误处理 + 重试策略指导) | YES | MCP + Skill |
| GitHub: 创建 PR | **YES** (需要结构化参数) | NO (gh CLI 已足够) | **YES** (gh pr create) | MCP 或 CLI |
| Figma: 导出设计稿 | **YES** (文件操作) | **YES** (设计系统规范) | NO | MCP + Skill |
| Postgres: 查询数据 | **YES** (参数化查询) | **YES** (Schema 知识 + 查询优化) | YES (psql) | MCP + Skill |
| Vercel: 部署 | NO (CLI 更高效) | **YES** (部署策略 + 环境配置) | **YES** (vercel deploy) | Skill + CLI |
| Twilio: 发短信 | **YES** (单次 API) | NO (简单操作) | YES | MCP |
| AWS S3: 文件管理 | **YES** (CRUD 操作) | **YES** (命名规范 + 权限策略) | **YES** (aws s3) | 全部 |

### 2.4 "两者都需要"的黄金模式

**最有价值的场景是 MCP + Skill 协同**。单独用 MCP，agent 知道 "能做什么" 但不知道 "该怎么做"。单独用 Skill，agent 知道 "该怎么做" 但没有执行工具。

```
=== Stripe 集成的 MCP + Skill 协同 ===

MCP Tool (能做什么):
  stripe_create_payment_intent:
    description: "Create a payment intent for a customer"
    inputSchema: { amount: number, currency: string, ... }

Skill (该怎么做):
  ---
  name: stripe-payments
  description: Best practices for Stripe payment integration
  ---
  When handling payments with Stripe:
  1. ALWAYS create a PaymentIntent, never a Charge (deprecated)
  2. Use idempotency keys for ALL write operations
  3. Handle these specific errors:
     - `card_declined` → Show user-friendly message, suggest retry
     - `rate_limit` → Exponential backoff, max 3 retries
     - `authentication_required` → Trigger 3D Secure flow
  4. For subscriptions, use stripe_create_subscription tool
     AFTER creating a customer with stripe_create_customer
  5. Always store webhook events for reconciliation
```

**协同效果量化**：根据 Anthropic 工程博客的数据，Tool Use Examples 将复杂参数处理准确率从 72% 提升到 90%。Skill 本质上就是 "超级丰富的 Tool Use Example + workflow 指导"。预计 MCP + Skill 协同可将任务完成率提升 **15-25%**（相比单独 MCP）。

---

## 3. Context Window 在多格式下的影响

### 3.1 各格式的 Context 成本模型

```
假设一个中型产品有 60 个 API endpoint：

格式                    Context 消耗          加载策略
─────────────────────────────────────────────────────────────
MCP (all tools)         ~36,000 tokens       全量加载（传统）
MCP (progressive)       ~3,000 tokens        描述索引 + 按需加载
MCP (Code Execution)    ~2,000 tokens        恒定消耗
Skill (all loaded)      ~15,000 tokens       全部指令注入
Skill (progressive)     ~600 tokens          描述索引 + 按需加载
CLI (help text)         ~1,200 tokens        --help 按需
.cursorrules            ~3,000 tokens        项目启动时一次性
A2A Card                ~500 tokens          发现时一次性
SDK                     0 tokens             编译时，不占 context
文档                     ~800 tokens/次       RAG 检索

=== 场景对比 ===

场景 A: 只有 MCP (传统)
  → 36,000 tokens (18% of 200K context)
  → 3-4 次 tool call 后 reasoning quality 下降

场景 B: MCP (progressive) + Skill (progressive) + CLI
  → 3,000 + 600 + 1,200 = 4,800 tokens (2.4%)
  → 大量 context 空间留给 reasoning

场景 C: Code Execution + Skill + 文档 RAG
  → 2,000 + 600 + 800 = 3,400 tokens (1.7%)
  → 最高效的组合
```

### 3.2 "只加载需要的格式"的机制设计

Agentify 需要一个 **格式路由器 (Format Router)**，让 agent 只加载当前任务需要的格式：

```typescript
interface FormatRouter {
  // 根据 agent 类型和任务类型，决定加载哪些格式
  selectFormats(context: {
    agentType: 'claude-code' | 'chatgpt' | 'cursor' | 'devin' | 'langchain' | 'a2a-client'
    taskType: 'coding' | 'api-interaction' | 'data-analysis' | 'deployment' | 'discovery'
    apiSize: 'small' | 'medium' | 'large'
  }): FormatSelection

  // 返回应该加载的格式及其加载策略
  // FormatSelection: { mcp?: LoadStrategy, skill?: LoadStrategy, cli?: boolean, ... }
}

// 加载策略
type LoadStrategy =
  | { type: 'full' }           // 全量加载（小型 API）
  | { type: 'progressive' }    // 渐进式（中型 API）
  | { type: 'code-execution' } // 代码执行模式（大型 API）
```

### 3.3 Progressive Disclosure 在多格式中的应用

Anthropic 2026 年的最新数据表明，progressive disclosure 将 MCP 的 token 开销从 77,000 降至 8,700（85% 减少），同时 Opus 4 的工具选择准确率从 49% 提升到 74%。

**但有一个重要权衡**：full-loading MCP 的 runtime 性能更好（减少 3-4 倍 tool call），因为 LLM 可以直接推理所有工具。Progressive disclosure 需要额外的发现步骤。

**多格式下的最优策略**：

```
小型 API (<30 endpoints):
  → MCP: Full loading (所有 tool 定义)
  → Skill: Full loading (所有指令)
  → 总计: ~20K tokens — 可接受

中型 API (30-100 endpoints):
  → MCP: Progressive (描述索引 + 按需加载)
  → Skill: Progressive (只加载相关 Skill)
  → CLI: 提供 --help 引用
  → 总计: ~5K tokens — 高效

大型 API (100+ endpoints):
  → MCP: Code Execution 模式 (SDK + docs search)
  → Skill: 按 domain 分组，只加载活跃 domain
  → CLI: 完整 CLI 可用
  → 文档: RAG 检索
  → 总计: ~3.5K tokens — 极致高效
```

### 3.4 Agentify 的分层输出策略

结合前一轮评审中的分层生成策略和多格式输出的 context 分析，建议 Agentify 的输出策略如下：

| API 规模 | 主格式 | 辅格式 | 可选格式 | Token 预算 |
|---------|--------|--------|---------|-----------|
| 小型 (<30) | MCP Server (one-tool-per-endpoint) | AGENTS.md | CLI, A2A Card | <20K |
| 中型 (30-100) | MCP Server (progressive) + Skills | CLI + AGENTS.md | A2A Card | <5K |
| 大型 (100+) | MCP Server (Code Execution) + Skills + CLI | AGENTS.md + Docs | A2A Card, SDK | <4K |

---

## 4. Agent 发现机制

### 4.1 当前的发现困境

Agent 怎么知道一个产品提供了哪些可用格式？当前的现实是 **手动配置**：

```
Claude Code 用户: 手动添加 MCP Server 到 .mcp.json，手动安装 Skill
Cursor 用户: 手动放置 .cursorrules
ChatGPT 用户: 手动配置 MCP connector
LangChain 开发者: 手动写 tool wrapper
```

这就是 Agentify 可以解决的核心痛点——**一次生成，多格式自动发现**。

### 4.2 Capability Manifest 设计

Agentify 应该为每个生成的产品创建一个 **Capability Manifest**——一个描述所有可用格式的元数据文件：

```json
{
  "$schema": "https://agentify.dev/schemas/manifest/v1.json",
  "product": {
    "name": "Stripe",
    "version": "2026-02-15",
    "description": "Payment processing platform",
    "apiSize": "large",
    "endpointCount": 312
  },
  "formats": {
    "mcp": {
      "available": true,
      "strategy": "code-execution",
      "transport": ["stdio", "streamable-http"],
      "toolCount": 2,
      "install": "npx agentify-mcp stripe",
      "configSnippet": {
        "claude": { "mcpServers": { "stripe": { "command": "npx", "args": ["agentify-mcp", "stripe"] } } },
        "cursor": { "mcpServers": { "stripe": { "command": "npx", "args": ["agentify-mcp", "stripe"] } } }
      }
    },
    "skills": {
      "available": true,
      "count": 8,
      "domains": ["payments", "subscriptions", "invoicing", "webhooks", "disputes", "customers", "products", "reporting"],
      "install": "npx agentify-skills stripe --target ~/.claude/skills/"
    },
    "cli": {
      "available": true,
      "commands": 45,
      "install": "npm install -g agentify-cli-stripe"
    },
    "rules": {
      "available": true,
      "formats": ["AGENTS.md", ".cursorrules", "CLAUDE.md"],
      "install": "npx agentify-rules stripe"
    },
    "a2a": {
      "available": true,
      "agentCard": "https://agentify.dev/a2a/stripe/agent-card.json",
      "skills": ["process-payment", "manage-subscription", "handle-dispute"]
    },
    "sdk": {
      "available": true,
      "languages": ["typescript", "python"],
      "install": {
        "typescript": "npm install @agentify/stripe",
        "python": "pip install agentify-stripe"
      }
    },
    "docs": {
      "available": true,
      "searchEndpoint": "https://agentify.dev/docs/stripe/search",
      "format": "markdown"
    }
  },
  "recommended": {
    "claude-code": ["skills", "mcp", "rules"],
    "chatgpt": ["mcp"],
    "cursor": ["rules", "mcp"],
    "devin": ["cli", "rules"],
    "langchain": ["mcp", "sdk"],
    "enterprise": ["a2a", "mcp", "sdk"]
  }
}
```

### 4.3 发现协议

Agent 如何找到这个 Manifest？三种发现路径：

**路径 1: Well-Known URL（标准化）**
```
GET https://api.stripe.com/.well-known/agentify.json
→ 返回 Capability Manifest
```
类似 OAuth 的 `.well-known/openid-configuration`，建立一个标准化的发现端点。

**路径 2: Registry（集中式）**
```
GET https://registry.agentify.dev/stripe
→ 返回 Capability Manifest + 所有格式的下载链接
```
类似 npm registry，提供中心化的格式目录。

**路径 3: A2A Agent Card（agent-to-agent）**
A2A Protocol 的 Agent Card 已经包含了能力描述和技能列表。Agentify 可以在 Agent Card 中嵌入格式信息：
```json
{
  "name": "Stripe Agent",
  "description": "Handles payment operations via Stripe API",
  "skills": [...],
  "extensions": {
    "agentify": {
      "manifestUrl": "https://agentify.dev/manifest/stripe.json"
    }
  }
}
```

### 4.4 自动配置 (Zero-Config)

发现之后的关键是 **自动配置**。Agentify 应该提供一条命令完成格式安装：

```bash
# 智能安装：检测当前环境，安装最优格式组合
npx agentify install stripe

# 检测到 Claude Code 环境 → 安装 Skills + MCP + CLAUDE.md 规则
# 检测到 Cursor 环境 → 安装 .cursorrules + MCP
# 检测到 CI/CD 环境 → 安装 CLI + SDK
```

---

## 5. 格式间的协同效应

### 5.1 协同 > 单独使用

**核心论点：MCP + Skill 协同使用比单独使用任何一个都更强。**

以下是三个具体的协同模式：

#### 模式 1: Tool + Workflow (MCP + Skill)

```
单独 MCP: Agent 有 stripe_create_payment 工具，但不知道：
  - 应该先验证客户存在
  - 需要设置 idempotency key
  - 应该处理 3D Secure 回调
  - 错误后应该如何恢复
  → 任务完成率: ~60%

MCP + Skill: Agent 既有工具，又有 workflow 指导：
  Skill 告诉它: "创建支付前，先用 stripe_get_customer 验证客户"
  Skill 告诉它: "总是在 metadata 中设置 idempotency_key"
  Skill 告诉它: "card_declined 错误的处理流程是..."
  → 预估任务完成率: ~85%
```

#### 模式 2: Discovery + Execution (AGENTS.md + MCP)

```
单独 MCP: Agent 在项目启动时加载所有 tool 定义
  → 50 个 tool = 30,000 tokens，context 压力大

AGENTS.md + MCP (Progressive):
  AGENTS.md 告诉 IDE agent: "这个项目使用 Stripe 和 GitHub API"
  Agent 只在需要时加载相关 MCP tools
  → 初始只需 ~3,000 tokens，按需扩展
```

#### 模式 3: Human + Agent (CLI + MCP + A2A)

```
场景: 一个 DevOps 团队需要自动化部署流程

CLI: 人类开发者直接使用命令行部署和调试
  $ agentify-vercel deploy --env production

MCP: Claude Code 等 agent 通过 MCP 工具调用部署 API
  agent 调用 vercel_deploy tool

A2A: 编排 agent 发现并委派任务给 "Vercel 部署 agent"
  编排 agent → A2A Card 发现 → 委派部署任务

三者使用同一套底层 API，但暴露方式不同。
人类用 CLI，单个 agent 用 MCP，agent 系统用 A2A。
```

### 5.2 协同矩阵

| 组合 | 协同效果 | 适用场景 | 预估提升 |
|------|---------|---------|---------|
| MCP + Skill | **极强** — 工具 + 操作指南 | Claude Code 日常开发 | +25% 任务完成率 |
| MCP + Rules | **强** — 工具 + 项目规范 | IDE agent 开发 | +15% 代码质量 |
| MCP + CLI | **中** — 结构化 + 灵活性 | 混合场景 | +20% 覆盖率 |
| MCP + A2A | **强** — 单 agent + 多 agent | 企业编排 | 解锁新场景 |
| Skill + CLI | **中** — 指导 + 执行 | Terminal-first agent | +15% 效率 |
| MCP + Skill + Rules | **最强** — 完整栈 | Claude Code 深度集成 | +30% 综合效果 |

### 5.3 "1 + 1 > 2" 的科学依据

为什么协同效果超过简单叠加？

1. **信息互补性**：MCP 提供 "what"（什么工具可用），Skill 提供 "how"（如何正确使用），Rules 提供 "when"（什么场景下使用什么）。三者覆盖了 agent 决策的三个维度。

2. **Context 效率**：Skill 的 progressive disclosure 避免了 MCP 的全量加载问题。Agent 通过 Skill 描述了解 workflow，只按需加载具体 MCP tool。

3. **错误恢复**：我在前一轮评审中指出，agent 遇到 tool error 后最常见行为是"重试同样的调用"。Skill 可以教 agent 正确的错误处理流程，打破这个盲目重试循环。

---

## 6. 评估框架：怎么证明"多格式更好"

### 6.1 核心假设

Agentify 多格式输出策略的核心假设是：

> **H1: 多格式输出使 agent 在更多场景下更有效地使用产品能力**
> **H2: 格式协同使用比单独使用任一格式的效果更好**
> **H3: 自动格式选择比手动配置更高效**

### 6.2 AgentifyBench v2: 多格式评测框架

在前一轮评审中提出的 AgentifyBench 基础上，扩展为多格式评测：

```
AgentifyBench v2 评测维度:

1. Format Coverage Score (格式覆盖度)
   - 给定一个产品，Agentify 能生成多少种有效格式？
   - 每种格式的质量是否达到可用标准？
   - 指标: Valid Format Count / Total Possible Formats

2. Agent Compatibility Matrix (Agent 兼容度)
   - 生成的格式能被多少种 agent 消费？
   - 指标: {agent_type: success_rate} 的覆盖矩阵

3. Format Synergy Score (协同效果)
   - MCP-only vs MCP+Skill vs MCP+Skill+Rules 的任务完成率对比
   - 指标: Task Completion Rate 增量
   - 方法: A/B 测试，控制变量为可用格式组合

4. Context Efficiency Ratio (Context 效率比)
   - 多格式方案 vs 单格式方案的 token 消耗比
   - 指标: Tokens_Used / Task_Completed
   - 期望: 多格式方案的 token 效率更高（因为 progressive disclosure）

5. Discovery-to-Use Latency (发现到使用延迟)
   - 从 "agent 发现产品" 到 "成功执行第一个操作" 的耗时
   - 指标: Time-to-First-Action (秒)
   - 自动配置 vs 手动配置的对比

6. Cross-Agent Portability (跨 Agent 可移植性)
   - 同一产品能力在不同 agent 上的效果一致性
   - 指标: Variance of Task Completion Rate across Agents
   - 期望: 多格式方案降低方差（每个 agent 用最优格式）
```

### 6.3 具体实验设计

**实验 1: 格式对比 (Format A/B Test)**

```
设置:
  - 5 个目标 API (Stripe, GitHub, Slack, Vercel, Supabase)
  - 4 种格式条件: MCP-only, MCP+Skill, MCP+CLI, MCP+Skill+Rules
  - 3 种 agent: Claude Code, ChatGPT, Cursor
  - 每个组合 20 个任务

指标:
  - Task Completion Rate
  - Token Efficiency (tokens/completed_task)
  - Error Recovery Rate
  - Time-to-Completion

预期结果:
  - MCP+Skill 在 Claude Code 上比 MCP-only 高 20-25%
  - MCP+Rules 在 Cursor 上比 MCP-only 高 15-20%
  - ChatGPT 在所有条件下差异较小（因为只能用 MCP）
```

**实验 2: Context 效率 (Progressive Disclosure Test)**

```
设置:
  - 1 个大型 API (GitHub, 312 endpoints)
  - 3 种加载策略: Full, Progressive, Code-Execution
  - 10 个多步骤任务（需要 5+ tool calls）

指标:
  - Context Window Usage (%)
  - Reasoning Quality (LLM-as-Judge)
  - Multi-step Success Rate

预期结果:
  - Full loading 在第 3-4 步后 reasoning 显著下降
  - Progressive 和 Code-Execution 保持稳定
  - Code-Execution 在超过 8 步的任务上最优
```

**实验 3: 协同效果 (Synergy Test)**

```
设置:
  - Stripe API (复杂支付场景)
  - 5 个场景: 创建支付、处理退款、管理订阅、争议处理、Webhook 配置
  - 4 种条件: MCP-only, Skill-only(通过 CLI 执行), MCP+Skill, MCP+Skill+Rules

指标:
  - Task Completion Rate
  - Error Handling Quality (LLM-as-Judge)
  - Best Practice Adherence (人工评审)

预期结果:
  - MCP+Skill 的 Best Practice Adherence 显著高于任何单格式
  - Skill-only 在简单任务上与 MCP-only 持平
  - MCP+Skill+Rules 在复杂多步骤任务上全面领先
```

### 6.4 成功标准

多格式输出策略的成功标准：

| 指标 | 基线 (MCP-only) | 目标 (Multi-format) | 提升幅度 |
|------|----------------|-------------------|---------|
| 平均任务完成率 | ~65% | ~85% | +20pp |
| Token 效率 | ~1,500 tokens/task | ~900 tokens/task | -40% |
| Agent 覆盖率 | 3 种 agent | 6+ 种 agent | +100% |
| 错误恢复率 | ~30% | ~60% | +30pp |
| 发现到使用延迟 | ~5 min (手动) | ~30 sec (自动) | -90% |

---

## 7. 实施建议与优先级

### 7.1 格式实施路线图

```
Phase 0.5 (当前, 1-2 周):
  ✅ MCP Server 生成（已计划）
  🆕 AGENTS.md 自动生成（增量小，价值大）
  🆕 Capability Manifest v0.1

Phase 1 (2-4 周):
  🆕 Skill 生成（Claude Code 专属）
  🆕 CLI wrapper 生成
  🆕 .cursorrules 生成
  升级 Capability Manifest v0.2

Phase 2 (4-8 周):
  🆕 A2A Agent Card 生成
  🆕 SDK 生成 (TypeScript/Python)
  🆕 Format Router 智能选择
  🆕 AgentifyBench v2 评测
  🆕 auto-install 命令
```

### 7.2 Phase 0.5 快速增量：AGENTS.md 生成

AGENTS.md 是最容易增加的格式——它就是 Markdown 文本。Agentify 可以在生成 MCP Server 的同时，自动生成项目 AGENTS.md：

```markdown
# AGENTS.md — Auto-generated by Agentify

## Project Overview
This project provides MCP Server access to the Stripe API.

## Available MCP Tools
- `stripe_create_payment_intent` — Create a new payment intent
- `stripe_get_customer` — Retrieve customer details
- ...

## Common Workflows
### Process a Refund
1. Call `stripe_get_charge` to verify the charge
2. Call `stripe_create_refund` with the charge ID
3. Verify refund status with `stripe_get_refund`

## Best Practices
- Always use idempotency keys for write operations
- Handle rate limits with exponential backoff
- Never log full card numbers
```

成本极低（从已有的 OpenAPI spec 数据生成），但立即让生成的项目对所有 IDE agent 可用。

### 7.3 关键技术风险

| 风险 | 影响 | 缓解策略 |
|------|------|---------|
| 格式爆炸增加维护成本 | 高 | 所有格式从同一 IR 生成，IR 是 single source of truth |
| Skill 格式绑定 Claude 生态 | 中 | Skill 生成是可选的；核心是 MCP + AGENTS.md |
| A2A Protocol 尚不成熟 | 中 | Phase 2 才引入；跟踪 v0.3 → v1.0 进展 |
| 评测框架构建成本高 | 高 | 从 MCP-Bench 开源框架扩展，而非从零构建 |
| 用户不知道该安装什么格式 | 高 | Format Router + auto-install 解决 |

---

## 8. 总结

### 核心结论

1. **多格式输出是科学必然**——agent 消费偏好矩阵清楚表明，没有单一格式覆盖所有场景。MCP 是通用基础，但 Skills、CLI、Rules、A2A 在各自的最优场景下显著优于 MCP。

2. **Skills 和 MCP 不是竞争关系，而是互补关系**——MCP = "给 agent 工具"，Skills = "教 agent 怎么用工具"。两者协同预计提升任务完成率 20-25%。

3. **Context Window 管理是多格式的核心技术挑战**——但也是多格式的核心优势。通过 progressive disclosure + format router，多格式方案的 context 效率反而优于 MCP-only。

4. **Capability Manifest 是发现机制的关键**——一个标准化的元数据文件描述所有可用格式，支持自动发现和自动配置。

5. **可以科学评估**——通过 AgentifyBench v2 的 6 个维度，可以定量证明多格式策略的优势。

### Agentify 的独特定位

如果 Agentify 能实现多格式输出，它的定位从 "MCP Server 生成器"（有竞品，如 Stainless、Speakeasy）升级为 **"产品 Agent 化的完整翻译层"**——这个定位目前无竞品覆盖。一个 OpenAPI spec 输入，产出覆盖所有主流 agent 生态的格式组合，这就是 "The Meta-Tool that makes every product Agent-Native" 的真正含义。

---

## 参考来源

### Skills & MCP
- [Skills explained: How Skills compares to prompts, Projects, MCP, and subagents](https://claude.com/blog/skills-explained)
- [Extending Claude's capabilities with skills and MCP](https://claude.com/blog/extending-claude-capabilities-with-skills-mcp-servers)
- [Claude Skills vs. MCP: A Technical Comparison for AI Workflows](https://intuitionlabs.ai/articles/claude-skills-vs-mcp)
- [MCP, Skills, and Agents](https://cra.mr/mcp-skills-and-agents/)
- [Skills vs MCP tools for agents: when to use what](https://www.llamaindex.ai/blog/skills-vs-mcp-tools-for-agents-when-to-use-what)
- [MCP vs Agent Skills: Why They're Different, Not Competing](https://dev.to/phil-whittaker/mcp-vs-agent-skills-why-theyre-different-not-competing-2bc1)

### CLI vs MCP
- [Why CLI is the New MCP for AI Agents](https://oneuptime.com/blog/post/2026-02-03-cli-is-the-new-mcp/view)
- [Why CLIs Beat MCP for AI Agents](https://jannikreinhard.com/2026/02/22/why-cli-tools-are-beating-mcp-for-ai-agents/)
- [CLI-Agent vs MCP: A Practical Comparison](https://dev.to/girma35/cli-agent-vs-mcp-a-practical-comparison-for-students-startups-and-developers-4com)

### Progressive Disclosure
- [Progressive Disclosure Might Replace MCP](https://www.mcpjam.com/blog/claude-agent-skills)
- [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [Building an internal agent: Progressive disclosure and handling large files](https://lethain.com/agents-large-files/)

### Agent Instruction Formats
- [AGENTS.md: One File to Guide Them All](https://layer5.io/blog/ai/agentsmd-one-file-to-guide-them-all/)
- [AGENTS.md Cross-Tool Unified Management Guide](https://smartscope.blog/en/generative-ai/github-copilot/github-copilot-agents-md-guide/)
- [Cursor Rules Documentation](https://cursor.com/docs/context/rules)
- [Extend Claude with skills](https://code.claude.com/docs/en/skills)

### A2A Protocol
- [Announcing the Agent2Agent Protocol (A2A)](https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/)
- [Agent2Agent protocol (A2A) is getting an upgrade](https://cloud.google.com/blog/products/ai-machine-learning/agent2agent-protocol-is-getting-an-upgrade)
- [A2A Protocol Specification](https://a2a-protocol.org/latest/specification/)

### Agent SDKs
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview)
- [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/)
- [GPT Actions vs MCP](https://fast.io/resources/gpt-actions-vs-mcp/)

### Benchmarks
- [MCP-Bench (Accenture)](https://github.com/Accenture/mcp-bench)
- [MCP-AgentBench](https://arxiv.org/pdf/2509.09734)
- [OSWorld-MCP](https://openreview.net/forum?id=rceD6wwt4B)
