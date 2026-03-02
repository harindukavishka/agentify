# Agentify Vision v2: Agent Interface Compiler

> 版本: v2.0 | 日期: 2026-03-02
> 基于: 4 份调研 + 7 份专家评审 + 2 份 UX 研究 + 7 份愿景探索 + 4 个用户故事

---

## 一句话定位

**"One command. Every agent speaks your product."**

Agentify 是一个 **Agent Interface Compiler**——从一个 source of truth（OpenAPI Spec）编译出产品在 Agent 时代需要的所有接口格式。

---

## 核心理念

### 产品能力的"全息投影"

传统产品只有一个面——GUI。Agent 时代，同一个产品能力需要投射到多个消费面：

```
                    ┌─── MCP Server ──→ Claude / ChatGPT / Gemini
                    ├─── MCP Resources ──→ Agent 读取数据
                    ├─── MCP Prompts ──→ 预制 workflow
                    ├─── Skills (.md) ──→ Claude Code / Codex
传统产品            ├─── CLI wrapper ──→ 终端 Agent / Devin
  (OpenAPI) ──→    ├─── CLAUDE.md ──→ Claude Code 项目上下文
  Agentify         ├─── AGENTS.md ──→ 通用 Agent 指令
                    ├─── .cursorrules ──→ Cursor IDE
                    ├─── llms.txt ──→ LLM 可读文档
                    ├─── A2A Card ──→ Agent 发现与协作
                    └─── Config files ──→ Dockerfile, .env, etc.
```

### 为什么多格式不是膨胀

| 误解 | 事实 |
|------|------|
| "MCP 就够了" | MCP+Skill 协同 → +25% 任务完成率（Agent 科学家测算） |
| "多格式会爆 context" | 多格式 progressive loading 仅 1.7% context vs MCP-only 的 18% |
| "工程量太大" | 共享同一 IR，每新增格式仅 200-600 行增量代码 |
| "没人做说明没需求" | Speakeasy 多格式输出定价 $250+/mo，L4 产品目前不存在 = 蓝海 |

### 五级产品成熟度模型

```
L0: Human-only (GUI)        ← 大多数 SaaS
L1: API available            ← 大多数 B2B SaaS
L2: MCP ready                ← GitHub, Notion, Stripe
L3: Agent-friendly           ← Cloudflare (Code Mode)
L4: Agent-native (全接口套件)  ← 目前不存在 → Agentify 的目标
```

**Agentify 的使命：让任何 L1+ 产品一键升级到 L4。**

---

## 二、整体架构

### Compiler 模型

```
┌──────────────────────────────────────────────────────┐
│                     Agentify                          │
│                                                       │
│   ┌─────────┐    ┌──────────────┐    ┌────────────┐  │
│   │ Frontend │    │     IR       │    │  Backends  │  │
│   │ (Parser) │───→│ (Canonical   │───→│ (Emitters) │  │
│   │          │    │  Capability) │    │            │  │
│   │ OpenAPI  │    │              │    │ MCP Server │  │
│   │ GraphQL  │    │ Product      │    │ Skills     │  │
│   │ Docs     │    │  └─Domain    │    │ CLI        │  │
│   │ CLI help │    │    └─Cap[]   │    │ CLAUDE.md  │  │
│   │ UI crawl │    │      ├─input │    │ .cursorrules│  │
│   │          │    │      ├─output│    │ A2A Card   │  │
│   │          │    │      ├─auth  │    │ llms.txt   │  │
│   │          │    │      └─meta  │    │ Config     │  │
│   └─────────┘    └──────────────┘    └────────────┘  │
│                                                       │
│   ┌─────────────────────────────────────────────────┐ │
│   │              Cross-cutting Concerns              │ │
│   │  Security (sanitize) │ Strategy (small/med/large)│ │
│   │  Description Optimizer │ Format Router           │ │
│   └─────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

### IR（中间表示）设计

Phase 0.5 使用扁平结构，但从 Day 1 为多格式设计：

```typescript
interface AgentifyIR {
  product: ProductMeta          // 产品元信息
  domains: Domain[]             // 能力域分组
  capabilities: Capability[]    // 核心能力列表
  auth: AuthConfig              // 认证配置
  strategy: GenerationStrategy  // 生成策略 (small/medium/large)
}

