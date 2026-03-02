# Agent 可消费的产品输出格式全景图

> 日期: 2026-03-02
> 目标: 系统梳理 AI Agent 消费产品能力的所有接口格式，为 Agentify 的多格式生成引擎提供决策依据。

---

## 核心类比

产品的能力（Capabilities）就像一本书的内容。这本书可以变成：

- **纸质书** → MCP Server（结构化工具调用）
- **有声书** → Natural Language Runbooks（自然语言指令）
- **电子书** → Agent-Friendly Documentation（llms.txt）
- **播客** → Webhooks/Event Streams（事件驱动推送）
- **课程讲义** → Skills / AGENTS.md（项目级指令）
- **API 文档** → SDK / CLI（程序化访问）
- **名片** → A2A Agent Card（身份发现）

Agentify 要做的是：**一份 OpenAPI spec 输入 → N 种 Agent 可消费格式输出**。

---

## 一、MCP Server — Tool Use（工具调用）

### 技术定义
MCP (Model Context Protocol) 是 Anthropic 于 2024 年 11 月发布的开放协议，用于标准化 LLM 与外部工具/数据源的交互。MCP Server 暴露 **Tools**（可执行函数），Agent 通过 JSON-RPC 调用。

### Agent 使用场景
- Agent 需要执行有副作用的操作（创建、更新、删除）
- Agent 需要查询实时数据（搜索、获取状态）
- Agent 需要与第三方服务交互（发邮件、创建 PR、调用支付）

### 产品能力映射
- 每个 API endpoint → 一个 MCP Tool
- 工具参数 → 从 OpenAPI parameters/requestBody 映射
- 工具描述 → 从 OpenAPI description + summary 优化

### 现实案例
- GitHub MCP Server（93 tools，55K tokens context cost）
- Stripe MCP Server
- Slack MCP Server
- Anthropic 官方参考服务器集合

### Agentify 生成策略
- **输入**: OpenAPI spec
- **输出**: 完整的 MCP Server 项目（TypeScript + Dockerfile + .env.example）
- **分层策略**:
  - 小型 API（<30 endpoints）: 每个 endpoint 一个 tool
  - 中型 API（30-100）: Tool Search + Lazy Loading
  - 大型 API（100+）: Code Execution + Docs Search（Stainless 模式）

---

## 二、MCP Resources — Data Access（只读数据访问）

### 技术定义
MCP Resources 是协议中的只读数据原语（read-only primitive），允许 Server 暴露结构化数据供 Client 作为 LLM 上下文使用。每个 Resource 通过唯一 URI 标识，可包含文本或二进制数据。

### Agent 使用场景
- Agent 需要产品的静态配置信息作为上下文
- Agent 需要读取文档、Schema 定义、配置模板
- Agent 需要获取产品元数据（版本、能力列表、限制条件）
- **关键区别**: Resources 是 application-controlled（由客户端应用决定何时使用），Tools 是 model-controlled（由 LLM 决定何时调用）

### 产品能力映射
- API Schema 定义 → Resource（`schema://api/v1`）
- 产品文档 → Resource（`docs://getting-started`）
- 配置模板 → Resource（`config://default`）
- 状态/仪表板数据 → Resource（`status://health`）

### 现实案例
- MCP Filesystem Server 暴露文件系统为 Resources
- Database MCP Server 暴露 table schemas 为 Resources
- Notion MCP Server 暴露页面内容为 Resources

### Agentify 生成策略
- **输入**: OpenAPI spec 中的 GET endpoints + Schema definitions
- **输出**: 在 MCP Server 中注册 Resource handlers
- **映射规则**: 幂等 GET 请求 → Resource，有副作用的请求 → Tool

---

## 三、MCP Prompts — Workflow Templates（工作流模板）

### 技术定义
MCP Prompts 是预定义的 prompt 模板，封装了特定任务的最佳实践工作流。Server 暴露 prompts 列表，Client 可以展示给用户选择或由 Agent 自动使用。

### Agent 使用场景
- Agent 面对复杂的多步骤任务需要引导
- 用户想要快速启动常见工作流（如 "创建 GitHub Release"）
- Agent 需要组合多个 Tools 完成一个业务流程

