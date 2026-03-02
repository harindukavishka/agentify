# Agentify 产品计划评审：Agent 编排视角

> 评审人：Agent 编排大师（MCP Protocol / A2A / LangGraph / CrewAI / Claude Code Agent Teams 专家）
> 日期：2026-03-02
> 身份：每天实际编排 multi-agent workflows 的一线实践者

---

## 总体评价

Agentify 的定位——"The Meta-Tool that makes every product Agent-Native"——在 2026 年 3 月这个时间点是 **精准且稀缺的**。Capability Graph 作为中间表示的设计决策非常正确。但从一个每天编排数十个 agent、管理数百个 MCP server 的实践者视角看，当前计划在 **agent 交互模式、框架集成、composability** 三个维度存在显著盲区。

**核心问题：当前计划是用 2024 年的思维在做 2026 年的产品。** 它把 Agentify 当作一个 "代码生成器"，而实际上 agent 需要的是一个 **实时协作伙伴**。

---

## 一、Dog-fooding MCP Server 设计严重不足

### 现状诊断

产品计划中定义了 5 个 tools（`analyze_product`、`assess_readiness`、`generate_mcp_server`、`preview_capabilities`、`validate_mcp_server`）。这对于一个号称 "meta-tool" 的产品来说远远不够。

### 问题

一个 agent 用 Agentify 的典型 workflow 是：

```
1. 拿到一个 OpenAPI spec URL
2. 分析产品能力
3. 看一下有哪些 endpoint，决定暴露哪些
4. 对比一下市面上已有的同类 MCP server
5. 选择生成策略（全量 vs 精选 vs Stainless 双工具模式）
6. 生成 MCP server
7. 生成的 tool descriptions 可能不够好，需要优化
8. 验证生成结果
9. 打包发布
```

当前的 5 个 tools 只覆盖了步骤 1、2、3、6、8。步骤 4、5、7、9 完全缺失。

### 建议增加的 Tools

| Tool | 功能 | 为什么需要 |
|------|------|-----------|
| `suggest_transformation_strategy` | 根据 API 复杂度、endpoint 数量、auth 模式推荐最佳转换策略 | Agent 不知道该用 template-based、runtime dynamic、还是 Stainless 双工具模式 |
| `compare_with_existing_mcp` | 对比目标产品是否已有 MCP server，分析差异和改进空间 | 18,000+ MCP servers 已存在，agent 需要知道是否在重复造轮子 |
| `generate_tool_descriptions` | 为生成的 tools 优化 descriptions，确保 agent-friendly | Tool description 质量直接决定 agent 能否正确调用，这是一个独立的优化步骤 |
| `customize_capability_selection` | 从 Capability Graph 中选择/过滤要暴露的 capabilities | 不是每个 endpoint 都应该成为 tool，agent 需要能做 selective exposure |
| `estimate_complexity` | 评估转换的复杂度和潜在风险 | Agent 在开始前需要知道这个任务有多难 |
| `package_for_distribution` | 打包生成的 MCP server，准备发布到 Smithery/npm | 生成代码只是第一步，分发才是最后一公里 |
| `explain_capability_graph` | 用自然语言解释 Capability Graph 的结构和关系 | Agent 需要向人类用户解释分析结果 |
| `diff_versions` | 对比两个版本的 Capability Graph / 生成代码的差异 | API 会迭代，agent 需要理解变更 |

### 同时需要增加的 Resources

目前计划中完全没有提到 MCP Resources。一个好的 meta-tool MCP Server 应该暴露：

| Resource | URI 模式 | 用途 |
|----------|---------|------|
| 产品分析报告 | `agentify://reports/{product-id}` | Agent 可以随时查阅之前的分析结果 |
| Capability Graph | `agentify://graphs/{graph-id}` | 直接读取图谱数据作为 context |
| 转换模板列表 | `agentify://templates` | Agent 了解可用的代码模板 |
| 生成历史 | `agentify://history/{product-id}` | 追溯和对比历史生成结果 |
| 最佳实践指南 | `agentify://guides/{topic}` | Agent 内嵌的 MCP best practices 知识 |

