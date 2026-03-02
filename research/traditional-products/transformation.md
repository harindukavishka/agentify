# 传统产品的 Agent 化转型研究报告

> 研究日期：2026 年 3 月 | 研究范围：SaaS、数据库、开发者工具、通信工具、企业软件、云服务

---

## 目录

1. [概述：传统产品为什么需要 Agent 化](#概述)
2. [SaaS 产品的 Agent 化](#1-saas-产品的-agent-化)
3. [数据库的 Agent 化](#2-数据库的-agent-化)
4. [开发者工具的变革](#3-开发者工具的变革)
5. [通信工具的适配](#4-通信工具的适配)
6. [企业软件（CRM/ERP）的转型](#5-企业软件crmerp的转型)
7. [云服务的 Agent 集成](#6-云服务的-agent-集成)
8. [具体案例分析](#7-具体案例分析)
9. [协议之争：MCP vs A2A](#8-协议之争mcp-vs-a2a)
10. [MCP Gateway 与安全层](#9-mcp-gateway-与安全层)
11. [传统产品 Agent 化的通用模式](#传统产品-agent-化的通用模式)
12. [对 Agentify 的启示](#对-agentify-的启示)

---

## 概述

2026 年，AI Agent 从实验走向生产。据 Gartner 预测，到 2026 年底将有 **40% 的企业应用集成 AI Agent**，而 2025 年这个数字还不到 5%。这意味着传统产品面临一个根本性的转变：它们的用户不再只是人类，还包括 **AI Agent**。

**Model Context Protocol (MCP)** 是 Anthropic 于 2024 年 11 月开源的协议，被称为 "AI 的 USB-C"。它定义了 AI Agent 如何安全地发现和使用外部工具、数据源和服务的标准接口。到 2026 年初，MCP 已经成为事实上的 Agent-Tool 集成标准，几乎所有主流产品都在以某种方式接入。

核心趋势：

- **从 API-first 到 Agent-first**：产品不再只是暴露 REST API，而是提供 MCP Server 或 Agent-friendly 的接口
- **从 GUI 操作到自然语言指令**：用户通过 Agent 发出自然语言指令，产品需要理解并执行
- **从人机交互到 Agent-Agent 协作**：产品需要支持 Agent 间的协作（A2A Protocol）
- **从静态集成到动态发现**：Agent 需要在运行时动态发现工具能力（Tool Discovery）

---

## 1. SaaS 产品的 Agent 化

### 1.1 Notion：从笔记工具到 Agent 平台

Notion 是传统 SaaS 产品 Agent 化的标杆案例：

- **Notion 3.0 (2025.09)**：推出 Agents 功能，AI 可以访问 workspace 数据
- **Notion 3.2 (2026.01)**：Mobile AI、新模型支持、people directory
- **Notion 3.3 (2026.02)**：**Custom Agents** - 真正的突破
  - 完全自主运行（autonomous），无需手动 prompting
  - 可设置 trigger 或 schedule，24/7 完成工作
  - 可自动化 task triaging、内部 Q&A、daily standups、status reports
  - **MCP 集成**：支持预配置的 MCP 集成（Linear、Figma、HubSpot 等）和自定义 MCP Server 连接
  - 权限控制：像真正的 teammate 一样管理权限
  - 商业模式：Business 和 Enterprise 计划的 add-on，使用 Notion credits 计费

**关键洞察**：Notion 的策略是把自己从"工具"变成"Agent 的工作空间"——Agent 在 Notion 里工作，就像人类在 Notion 里工作一样。

### 1.2 Slack：Agent 的通信枢纽

Slack 推出了**官方的 first-party MCP Server**，是目前最成熟的通信集成方案：

- 支持 channels、threads、direct messages、file uploads
- AI Agent 可以搜索 channels、发送消息、执行 Slack actions
- 与 MCP clients（Cursor、Claude Desktop 等）直接集成

### 1.3 GitHub：代码仓库的 Agent 化

GitHub 的 MCP 实现让 Agent 能够：

- 在 repository 中自主执行、测试和提交代码更改
- 管理 issues、pull requests 和 code reviews
- 这是 DevOps 自动化的重大飞跃

### 1.4 Figma：设计工具的双向 Agent 接口

Figma 提供两种 MCP Server：

- **Remote MCP Server**：直接连接 Figma 托管的 endpoint
- **Desktop MCP Server**：通过本地 Figma Desktop App 运行
- **Figma Codex Integration (2026.02)**：与 OpenAI 合作的双向 MCP Server，打通设计与代码
- Agent 可以自主完成 QA、asset organization、developer handoff

### 1.5 HubSpot：CRM 的自然语言接口

HubSpot 推出了 **public beta MCP Server**：

- AI Agent（如 Claude）可以通过自然语言原生地读取、搜索和管理 CRM 数据
- 非技术用户无需编写 API 代码或管理 middleware
- 颠覆了传统 CRM 的使用方式

---

## 2. 数据库的 Agent 化

### 2.1 Supabase：最完整的数据库 MCP 方案

Supabase 是数据库 Agent 化的领先者：

- **官方 MCP Server**：暴露 20+ 工具，让 AI 助手可以：
  - 查询数据库
  - 检查 schema
  - 管理表
  - 生成 migrations
  - 与 Edge Functions 交互
- **MCP Authentication**：基于 OAuth 的 MCP 认证方案
- **安全机制**：read_only 模式，限制 INSERT/UPDATE/DELETE/DDL 操作
- 与 Cursor、Claude、Windsurf、VS Code (CoPilot)、Cline 等工具集成

### 2.2 PostgreSQL：通用型 MCP 接入

多个 PostgreSQL MCP Server 选项：

- **Anthropic 官方**：基础的 PostgreSQL MCP Server
- **Postgres MCP Pro (CrystalDBA)**：增加了性能分析和优化工具，超越了简单的查询执行
- **Neon**：Serverless Postgres 的 MCP 集成
- **Google Cloud MCP Toolbox for Databases**：支持 Cloud SQL、Spanner、AlloyDB、BigQuery 等

### 2.3 MongoDB：向量数据库与 Agent 的融合

MongoDB MCP Server（2026 冬季版更新）：

- **自动 embedding 生成**：insert-many 工具支持为带有 vector search index 的字段自动生成 embeddings（使用 Voyage AI 的模型）
- **统一索引创建**：CreateIndexTool 同时支持传统索引和 vector search 索引
- **本地集群管理**：简化开发环境设置
- **与 Microsoft Foundry 集成**：Agent 可以访问实时运营数据，而非静态的 vector store

**关键洞察**：数据库的 Agent 化不只是 "让 AI 写 SQL"，而是让 Agent 成为数据库的一等公民——能理解 schema、优化查询、管理 migration、甚至自动生成 embeddings。

---

## 3. 开发者工具的变革

### 3.1 IDE 的 Agent 化分野

2026 年 IDE 领域出现了两种哲学：

| 特性 | Claude Code | Cursor |
|------|------------|--------|
| 核心理念 | Agent-first | IDE-first |
| 自主性 | 高：AI 自主操作文件、执行命令 | 中：用户确认每个更改 |
| MCP 支持 | 原生支持 | 支持（最多 40 个工具集成） |
| 形态 | VS Code 扩展 + Desktop App + Browser IDE | Fork of VS Code |
| CLI | 原生 CLI | 2026.01 新增 CLI |
| 适用场景 | 大型架构工作 | 逐行精细控制 |

**开发者的最佳实践**：两者结合使用——Claude Code 做架构级别的工作，Cursor 做逐行打磨。

### 3.2 MCP 作为开发者工具的标准接口

- **GitKraken MCP Server**：Git 操作的 MCP 接口
- **Red Hat MCP Servers**：在 VS Code 和 Cursor 中实现 root-cause analysis
- **Arcade Tools**：跨 Cursor、VS Code 和其他 MCP-enabled 应用的通用工具层

### 3.3 Agent-Friendly CLI

CLI 工具正在变得 Agent-friendly：

- Claude Code 本身就是一个 Agent CLI
- Cursor 在 2026 年 1 月推出了 CLI，支持 agent modes 和 cloud handoff
- AWS Agent Plugins (2026.02)：开源的 coding agent 扩展，提供 AWS 特定技能

---

## 4. 通信工具的适配

### 4.1 统一通信层

通信工具的 Agent 化核心在于**跨渠道一致性**：

- 用户可以在 Slack 开始请求 → 通过 email 跟进 → 在 ServiceNow 触发操作
- Agent 在不同渠道之间保持上下文
- Red Hat 的 IT self-service agent 展示了这种跨渠道模式

### 4.2 Email 的 Agent 化

- **AgentMail**：为 AI Agent 提供专属 email inbox
  - 一次性地址（disposable addresses）
  - 结构化解析（structured parsing）
  - Webhook 通知
  - 专为 agent workflow 设计
- **Gmail MCP**：通过 MCP 连接到 Gmail，实现邮件的读取、搜索和管理

### 4.3 日历和调度

- MCP servers for email/calendar 特别适合 executive assistants、scheduling bots
- Agent 可以跨 email 和 calendar 协调调度

### 4.4 消息平台

MCP servers for communication 是标准化的连接器，让 AI Agent 在 Slack、email、Discord、SMS 等平台上读取和发送消息——通过标准 tool calls 获得消息能力。

---

## 5. 企业软件（CRM/ERP）的转型

### 5.1 Salesforce：Agentic Enterprise 的领导者

Salesforce 是企业软件 Agent 化最激进的推动者：

**Agentforce 架构**：
- **Supervisor Agent**：作为单一入口，将请求路由到 Specialist Agents
- **MCP Client**：通过 MuleSoft 作为 MCP wrapper，连接非 MCP-enabled 的 API
- **Data 360**：数据虚拟化层，为 Agent 提供个性化上下文
- **Agent Protocol Gateway**：桥接 MCP 到内部 API 和事件

**业务数据**：
- Q4 2026 财报：Agentic AI 驱动营收超预期
- 平台处理了 **11.14 万亿 tokens**（单季度），说明客户已从"测试"转向"生产部署"
- Multi-Agent 采用率预计到 2027 年增长 67%

**核心挑战**：平均企业运行 **957 个应用**，但只有 **27% 集成**——一半的 Agent 运行在断开的孤岛中。

### 5.2 Oracle 和 SAP

- **Oracle**：将 role-based AI agents 直接嵌入 ERP 和 Supply Chain 软件，**无额外费用**
- **SAP**：Joule AI assistant 原生集成 inventory 和 logistics 数据，在制造和零售领域优势明显

### 5.3 CRM-ERP 集成市场

Salesforce 和 SAP 集成市场预计从 2023 年的 **$15.4B** 增长到 2028 年的 **$38.4B**。使用 AI-powered 集成的企业报告：
- 工作流周期加快 20-30%
- 重复任务时间减少 25-40%

---

## 6. 云服务的 Agent 集成

### 6.1 AWS：最广泛的 MCP 生态

- **60+ 官方 MCP Servers**：覆盖 documentation、infrastructure、deployment、containers、Lambda、AI/ML、data & analytics、messaging、cost analysis 等
- **Agent Plugins for AWS (2026.02.17)**：开源项目，扩展 coding agents 的 AWS 技能
- **Bedrock AgentCore**：企业级 MCP orchestration，作为 context manager，routing queries、维护 multi-session memory、分配 agent 任务

### 6.2 Azure：企业级 MCP 集成

- **Azure AI Foundry Service**：原生支持 MCP，消除自定义代码需求
- 支持与数据源和 workflow 的无缝连接
- 企业级安全保障

### 6.3 Google Cloud：多层 MCP 方案

- **官方 Google Cloud MCP Servers (2025.12)**：remote MCP servers（仍在 preview 阶段）
- **MCP Toolbox for Databases (2025.07)**：简化 AI Agent 访问 Cloud SQL、Spanner、AlloyDB、BigQuery
- **Vertex AI**：通过 Agent Development Kit (ADK) 提供原生 MCP

### 6.4 Cloudflare：边缘 MCP

Cloudflare 的 MCP 方案开创了 **edge orchestration for AI agents** 的新领域——在边缘网络分发计算和上下文数据流，改善延迟和隐私。

### 6.5 跨云协作

AWS 和 Google Cloud 发起了联合多云合作，简化云平台互联，multicloud networking 产品将在 2026 年加入 Microsoft Azure。

---

## 7. 具体案例分析

### 已提供官方 MCP Server 的产品

| 产品 | 类别 | MCP 接入方式 | 状态 |
|------|------|-------------|------|
| Notion | 协作/笔记 | 官方 MCP + Custom Agents | GA |
| Slack | 通信 | First-party MCP Server | GA |
| GitHub | 代码托管 | 官方 MCP Server | GA |
| Figma | 设计 | Remote + Desktop MCP Server | GA |
| HubSpot | CRM | Public Beta MCP Server | Beta |
| Supabase | 数据库 | 官方 MCP Server (20+ tools) | GA |
| MongoDB | 数据库 | 官方 MCP Server | GA |
| PostgreSQL | 数据库 | 多个 MCP Server (Anthropic官方 + 社区) | GA |
| Salesforce | CRM/Enterprise | Agentforce MCP Client + Gateway | GA |
| AWS | 云服务 | 60+ 官方 MCP Servers | GA |
| Azure | 云服务 | AI Foundry MCP Support | Preview |
| Google Cloud | 云服务 | 官方 MCP Servers + Toolbox | Preview |
| Linear | 项目管理 | 通过 Notion MCP 集成 | GA |
| Cloudflare | 边缘计算 | Edge MCP Orchestration | GA |
| Databricks | 数据平台 | Mosaic Framework MCP | GA |

### 聚合平台（Meta-Integration Layer）

| 平台 | 连接应用数 | 特点 |
|------|-----------|------|
| Composio (Rube) | 500+ | Universal MCP Server，一次认证即可使用 |
| Zapier | 数千 | 将 Zapier workflows 暴露给 GenAI 系统 |
| MuleSoft (Salesforce) | 企业级 | 为非 MCP-enabled API 提供 MCP wrapper |
| LlamaIndex | N/A | MCP-compatible context server，连接结构化和非结构化数据 |

---

## 8. 协议之争：MCP vs A2A

### MCP (Model Context Protocol) - Anthropic

- **关注点**：Agent 如何访问工具和数据（垂直连接）
- **类比**：Agent 的 "USB-C"
- **功能**：Tool discovery、tool execution、data access、prompt templates
- **适用场景**：单个 Agent 连接外部服务

### A2A (Agent2Agent Protocol) - Google

- **发布时间**：2025 年 4 月
- **支持者**：50+ 科技巨头（Atlassian、Salesforce、PayPal 等）
- **关注点**：Agent 之间如何通信和协作（水平连接）
- **核心机制**：Agent Card（JSON 元数据文档，描述 Agent 的能力、技能和联系方式）
- **适用场景**：多个 Agent 协作完成复杂任务

### 互补关系

MCP 和 A2A **不是竞争关系，而是互补**：

```
┌─────────────────────────────────────────┐
│           A2A (Agent-to-Agent)          │
│  Agent A  <────────────>  Agent B       │
│     │                        │          │
│     │ MCP                    │ MCP      │
│     ▼                        ▼          │
│  [Tools]                  [Tools]       │
│  [Data]                   [Data]        │
│  [Services]               [Services]   │
└─────────────────────────────────────────┘
```

- **MCP**：解决 Agent 与工具之间的连接（垂直）
- **A2A**：解决 Agent 与 Agent 之间的协作（水平）

### UCP (Unified Commerce Protocol)

2026 年还出现了第三个协议 UCP，主要用于 AI commerce 场景。三者各有侧重。

---

## 9. MCP Gateway 与安全层

### 企业级安全需求

随着 Agent 访问越来越多的企业数据和系统，安全成为核心关切：

- **86% 的企业**需要升级技术栈才能正确部署 AI Agent

### MCP Gateway 方案

| Gateway | 特点 |
|---------|------|
| MintMCP Gateway | 业界首个 SOC 2 Type II 认证的 MCP 平台 |
| TrueFoundry | 3-4ms 延迟，350+ RPS on single vCPU |
| Docker MCP Gateway | Interceptors 实现安全层 |
| Agentic Community Gateway | Keycloak/Entra 集成 |

### 核心安全能力

- **OAuth 2.0/SAML 认证**
- **On-Behalf-Of (OBO) 认证**：OAuth 2.0 token exchange，实现用户上下文感知
- **Task-Based Access Control (TBAC)**：动态授权，根据操作上下文而非静态角色
- **Audit logging + RBAC + 实时监控**
- **Read-only 模式**：生产环境数据探索的安全保障

---

## 传统产品 Agent 化的通用模式

通过分析以上案例，我们总结出传统产品 Agent 化的 **6 种通用模式**：

### 模式 1：MCP Server 包装（最常见）

```
传统产品 API → MCP Server Wrapper → Agent
```

- **策略**：在现有 API 之上构建 MCP Server 层
- **典型案例**：HubSpot、PostgreSQL、MongoDB
- **优点**：改动最小，向后兼容
- **缺点**：受限于原有 API 的能力边界

### 模式 2：Agent-Native 重构

```
传统产品 → 重新设计为 Agent 平台 → Agent-first 体验
```

- **策略**：从底层重新设计产品，使其 Agent-native
- **典型案例**：Notion Custom Agents、Salesforce Agentforce
- **优点**：最深度的集成，最好的 Agent 体验
- **缺点**：需要大量投入，风险较高

### 模式 3：聚合中间层

```
多个传统产品 → 聚合平台（Composio/Zapier）→ 统一 MCP 接口 → Agent
```

- **策略**：通过中间平台统一暴露多个产品
- **典型案例**：Composio Rube (500+ 应用)、Zapier、MuleSoft
- **优点**：一次集成，覆盖多个产品
- **缺点**：功能受限于中间层的抽象程度

### 模式 4：边缘 Agent 化

```
传统产品 → 边缘节点 MCP → 低延迟 Agent 访问
```

- **策略**：在边缘网络部署 MCP，优化延迟和隐私
- **典型案例**：Cloudflare Edge MCP
- **优点**：低延迟，数据本地化
- **缺点**：架构复杂度高

### 模式 5：数据库直连 Agent 化

```
数据库 → MCP Server（含 Schema 理解 + 查询优化）→ Agent
```

- **策略**：让 Agent 直接理解和操作数据库
- **典型案例**：Supabase、Postgres MCP Pro、MongoDB MCP
- **优点**：Agent 可以理解 schema、优化查询、管理 migration
- **缺点**：安全风险需要严格控制（read-only 模式等）

### 模式 6：协议桥接

```
传统产品（非 MCP）→ Protocol Bridge/Gateway → MCP 兼容 → Agent
```

- **策略**：通过 Gateway 将非 MCP 产品桥接到 MCP 生态
- **典型案例**：Salesforce MuleSoft MCP Wrapper、MCP Gateways
- **优点**：不需要产品方修改代码
- **缺点**：功能和性能受限

### 转型路径的选择矩阵

| 因素 | 模式 1 (Wrapper) | 模式 2 (重构) | 模式 3 (聚合) |
|------|-----------------|--------------|--------------|
| 投入成本 | 低 | 高 | 中 |
| 集成深度 | 浅 | 深 | 中 |
| 上市速度 | 快 | 慢 | 快 |
| Agent 体验 | 中等 | 最佳 | 中等 |
| 适用阶段 | 早期探索 | 战略转型 | 快速覆盖 |

---

## 对 Agentify 的启示

### 1. Agentify 的核心机会：成为 "模式 3" 的下一代

目前市场上的聚合层（Composio、Zapier）主要解决的是**工具连接**问题。但 Agentify 可以做得更深：

- **不只是连接工具，而是理解工具之间的语义关系**
- **不只是暴露 API，而是提供 Agent-optimal 的交互模式**
- **不只是 MCP Server，而是 MCP + A2A 的统一层**

### 2. 关键设计原则

#### 2.1 分层架构

```
Agent
  ↓
Agentify (Meta-Tool Layer)
  ├── Tool Discovery (动态发现能力)
  ├── Tool Composition (组合多个工具)
  ├── Context Management (上下文管理)
  └── Security Gateway (安全网关)
  ↓
Traditional Products (via MCP / API / A2A)
```

#### 2.2 Smart Defaults + Escape Hatches

- 像 Supabase 的 read_only 模式一样，默认安全，但允许 escape
- 像 Notion Custom Agents 一样，让非技术用户也能配置 Agent 行为

#### 2.3 双协议支持

- **MCP**：连接工具和数据（垂直）
- **A2A**：协调多个 Agent（水平）
- Agentify 应该同时支持两者，成为 Agent 的"全栈接口"

### 3. 差异化方向

| 现有方案 | 局限性 | Agentify 的机会 |
|---------|--------|----------------|
| Composio (500+ 应用) | 浅层集成，工具列表式 | 深度语义理解，智能工具选择 |
| Zapier MCP | 限于 Zapier workflow | 原生 MCP 设计，不受 workflow 限制 |
| MuleSoft | 企业级复杂度，成本高 | 开发者友好，轻量级 |
| 各产品官方 MCP | 孤立、不统一 | 统一抽象层，跨产品协调 |

### 4. 市场切入建议

#### 第一阶段：开发者工具集成

- 先连接开发者最常用的工具（GitHub、Linear、Slack、Notion）
- 做好 "MCP 聚合器" 的基本面

#### 第二阶段：智能编排层

- 加入 Tool Composition 能力（多个工具的智能组合）
- 加入 Context Management（跨工具的上下文保持）

#### 第三阶段：企业级平台

- 加入 MCP Gateway 能力（安全、审计、权限）
- 支持 A2A Protocol（Agent 间协作）
- SOC 2 合规

### 5. 需要关注的风险

1. **官方 MCP 的竞争**：越来越多的产品提供官方 MCP Server，聚合层的价值可能被侵蚀
2. **协议碎片化**：MCP、A2A、UCP 等协议并存，需要灵活应对
3. **安全合规**：企业客户对 Agent 访问敏感数据有严格要求
4. **厂商锁定风险**：过度依赖某个协议或平台可能带来风险

### 6. 核心竞争力构建

Agentify 的长期竞争力应该建立在：

- **语义理解层**：不只是传递 API 调用，而是理解工具的语义，智能地选择和组合工具
- **开发者体验**：比直接使用各产品的 MCP Server 更简单、更统一
- **企业安全**：内置 Gateway、RBAC、audit logging，而非事后添加
- **生态效应**：连接的产品越多，每个产品的价值越大（网络效应）

---

## 参考来源

### SaaS 与 MCP 集成
- Notion 3.3 Custom Agents: https://www.notion.com/releases/2026-02-24
- Slack MCP Server: https://docs.slack.dev/ai/slack-mcp-server/
- Figma MCP Server Guide: https://help.figma.com/hc/en-us/articles/32132100833559
- HubSpot MCP Server: https://developers.hubspot.com/mcp
- GitHub MCP Servers: https://github.com/modelcontextprotocol/servers

### 数据库
- Supabase MCP: https://supabase.com/docs/guides/getting-started/mcp
- MongoDB MCP Server Winter 2026: https://www.mongodb.com/company/blog/product-release-announcements/whats-new-mongodb-mcp-server-winter-2026-edition
- Postgres MCP Pro: https://github.com/crystaldba/postgres-mcp

### 企业软件
- Salesforce Agentforce MCP: https://www.salesforce.com/agentforce/mcp-support/
- Salesforce Enterprise Agentic Architecture: https://architect.salesforce.com/fundamentals/enterprise-agentic-architecture
- Salesforce Connectivity Report 2026: https://www.salesforce.com/news/stories/connectivity-report-announcement-2026/

### 云服务
- AWS Agent Plugins: https://futurumgroup.com/insights/awss-deploy-to-aws-plugin-frictionless-deployment-or-developer-honeypot/
- Azure AI Foundry MCP: https://www.infoq.com/news/2025/07/azure-foundry-mcp-agents/
- Google Cloud MCP: https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/

### 协议与安全
- A2A Protocol: https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/
- MCP vs A2A: https://auth0.com/blog/mcp-vs-a2a/
- MCP Gateways: https://www.integrate.io/blog/best-mcp-gateways-and-ai-agent-security-tools/
- MintMCP: https://www.mintmcp.com/blog/enterprise-ai-infrastructure-mcp

### 开发者工具
- Claude Code vs Cursor 2026: https://www.builder.io/blog/cursor-vs-claude-code
- Best MCP Servers 2026: https://www.builder.io/blog/best-mcp-servers-2026
- Composio: https://composio.dev/
