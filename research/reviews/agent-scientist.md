# Agent Scientist Review: Agentify 产品计划的 AI/Agent 正确性深度评审

> 评审员: Agent Scientist (LLM Agent 工具使用研究专家)
> 日期: 2026-03-02
> 评审范围: CLAUDE.md, product-plan.md, paradigms.md, patterns.md
> 评审维度: Tool Description 质量、Context Window 问题、Agent 使用模式、Capability Graph Gap、MCP Spec 合规、多 Agent 协作、评估方法论

---

## 总体评价

Agentify 的产品愿景——"The Meta-Tool that makes every product Agent-Native"——在宏观层面是正确的。但从 **LLM Agent 实际使用工具的科学角度** 审视，计划中存在若干关键盲区。这些盲区不是"nice-to-have"的优化项，而是 **决定生成的 MCP Server 是否真正可用** 的核心问题。

**评级: B- (Good Vision, Critical Gaps in Agent-Side Thinking)**

---

## 1. Tool Description 质量是核心 —— 计划中最大的盲区

### 1.1 问题严重性

Tool description 是 LLM 选择和使用工具的 **唯一信息来源**。Anthropic 内部测试表明，提供 Tool Use Examples 后，复杂参数处理的准确率从 **72% 提升到 90%**。这不是锦上添花——这是 18 个百分点的可用性差距。

然而，Agentify 的产品计划中：
- Capability Graph 有详细的数据模型设计（5 种实体、6 种关系）
- MCP Server 代码生成有清晰的模板结构
- **但 tool description 的生成策略完全缺失**

产品计划中 `DescriptionEnhanceTransform` 在架构报告中只有一行提及（"使用 LLM 增强描述"），没有任何具体设计。这相当于造了一辆车但忘了设计方向盘。

### 1.2 Tool Description 的科学要求

根据 Anthropic 工程博客和 Merge 的 MCP tool description 最佳实践，高质量的 tool description 需要：

**结构层面：**
- **动词 + 资源** 的简洁格式（1-2 句话）
- 前置最重要的信息（Agent 可能不会读完整个 description）
- 操作性细节放在 schema 的 field-level description 中，而非 tool description 中

**语义层面：**
- 明确区分相似工具（如 `notification-send-user` vs `notification-send-channel`，Anthropic 实测中这类 confusion 是主要 failure mode）
- 包含返回值格式的明确描述
- 标注副作用（是否 idempotent、是否有 rate limit）

**示例层面：**
- Tool Use Examples 显著提升准确率
- 需要展示日期格式、ID 模式、嵌套结构、可选参数的用法
- 需要展示参数之间的关联关系

### 1.3 对 Agentify 的具体建议

**[CRITICAL] 新增 Description Optimization Pipeline：**

```
Capability Graph
    │
    ▼ (1) Semantic Description Generation
    │  - 从 OpenAPI operation summary + description 提取
    │  - LLM 重写为 agent-friendly 格式
    │  - 自动消歧义（检测 name/description 相似的 tools）
    │
    ▼ (2) Schema Description Enrichment
    │  - 每个 parameter 都需要 description
    │  - 枚举值需要语义说明
    │  - 复杂对象需要 example values
    │
    ▼ (3) Tool Use Example Generation
    │  - 为每个 tool 生成 2-3 个典型使用示例
    │  - 覆盖 happy path 和 edge case
    │  - 示例格式符合 MCP Tool Use Example spec
    │
    ▼ (4) A/B Testing Framework
       - 对比不同 description 版本的 tool selection accuracy
       - 使用 MCP-Bench 风格的评测自动化验证
```

**[HIGH] 在 Readiness Score 中增加 "Description Quality" 维度：**
- 当前的 6 个评估维度（API 覆盖度、Schema 质量、认证友好度、错误处理、文档质量、幂等性）缺少 **tool description 的 agent 可理解性** 评估
- 建议增加第 7 维度：Agent Usability Score，包含 description clarity、parameter documentation completeness、example coverage

---

## 2. Context Window 问题 —— 200 个 Endpoint 的灾难

### 2.1 问题量化