### Prompts 也不能缺

| Prompt | 触发场景 | 作用 |
|--------|---------|------|
| `full_transformation_workflow` | 用户说 "帮我把这个 API 变成 MCP server" | 端到端引导 |
| `readiness_audit` | 用户说 "评估一下这个产品" | 结构化评估流程 |
| `optimization_review` | 生成后优化 | 检查 tool descriptions、schema 质量、安全性 |

**底线：一个 meta-tool 的 MCP Server 应该有 10-15 个 tools、5+ resources、3+ prompts。4 个 tools 是 MVP 中的 MVP。**

---

## 二、实时交互 vs 批处理：MCP Elicitation 是关键缺失

### 现状诊断

当前设计是纯 batch 模式：输入 spec → 输出代码文件。但真实的 agent workflow 需要大量的 **中间决策点**。

### 问题场景

```
Agent: "分析 Stripe 的 OpenAPI spec"
Agentify: "发现 247 个 endpoints，分为 Payments、Billing、Connect 等 12 个域..."
Agent: "太多了，让用户选择要暴露哪些域"
[这里需要一个交互点让人类选择]
Agentify: "用户选了 Payments 和 Billing，共 43 个 endpoints"
Agent: "其中有些 endpoint 需要 Connect 权限，怎么处理？"
[又需要一个决策点]
```

### MCP Elicitation 的机会

MCP Elicitation（2025-06-18 spec 引入）让 MCP Server 可以在执行过程中 **暂停并向 Client 请求额外信息**。这完美匹配 Agentify 的需求：

```typescript
// 在 generate_mcp_server tool 执行过程中
const domainSelection = await server.elicit({
  message: "该产品有 12 个功能域，请选择要暴露的域",
  requestedSchema: {
    type: "object",
    properties: {
      selectedDomains: {
        type: "array",
        items: {
          type: "string",
          enum: ["payments", "billing", "connect", ...]
        },
        description: "选择要转换为 MCP tools 的功能域"
      },
      strategy: {
        type: "string",
        enum: ["template-based", "runtime-dynamic", "stainless-dual"],
        description: "选择代码生成策略"
      }
    }
  }
})
```

### 具体建议

1. **Phase 1 就应该集成 Elicitation**，不要等到 Phase 2
2. 在以下关键节点插入 Elicitation：
   - Capability 选择（哪些 endpoints 要暴露）
   - 策略选择（生成模式）
   - 冲突解决（schema collision、命名冲突）
   - Auth 配置（OAuth scope、API key 位置）
   - 验证失败时的修复决策
3. Elicitation 的 URL mode 可以用于 OAuth flow——当需要验证目标 API 的访问权限时，将用户重定向到 OAuth 授权页面

### 重要性评级：CRITICAL

**不集成 Elicitation 的 Agentify 就像一个只能单选题不能多选题的考试系统。** Agent 在实际使用中需要大量的 human-in-the-loop 决策，Elicitation 是 MCP 协议原生支持这一点的方式。

---

## 三、MCP Apps：从代码生成器到交互式平台的跃迁

### 现状诊断

产品计划中提到了 MCP Apps（`paradigms.md` 第 177-191 行），但没有将其纳入产品路线图。这是一个重大遗漏。

### MCP Apps 对 Agentify 的意义

MCP Apps（SEP-1865，2026-01-26 正式发布）让 MCP tool 可以返回 **交互式 UI 组件**（HTML + sandboxed iframe）。已被 Claude、ChatGPT、VS Code、Goose 支持。

对 Agentify 来说，这意味着两个层面的机会：

#### 层面 1：Agentify 自身生成 MCP Apps（而不仅仅是 MCP Server）

```
当前：Agentify → 生成 MCP Server（tools only）
升级：Agentify → 生成 MCP Apps（tools + interactive UI）
```