### 产品能力映射
- 常见 API 使用模式 → Prompt 模板（如 "创建并配置新项目"）
- 多步骤业务流程 → 编排型 Prompt
- 最佳实践操作 → 带参数的 Prompt 模板

### 现实案例
- MCP "Everything" 参考服务器包含示例 Prompts
- Anthropic 官方 MCP Prompts 文档示例

### Agentify 生成策略
- **输入**: OpenAPI spec 中的 endpoint 关联关系 + 常见使用模式
- **输出**: 预定义 Prompt 模板（如 CRUD 工作流、搜索+操作流）
- **智能识别**: 从 endpoint 命名模式推断工作流（create→get→update→delete）

---

## 四、Skills — Agent 技能包（.md 指令文件）

### 技术定义
Skills 是一种跨平台的 Agent 指令格式。核心是一个 `SKILL.md` 文件（YAML frontmatter + Markdown 指令），可选附带 scripts/、references/、assets/ 目录。由 Anthropic 和 OpenAI 共同推动，已成为事实标准。

**格式结构**:
```
skill-name/
├── SKILL.md          # 必须：YAML frontmatter + 指令
├── scripts/          # 可选：辅助脚本
├── references/       # 可选：参考文档
└── assets/           # 可选：资源文件
```

### Agent 使用场景
- Agent 需要遵循特定产品的操作规范
- Agent 需要执行复杂但可复用的工作流
- Agent 需要 progressive disclosure（先看元数据，需要时再加载完整指令）
- 跨 IDE/Agent 共享操作知识（Claude Code、Codex、Cursor 等均支持）

### 产品能力映射
- 产品的安装/配置流程 → Setup Skill
- API 集成最佳实践 → Integration Skill
- 故障排查指南 → Troubleshooting Skill
- 产品特定的代码模式 → Pattern Skill

### 现实案例
- Anthropic 官方 Skills 仓库（github.com/anthropics/skills）
- OpenAI Codex Skills（github.com/openai/skills）
- Speakeasy 生成的 OpenAPI/SDK Skills
- 社区 Skills 生态（awesome-claude-code 集合）

### Agentify 生成策略
- **输入**: OpenAPI spec + 产品文档
- **输出**: 一组 SKILL.md 文件（按功能域分组）
- **分组逻辑**: 按 OpenAPI tags 分组，每个 tag 一个 Skill
- **内容**: 包含 endpoint 使用示例、参数说明、错误处理指引、tool permissions

---

## 五、CLI Tools — Shell 命令（Agent 通过 Bash 执行）

### 技术定义
命令行工具是 Agent 可以通过 `Bash` tool 直接执行的 shell 命令。包括 npm/pip 安装的 CLI 包、shell scripts、或系统原生命令。

### Agent 使用场景
- Agent 在终端环境中操作（Claude Code、Codex CLI、Cline）
- Agent 需要执行构建、测试、部署等开发任务
- Agent 需要执行产品的 CLI 管理命令（如 `stripe listen`、`gh pr create`）
- Agent 没有 MCP 集成但有 shell 访问权限时

### 产品能力映射
- CRUD 操作 → CLI 子命令（`agentify generate`、`agentify analyze`）
- 配置管理 → CLI flags 和 config 文件
- 批量操作 → Pipeline-friendly 输出（JSON stdout）

### 现实案例
- `gh`（GitHub CLI）— 被 Claude Code 大量使用
- `stripe`（Stripe CLI）— 本地开发和测试
- `aws`（AWS CLI）— 云资源管理
- `vercel`（Vercel CLI）— 部署管理

### Agentify 生成策略
- **输入**: OpenAPI spec
- **输出**: 基于 Commander.js/yargs 的 CLI 项目
- **设计原则**:
  - JSON 输出模式（`--json`）供 Agent 解析
  - 子命令映射 API 资源（`cli users list`、`cli users create`）
  - 管道友好（stdin/stdout）

---

## 六、API SDK — 程序化库（TypeScript/Python）

### 技术定义
类型安全的客户端库，封装 HTTP 请求为语言原生的函数调用。Agent 可以在生成的代码中直接 import 使用。