这是 Agentify 面临的 **最严重的架构层问题**。数据说话：

| 场景 | Token 消耗 | Context Window 占比 (200K) |
|------|-----------|--------------------------|
| GitHub MCP Server (93 tools) | ~55,000 tokens | 27.5% |
| 5 个 MCP Server (30 tools each) | 30,000-60,000 tokens | 15-30% |
| Anthropic 内部优化前 | 134,000 tokens | 67% |
| 一个大型 SaaS 产品 (200+ endpoints) | **~120,000+ tokens** | **60%+** |

学术研究（"From Tool Orchestration to Code Execution: A Study of MCP Design Choices", arXiv:2602.15945）证实：传统 MCP 的 context-coupled execution model 面临 **inherent scalability limitations**——metadata 和 intermediate outputs 消耗越来越多的 context window，留给推理的空间越来越少。

实测表明：**Multi-step reasoning 在 3-4 次 tool call 后就会崩溃**，因为 accumulated context 把 agent 推入 context window 尾部，attention quality 急剧下降。

### 2.2 Agentify 计划中的缺陷

产品计划中的 MCP Server 生成策略是 **"Template-Based Code Generation"**——为每个 capability 生成一个 tool：

```
tools/
├── create-user.ts    # Tool: createUser
├── list-orders.ts    # Tool: listOrders
└── ...               # 200+ files for large APIs
```

这种 one-tool-per-endpoint 模式在小型 API（<30 endpoints）时可行，但对于 Agentify 的目标用户——**SaaS 产品团队和 API-first 公司**——他们的产品通常有 50-500 个 endpoint。生成 200 个 MCP tools 会让 agent 的 context window 直接爆炸。

### 2.3 Stainless 双工具模式 vs Agentify 的方案

Stainless 的 "code execution + docs search" 双工具架构已被 Anthropic 工程博客和学术论文证实更优：

| 维度 | One-Tool-Per-Endpoint | Stainless 双工具模式 |
|------|----------------------|---------------------|
| Context 消耗 | O(N) — 线性增长 | O(1) — 常量 |
| Token 效率 | ~120K (200 endpoints) | ~2K (任意数量) |
| Composability | 低（每次一个操作） | 高（代码可组合任意操作） |
| 准确率 | 工具越多越低 | 不受工具数量影响 |
| 调试性 | 好（每个 tool 独立） | 中（需要理解生成的代码） |
| 安全性 | 好（操作受限） | 需要沙盒（代码执行风险） |

**关键数据**: Anthropic 工程博客报告，code execution 方式实现了 **98.7% 的 token 消耗减少**（从 150,000 降至 2,000 tokens）和 **60% 的执行速度提升**。

arXiv 论文进一步证实：CE-MCP (Code Execution MCP) 维持 **"constant context consumption regardless of task complexity or the size of the tool ecosystem"**。

### 2.4 对 Agentify 的具体建议

**[CRITICAL] 采用分层工具架构（Tiered Tool Architecture）：**

```
Tier 1: Small API (<30 endpoints)
  → One-Tool-Per-Endpoint（当前方案，保留）
  → 适合简单产品，调试友好

Tier 2: Medium API (30-100 endpoints)
  → Tool Search + Lazy Loading
  → 只加载 search tool (~500 tokens)
  → 按需发现和加载具体 tool (~3K tokens per discovery)
  → 总计 ~3.5K vs ~60K，节省 94%

Tier 3: Large API (100+ endpoints)
  → Code Execution + Docs Search（Stainless 模式）
  → 生成 SDK client + 沙盒执行环境
  → 总计 ~2K 常量消耗
  → 需要额外的沙盒基础设施
```

**[HIGH] 在 Capability Graph 中增加 "Tool Grouping" 能力：**
- 自动将 200 个 endpoint 按 domain 聚类
- 每个 domain 生成一个 "composite tool"（如 `user_management` 包含 CRUD 操作）
- Agent 先选择 domain，再展开具体操作
- 这是 Tool Search 和 Code Execution 之间的 **中间方案**