想象一下：agent 调用 Agentify 为 Stripe 生成 MCP server，生成结果不仅包含 tools，还包含：
- 一个可视化的 **Capability Graph 浏览器**（在 chat 中渲染的 interactive graph）
- 一个 **API 测试面板**（直接在对话中测试生成的 tools）
- 一个 **配置表单**（让用户微调 tool descriptions、auth 设置）

这将把 "生成代码文件" 升级为 "生成可交互的 agent 能力包"。

#### 层面 2：Agentify 自身的 MCP Server 应该是一个 MCP App

`preview_capabilities` tool 返回文本描述不够直观。它应该返回一个 interactive Capability Graph visualization：

```typescript
// 返回 MCP App UI 而非纯文本
{
  content: [
    {
      type: "resource_link",
      uri: "ui://agentify/capability-graph",
      // 渲染一个交互式图谱，用户可以点击节点查看详情、拖拽选择要暴露的能力
    }
  ]
}
```

### 建议

| 时间 | 行动 |
|------|------|
| Phase 1 | Agentify 自身的 `preview_capabilities` 和 `assess_readiness` 返回 MCP App UI |
| Phase 2 | 生成的 MCP Server 可选 MCP App 模式（带 UI 组件） |
| Phase 3 | 完整的 MCP App 生成 pipeline（forms, dashboards, workflows） |

### 重要性评级：HIGH

MCP Apps 正在快速成为 MCP 生态的标配。6 个月后，不支持 MCP App 输出的工具会显得过时。

---

## 四、与 Agent 框架的集成：当前计划最大的盲区

### 现状诊断

产品计划完全没有提到如何与 LangChain/LangGraph、CrewAI、AutoGen 等主流 agent 框架集成。这些框架的用户是 Agentify 最直接的目标群体。

### 现实情况

截至 2026 年 3 月：

| 框架 | MCP 集成状态 | 用户基数 |
|------|-------------|---------|
| **LangChain/LangGraph** | `langchain-mcp-adapters` 库，`MultiServerMCPClient` 类，LangSmith 每个 agent 自动暴露 MCP endpoint | 最大 |
| **CrewAI** | 1.0 GA 原生 MCP 支持，`MCPServerAdapter`，支持 stdio/SSE/Streamable HTTP | 快速增长 |
| **AutoGen** | `autogen_ext.tools.mcp` 模块，`McpWorkbench`、`StdioMcpToolAdapter`、`SseMcpToolAdapter` | 企业级 |
| **OpenAI Agents SDK** | 原生 MCP 支持 | 巨大 |

### Agentify 应该做什么

#### 4.1 生成的 MCP Server 应该附带框架集成配置

```
generated-mcp-server/
├── src/                    # MCP Server 源码
├── integrations/
│   ├── langchain.py        # LangChain adapter 配置
│   ├── crewai.py           # CrewAI agent 配置
│   ├── autogen.py          # AutoGen workbench 配置
│   └── claude-code.json    # Claude Code MCP 配置
├── examples/
│   ├── langchain-agent.py  # 使用该 MCP server 的 LangChain agent 示例
│   ├── crewai-crew.py      # CrewAI multi-agent 示例
│   └── autogen-team.py     # AutoGen team 示例
└── README.md
```

#### 4.2 Agentify 自身应提供框架适配 tool

```typescript
// Tool: generate_framework_integration
{
  name: "generate_framework_integration",
  description: "Generate integration code for a specific agent framework",
  inputSchema: {
    mcpServerDir: "string",
    framework: "langchain | crewai | autogen | openai-agents | claude-code",
    options: {
      includeExamples: "boolean",
      multiAgent: "boolean"  // 是否生成 multi-agent 示例
    }
  }
}
```

#### 4.3 Capability Graph 应该可以直接导出为框架工具定义

不经过 MCP Server 中间层，直接从 Capability Graph 生成框架原生工具：

```
Capability Graph → LangChain Tool[] (直接)
Capability Graph → CrewAI Tool[] (直接)
Capability Graph → MCP Server → 再被框架消费 (间接，当前唯一路径)
```

直接路径对于已经深度使用特定框架的用户更友好。