### Agent 使用场景
- Agent 生成应用代码时需要调用产品 API
- Agent 需要类型安全和自动补全
- Agent 编写测试时 mock API 调用
- Agent 构建复合应用时组合多个 SDK

### 产品能力映射
- 每个 API 资源 → SDK 类（如 `client.users`）
- 每个 endpoint → 类方法（如 `client.users.list()`）
- 请求/响应模型 → TypeScript interfaces / Python dataclasses
- 认证 → SDK 构造函数参数

### 现实案例
- Stainless 生成的 SDK（OpenAI、Anthropic、Meta 使用）
- Speakeasy 生成的 SDK（TypeScript、Python、Go 等）
- Fern 生成的 SDK

### Agentify 生成策略
- **输入**: OpenAPI spec
- **输出**: TypeScript SDK 包 / Python SDK 包
- **价值**: SDK 是 MCP Server 的基础层（Speakeasy 的 MCP Server 就是 SDK 的 thin wrapper）
- **优先级**: Phase 2（先有 MCP，再衍生 SDK）

---

## 七、Agent-Friendly Documentation — LLM 优化文档

### 技术定义
专为 LLM 消费优化的文档格式。核心标准是 `llms.txt`（概要+链接）和 `llms-full.txt`（完整内容），由 Jeremy Howard 于 2024 年提出。使用 Markdown 格式，针对 token 效率优化。

### Agent 使用场景
- Agent 需要了解产品概况和能力范围
- Agent 需要查找特定功能的使用方法
- Agent 需要理解产品的限制和最佳实践
- RAG（检索增强生成）系统的文档源

### 产品能力映射
- 产品概述 → llms.txt（精简版，含链接）
- 完整 API 文档 → llms-full.txt（全量内容）
- 教程和指南 → 结构化 Markdown 文件
- API 参考 → 按 endpoint 组织的文档

### 现实案例
- Anthropic 官方文档提供 llms.txt 和 llms-full.txt
- Mintlify 自动生成 llms.txt
- Fern 自动生成 token-optimized llms.txt
- Mastercard Developer Portal 提供 llms.txt

### Agentify 生成策略
- **输入**: OpenAPI spec + 产品文档（如有）
- **输出**:
  - `llms.txt`（概要 + 能力列表 + 链接）
  - `llms-full.txt`（完整 API 参考 + 使用示例）
  - 按功能域分割的 Markdown 文件
- **优化**: Token-efficient 格式、去除冗余 HTML、结构化标题

---

## 八、A2A Agent Cards — Agent 间发现元数据

### 技术定义
A2A (Agent-to-Agent) Protocol 由 Google 发布，Agent Card 是 JSON 元数据文档，描述 Agent 的身份、能力、技能、服务端点和认证要求。发布在 `/.well-known/agent.json` 路径下。

### Agent 使用场景
- 一个 Agent 需要发现并委托任务给另一个 Agent
- Agent 市场/注册中心需要索引可用 Agent
- 多 Agent 编排系统需要自动发现合适的 Agent
- 企业内部 Agent 生态的服务发现

### 产品能力映射
- 产品名称/描述 → Agent Card identity
- API 能力 → Agent Card skills
- 认证方式 → Agent Card authentication（OAuth 2.0、API Key）
- 支持的输入/输出格式 → Agent Card modalities

### 现实案例
- Google Agent Engine 上的 A2A Agent
- A2A 协议官方示例（Purchasing Concierge + Remote Seller）
- 基于 A2A 的企业 Agent 编排方案

### Agentify 生成策略
- **输入**: OpenAPI spec（title、description、servers、securitySchemes）
- **输出**: `/.well-known/agent.json` Agent Card 文件
- **映射**: OpenAPI tags → skills，securitySchemes → authentication
- **签名**: 支持 JWS 数字签名（可选）

---

## 九、Cursor Rules / .cursor/rules/ — IDE Agent 配置

### 技术定义
Cursor IDE 的规则系统，用于持久化 Agent 的行为指令。支持四种层级：Project Rules（`.cursor/rules/*.mdc`）、User Rules（全局设置）、Team Rules（团队共享）、Agent Rules（`AGENTS.md`）。