interface Capability {
  id: string
  domain: string
  name: string
  description: string           // 人类可读描述
  agentDescription: string      // Agent 优化描述
  operation: OperationType      // CRUD + custom
  input: SchemaDefinition
  output: SchemaDefinition
  auth: AuthRequirement
  sideEffects: boolean
  idempotent: boolean
  examples: Example[]
  tags: string[]
}
```

### 生成策略（分层）

| API 规模 | Endpoint 数 | MCP 策略 | Skills 策略 | CLI 策略 |
|---------|------------|---------|------------|---------|
| 小型 | <30 | 每 endpoint 一个 tool | 按 domain 分 Skill | 全部生成 |
| 中型 | 30-100 | Tool Search + Lazy Load | 按 domain 分 Skill | 高频操作 |
| 大型 | 100+ | Code Execution + Docs | 按 workflow 分 Skill | 核心操作 |

---

## 三、Milestone 路线图

### Milestone 0: Foundation（第 1 周）

**目标：** 搭建项目骨架，让 `npx agentify <url>` 能跑通最简流程

```
输入: OpenAPI URL
输出: 单个 MCP Server 项目（最小可运行版本）
```

**交付物：**
- [ ] 项目脚手架（单包 `agentify`）
- [ ] OpenAPI Parser（支持 3.0/3.1，带 input sanitization）
- [ ] IR 数据结构（为多格式设计，但只实现 MCP emitter）
- [ ] MCP Server Emitter（Template-Based，小型 API 策略）
- [ ] 基础安全扫描（禁 eval/exec，字段净化）
- [ ] `npx agentify <url>` CLI 入口
- [ ] 生成物包含 Dockerfile + .env.example + README
- [ ] 3 个 demo（Petstore, Stripe, GitHub）
- [ ] 基础测试覆盖

**技术验证：** `npx agentify https://petstore3.swagger.io/api/v3/openapi.json` 生成可运行 MCP Server

---

### Milestone 1: Multi-Format MVP（第 2-3 周）

**目标：** 证明"一个 IR → 多格式输出"的核心价值主张

```
输入: OpenAPI URL
输出: MCP Server + Skills + CLAUDE.md + .cursorrules + llms.txt
```

**交付物：**
- [ ] Skills Emitter（按 domain 分组生成 SKILL.md）
- [ ] CLAUDE.md Emitter（项目级 Agent 上下文）
- [ ] .cursorrules Emitter（Cursor IDE 规则）
- [ ] llms.txt Emitter（LLM 可读文档）
- [ ] AGENTS.md Emitter（通用 Agent 指令）
- [ ] 输出目录结构：`<product>-agent-suite/`
- [ ] `--format` 选项支持格式选择
- [ ] Description Optimizer v1（长度限制 + 格式规范 + examples 提取）
- [ ] MCP Resources 支持（GET endpoints 自动映射）

**价值验证：** 同一个 `agentify transform` 命令的输出被 Claude Desktop（MCP）、Claude Code（Skills）、Cursor（.cursorrules）三个 agent 成功使用

---

### Milestone 2: Intelligence Layer（第 4-5 周）

**目标：** 加入智能策略和交互能力

```
新增: 分层生成策略 + Readiness Score + MCP Prompts
```

**交付物：**
- [ ] 中型 API 策略（Tool Search + Lazy Loading）
- [ ] 大型 API 策略（Code Execution + Docs Search）
- [ ] Readiness Score 算法 v1（0-100 评分）
- [ ] MCP Prompts Emitter（预制 workflow 模板）
- [ ] CLI wrapper Emitter（高频操作的 shell 命令）
- [ ] LLM 辅助 Description Optimization
- [ ] `agentify score <url>` 命令
- [ ] `agentify preview` 本地预览服务

**价值验证：** 大型 API（GitHub 200+ endpoints）成功使用 Code Execution 策略，context 占用 <3%

---

### Milestone 3: Self-Serve & Ecosystem（第 6-8 周）

**目标：** Agentify 自身 Agent-Native 化 + 生态建设

```
新增: Dog-fooding MCP Server + Publish + Plugin 架构
```

**交付物：**
- [ ] Agentify 自身 MCP Server（10+ tools: analyze, transform, score, preview, suggest_strategy...）
- [ ] Agentify Skill（教 agent 如何使用 Agentify）
- [ ] Agentify CLI 完善（`agentify transform`, `agentify score`, `agentify preview`, `agentify publish`）
- [ ] `agentify publish` 一键发布（MCP→Smithery, CLI→npm, Skills→registry）
- [ ] Output Plugin 接口（OutputEmitter interface）
- [ ] A2A Agent Card Emitter
- [ ] Format Router（根据产品特征建议最佳格式组合）
- [ ] agentify.json Capability Manifest

**价值验证：** Claude Code 通过 Agentify 的 MCP Server 自动分析一个陌生产品并为自己生成 Skills（"meta" loop）

---

### Milestone 4: Scale & Enterprise（第 9-14 周）

**目标：** 企业级特性 + 规模化

```
新增: 批量转换 + 增量更新 + 企业安全
```

**交付物：**
- [ ] `agentify batch` 批量转换
- [ ] 增量更新（Spec Diff → Per-Format Update）
- [ ] Cross-Format Consistency 测试
- [ ] 企业安全（SSRF 防护, RBAC, audit log）
- [ ] Output Manifest（agentify-output.json）运维自动化
- [ ] Drift Detection（格式过期检测 + alert）
- [ ] GraphQL Ingestor（第二个 Frontend）
- [ ] 社区 Plugin 生态

---

## 四、格式优先级矩阵

基于工程成本、用户价值、差异化程度的综合评估：