### 重要性评级：CRITICAL

**LangChain + CrewAI + AutoGen 的用户加起来可能比 "直接使用 MCP" 的用户多一个数量级。** 不做框架集成就是放弃最大的潜在用户群。

---

## 五、Multi-Agent 场景支持

### 现状诊断

产品计划只考虑了单 agent 使用 Agentify 的场景。但 2026 年的实际 workflow 是 multi-agent 的。

### 典型 Multi-Agent Workflow

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  Architect   │     │   Builder    │     │   Reviewer   │
│   Agent      │     │   Agent      │     │   Agent      │
│              │     │              │     │              │
│ 1. 用 Agentify │     │ 3. 用 Agentify │     │ 5. 用 Agentify │
│    分析产品    │────►│    生成 MCP   │────►│    验证结果    │
│ 2. 选择策略    │     │ 4. 生成测试    │     │ 6. 安全审计    │
└─────────────┘     └──────────────┘     └──────────────┘
```

### 当前设计的问题

1. **无共享状态**: Agent A 分析的 Capability Graph 无法被 Agent B 直接使用（除非通过文件系统）
2. **无任务传递**: 分析结果无法结构化地传递给下一个 agent
3. **无并行支持**: 多个 agent 不能同时操作同一个 Capability Graph 的不同部分
4. **无角色分工**: 没有针对不同 agent 角色（分析师、生成器、审查员）的优化

### 建议

#### 5.1 Capability Graph 应该是可共享的持久化资源

```typescript
// Agent A: 分析并保存
const graphId = await agentify.analyze_product({ source: "https://..." })

// Agent B: 基于同一 graph 生成
await agentify.generate_mcp_server({ capabilityGraphId: graphId })

// Agent C: 验证同一 graph 对应的输出
await agentify.validate_mcp_server({ capabilityGraphId: graphId })
```

**关键变化**：`capabilityGraphId` 成为 agent 之间的 **coordination token**。

#### 5.2 提供 "Workflow Template" Prompts

```typescript
// Prompt: multi_agent_transformation
// 描述完整的 multi-agent 转型 workflow，包括角色分工和协调步骤
{
  name: "multi_agent_transformation",
  description: "A complete multi-agent workflow for transforming a product to Agent-Native",
  arguments: [
    { name: "productSource", description: "产品 API spec 或 URL" },
    { name: "agentCount", description: "参与的 agent 数量" },
    { name: "roles", description: "各 agent 角色分配" }
  ]
}
```

#### 5.3 Phase 1 就应该考虑 Graph 持久化

当前计划把 Capability Graph 持久化放到 Phase 3。但 multi-agent 场景从 Phase 1 就需要持久化。建议：
- Phase 1：SQLite-based 简单持久化（够用就行）
- Phase 3：Neo4j 级别的高级图数据库

### 重要性评级：HIGH

Multi-agent 不是未来，是现在。Claude Code 本身就是在用 multi-agent team。

---

## 六、A2A 集成时机：应该提前到 Phase 2

### 现状诊断

产品计划把 A2A Protocol 支持放在 Phase 3（6-8 周后）。但 A2A 生态的发展速度超出预期。

### 最新动态（2026 年 3 月）

- A2A 已由 Google 捐赠给 Linux Foundation，成立独立项目
- IBM 的 Agent Communication Protocol 已与 A2A 合并
- 支持方超过 **100 家**，包括 Microsoft、AWS、Salesforce、SAP
- A2A 正在从 "协议规范" 快速演化为 "有 SDK 和工具链的实用协议"

### 为什么 Agentify 需要更早支持 A2A

MCP 是 Agent↔Tool 的协议。A2A 是 Agent↔Agent 的协议。Agentify 如果只生成 MCP Server，那生成的产品只能被 **一个 agent 使用**。如果同时生成 A2A Agent Card，那生成的产品可以被 **其他 agent 发现和协作**。

```
当前：Product → Agentify → MCP Server → 被单个 Agent 调用
升级：Product → Agentify → MCP Server + A2A Agent Card → 被 Agent 网络发现和编排
```

### 具体建议

| Phase | A2A 相关工作 |
|-------|-------------|
| Phase 1 | 在 Capability Graph 中预留 A2A metadata 字段 |
| Phase 2 | 生成 A2A Agent Card（JSON 格式的能力广告）、实现 A2A discovery 集成 |
| Phase 3 | 完整的 A2A Agent 生成（不仅是 Card，还有 A2A server 实现） |

### 重要性评级：MEDIUM-HIGH

A2A 目前还没有达到 MCP 的成熟度，但趋势明确。提前布局的成本很低（Phase 2 只需要生成 Agent Card），但收益可能很大。

---

## 七、Context7 / 文档集成模式 vs 每 Endpoint 一个 Tool

### 现状诊断

架构调研中提到了 Stainless 的 "code execution + docs search" 双工具模式优于 "一个 endpoint 一个 tool"。但产品计划仍然默认使用 template-based 的逐 endpoint 生成。

### 问题分析

对于有 200+ endpoints 的大型 API（Stripe、Salesforce、GitHub）：

| 模式 | Tools 数量 | Context Window 占用 | Agent 选择准确率 |
|------|-----------|-------------------|-----------------|
| 逐 Endpoint | 200+ | 巨大，可能溢出 | 低（Anthropic 建议 30+ tools 时用 Tool Search） |
| 双工具模式 | 2 | 极小 | 高（Agent 写代码调用） |
| 分域暴露 | 10-20 | 中等 | 中高 |
| 文档查询模式 | 1-3 | 小 | 中高（类似 Context7） |

### Context7 模式的启发

Context7 的模式是：
1. 一个 `resolve-library-id` tool（找到目标库）
2. 一个 `query-docs` tool（查询文档获取代码示例）

类似地，Agentify 生成的 MCP Server 可以采用 **"Capability Query" 模式**：

```typescript
// 不是为每个 endpoint 生成 tool，而是生成：
// Tool 1: 查询可用能力
{
  name: "query_capabilities",
  description: "Search available capabilities of [Product Name]",
  inputSchema: { query: "string", domain: "string?" }
}