### Agent 使用场景
- 开发者在 Cursor 中使用产品 API 时需要自动引导
- Agent 需要知道项目中使用的产品版本、配置约定
- Agent 需要产品特定的代码模式和最佳实践
- 基于 glob 模式按文件类型激活不同规则

### 产品能力映射
- 产品的代码风格 → Rule 文件
- API 调用约定 → Rule 文件（如 "始终使用 v2 API"）
- 错误处理模式 → Rule 文件
- 导入路径约定 → Rule 文件

### 现实案例
- awesome-cursorrules 社区收集的规则集
- cursorrules.org 提供 AI 生成的规则文件
- 各框架提供的 .cursorrules（Next.js、Tailwind 等）

### Agentify 生成策略
- **输入**: OpenAPI spec + 产品文档
- **输出**: `.cursor/rules/` 目录下的 `.mdc` 规则文件
- **内容**: API 使用约定、SDK 导入方式、认证配置、常见错误修复

---

## 十、CLAUDE.md / AGENTS.md — 项目级 Agent 上下文

### 技术定义
项目根目录下的 Markdown 文件，为 AI coding agent 提供项目级别的上下文和指令。`CLAUDE.md` 是 Claude Code 特有格式，`AGENTS.md` 是跨平台开放标准（Cursor、Codex、Kilo Code 等均支持）。

### Agent 使用场景
- Agent 首次进入项目时需要了解项目结构和约定
- Agent 需要知道构建、测试、部署命令
- Agent 需要了解项目中使用的产品 API 配置
- 不同子目录可有不同的 AGENTS.md（最近的优先）

### 产品能力映射
- 产品集成指南 → CLAUDE.md 中的 "API Integration" 章节
- 环境变量配置 → CLAUDE.md 中的 "Environment" 章节
- 产品特定的测试策略 → CLAUDE.md 中的 "Testing" 章节
- 常见问题 → CLAUDE.md 中的 "Troubleshooting" 章节

### 现实案例
- AGENTS.md 官方标准（agents.md/）
- Claude Code 项目中的 CLAUDE.md
- Factory AI 的 AGENTS.md 支持
- Kilo Code 的 AGENTS.md 支持

### Agentify 生成策略
- **输入**: OpenAPI spec + 产品文档
- **输出**:
  - `CLAUDE.md`（Claude Code 格式）
  - `AGENTS.md`（跨平台格式）
- **内容**: 产品概述、API 配置、SDK 使用、环境变量、常见操作

---

## 十一、Webhooks / Event Streams — 响应式 Agent 触发器

### 技术定义
Webhooks 是 HTTP 回调机制，当事件发生时主动推送通知。SSE (Server-Sent Events) 和 WebSocket 提供持续的事件流。MCP 的 Streamable HTTP transport 也支持事件推送。

### Agent 使用场景
- Agent 需要对产品事件做出实时响应（如 "代码合并时自动部署"）
- Agent 需要监控产品状态变化（如 "订单状态更新时通知客户"）
- Ambient Agent 模式 — Agent 持续运行，被事件唤醒
- 多 Agent 编排中的事件驱动协调

### 产品能力映射
- 产品的 Webhook 事件 → Agent 触发器
- 状态变更通知 → Agent 响应逻辑
- 实时数据流 → Agent 持续处理

### 现实案例
- GitHub Webhooks → CI/CD Agent 触发
- Stripe Webhooks → 支付处理 Agent
- Slack Events API → 聊天机器人 Agent
- Moveworks Ambient Agent Webhook Triggers

### Agentify 生成策略
- **输入**: OpenAPI spec 中的 callback/webhook 定义
- **输出**:
  - Webhook handler 模板（Express/Fastify）
  - Event type 定义
  - Agent 响应逻辑骨架
- **优先级**: Phase 2（需要 OpenAPI 3.1 callbacks 支持）

---

## 十二、Natural Language Runbooks — Agent 自然语言操作手册

