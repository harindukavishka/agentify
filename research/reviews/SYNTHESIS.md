# 七人评审团综合分析

> 日期: 2026-03-02
> 评审人: 老派开发者、运维工程师、安全研究员、Agent 科学家、创业者、编排大师、Vibe Coder

---

## 一、共识发现（5/7+ 专家同意）

### 1. MVP 范围必须大幅缩减
- **共识度: 7/7**
- 原计划 Phase 1（4-6 周，7 包 monorepo）不现实
- 新目标：**1-2 周内发布 `npx agentify <openapi-url>`**
- 单包 `agentify`，不要 monorepo
- 砍掉 Phase 1 中的：Capability Graph 引擎、Plugin 系统、独立 validator 包、独立 templates 包

### 2. 安全是 Day 1 需求，不是 Phase 3
- **共识度: 6/7**（hacker + ops + agent-scientist + entrepreneur + orchestration-master + old-school-dev）
- OpenAPI Spec 输入必须做 sanitization
- 生成的代码必须做安全扫描
- 产品计划的"风险"章节必须加入安全风险

### 3. 生成策略不能"一个 endpoint 一个 tool"
- **共识度: 5/7**（agent-scientist + orchestration-master + old-school-dev + vibe-coder + entrepreneur）
- 大型 API（100+ endpoints）会爆 context window（GitHub MCP = 93 tools = 55K tokens）
- 需要分层策略：小型直接生成、中型 Tool Search、大型 Code Execution 模式
- **这是核心智能，不是可选功能**

### 4. 生成物必须"production-ready"
- **共识度: 5/7**（ops + hacker + old-school-dev + vibe-coder + entrepreneur）
- 生成的 MCP Server 必须包含：Dockerfile、健康检查、结构化日志、.env.example
- 不能只生成代码——要生成可运行的项目

### 5. DX 是生死线
- **共识度: 5/7**（vibe-coder + entrepreneur + old-school-dev + orchestration-master + agent-scientist）
- 一条命令搞定：`npx agentify <url>`
- 不要 3 步流程（analyze → generate → score）
- 30 秒内必须有 wow moment

---

## 二、分歧与张力

### 张力 1: 简化 vs 前瞻
| 简化派（4 人） | 前瞻派（2 人） |
|---------------|---------------|
| 砍掉 Graph，用扁平数据结构 | Capability Graph 是长期差异化 |
| 砍掉 Plugin，硬编码一切 | Plugin 架构防止技术债 |
| 批处理就够了 | Agent 需要实时交互（Elicitation） |

**调和方案:** Phase 0.5（1-2 周）用扁平结构快速发布，Phase 1（4 周）引入轻量 Graph。Plugin 推迟到有 2+ 输入源时再做。Elicitation 作为 Phase 1 的"亮点特性"而非必须。

### 张力 2: Tool Description 质量 vs 发布速度
| 快速派 | 质量派 |
|--------|--------|
| 先发布，description 后优化 | 差的 description = 不可用的 MCP Server |

**调和方案:** Phase 0.5 从 OpenAPI spec 直接提取 description（已有质量），加基础优化（长度限制、格式规范）。LLM 辅助优化放 Phase 1。

### 张力 3: 开源核心 vs 商业壁垒
| 开源路线 | 商业路线 |
|---------|---------|
| 全开源建 mindshare | 核心开源 = 无护城河 |

**调和方案:** 核心生成引擎开源。付费点：hosted 版本（Vercel 模式）+ 批量评估 + 企业安全。但 Day 1 不用想商业化——先证明产品价值。

---

## 三、按优先级排列的改进项

### P0: Phase 0.5 必须做（发布前 1-2 周）

| # | 改进项 | 来源 | 影响 |
|---|--------|------|------|
| 1 | 单包结构（`agentify`），砍掉 monorepo | 老派开发者 + Vibe Coder + 创业者 | 架构 |
| 2 | 一条命令体验：`npx agentify <openapi-url>` | 全员共识 | DX |
| 3 | 输入 Sanitization（OpenAPI spec 字段过滤） | Hacker | 安全 |
| 4 | 分层生成策略（小/中/大 API 不同方案） | Agent 科学家 | 核心功能 |
| 5 | 生成项目包含 Dockerfile + .env.example + README | 运维 | 可用性 |
| 6 | 用扁平 IR 替代 Capability Graph（Phase 0.5） | 老派开发者 | 简化 |
| 7 | 生成代码安全扫描（基础正则 + 禁用 eval/exec） | Hacker | 安全 |
| 8 | Tool description 基础优化（长度、格式、examples） | Agent 科学家 | 质量 |