**[HIGH] 在生成策略选择中增加自动决策逻辑：**
```typescript
function selectGenerationStrategy(graph: CapabilityGraph): GenerationStrategy {
  const toolCount = graph.getCapabilities().length
  if (toolCount <= 30) return 'one-tool-per-endpoint'
  if (toolCount <= 100) return 'tool-search-lazy-loading'
  return 'code-execution-with-docs-search'
}
```

---

## 3. Agent 实际使用工具的模式 —— 被忽视的 Runtime 行为

### 3.1 Agent 工具使用的真实 Pattern

学术研究（"How Do LLMs Fail In Agentic Scenarios?" arXiv:2512.07497, "The Reasoning Trap" arXiv:2510.22977）揭示了 agent 使用工具时的真实行为模式：

**Sequential 是主流，Parallel 是例外：**
- 绝大多数 agent 以 sequential 方式调用工具
- Parallel tool calling 需要 LLM 明确判断操作无依赖关系
- 实际中 agent 倾向于保守（sequential），即使 parallel 更高效

**Error Handling 几乎不存在：**
- Agent 收到 tool error 后，最常见的行为是 **重试同样的调用**（而非理解错误原因）
- 在 multi-turn execution 中，early mistakes 导致 **compounding failures**——错误的 belief state 偏差后续所有规划
- Malformed tool calls（JSON 结构错误、丢失 field）是最常见的执行失败原因

**Tool Hallucination 是系统性问题：**
- "The Reasoning Trap" 论文发现一个反直觉的结论：**增强推理能力反而增加 tool hallucination**——强推理模型更自信地编造不存在的工具或错误的参数
- Tool hallucination 分为两类：tool selection hallucination（选错工具）和 tool usage hallucination（参数错误）
- 当可用工具中存在 "distractor tools"（名字相似但功能不同的工具）时，hallucination 率显著上升

### 3.2 对 Agentify 生成的 MCP Server 的影响

Agentify 生成的 MCP Server 需要 **为 agent 的这些行为模式做设计**，而非假设 agent 是完美的：

**[HIGH] 生成 Agent-Resilient Error Responses：**
```typescript
// BAD: Agent 无法理解的错误
throw new Error('ENOENT: no such file or directory')

// GOOD: Agent 可理解并据此调整的错误
return {
  isError: true,
  content: [{
    type: "text",
    text: JSON.stringify({
      error: "user_not_found",
      message: "No user exists with ID 'abc123'. Use list_users tool to find valid user IDs.",
      suggestion: "Call list_users first, then retry with a valid user ID from the results.",
      relatedTools: ["list_users"]
    })
  }]
}
```

**[HIGH] Tool Naming 消歧义策略：**
- 自动检测 Capability Graph 中 name 或 description 相似度 > 0.8 的工具对
- 强制重命名或增加 disambiguating prefix
- 例如：`send_notification` 拆分为 `send_user_notification` 和 `send_channel_notification`

**[MEDIUM] 生成 Idempotency 标注：**
- 在 tool description 中明确标注 `[SAFE TO RETRY]` 或 `[NOT IDEMPOTENT - DO NOT RETRY]`
- Agent 看到重试安全标注后，可以自主决定 retry 策略

### 3.3 生成的 MCP Server 应该包含的 Agent-Guidance 机制

```typescript
// 生成的 MCP Server 应该在 tool description 中包含 workflow hints
{
  name: "create_order",
  description: "Create a new order for a customer. " +
    "PREREQUISITES: Customer must exist (use get_customer first). " +
    "RETURNS: Order object with order_id. " +
    "NEXT STEPS: Use add_order_items to add products to the order.",
  // ...
}
```

这种 **workflow-aware description** 直接弥合了 Capability Graph（静态能力）和 Agent 需求（动态任务完成路径）之间的 gap。

---

## 4. Capability Graph vs Agent 需求的 Semantic Gap

### 4.1 Gap 的本质

Capability Graph 捕获的是产品的 **"能做什么"（What）**：
```
Product → Domain → Capability (with Input/Output Schema)
```

但 Agent 需要的是 **"如何完成任务"（How）**：
```
User Intent → Task Decomposition → Ordered Tool Calls → Result Aggregation
```