| 格式 | Milestone | 工程量 | 用户价值 | 差异化 | 理由 |
|------|-----------|--------|---------|--------|------|
| **MCP Server (Tools)** | M0 | 高 | 极高 | 低（竞品多） | 基础，必须有 |
| **Skills (.md)** | M1 | 低 | 极高 | 极高 | 无竞品做 OpenAPI→Skills |
| **CLAUDE.md** | M1 | 极低 | 高 | 高 | 文本模板，几乎免费 |
| **.cursorrules** | M1 | 极低 | 高 | 高 | 同上 |
| **llms.txt** | M1 | 极低 | 中 | 中 | 新标准，易实现 |
| **AGENTS.md** | M1 | 极低 | 中 | 中 | 同上 |
| **MCP Resources** | M1 | 低 | 中 | 低 | GET→Resource 映射简单 |
| **MCP Prompts** | M2 | 中 | 高 | 中 | 需要理解 workflow |
| **CLI wrapper** | M2 | 中 | 高 | 中 | 需要参数映射 |
| **Readiness Score** | M2 | 中 | 高 | 极高 | 独特卖点 |
| **A2A Card** | M3 | 低 | 中 | 高 | 协议还在早期 |
| **agentify.json** | M3 | 低 | 中 | 极高 | 定义新标准 |
| **Webhook config** | M4 | 中 | 中 | 低 | 需要 AsyncAPI |
| **SDK snippets** | M4+ | 高 | 低 | 低 | Speakeasy 领地，避开 |

**核心节奏：** M0 做 MCP（证明能跑），M1 做 Skills+Docs（证明多格式价值），M2 做智能（证明不只是模板），M3 做 meta（自举），M4 做规模。

---

## 五、用户体验（终极形态）

### 基础体验

```bash
# 一条命令，全部输出
$ npx agentify transform https://api.stripe.com/openapi.json

🔍 Analyzing Stripe API...
  ├── 184 endpoints detected → Large API strategy
  ├── 12 domains identified (Payments, Customers, Subscriptions...)
  ├── Auth: Bearer Token (API Key)
  └── Agent-Readiness Score: 78/100

⚡ Generating agent interfaces...
  ├── ✅ MCP Server (Code Execution + Docs Search mode)
  ├── ✅ Skills × 12 (one per domain)
  ├── ✅ CLAUDE.md
  ├── ✅ .cursorrules
  ├── ✅ AGENTS.md
  ├── ✅ llms.txt
  └── ✅ MCP Resources × 34

📁 Output: stripe-agent-suite/
🔒 Security scan: PASSED
⏱️ Total: 8.2s

Next steps:
  cd stripe-agent-suite
  agentify preview     # 本地预览所有格式
  agentify publish     # 一键发布到各平台
```

### Meta 体验（Agent 自助）

```
Claude Code:
> "我需要集成 PayNow 支付网关，但它没有 MCP Server"

[Claude Code 调用 Agentify MCP Server]
→ analyze_product("https://api.paynow.com/docs")
→ suggest_strategy() → "Medium API, recommend MCP + Skills"
→ transform({ formats: ["mcp", "skills", "claude-md"] })
→ 自动安装生成的 MCP Server 和 Skills
→ 立即开始使用 PayNow
```

---

## 六、商业模式

| 层级 | 内容 | 价格 |
|------|------|------|
| **Free** | MCP Server 生成（开源核心） | $0 |
| **Pro** | 全格式输出 + Readiness Score + Publish + Sync | $99-199/mo |
| **Enterprise** | 批量转换 + 企业安全 + SLA + 自定义格式 | Custom |

**GTM 路径：**
1. 开源 MCP 生成器 → GitHub Stars + npm downloads
2. M1 发布多格式 → "One command, every agent" 叙事 → HN/PH launch
3. Pro 版本 → API-first 公司付费
4. Enterprise → 企业批量转换

---

## 七、竞争定位

```
                       多格式输出
                         ↑
                         │
              Agentify ★ │
                         │    Speakeasy ($250+/mo)
                         │       ★ (SDK+MCP+Terraform)
                         │
    ─────────────────────┼──────────────────→ 智能策略
                         │
          Stainless ★    │    Manufact ★
          (MCP only)     │    (MCP + SDK)
                         │
               FastMCP ★ │
          (Python MCP)   │
```

**Agentify 独占左上象限：多格式 + Agent-Native 智能。**

---

## 八、成功指标

| Milestone | 时间 | 核心指标 |
|-----------|------|---------|
| M0 | 第 1 周 | `npx agentify <url>` 能生成可运行 MCP Server |
| M1 | 第 3 周 | 5 种格式输出，GitHub 500+ stars |
| M2 | 第 5 周 | 大型 API 支持，npm 1000+ 周下载 |
| M3 | 第 8 周 | 自举完成，HN 首页 |
| M4 | 第 14 周 | 企业客户 3+，Pro 付费 30+ |

---

## 附录：关键参考

- 用户故事: `research/ux-story/user-stories.md`
- 20 种输出格式全景: `research/ux-story/output-formats.md`
- Agent 消费模式: `research/ux-story/agent-consumption-patterns.md`
- 愿景探索（7 份）: `research/vision-explore/`
- 第一轮评审（7 份）: `research/reviews/`
- 原始调研（4 份）: `research/agent-native/`, `traditional-products/`, `market-analysis/`, `architecture/`
