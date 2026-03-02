# Agentify 用户体验故事

> 日期: 2026-03-02
> 基于: output-formats.md（20 种输出格式全景图）+ agent-consumption-patterns.md（Agent 消费模式研究）
> 目标: 用具体场景展示 Agentify 的 "Multi-Output Transformation" 愿景如何改变产品与 Agent 的关系

---

## Story 1: 独立开发者的 SaaS 全面 Agent 化

### 角色: 林小明，独立开发者

林小明做了一个项目管理 SaaS 叫 TaskFlow。有 REST API、有文档、有几百个用户——典型的 L1 产品（有 API，但 Agent 不知道怎么用）。

一天他在 Hacker News 上看到一个帖子："Why your SaaS is invisible to AI agents"。他意识到，当 Claude Code 用户想在项目里集成 TaskFlow 时，Agent 完全不知道 TaskFlow 的存在。用户只能手动翻文档、手动写 HTTP 请求。而竞品 Linear 已经有了 MCP Server、有 CLAUDE.md、有 Skills——Agent 可以直接 `用 Linear 创建一个 bug ticket`。

林小明决定试试 Agentify。他打开终端：

```bash
npx agentify transform https://api.taskflow.dev/openapi.json
```

30 秒后，终端输出了一个完整的目录结构：

```
taskflow-agent-suite/
├── mcp-server/                    # MCP Server（核心工具接口）
│   ├── src/
│   │   ├── server.ts              # 26 个 tools（自动选择小型 API 策略）
│   │   ├── resources.ts           # 8 个 resources（GET endpoints 自动映射）
│   │   └── prompts.ts             # 3 个 workflow prompts
│   ├── Dockerfile
│   ├── .env.example               # TASKFLOW_API_KEY=your-key-here
│   └── package.json
│
├── skills/                        # Claude Code / Codex Skills
│   ├── taskflow-quickstart/
│   │   └── SKILL.md               # "如何在项目中集成 TaskFlow"
│   ├── taskflow-projects/
│   │   └── SKILL.md               # 项目管理相关操作的最佳实践
│   └── taskflow-webhooks/
│       └── SKILL.md               # Webhook 配置和事件处理指南
│
├── context/                       # 跨平台 Agent Context Files
│   ├── CLAUDE.md                  # Claude Code 项目约定
│   ├── AGENTS.md                  # 跨平台标准（Codex, Gemini CLI）
│   └── .cursor/
│       └── rules/
│           └── taskflow.mdc       # Cursor IDE 规则
│
├── docs/                          # Agent-Friendly 文档
│   ├── llms.txt                   # 产品概要（~500 tokens）
│   └── llms-full.txt              # 完整 API 参考（token-optimized）
│
└── README.md                      # 人类可读的使用说明
```

林小明惊讶地发现，Agentify 不只是生成了一个 MCP Server。它生成了一整套 **Agent 接口矩阵**。他看了看每个输出物的注释，理解了为什么需要这么多格式：

**不同的 Agent，消费不同的接口。**

第一个使用场景很快出现了。一个用户在 Claude Code 里开发 TaskFlow 集成。Claude Code 启动时自动读取了 `CLAUDE.md`，知道了这个项目使用 TaskFlow 作为项目管理工具，API Key 存在 `.env` 里，endpoint base URL 是 `https://api.taskflow.dev/v1`。当用户说 "帮我创建一个新的 sprint"，Claude Code 通过 MCP Server 调用了 `create_sprint` tool。整个过程 zero-configuration，因为 context file 已经提供了所有必要的知识。

第二个场景：另一个用户在 Cursor 里写代码。Cursor 加载了 `.cursor/rules/taskflow.mdc`，里面写着 "TaskFlow API 使用 snake_case 参数命名，所有日期字段用 ISO 8601 格式，分页用 cursor-based pagination"。当用户让 Cursor 生成 TaskFlow API 调用代码时，生成的代码自动遵循了这些约定——不再出现 camelCase 参数名被 API 拒绝的尴尬。