// Tool 2: 执行能力
{
  name: "execute_capability",
  description: "Execute a specific capability by ID",
  inputSchema: { capabilityId: "string", params: "object" }
}

// Tool 3: 获取能力详情
{
  name: "get_capability_details",
  description: "Get full schema and documentation for a capability",
  inputSchema: { capabilityId: "string" }
}
```

### 建议

Agentify 应该支持 **多种生成策略**，让 agent（或用户）选择：

1. **Full Exposure**: 每个 endpoint 一个 tool（适合小 API，<30 endpoints）
2. **Domain Grouped**: 按域分组，每个域一个 tool（适合中型 API，30-100 endpoints）
3. **Query + Execute**: Context7 式的查询-执行双工具（适合大型 API，100+ endpoints）
4. **Stainless Dual**: Code execution + docs search（适合极大型 API）

这个选择应该由 `suggest_transformation_strategy` tool 自动推荐。

### 重要性评级：HIGH

工具数量爆炸是 MCP 生态当前最大的实际痛点。Agentify 如果能智能地选择最优暴露策略，这本身就是强大的差异化。

---

## 八、Composable MCP：多 Server 组合编排

### 现状诊断

产品计划提到了 Phase 3 的 "跨产品 capability composition"，但没有展开设计。

### 实践中的需求

实际 agent workflow 经常需要组合多个产品的能力：

```
"帮我监控 Stripe 的支付失败事件，失败时自动在 Slack 发通知，同时在 Notion 记录日志"
```

这需要 Stripe MCP + Slack MCP + Notion MCP 的组合。当前的做法是让 agent 自行管理多个 MCP server。但 Agentify 可以做得更好。

### Composable MCP 的创新方向

#### 8.1 Capability Composition Graph

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Stripe     │     │   Slack     │     │   Notion    │
│  Capability │     │  Capability │     │  Capability │
│  Graph      │     │  Graph      │     │  Graph      │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                    ┌──────▼──────┐
                    │  Composed   │
                    │  Capability │
                    │  Graph      │
                    │             │
                    │ "payment-   │
                    │  failure-   │
                    │  alert"     │
                    └─────────────┘
```