### P1: Phase 1 应加入（发布后 2-4 周）

| # | 改进项 | 来源 | 影响 |
|---|--------|------|------|
| 9 | Agentify 自身 MCP Server（扩展到 10+ tools） | 编排大师 | Dog-fooding |
| 10 | MCP Elicitation 支持（agent 中间交互） | 编排大师 | 差异化 |
| 11 | CI/CD（GitHub Actions + npm publish） | 运维 | 工程 |
| 12 | 健康检查 + 结构化日志（生成物） | 运维 | 可靠性 |
| 13 | 产品计划加入安全风险章节 | Hacker | 文档 |
| 14 | Agent 框架集成文档（LangChain/CrewAI） | 编排大师 | 生态 |
| 15 | Readiness Score v1 | 创业者 | 差异化 |
| 16 | 轻量 Capability Graph（可选，SQLite） | 编排大师 + Agent 科学家 | 数据 |

### P2: Phase 2 考虑

| # | 改进项 | 来源 |
|---|--------|------|
| 17 | MCP Apps 生成（交互式 UI） | 编排大师 |
| 18 | A2A Protocol 支持（提前到 Phase 2） | 编排大师 |
| 19 | LLM 辅助 description 优化 | Agent 科学家 |
| 20 | Plugin 架构 | 老派开发者（延期） |
| 21 | AgentifyBench 评估框架 | Agent 科学家 |
| 22 | Viral 机制（badges, --publish, leaderboard） | Vibe Coder |

---

## 四、修订后的产品路线图

### Phase 0.5: "One Command" MVP（1-2 周）
```
npx agentify <openapi-url>
  → 解析 OpenAPI spec（带 sanitization）
  → 智能选择生成策略（按 endpoint 数量）
  → 生成 standalone MCP Server 项目
    - TypeScript 源码
    - Dockerfile
    - .env.example
    - README.md
    - 基础安全扫描通过
  → 输出: 一个可直接 `npm start` 运行的目录
```

**技术选型修订:**
- 单包 `agentify`（不要 monorepo）
- 扁平 IR（ParsedProduct → ParsedCapability[]），不要 Graph
- Handlebars 模板生成（移除 ts-morph）
- `tsx` 运行时（不依赖 Node 22 实验特性）
- Zod 验证输入
- MCP 官方 SDK

**发布标准:**
- `npx agentify https://petstore3.swagger.io/api/v3/openapi.json` 能生成可运行的 MCP Server
- 安全扫描通过
- 3 个知名 API 的 demo（Petstore, Stripe, GitHub）

### Phase 1: Enhancement（2-4 周）
- Agentify 自身 MCP Server
- MCP Elicitation（交互式端点选择）
- Readiness Score
- CI/CD + npm publish
- Agent 框架集成文档
- LLM 辅助 description 优化

### Phase 2: Scale（4-8 周）
- 多输入源（GraphQL, 文档）
- MCP Apps 生成
- A2A 支持
- Plugin 架构
- 轻量 Capability Graph（SQLite）
- Viral 机制

---

## 五、被否决的原方案元素

| 原方案 | 否决原因 | 替代方案 |
|--------|---------|---------|
| 7 包 Turborepo monorepo | 过早、DX 杀手 | 单包 agentify |
| Capability Graph 引擎 | Phase 0.5 过重 | 扁平 IR，Phase 2 引入 |
| ts-morph 代码生成 | 15MB 依赖，不必要 | Handlebars 模板 |
| Plugin 系统 | 一个输入源时无意义 | Phase 2 引入 |
| 独立 validator 包 | 过早拆分 | 集成在主包中 |
| Phase 3 才做安全 | 安全是 Day 1 | Phase 0.5 就做基础安全 |
| $29-99/mo 定价 | 定价死亡区间 | 先不考虑，证明价值先行 |

---

## 六、30 天成功指标（修订）

| 指标 | 目标 |
|------|------|
| 发布时间 | 2 周内 |
| GitHub Stars（30 天） | 500+ |
| npm 周下载量 | 200+ |
| 成功转换的 API demo | 10+ |
| HN 首页 | 1 次 |
| 社区反馈收集 | 50+ issues/discussions |