第三个场景：有人在 ChatGPT 里问 "TaskFlow 支持哪些 webhook 事件？"。ChatGPT 通过 MCP 连接到 TaskFlow MCP Server，调用了 `list_webhook_events` resource，返回了结构化的事件列表。

第四个场景最让林小明兴奋——一个高级用户在 Claude Code 里说 `/taskflow-quickstart`。Claude Code 加载了对应的 Skill，按照 SKILL.md 里的步骤，自动完成了：安装 SDK、配置环境变量、创建第一个测试项目、验证连接。整个过程像一个有经验的同事在手把手教你。

林小明把 `taskflow-agent-suite/` 推到了 GitHub，在 README 里加了一行：

> **TaskFlow is Agent-Native.** Works with Claude Code, Cursor, ChatGPT, Codex, and any MCP-compatible agent.

一周后，TaskFlow 的 GitHub stars 涨了 300%。他在 Twitter 上看到有人说："终于不用手动翻 TaskFlow 文档了，Agent 直接就能用。" 林小明的 SaaS 从 L1（API 可用）直接跳到了 L4（Agent 原生）——只用了一条命令。

---

## Story 2: Agent 自我进化——"Meta" 循环

### 角色: Claude Code（作为 Agent），开发者张伟（作为用户）

张伟是一个全栈工程师，正在用 Claude Code 构建一个电商平台。他需要集成一个他从没用过的支付网关——PayNow。PayNow 有 REST API 和文档，但没有 MCP Server，没有 Skills，没有 CLAUDE.md。典型的 L1 产品。

张伟对 Claude Code 说：

```
帮我集成 PayNow 支付网关。他们的 API 文档在 https://docs.paynow.io
```

Claude Code 开始工作。它首先尝试搜索 PayNow 的 MCP Server——不存在。尝试查找 PayNow 的 Skills——不存在。尝试读取项目中的 PayNow 相关 context files——不存在。

在 2025 年，故事到这里就卡住了。Agent 只能告诉用户 "请自己去读文档"，然后根据用户粘贴的文档片段尝试写代码。

但现在是 2026 年。Claude Code 的工具箱里有 Agentify 的 MCP Server。

Claude Code 做出了一个关键决策：

```
[Agent 内部推理]
PayNow 没有 Agent 接口。但我有 agentify MCP Server。
让我先分析 PayNow 的 API，生成我需要的接口，然后用它来完成集成。
```

**Step 1: 分析**

Claude Code 调用 Agentify MCP Server 的 `analyze_api` tool：

```json
{
  "tool": "agentify_analyze",
  "input": {
    "source": "https://api.paynow.io/openapi.json",
    "options": { "include_readiness_score": true }
  }
}
```

Agentify 返回了分析结果：PayNow API 有 47 个 endpoints，属于中型 API。Readiness Score: L1（有 API，description 质量中等）。推荐生成策略：Tool Search + Lazy Loading。

**Step 2: 生成**

Claude Code 调用 `agentify_transform` tool，但这次它做了一个聪明的选择——它不需要完整的 agent suite，它只需要能立即使用的接口：

```json
{
  "tool": "agentify_transform",
  "input": {
    "source": "https://api.paynow.io/openapi.json",
    "outputs": ["mcp-server", "skills", "context-files"],
    "strategy": "medium",
    "install": true
  }
}
```

Agentify 生成了：
- 一个 MCP Server（Tool Search 模式，只暴露 `search_tools` 和 `call_tool` 两个 meta-tool）
- 两个 Skills：`/paynow-payment-flow` 和 `/paynow-webhook-setup`
- 一个 `CLAUDE.md` 片段（PayNow API 约定和认证方式）

因为 `install: true`，Agentify 自动将生成的 MCP Server 注册到了当前 session。

**Step 3: 自我使用**

现在 Claude Code 的工具箱里多了 PayNow 的 MCP tools。它回到张伟的原始请求——集成 PayNow 支付网关。

Claude Code 先加载了刚生成的 `/paynow-payment-flow` Skill。Skill 的指令说：