### 技术定义
结构化的 Markdown 文档，用自然语言描述 Agent 执行任务的步骤。AWS 的 Strands Agent SOPs 是代表性实现——标准化的 Markdown 格式，定义 AI Agent 工作流，可跨不同 AI 系统复用。

### Agent 使用场景
- Agent 执行复杂的多步骤运维任务
- Agent 处理故障排查和事件响应
- Agent 执行需要决策点的非线性工作流
- Agent 在缺乏 MCP/API 集成时通过自然语言指令操作

### 产品能力映射
- 产品的安装部署流程 → Deployment Runbook
- 故障排查步骤 → Troubleshooting Runbook
- 日常运维任务 → Operations Runbook
- 安全事件响应 → Incident Response Runbook

### 现实案例
- AWS Strands Agent SOPs（标准化 Markdown 工作流）
- HCL BigFix Runbook AI（GenAI-powered runbook automation）
- Cutover AI-enabled Runbooks
- Ada Playbooks（从 SOP 自动转换为可执行步骤）

### Agentify 生成策略
- **输入**: OpenAPI spec + 产品文档
- **输出**: 按场景分组的 Runbook 文件集
- **格式**: AWS Strands SOP Markdown 格式（兼容性最好）
- **内容**: 前置条件、步骤、决策点、验证检查、回滚步骤

---

## 十三、Database Access Layers — 结构化查询接口

### 技术定义
通过 MCP 或直接连接暴露数据库查询能力。Agent 可以执行 text-to-SQL，直接查询产品数据而非通过 API 封装。

### Agent 使用场景
- Agent 需要执行复杂数据分析（聚合、JOIN、窗口函数）
- Agent 需要访问 API 未暴露的数据
- Agent 进行数据探索和 ad-hoc 查询
- 比 API 调用更快的数据访问（减少网络开销）

### 产品能力映射
- 产品数据库 Schema → 查询接口
- 常用查询 → 预定义视图/函数
- 数据分析需求 → 只读查询权限

### 现实案例
- Postgres MCP Pro Server（读写 + 性能分析）
- SQLite MCP Server（轻量级本地数据库）
- DBHub（通用数据库 MCP Server，text-to-SQL）
- Google MCP Toolbox for Databases

### Agentify 生成策略
- **输入**: OpenAPI spec 中的数据模型 + 数据库 Schema（如提供）
- **输出**:
  - Database MCP Server 配置
  - 只读视图定义
  - 安全策略（只允许 SELECT）
- **优先级**: Phase 2（需要数据库连接信息，安全风险较高）

---

## 十四、Configuration Generators — 环境与基础设施配置

### 技术定义
自动生成产品所需的配置文件，包括 `.env`、`docker-compose.yml`、Terraform 配置、Kubernetes manifests 等。

### Agent 使用场景
- Agent 设置开发环境时需要正确的环境变量
- Agent 部署产品时需要 Docker/K8s 配置
- Agent 管理多环境（dev/staging/prod）配置
- Agent 执行基础设施变更

### 产品能力映射
- API 密钥和端点 → `.env` / `.env.example`
- 服务依赖关系 → `docker-compose.yml`
- 云资源需求 → Terraform/Pulumi 配置
- 运行时配置 → JSON/YAML 配置文件

### 现实案例
- Workik Terraform 代码生成器
- Docker AI 辅助的 Compose 文件生成
- Vercel 自动环境配置
- AWS CDK AI 生成

### Agentify 生成策略
- **输入**: OpenAPI spec（servers、securitySchemes）+ 产品部署文档
- **输出**:
  - `.env.example`（所有需要的环境变量）
  - `docker-compose.yml`（产品依赖的服务）
  - `Dockerfile`（生成的 MCP Server 的容器化）
- **优先级**: Phase 0.5 已包含基础版本（.env.example + Dockerfile）

---

## 十五、GPT Actions / Custom GPTs — ChatGPT 生态集成

### 技术定义
OpenAI 的 Custom GPT 系统允许通过 OpenAPI spec 定义 Actions，使 ChatGPT 可以调用外部 API。虽然独立的 Actions 功能已弃用，但 Custom GPTs 仍然使用 OpenAPI 格式定义 API 集成。ChatGPT 开发者模式现已支持 MCP。