这之间存在三个层次的 semantic gap：

**Gap 1: 依赖关系 vs 执行顺序**
- Capability Graph 的 `requires` 关系是静态声明
- Agent 需要的是动态的执行计划（包含条件分支、循环、错误恢复）

**Gap 2: 单个能力 vs 组合工作流**
- 用户的一个意图（"帮我退款"）可能需要调用 5-7 个 tool
- Capability Graph 没有 "退款工作流" 这个概念

**Gap 3: 参数传递链**
- Tool A 的 output 是 Tool B 的 input
- 这种数据流关系在 Capability Graph 的 `produces`/`consumes` 关系中隐含，但 agent 需要显式知道

### 4.2 弥合方案

**[HIGH] 在 Capability Graph 中增加 "Workflow" 层：**

```typescript
interface WorkflowNode {
  id: string
  name: string  // e.g., "process_refund"
  description: string  // agent-readable workflow description
  steps: WorkflowStep[]
  triggers: string[]  // natural language intent patterns
}

interface WorkflowStep {
  capabilityId: string
  order: number
  condition?: string  // "only if order.status === 'delivered'"
  inputMapping: Record<string, string>  // "orderId" -> "previous_step.result.orderId"
  onError: 'retry' | 'skip' | 'abort'
}
```

**[MEDIUM] 生成 MCP Prompts 作为 Workflow Templates：**

MCP 的三元素中，Prompts 是目前 Agentify 计划中 **最被忽视的**。Prompts 可以作为 workflow templates，引导 agent 按正确顺序使用工具：

```typescript
// 生成的 MCP Server 中的 Prompt 定义
{
  name: "process_refund",
  description: "Guide for processing a customer refund",
  arguments: [
    { name: "order_id", required: true }
  ],
  // 返回一个结构化的工作流提示
  content: `
    To process a refund for order {order_id}:
    1. Call get_order with order_id to verify order details
    2. If order.status is 'delivered', call initiate_refund
    3. Call send_notification to inform the customer
    4. Call update_order_status to mark as 'refunded'
  `
}
```

**[MEDIUM] Capability Graph 的 "Common Workflows" 自动推断：**
- 分析 OpenAPI spec 中的 endpoint 命名模式（CRUD grouping）
- 使用 LLM 从 API 文档中推断常见工作流
- 将推断结果存储为 Workflow 节点

---

## 5. MCP Spec 合规 —— 生成的代码必须过关的硬门槛

### 5.1 常见合规问题

根据安全研究（"The State of MCP Server Security in 2026"——118 findings across 68 packages）和 MCP spec 更新，常见的合规问题包括：

**认证合规 (CRITICAL)：**
- MCP spec 要求实现 OAuth 2.0 Protected Resource Metadata (PRM)
- 2025-06 更新后，PRM 成为 mandatory，移除了 fallback default endpoints
- 需要实现 Resource Indicators 防止 "token mis-redemption"
- 当前大量 MCP Server **没有任何认证机制**

**参数验证 (HIGH)：**
- 普遍缺失 type checking、length limits、format validation
- 虽然不会立即被利用，但构成攻击面

**传输层合规 (MEDIUM)：**
- Streamable HTTP 已替代旧的 SSE transport
- 需要正确实现 `mcp-session-id` header 管理
- Session 状态管理需要符合 spec 要求

**网络暴露 (HIGH)：**
- 绑定到 0.0.0.0 是最常见且最危险的配置错误
- 需要默认绑定到 127.0.0.1

### 5.2 对 Agentify 的具体建议

**[CRITICAL] Validator 插件必须覆盖 MCP Spec 合规检查：**

```typescript
interface McpComplianceValidator {
  // Phase 1: 基础合规
  validateToolSchemas(server: McpServerArtifact): ValidationResult  // JSON Schema 正确性
  validateTransport(server: McpServerArtifact): ValidationResult     // stdio/streamable-http
  validateErrorFormat(server: McpServerArtifact): ValidationResult   // 错误响应格式

  // Phase 2: 安全合规
  validateAuth(server: McpServerArtifact): ValidationResult          // OAuth 2.0 PRM
  validateNetworkBinding(server: McpServerArtifact): ValidationResult // 不绑定 0.0.0.0
  validateInputSanitization(server: McpServerArtifact): ValidationResult

  // Phase 3: 高级合规
  validateSessionManagement(server: McpServerArtifact): ValidationResult
  validateResourceIndicators(server: McpServerArtifact): ValidationResult
}
```