```markdown
## PayNow 支付集成标准流程
1. 创建 PaymentIntent（指定金额、货币、描述）
2. 获取 client_secret 传给前端
3. 前端调用 PayNow.js 的 confirmPayment()
4. 配置 Webhook 接收支付结果通知
5. 在 Webhook handler 中验证签名并更新订单状态
```

Claude Code 按照 Skill 的指引，通过 MCP Server 调用了 PayNow API：
- 调用 `create_payment_intent` 创建了一个测试支付
- 读取了 `webhook_events` resource 了解事件格式
- 用 `CLAUDE.md` 中的认证约定配置了 API Key

最终，Claude Code 为张伟生成了完整的支付集成代码——包括后端 API route、前端支付组件、Webhook handler、错误处理——所有代码都遵循 PayNow 的最佳实践。

张伟看着终端输出，说了一句："等等，你是从哪里学会 PayNow 的？" Claude Code 回答：

```
我使用了 Agentify 分析了 PayNow 的 API 并为自己生成了工具接口和操作指南。
这让我可以像使用 Stripe 一样流畅地使用 PayNow。

生成的文件保存在 .claude/tools/paynow/，你可以在后续 session 中继续使用。
```

这就是 "Meta" 循环的力量：**Agent 用 Agentify 为自己生成工具，然后用这些工具完成用户的任务。** 产品不需要主动 Agent 化——Agent 可以自己把产品 Agent 化。

这个故事揭示了 Agentify 最深层的产品价值：它不只是一个开发者工具，它是 **Agent 的自我进化基础设施**。当 Agentify 作为 MCP Server 被集成到 Agent 生态中，任何 Agent 遇到任何 L1 产品时，都可以自动将其提升到 L3 或 L4。

---

## Story 3: 企业 IT 的 20+ 内部工具全面 Agent 化

### 角色: 王芳，某中型互联网公司 IT 负责人

王芳管理着一个 200 人的技术团队。公司内部有 23 个工具和系统，每个都有 REST API，但 Agent 一个都用不了：

| 系统 | Endpoint 数 | 现状 |
|------|------------|------|
| 内部 JIRA (项目管理) | 87 | 有 OpenAPI spec |
| HR 系统 | 34 | 有 OpenAPI spec |
| 部署平台 | 156 | 有 OpenAPI spec |
| 监控系统 | 210 | 有 Swagger 2.0 |
| 配置中心 | 22 | 有 OpenAPI spec |
| ...其他 18 个系统 | 各异 | 大部分有 API 文档 |

团队的 AI 采纳率很高——80% 的开发者日常使用 Claude Code 或 Cursor。但他们的痛点是：**Agent 只能操作代码和 GitHub，碰到内部系统就 "失明" 了。** 开发者不得不在 Agent 和各种内部 Web 界面之间频繁切换。

王芳决定用 Agentify 做一次批量转型。她创建了一个配置文件：

```yaml
# agentify-batch.yaml
apis:
  - name: jira-internal
    source: https://jira.internal.company.com/api/openapi.json
    auth:
      type: bearer
      env_var: JIRA_TOKEN

  - name: hr-system
    source: https://hr.internal.company.com/api/v2/openapi.json
    auth:
      type: oauth2
      env_var: HR_CLIENT_ID

  - name: deploy-platform
    source: https://deploy.internal.company.com/openapi.json
    auth:
      type: api_key
      env_var: DEPLOY_API_KEY

  # ... 其他 20 个系统

output:
  formats: [mcp-server, skills, context-files, llms-txt]
  strategy: auto  # 自动按 endpoint 数量选择生成策略
```

```bash
npx agentify batch agentify-batch.yaml --output ./agent-suite
```

Agentify 花了 3 分钟处理完所有 23 个 API。输出报告显示：