### Agent 使用场景
- 用户在 ChatGPT 中需要与产品交互
- 企业构建内部 Custom GPT 集成产品能力
- ChatGPT 用户通过自然语言操作产品

### 产品能力映射
- API endpoints → GPT Actions（OpenAPI 格式）
- 认证流程 → GPT Action OAuth 配置
- 常见操作 → GPT Instructions

### 现实案例
- 各类 Custom GPTs（数万个已发布）
- ChatGPT 开发者模式 MCP 支持

### Agentify 生成策略
- **输入**: OpenAPI spec（已有，天然兼容）
- **输出**:
  - 针对 GPT Actions 优化的 OpenAPI subset
  - GPT Instructions 文本
  - 认证配置指引
- **说明**: GPT Actions 本质就是 OpenAPI，所以 Agentify 的核心能力天然覆盖

---

## 十六、Function Calling Schemas — LLM 原生工具定义

### 技术定义
LLM 提供商（OpenAI、Anthropic、Google）各自的 tool/function 定义格式。Agent 框架（LangChain、CrewAI、AutoGen）将这些格式封装为统一的 tool 接口。

### Agent 使用场景
- Agent 框架需要注册产品能力为可调用工具
- 开发者在 Agent 代码中直接定义产品相关的 function
- 不使用 MCP 但使用 Agent 框架时的替代方案

### 产品能力映射
- API endpoints → Function definitions（JSON Schema）
- 参数 → Function parameters（strict mode 验证）
- 返回值 → Function result schema

### 现实案例
- OpenAI Function Calling（tools parameter）
- Anthropic Tool Use（同遵循 MCP 格式）
- Google Vertex AI Function Calling
- Amazon Bedrock Agent Actions（OpenAPI schema）

### Agentify 生成策略
- **输入**: OpenAPI spec
- **输出**:
  - OpenAI function calling JSON schema
  - Anthropic tool use schema
  - LangChain tool definitions
- **优先级**: Phase 1（MCP 优先，框架适配随后）

---

## 十七、Composio-style Unified Connectors — 统一集成连接器

### 技术定义
Composio 等平台提供的预构建集成连接器，封装 OAuth、API 调用、数据转换为 LLM-ready 的工具。支持 850+ 服务，一行代码完成集成。

### Agent 使用场景
- Agent 需要快速连接多个 SaaS 服务
- Agent 需要处理复杂的 OAuth 认证流程
- 多 Agent 系统需要统一的工具访问层

### 产品能力映射
- 产品 API → Composio connector definition
- OAuth 流程 → 自动化认证处理
- Webhook 事件 → 触发器注册

### 现实案例
- Composio（850+ connectors，25+ Agent 框架）
- Toolhouse
- AgentOps

### Agentify 生成策略
- **输入**: OpenAPI spec + securitySchemes
- **输出**: Composio connector 定义文件
- **优先级**: Phase 2（生态集成）

---

## 十八、MCP Elicitation — Agent 交互式信息收集

### 技术定义
MCP 2025-06-18 规范引入的特性。允许 MCP Server 在执行过程中向 Client 请求额外信息，Server 定义 schema 描述需要的输入结构，Client 通过用户交互收集信息后返回。

### Agent 使用场景
- Agent 执行操作前需要用户确认（如 "确认删除这个资源？"）
- Agent 需要选择性地启用产品功能（如 "选择要生成的 endpoint"）
- 多步骤流程中动态收集参数

### 产品能力映射
- 需要确认的危险操作 → Elicitation 确认流
- 多选项配置 → Elicitation 选择流
- 动态参数收集 → Elicitation 表单流

### 现实案例
- MCP 官方 Elicitation 规范示例
- Agentify 自身规划的 Elicitation 支持（Phase 1）

### Agentify 生成策略
- **输入**: OpenAPI spec 中的危险操作标记 + 复杂参数
- **输出**: MCP Elicitation handler 在生成的 Server 中
- **优先级**: Phase 1（SYNTHESIS.md 已列为亮点特性）

---

## 十九、MCP Sampling — 服务端 LLM 调用