#### 8.2 Agentify 作为 "MCP Composer"

```typescript
// Tool: compose_capabilities
{
  name: "compose_capabilities",
  description: "Compose capabilities from multiple products into a unified workflow",
  inputSchema: {
    sources: [
      { graphId: "stripe-graph", capabilities: ["payment.webhook.listen"] },
      { graphId: "slack-graph", capabilities: ["message.send"] },
      { graphId: "notion-graph", capabilities: ["page.create"] }
    ],
    composition: {
      trigger: "stripe:payment.webhook.listen",
      actions: [
        { capability: "slack:message.send", mapping: { channel: "#alerts", text: "{{event.description}}" } },
        { capability: "notion:page.create", mapping: { database: "payment-logs", content: "{{event}}" } }
      ]
    }
  }
}
```

#### 8.3 生成 Composite MCP Server

输出一个 **聚合 MCP Server**，内部编排多个下游 MCP Server：

```
Composed MCP Server
├── tools/
│   ├── trigger-payment-alert.ts    # 聚合 workflow
│   ├── check-alert-status.ts       # 查询状态
│   └── configure-alert.ts          # 配置 workflow
├── lib/
│   ├── stripe-client.ts            # Stripe MCP 连接
│   ├── slack-client.ts             # Slack MCP 连接
│   └── notion-client.ts            # Notion MCP 连接
└── composition.json                # 组合声明
```

### 建议

| Phase | Composability 工作 |
|-------|-------------------|
| Phase 1 | Capability Graph 支持跨产品引用 |
| Phase 2 | `compose_capabilities` tool 基础版（声明式 workflow） |
| Phase 3 | Composite MCP Server 生成 + runtime composition |

### 重要性评级：MEDIUM-HIGH

这是 Agentify 相对竞品最大的差异化潜力。没有任何工具在做 "从多个产品的能力中组合生成统一的 MCP Server"。

---

## 九、额外关注：被忽略的实际问题

### 9.1 生成代码的可维护性

当前只关注 "生成"，没有考虑 "更新"。当源 API 的 OpenAPI spec 更新时：
- 如何检测变更？
- 如何增量更新生成的 MCP Server？
- 如何处理 breaking changes？

**建议**：增加 `sync_with_source` tool，支持增量更新而非全量重新生成。

### 9.2 生成质量的度量

如何知道生成的 MCP Server "好不好用"？需要一个量化指标：
- Tool description 被 agent 正确调用的概率
- Schema 验证的通过率
- Error handling 的覆盖率

**建议**：参考 Merge Agent Handler 的思路，增加 `benchmark_mcp_server` tool。

### 9.3 Auth 处理过于简化

产品计划把 Auth 当作一个配置项，但实际中 Auth 是最复杂的部分。MCP Auth 的 OAuth 实现 被广泛批评为 "a mess for enterprise"。Agentify 需要专门处理：
- OAuth 2.0 各种 flow（Authorization Code, Client Credentials, PKCE）
- API Key 的多种传递方式（Header, Query, Cookie）
- Token refresh 和 rotation
- Multi-tenant 场景

### 9.4 Observability 缺失

生成的 MCP Server 应该内置 observability：
- Tool 调用的 metrics（调用次数、延迟、错误率）
- 结构化 logging
- Trace ID 传播（支持跨 MCP server 追踪）

---

## 十、优先级排序总结

### CRITICAL（必须在 Phase 1 解决）

| # | 问题 | 行动 |
|---|------|------|
| 1 | Dog-fooding tools 太少 | 扩展到 10-15 个 tools + 5 resources + 3 prompts |
| 2 | 无 Elicitation 支持 | Phase 1 集成 MCP Elicitation 用于关键决策点 |
| 3 | 无框架集成 | 至少支持 LangChain 和 Claude Code 的集成配置生成 |