```
Transformation Complete:

API Analysis:
  - Small APIs (<30 endpoints): 8 systems → Direct Tool strategy
  - Medium APIs (30-100): 11 systems → Tool Search strategy
  - Large APIs (100+): 4 systems → Code Execution strategy

Generated:
  - 23 MCP Servers (auto-configured strategies)
  - 67 Skills (grouped by system + domain)
  - 23 CLAUDE.md files
  - 23 AGENTS.md files
  - 23 llms.txt files
  - 1 unified .env.example (all API keys)
  - 1 docker-compose.yml (all MCP servers)

Security Scan: PASSED (0 critical, 2 warnings)
  - WARNING: hr-system has endpoints returning PII (SSN, salary)
    → Auto-applied: read-only mode, PII fields redacted
  - WARNING: deploy-platform has destructive endpoints (DELETE /deployments/*)
    → Auto-applied: confirmation required via MCP Elicitation
```

王芳注意到安全扫描自动处理了两个关键问题：HR 系统的 PII 数据被自动脱敏，部署平台的危险操作被自动加上了确认机制。这让她省去了至少一周的安全审查时间。

**部署完成后，团队的工作方式发生了根本变化。**

**场景 A: 跨系统 Agent 编排**

开发者刘洋在 Claude Code 里说：

```
我刚修了 JIRA-4521 的 bug。帮我：
1. 把 JIRA ticket 状态改为 "已解决"
2. 在部署平台创建一个 staging 部署
3. 等部署完成后，更新监控系统的告警阈值
```

Claude Code 理解了这是一个跨三个系统的操作。它：
- 通过 JIRA MCP Server 更新了 ticket 状态（Direct Tool Call 模式）
- 通过部署平台 MCP Server 创建了部署（触发了 Elicitation 确认："确认部署到 staging？"）
- 部署平台返回部署 ID 后，通过监控系统 MCP Server 更新了告警配置

三个内部系统，一次对话完成。以前这需要打开三个浏览器 tab，手动操作至少 10 分钟。

**场景 B: 新人入职**

新入职的开发者陈磊打开项目，Claude Code 自动加载了 `CLAUDE.md`：

```markdown
# 公司内部系统 Agent 集成

## 可用的 MCP Servers
- jira-internal: 项目管理（87 endpoints, Tool Search 模式）
- hr-system: 人力资源（只读，PII 已脱敏）
- deploy-platform: 部署管理（destructive 操作需确认）
- monitoring: 监控告警（210 endpoints, Code Execution 模式）
- ...

## 常用 Skills
- /jira-workflow: JIRA 工作流操作指南
- /deploy-staging: Staging 部署标准流程
- /incident-response: 线上事故处理 runbook

## 环境配置
所有 API Key 在 1Password 的 "Agent Keys" vault 中。
运行 `./scripts/setup-agent-env.sh` 自动配置。
```

陈磊不需要读 23 份系统文档。他问 Claude Code "怎么查看我的待办 JIRA tickets？"，Claude Code 通过 JIRA MCP Server 的 `search_tools` 找到了 `list_my_issues` tool，返回了结构化的 ticket 列表。

**场景 C: 混合接口自适应**

高级开发者李华在处理一个复杂的性能问题。她需要同时分析监控数据和部署历史。

监控系统有 210 个 endpoints，Agentify 为它选择了 Code Execution 策略。Claude Code 没有逐一调用 MCP tools，而是写了一段代码通过 SDK 批量查询了过去 7 天的 P99 延迟数据、错误率趋势和资源使用情况。

同时，它用部署平台的 MCP Server（Tool Search 模式）查询了同期的所有部署记录，找到了一个可疑的配置变更。

两种不同的交互模式（Code Execution + Tool Search），由 Agentify 的分层策略自动选择，Agent 无缝切换。李华甚至没有意识到背后的复杂性。

三个月后，王芳看了一下数据：
- 开发者日均 "context switch" 次数从 47 次降到了 12 次
- 内部系统相关的 Agent 交互从 0 增长到日均 2,300 次
- 新人入职到首次独立提交代码的时间从 2 周缩短到了 3 天

她在季度汇报里写道："我们用 Agentify 一条命令把 23 个内部系统从 L1 提升到了 L3。开发者不再需要记住 23 套不同的 Web 界面——Agent 就是他们的统一入口。"

---

## Story 4: 社区贡献者构建新的输出格式插件

### 角色: Alex Chen，开源贡献者