### 技术定义
MCP Sampling 允许 Server 请求 Client 进行 LLM 调用。这使得 MCP Server 可以利用 Client 的 LLM 能力进行智能决策，而不需要自己维护 LLM 连接。

### Agent 使用场景
- MCP Server 需要对 API 响应做智能摘要
- MCP Server 需要将自然语言查询转换为结构化参数
- MCP Server 需要对复杂数据做分类或判断

### 产品能力映射
- 复杂查询转换 → Sampling（自然语言 → API 参数）
- 响应摘要 → Sampling（长 JSON → 人类可读摘要）
- 智能路由 → Sampling（判断使用哪个 endpoint）

### 现实案例
- MCP 官方 Sampling 规范
- AI 辅助的 text-to-SQL 查询

### Agentify 生成策略
- **输入**: OpenAPI spec 中的复杂参数和响应
- **输出**: Sampling 调用点在生成的 MCP Server 中
- **优先级**: Phase 2（高级特性）

---

## 二十、OpenAPI Spec 本身 — 通用产品能力描述

### 技术定义
OpenAPI Specification (OAS) 3.x 是描述 HTTP API 的标准格式。它本身就是所有其他格式的 **源格式**（source of truth），可被 LLM 直接消费，也可被工具链转换为其他格式。

### Agent 使用场景
- Agent 直接解析 OpenAPI spec 理解产品能力
- Agent 使用 OpenAPI 生成 HTTP 请求
- Agent 框架将 OpenAPI operations 自动转换为 tools
- Amazon Bedrock 直接使用 OpenAPI 定义 Agent Actions

### 产品能力映射
- **本身就是产品能力的完整描述**

### 现实案例
- ChatGPT Actions（直接使用 OpenAPI）
- Amazon Bedrock Agent Actions（要求 OAS 3.0.0）
- OpenAI Agents SDK + MCP（通过 OpenAPI 发现工具）

### Agentify 生成策略
- **输入**: 这就是 Agentify 的输入
- **输出**: 优化后的 OpenAPI spec（agent-optimized descriptions、token-efficient 格式）
- **价值**: Agentify 的第一步就是 "改善 OpenAPI spec 的 Agent 可消费性"

---

## 总结对照表

| # | 格式 | 协议/标准 | Agent 操作类型 | Agentify 优先级 | 输入源 | 输出物 |
|---|------|-----------|---------------|----------------|--------|--------|
| 1 | **MCP Server (Tools)** | MCP | 执行操作 | **Phase 0.5** | OpenAPI spec | TypeScript MCP Server 项目 |
| 2 | **MCP Resources** | MCP | 读取数据 | **Phase 0.5** | OpenAPI GET endpoints + Schemas | Resource handlers |
| 3 | **MCP Prompts** | MCP | 工作流引导 | Phase 1 | Endpoint 关联模式 | Prompt 模板 |
| 4 | **Skills (.md)** | 开放标准 | 指令执行 | Phase 1 | OpenAPI + 文档 | SKILL.md 文件集 |
| 5 | **CLI Tools** | Shell | 命令执行 | Phase 1 | OpenAPI spec | Commander.js CLI 项目 |
| 6 | **API SDK** | Language-native | 代码调用 | Phase 2 | OpenAPI spec | TypeScript/Python 包 |
| 7 | **Agent-Friendly Docs** | llms.txt | 上下文读取 | **Phase 0.5** | OpenAPI + 文档 | llms.txt + llms-full.txt |
| 8 | **A2A Agent Card** | A2A Protocol | 服务发现 | Phase 1 | OpenAPI metadata | agent.json |
| 9 | **Cursor Rules** | .cursor/rules/ | IDE 配置 | Phase 1 | OpenAPI + 文档 | .mdc 规则文件 |
| 10 | **CLAUDE.md / AGENTS.md** | 开放标准 | 项目上下文 | Phase 1 | OpenAPI + 文档 | CLAUDE.md + AGENTS.md |
| 11 | **Webhooks / Events** | HTTP Callbacks | 事件触发 | Phase 2 | OpenAPI callbacks | Webhook handler 模板 |
| 12 | **NL Runbooks** | Strands SOP | 流程执行 | Phase 1 | OpenAPI + 文档 | Markdown runbooks |
| 13 | **Database Access** | MCP + SQL | 数据查询 | Phase 2 | DB Schema | Database MCP Server |
| 14 | **Config Generators** | 多种 | 环境配置 | **Phase 0.5** | OpenAPI servers/security | .env + Dockerfile + docker-compose |
| 15 | **GPT Actions** | OpenAPI subset | ChatGPT 集成 | Phase 1 | OpenAPI spec | 优化的 OAS + Instructions |
| 16 | **Function Calling Schemas** | 各 LLM 提供商 | 工具调用 | Phase 1 | OpenAPI spec | JSON Schema 定义 |
| 17 | **Unified Connectors** | Composio 等 | 平台集成 | Phase 2 | OpenAPI + OAuth | Connector 定义 |
| 18 | **MCP Elicitation** | MCP | 交互确认 | Phase 1 | OpenAPI 危险操作 | Elicitation handlers |
| 19 | **MCP Sampling** | MCP | 智能推理 | Phase 2 | 复杂参数/响应 | Sampling 调用点 |
| 20 | **优化的 OpenAPI Spec** | OAS 3.x | 通用描述 | **Phase 0.5** | 原始 OpenAPI | Agent-optimized OAS |