### HIGH（Phase 2 必须解决）

| # | 问题 | 行动 |
|---|------|------|
| 4 | 无 MCP App 支持 | Agentify 自身 tools 返回 MCP App UI |
| 5 | 无智能策略选择 | 实现 `suggest_transformation_strategy`，支持多种生成模式 |
| 6 | A2A 时机太晚 | Phase 2 开始生成 A2A Agent Cards |
| 7 | Multi-agent 无共享状态 | Phase 1 用 SQLite 持久化 Capability Graph |

### MEDIUM-HIGH（Phase 2-3）

| # | 问题 | 行动 |
|---|------|------|
| 8 | 无 Composable MCP | Phase 2 开始跨产品 Capability 组合 |
| 9 | 无增量更新 | 实现 API 变更检测和增量同步 |
| 10 | Auth 简化过度 | 专门的 Auth 模块处理企业级认证 |

---

## 十一、6 个月后的世界（2026 年 9 月预测）

基于当前趋势外推：

1. **MCP Apps 将成为标配**：50%+ 的新 MCP Server 将包含 UI 组件
2. **A2A 进入实用阶段**：企业级 agent 将通过 A2A 发现和协作
3. **框架融合加速**：LangChain、CrewAI、AutoGen 将提供统一的 MCP/A2A 集成层
4. **MCP Gateway 成为基础设施**：类似 API Gateway 的 MCP Gateway 将成为企业标配
5. **Composable Agent Workflows**：从单 agent 单 tool 到 multi-agent multi-tool workflow 是必然趋势
6. **Tool Description 质量成为核心竞争力**：谁的 tool description 让 agent 调用成功率最高，谁就赢

**Agentify 在 6 个月后的竞争力取决于：是否从 "代码生成器" 进化为 "agent 能力编排平台"。**

---

## 参考来源

- [MCP Specification 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25)
- [MCP Elicitation Implementation Guide (The New Stack)](https://thenewstack.io/how-to-implement-elicitation-with-model-context-protocol/)
- [MCP Elicitation Overview (SingleStore)](https://www.singlestore.com/blog/unlocking-human-like-interactions-with-model-context-protocol-elicitation/)
- [MCP Apps Official Blog Post](http://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/)
- [MCP Apps SEP-1865 Pull Request](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/1865)
- [MCP Apps Extension Repo](https://github.com/modelcontextprotocol/ext-apps)
- [Anthropic + OpenAI MCP Apps Collaboration (Inkeep)](https://inkeep.com/blog/anthropic-openai-mcp-apps-extension)
- [LangChain MCP Adapters](https://github.com/langchain-ai/langchain-mcp-adapters)
- [LangSmith MCP Endpoint Support](https://docs.langchain.com/langsmith/server-mcp)
- [CrewAI MCP Integration Docs](https://docs.crewai.com/en/mcp/overview)
- [AutoGen MCP Tools Module](https://microsoft.github.io/autogen/stable//reference/python/autogen_ext.tools.mcp.html)
- [A2A Protocol donated to Linux Foundation](https://developers.googleblog.com/en/google-cloud-donates-a2a-to-linux-foundation/)
- [Linux Foundation A2A Project Launch](https://www.linuxfoundation.org/press/linux-foundation-launches-the-agent2agent-protocol-project-to-enable-secure-intelligent-communication-between-ai-agents)
- [MCP Tool Description Best Practices (Merge)](https://www.merge.dev/blog/mcp-tool-description)
- [MCP Server Best Practices (Phil Schmid)](https://www.philschmid.de/mcp-best-practices)
- [MCP Composable Architecture (Built In)](https://builtin.com/articles/mcp-architect-composable-ai)
- [Multi-MCP Server Orchestration (Portkey)](https://portkey.ai/blog/orchestrating-multiple-mcp-servers-in-a-single-ai-workflow/)
- [Goose MCP Apps Support](https://block.github.io/goose/blog/2026/01/06/mcp-apps/)