**[HIGH] 生成的代码模板必须内置安全默认值：**
- 默认绑定 127.0.0.1 而非 0.0.0.0
- 默认启用 input validation（Zod schemas）
- 默认包含 rate limiting 中间件
- 默认生成 OAuth 2.0 scaffold（即使用户暂时不启用）

**[HIGH] 跟踪 MCP Spec 版本变更：**
- 当前 spec 版本是 2025-11-25，但更新频率为每几个月一次
- Agentify 需要一个 spec version tracking 机制
- 生成的 MCP Server 应该声明兼容的 spec 版本

---

## 6. 多 Agent 协作场景 —— 被完全忽视的维度

### 6.1 问题场景

当多个 agent 同时使用同一个 Agentify 生成的 MCP Server 时：

**并发访问冲突：**
- Agent-Zero 项目已报告 Bug：多个 session 同时使用 MCP tools 时系统 hang 或 deadlock
- stdio transport 天然是 single-threaded 的，不支持并发
- 如果生成的 MCP Server 使用 stdio transport（当前默认），多 agent 场景直接不可用

**Session 状态冲突：**
- MCP 维护 stateful session（通过 `mcp-session-id` header）
- 多个 agent 的 session 需要严格隔离
- 如果 agent A 的操作改变了共享状态（如写入数据库），agent B 的后续读取可能看到不一致的状态

**幂等性问题：**
- Agent A 和 Agent B 同时调用 `create_order`，可能创建重复订单
- 生成的 MCP Server 需要内置幂等性保护（idempotency key）

### 6.2 对 Agentify 的具体建议

**[HIGH] Transport 策略感知：**
```
Single Agent 使用: stdio transport (简单、低延迟)
Multi Agent 使用: Streamable HTTP transport (支持并发)
```
- 在生成配置中增加 `concurrency: 'single' | 'multi'` 选项
- multi 模式默认生成 Streamable HTTP transport + session 隔离

**[MEDIUM] 生成 Idempotency Key 支持：**
- 对所有 write 操作自动生成 idempotency key 参数
- Agent 可以传入 key 来防止重复操作

**[MEDIUM] 在产品计划中增加 "Multi-Agent Ready" 标签：**
- Readiness Score 中增加 "Multi-Agent Compatibility" 维度
- 评估目标产品 API 的幂等性、并发安全性、状态隔离能力

---

## 7. 评估方法论 —— 怎么科学地衡量"好不好用"

### 7.1 现有 MCP Benchmark 全景

2025-2026 年涌现了多个 MCP 评测基准：

| Benchmark | 规模 | 评测维度 | 适用场景 |
|-----------|------|---------|---------|
| **MCP-Bench** (Accenture) | 28 servers, 250 tools | Schema 合规、runtime 成功率、task completion、planning effectiveness | 通用 MCP Server 评测 |
| **OSWorld-MCP** | 158 tools, 7 applications | Tool invocation accuracy, GUI vs tool decision-making | Computer-use agent 场景 |
| **MCP-Radar** | 507 tasks, 6 domains | 数学推理、搜索、邮件、日历、文件、终端 | 多领域 MCP 能力评测 |
| **MCPMark** | 127 tasks | Realistic use cases, human+AI co-created | 综合质量评测 |

### 7.2 Agentify 需要的评估框架

Agentify 的评估需求比上述 benchmark 更特殊——它需要评估的不是 "一个 MCP Server 好不好用"，而是 **"自动生成的 MCP Server 好不好用"**。这需要一个 **meta-benchmark**。

**[HIGH] 构建 AgentifyBench：**