Alex 是一个 Devin 的重度用户。Devin 是 Cognition 的自主编码 Agent，它在一个隔离的云端开发环境中运行，有自己的浏览器、终端、编辑器。但 Devin 配置新项目的环境非常痛苦——每次都要手动安装依赖、配置环境变量、设置服务连接。

Alex 注意到 Agentify 已经能生成 MCP Server、Skills、CLAUDE.md 等多种输出格式，但没有 Devin 专用的环境配置格式。他决定自己做一个。

他在 GitHub 上 fork 了 Agentify，开始研究 Plugin 架构（Phase 2 已实现）。Agentify 的 output format plugin 系统非常简洁：

```typescript
// src/plugins/outputs/devin-env.ts

import { OutputPlugin, TransformContext, OutputResult } from '@agentify/plugin-api'
import { ParsedCapability } from '@agentify/types'

export const devinEnvPlugin: OutputPlugin = {
  name: 'devin-env',
  version: '1.0.0',
  description: 'Generate Devin environment configuration for automated setup',

  // 描述这个 plugin 能生成什么
  outputFormat: {
    id: 'devin-env',
    label: 'Devin Environment Config',
    filePatterns: ['.devin/environment.json', '.devin/setup.sh'],
    category: 'config',  // config | protocol | knowledge | code
  },

  // 核心生成函数：接收 IR，输出文件
  async generate(
    capabilities: readonly ParsedCapability[],
    context: TransformContext
  ): Promise<readonly OutputResult[]> {

    // 从 IR 中提取环境相关信息
    const envVars = extractRequiredEnvVars(capabilities, context.securitySchemes)
    const dependencies = extractDependencies(capabilities)
    const serviceEndpoints = extractEndpoints(context.servers)

    // 生成 Devin 环境配置
    const environmentJson = {
      version: '1.0',
      name: context.apiTitle,
      description: `Auto-generated Devin environment for ${context.apiTitle}`,

      // Devin 的 environment variables
      env: Object.fromEntries(
        envVars.map(v => [v.name, {
          description: v.description,
          required: v.required,
          secret: v.isSecret,
        }])
      ),

      // Devin 需要预装的包
      packages: {
        npm: dependencies.npm,
        pip: dependencies.pip,
        system: dependencies.system,
      },

      // Devin 需要访问的服务
      services: serviceEndpoints.map(ep => ({
        name: ep.name,
        url: ep.url,
        healthCheck: `${ep.url}/health`,
      })),

      // Devin session 启动时自动运行的命令
      onStart: [
        'npm install',
        `echo "Connected to ${context.apiTitle} API"`,
      ],
    }

    // 生成 setup script
    const setupScript = generateSetupScript(envVars, dependencies)

    return [
      {
        path: '.devin/environment.json',
        content: JSON.stringify(environmentJson, null, 2),
      },
      {
        path: '.devin/setup.sh',
        content: setupScript,
        executable: true,
      },
    ]
  },
}
```

Alex 的 Plugin 只有 80 行核心逻辑。它做的事情很简单：
1. 从 Agentify 的 IR（`ParsedCapability[]`）中提取环境配置信息
2. 把这些信息转换为 Devin 理解的 `.devin/environment.json` 格式
3. 生成一个 `setup.sh` 脚本自动配置环境

他写了测试，确保用 Petstore OpenAPI spec 能正确生成 Devin 配置：

```typescript
// test/plugins/devin-env.test.ts

describe('devin-env plugin', () => {
  it('should extract API key env vars from securitySchemes', async () => {
    const capabilities = parsePetstore()
    const result = await devinEnvPlugin.generate(capabilities, petstoreContext)

    const envJson = JSON.parse(
      result.find(r => r.path.endsWith('environment.json'))!.content
    )

    expect(envJson.env.PETSTORE_API_KEY).toEqual({
      description: 'API key for Petstore authentication',
      required: true,
      secret: true,
    })
  })

  it('should generate executable setup script', async () => {
    const result = await devinEnvPlugin.generate(capabilities, petstoreContext)
    const setupResult = result.find(r => r.path.endsWith('setup.sh'))

    expect(setupResult?.executable).toBe(true)
    expect(setupResult?.content).toContain('#!/bin/bash')
  })
})
```