---

## 格式生态关系图

```
                    OpenAPI Spec (输入源)
                           │
                    ┌──────┼──────┐
                    ▼      ▼      ▼
              [解析层]  [增强层]  [安全层]
                    │      │      │
                    └──────┼──────┘
                           │
                     Agentify IR
                    (ParsedCapability[])
                           │
            ┌──────────────┼──────────────┐
            │              │              │
       ┌────┴────┐   ┌────┴────┐   ┌────┴────┐
       │ MCP 族  │   │ 文档族  │   │ 代码族  │
       │         │   │         │   │         │
       │ Server  │   │llms.txt │   │ SDK     │
       │Resources│   │Runbooks │   │ CLI     │
       │ Prompts │   │CLAUDE.md│   │ Actions │
       │Elicitat.│   │AGENTS.md│   │ Schemas │
       │Sampling │   │ Cursor  │   │Connector│
       └─────────┘   │ Skills  │   └─────────┘
                      └─────────┘
                           │
                      ┌────┴────┐
                      │ 运维族  │
                      │         │
                      │ Config  │
                      │Webhooks │
                      │Database │
                      │A2A Card │
                      └─────────┘
```

---

## Agentify 的核心洞察

### 1. 所有格式共享同一个 IR
无论输出什么格式，输入都是 OpenAPI spec，中间表示都是 `ParsedCapability[]`。这意味着 Agentify 的核心价值在于 **解析+增强** 层，而非某个特定的输出格式。

### 2. MCP 是 2026 年的事实标准，但不是唯一标准
MCP 覆盖了 Tool Use、Resources、Prompts、Elicitation、Sampling 五大原语，是最完整的 Agent 接口协议。但 Skills、AGENTS.md、llms.txt 等格式在 IDE Agent 和文档 Agent 场景中同样重要。

### 3. 输出格式有自然分层
- **Phase 0.5 必做**: MCP Server（Tools + Resources）、Config、Agent-Friendly Docs、优化 OpenAPI
- **Phase 1 扩展**: Skills、AGENTS.md、CLAUDE.md、Cursor Rules、CLI、A2A Card、Prompts、Elicitation、Function Calling Schemas、GPT Actions、Runbooks
- **Phase 2 深化**: SDK、Webhooks、Database Access、Sampling、Unified Connectors

### 4. 格式之间不是替代关系，而是互补关系
一个产品的完整 Agent 化需要同时提供多种格式。就像一本书同时有纸质版、电子版、有声版一样——不同场景下用不同格式。

### 5. Agentify 的差异化在于"全覆盖"
市面上的工具要么只做 MCP（如各类 MCP generator），要么只做 SDK（如 Stainless/Speakeasy），要么只做文档（如 Mintlify）。Agentify 是唯一一个 **从同一输入生成所有格式** 的平台。这正是 "Meta-Tool" 定位的核心竞争力。