```
AgentifyBench 评测维度:

1. Generation Fidelity（生成保真度）
   - 输入 OpenAPI spec，生成的 MCP Server 是否覆盖了所有 endpoint？
   - Schema 转换是否无损？($ref 解析、union type 处理)
   - 指标: Endpoint Coverage Rate, Schema Accuracy

2. Tool Description Quality（描述质量）
   - 生成的 description 是否让 agent 正确选择工具？
   - 指标: Tool Selection Accuracy (给定 intent，agent 选对 tool 的概率)
   - 方法: 构建 intent -> expected_tool 的测试集，运行多个 LLM 测试

3. Task Completion Rate（任务完成率）
   - Agent 使用生成的 MCP Server 完成真实任务的成功率
   - 指标: End-to-End Task Success Rate
   - 方法: 参考 MCP-Bench 的 two-tier 评测（rule-based + LLM-as-Judge）

4. Context Efficiency（上下文效率）
   - 生成的 tool definitions 占用多少 tokens？
   - Agent 完成一个任务消耗多少 total tokens？
   - 指标: Token/Task, Tool Definition Token Count

5. Error Resilience（错误韧性）
   - Agent 遇到 error response 后能否恢复？
   - 指标: Recovery Rate after Error

6. Spec Compliance（规范合规）
   - 生成的 MCP Server 是否通过 spec 合规检查？
   - 指标: Compliance Checklist Pass Rate
```

**[MEDIUM] 建立 "Golden Set" 参考标准：**
- 手动优化 5-10 个知名产品的 MCP Server（作为 golden reference）
- 用 Agentify 自动生成同产品的 MCP Server
- 对比两者在上述 6 个维度的差异
- 这就是产品计划中"5 个知名产品的 OpenAPI -> MCP 转换 demo"应该做的事，但需要增加 **定量评测** 而非仅做 demo

**[MEDIUM] 自动化回归测试：**
- 每次 Agentify 更新后，重新生成所有 golden set 的 MCP Server
- 自动运行 AgentifyBench 检测质量回归
- 将 benchmark score 作为 CI/CD 的 quality gate

---

## 8. 补充建议：计划中缺失的关键技术考量

### 8.1 Tool Poisoning / Prompt Injection 防御

arXiv 论文 (2602.15945) 发现：
- 恶意 tool name 可以 **bias agent 的工具选择和调用方式**
- Tool description 中嵌入的矛盾指令可导致 agent 进入 **无限循环**（DoS）
- 文件/目录命名中的 adversarial instructions 可以 **corrupt agent 的推理和规划**

Agentify 从外部 OpenAPI spec 生成 MCP Server，spec 可能被恶意篡改。需要：

**[HIGH] Input Sanitization Pipeline：**
- 对 OpenAPI spec 中的 operation description 进行 prompt injection 检测
- 过滤掉看似正常但实际包含 adversarial instructions 的描述
- 对生成的 tool name 进行命名规范强制（alphanumeric + underscore only）

### 8.2 MCP Resources 和 Prompts 的生成策略

当前计划几乎 100% 聚焦于 Tools 的生成，但 MCP 的三元素中 Resources 和 Prompts 同样重要：

**Resources（App-controlled 数据注入）：**
- OpenAPI spec 中的 GET endpoints（无副作用的读取操作）应该生成为 Resources 而非 Tools
- Resources 可以被 application 预加载到 context 中，减少 agent 主动调用的需要

**Prompts（User-controlled workflow templates）：**
- 如第 4 节所述，Prompts 是弥合 Capability Graph 和 Agent 需求 gap 的关键机制
- 应该从 API 的 domain grouping 中自动推断常见 workflow，生成 Prompt templates

### 8.3 渐进式信息披露 (Progressive Disclosure)

Anthropic 的 Tool Search 实践表明，最佳的工具暴露方式是 **渐进式** 的：

```
Level 0: Tool names only (~100 tokens for 50 tools)
Level 1: Tool names + 1-line descriptions (~500 tokens)
Level 2: Full tool definitions including schemas (~5K tokens for 5 tools)
Level 3: Tool definitions + examples (~8K tokens for 5 tools)
```

Agentify 生成的 MCP Server 应该支持这种渐进式发现，而非一次性暴露所有 tool definitions。

---

## 9. 总结：优先级排序的行动清单