他提交了 PR。Agentify 的维护者 review 后提出了一个建议："能否让 Devin 的 `onStart` 自动安装该产品的 MCP Server？这样 Devin session 启动后就可以直接通过 MCP 操作产品了。" Alex 觉得这个想法太好了——Devin 的环境配置不应该是孤立的，它应该和 MCP Server 联动。

他更新了代码：

```typescript
// 如果同时生成了 MCP Server，在 Devin 启动时自动安装
if (context.generatedOutputs.includes('mcp-server')) {
  environmentJson.onStart.push(
    'cd .agentify/mcp-server && npm install && npm run build',
    'echo "MCP Server ready for Devin"'
  )
  environmentJson.mcpServer = {
    command: 'node',
    args: ['.agentify/mcp-server/dist/server.js'],
    env: envVars.filter(v => v.isSecret).map(v => v.name),
  }
}
```

PR 合并后，Agentify 用户可以这样使用：

```bash
npx agentify transform https://api.example.com/openapi.json --outputs mcp-server,devin-env
```

生成的 `.devin/environment.json` 让 Devin 在创建 session 时自动完成：环境变量配置、依赖安装、MCP Server 启动。Devin 用户从 "花 20 分钟配置环境" 变成了 "零配置开始工作"。

Alex 的 Plugin 在一周内被 47 个 Devin 用户安装。他在 Agentify 的 Discord 上收到了一条消息：

> "你的 devin-env plugin 让我的团队每天节省 40 分钟环境配置时间。我想做一个 Windsurf 版本的，可以参考你的代码吗？"

Alex 回复："当然。Plugin API 就是为此设计的。看 `OutputPlugin` interface 就够了。"

这就是 Agentify Plugin 系统的设计哲学：**核心团队不可能覆盖所有 Agent 平台，但社区可以。** Agentify 提供统一的 IR 和 Plugin API，社区贡献输出格式。每一个新的 Plugin 都让 Agentify 的 "Meta-Tool" 定位更加稳固——它真正成为了连接产品和所有 Agent 平台的桥梁。

两个月后，Agentify 的 Plugin 目录里有了 12 个社区贡献的输出格式：

| Plugin | 贡献者 | 安装量 |
|--------|--------|--------|
| devin-env | Alex Chen | 340+ |
| windsurf-config | Sarah Kim | 280+ |
| langchain-tools | Miguel Santos | 520+ |
| crewai-agents | Priya Patel | 190+ |
| gemini-instructions | Tom Li | 310+ |
| copilot-instructions | Emily Wang | 450+ |
| cline-config | James Park | 160+ |
| a2a-agent-card | Raj Mehta | 230+ |
| composio-connector | Lisa Chen | 170+ |
| terraform-provider | David Lee | 140+ |
| openai-function-defs | Anna Kowalski | 380+ |
| strands-sop | Chris Zhang | 200+ |

每个 Plugin 都是同一个 IR 的不同投影——**一次解析，无限输出**。

---

## 故事总结: 四个维度的价值

| 故事 | 用户角色 | 核心价值 | 成熟度跃迁 |
|------|---------|---------|-----------|
| Story 1 | 独立开发者 | 一条命令，产品全面 Agent 化 | L1 → L4 |
| Story 2 | Agent 自身 | Agent 自我进化，遇到新产品自动适配 | L1 → L3（实时） |
| Story 3 | 企业 IT | 批量转型 + 跨系统编排 + 自动安全扫描 | 23 个系统 L1 → L3 |
| Story 4 | 社区贡献者 | Plugin 生态，社区扩展输出格式 | 平台效应 |

**Agentify 不是 MCP Generator。Agentify 是产品的 Agent 化转型平台。**

就像 Babel 将 ES6+ 转译为所有浏览器能运行的 JavaScript，
Agentify 将 OpenAPI spec 转译为所有 Agent 能消费的接口格式。

**Define Once. Transform Everywhere.**