| 优先级 | 行动项 | 影响 | 实施阶段 |
|--------|--------|------|---------|
| **CRITICAL** | 设计 Tool Description Optimization Pipeline | 决定生成的 MCP Server 是否可用 | Phase 1 |
| **CRITICAL** | 实现分层工具架构（Tiered Tool Architecture） | 解决 context window 灾难 | Phase 1 |
| **CRITICAL** | MCP Spec 合规 Validator 完整实现 | 生成的代码必须过关 | Phase 1 |
| **HIGH** | Agent-Resilient Error Response 生成 | 提升 agent 错误恢复能力 | Phase 1 |
| **HIGH** | Tool Naming 消歧义策略 | 减少 tool selection hallucination | Phase 1 |
| **HIGH** | Input Sanitization (anti prompt injection) | 安全基线 | Phase 1 |
| **HIGH** | 构建 AgentifyBench 评测框架 | 科学衡量质量 | Phase 1-2 |
| **HIGH** | Capability Graph 增加 Workflow 层 | 弥合 capability-task gap | Phase 2 |
| **HIGH** | Transport 策略感知（multi-agent） | 多 agent 场景支持 | Phase 2 |
| **MEDIUM** | MCP Resources/Prompts 生成策略 | 完整利用 MCP 三元素 | Phase 2 |
| **MEDIUM** | 渐进式信息披露 | 优化 context 使用 | Phase 2 |
| **MEDIUM** | Golden Set + 自动化回归测试 | 质量保障 | Phase 2 |
| **MEDIUM** | Idempotency Key 自动生成 | 多 agent 安全 | Phase 2-3 |

---

## 参考文献

### Anthropic 工程博客
- [Code Execution with MCP: Building More Efficient AI Agents](https://www.anthropic.com/engineering/code-execution-with-mcp)
- [Advanced Tool Use Techniques](https://www.anthropic.com/engineering/advanced-tool-use)

### 学术论文
- "From Tool Orchestration to Code Execution: A Study of MCP Design Choices" (arXiv:2602.15945)
- "The Reasoning Trap: How Enhancing LLM Reasoning Amplifies Tool Hallucination" (arXiv:2510.22977)
- "How Do LLMs Fail In Agentic Scenarios?" (arXiv:2512.07497)
- "LLM-based Agents Suffer from Hallucinations: A Survey" (arXiv:2509.18970)
- "Reducing Tool Hallucination via Reliability Alignment" (arXiv:2412.04141)

### MCP 生态
- [MCP Tool Description Best Practices (Merge)](https://www.merge.dev/blog/mcp-tool-description)
- [MCP and Context Overload: Why More Tools Make Your AI Agent Worse](https://eclipsesource.com/blogs/2026/01/22/mcp-context-overload/)
- [Your MCP Servers Are Eating Your Context](https://medium.com/@lakshminp/your-mcp-servers-are-eating-your-context-549c472beaf2)
- [MCP Server Best Practices 2026 (CData)](https://www.cdata.com/blog/mcp-server-best-practices-2026)
- [Stainless API MCP Server Architecture Guide](https://www.stainless.com/mcp/api-mcp-server-architecture-guide)

### Benchmark
- [MCP-Bench (Accenture)](https://github.com/Accenture/mcp-bench)
- [OSWorld-MCP](https://openreview.net/forum?id=rceD6wwt4B)
- [MCP-Radar](https://openreview.net/forum?id=I0bbPcMeCj)
- [MCPMark](https://openreview.net/forum?id=uobROwBsJm)
- [MCPBench (ModelScope)](https://github.com/modelscope/MCPBench)

### 安全
- [The State of MCP Server Security in 2026 — 118 Findings Across 68 Packages](https://dev.to/ecap0/the-state-of-mcp-server-security-in-2026-118-findings-across-68-packages-4fkd)
- [MCP Security Checklist 2026](https://www.networkintelligence.ai/blogs/model-context-protocol-mcp-security-checklist/)
- [Excessive Context Usage for Tools (GitHub MCP Server Issue #1286)](https://github.com/github/github-mcp-server/issues/1286)
