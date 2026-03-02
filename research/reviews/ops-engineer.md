# Agentify 运维视角评审报告

> 评审人：老派运维工程师（15 年 SRE 经验）
> 日期：2026-03-02
> 立场：凌晨三点被 PagerDuty 叫醒的人

---

## 总体评价

产品计划在"做什么"方面想得很清楚，但在"怎么跑"方面几乎是空白。一个生成代码的工具，如果不考虑生成物的运行时生命周期，就像造了一把枪但没有子弹说明书——迟早有人会伤到自己。

**严重程度评分：** 8/10（如果不补齐运维能力，上线后半年内必出 P0 事故）

---

## 一、生成的 MCP Server 怎么运行？

### 问题

产品计划和架构文档只讲了"生成代码"，但对生成物的运行时完全沉默。用户拿到一个 `generated-mcp-server/` 目录后：

- **用什么运行？** Node.js 22+？Docker？Bun？产品计划说"Node.js 22+"但这是 Agentify 自身的运行时，不是生成物的运行时。
- **怎么启动？** `npm start`？`node src/index.ts`？需要先 `npm install` 吗？需要 build 步骤吗？
- **部署到哪？** 本地 stdio？远程 HTTP？Cloudflare Workers？AWS Lambda？
- **谁来运维？** 生成完就扔给用户？还是 Agentify 提供 hosting？

### 架构文档中的线索

架构文档提到了三种 transport：`stdio | sse | streamable-http`。但这只是 MCP 协议层面的选择，不是部署方案。

### 建议

1. **生成物必须包含 Dockerfile**：不管用户最终怎么部署，Docker 是唯一能保证"我这里能跑"的方式
2. **生成物必须包含 `docker-compose.yml`**：一键启动，包含所有依赖
3. **生成物的 `package.json` 必须锁定依赖版本**：用 lockfile，不要 `^` 版本
4. **提供至少三种部署模板**：
   - Local stdio（Claude Desktop / Cursor 集成）
   - Docker standalone（自托管）
   - Cloudflare Workers / AWS Lambda（serverless）
5. **生成一个 `README.md`**：不是 Agentify 的文档，是生成物自己的运行手册
6. **生成 `.nvmrc` 或 `engines` 字段**：锁定 Node.js 版本

### 严重程度：CRITICAL

> 没有运行方案的代码生成器 = 高级 `console.log`

---

## 二、运行时可靠性

### 问题

生成的 MCP Server 跑起来之后：

- **crash 了怎么办？** 没有提到任何 process management（pm2、systemd、supervisor）
- **health check 在哪？** MCP 协议本身没有标准的 health check endpoint
- **自动重启？** 如果用 stdio transport，parent process 挂了怎么办？
- **日志写到哪？** stdout？文件？结构化日志还是 `console.log`？
- **graceful shutdown？** 收到 SIGTERM 后是直接死还是处理完当前请求？
- **memory leak？** 生成的代码如果有 memory leak，用户怎么发现？

### 特别关注：stdio transport 的脆弱性

stdio transport 是 MCP 最常用的本地模式。但 stdio 有几个致命问题：

1. **没有 keepalive**：parent process 不知道 child 是不是还活着
2. **stderr 混用**：错误日志和正常 stderr 输出混在一起
3. **buffer 溢出**：大量数据时 pipe buffer 可能满
4. **没有 timeout**：一个 tool 执行卡死了，整个 server 就死了

### 建议

1. **生成的 server 必须包含结构化日志**：用 `pino` 或 `winston`，JSON 格式，带 timestamp、level、request-id
2. **生成 health check endpoint**：对 HTTP transport，加 `/health` endpoint；对 stdio，实现 ping/pong
3. **生成 graceful shutdown handler**：监听 SIGTERM/SIGINT
4. **每个 tool 执行加 timeout**：默认 30 秒，可配置
5. **生成 process management 配置**：pm2 的 `ecosystem.config.js` 或 systemd unit file
6. **内存使用监控**：定期打印 `process.memoryUsage()`，或暴露 `/metrics` endpoint

### 严重程度：HIGH

> 周五凌晨三点，用户的 MCP server 挂了。没有日志，没有 health check，没有自动重启。用户只知道"Claude 说工具不可用了"。

---

## 三、监控盲区

### 问题

整个产品计划和架构文档中，"monitoring"、"observability"、"metrics"、"tracing"、"OpenTelemetry" 这些词一个都没出现。

两个层面的监控缺失：

#### A. Agentify 自身的监控

Agentify 作为 MCP Server（dog-fooding 模式）运行时：
- 自身的 CPU/Memory/GC 指标谁来采集？
- Pipeline 执行时间？每个 stage 的耗时？
- 错误率？成功率？
- LLM API 调用的 token 消耗和延迟？

#### B. 生成的 MCP Server 的监控

生成出来的 server 跑在用户的环境里：
- tool 调用次数、成功率、延迟分布？
- 上游 API 调用的错误率？
- 认证失败次数？
- rate limit 触发次数？

### 建议

1. **Agentify 自身集成 OpenTelemetry**：traces + metrics + logs 三件套
2. **生成的 server 默认内置 OpenTelemetry 支持**（可 opt-out）：
   - 每次 tool 调用自动创建 span
   - 上游 HTTP 调用自动 instrument
   - 暴露 Prometheus-compatible `/metrics` endpoint
3. **提供 Grafana dashboard 模板**：开箱即用的监控面板
4. **提供 alert 规则模板**：error rate > 5%、P99 latency > 10s 等
5. **生成的 server 至少暴露以下 metrics**：
   - `mcp_tool_calls_total` (counter, labeled by tool name, status)
   - `mcp_tool_duration_seconds` (histogram)
   - `mcp_upstream_api_calls_total` (counter)
   - `mcp_upstream_api_duration_seconds` (histogram)
   - `mcp_auth_failures_total` (counter)

### 严重程度：HIGH

> 没有 observability 的系统 = 在黑屋子里开车

---

## 四、CI/CD 空白

### 问题

产品计划完全没提 CI/CD。一个字都没有。

具体缺失：
- **Agentify 自身怎么测试？** Vitest 是选了，但 CI pipeline 呢？GitHub Actions？
- **Agentify 怎么发布？** npm publish？哪个 registry？版本号怎么管？
- **生成的代码怎么测试？** 验证引擎 (`@agentify/validator`) 只说了"基础验证"，具体验证什么？
- **生成的代码怎么持续更新？** 上游 API spec 更新了，已生成的 MCP Server 怎么同步？
- **Monorepo 的构建顺序？** Turborepo 选了，但 package 之间的依赖图没有定义

### 特别关注：验证引擎的不足

架构文档提到了 `Validator` plugin 接口，但验证维度太少：
- Schema validation：只验证 schema 格式正确吗？还是验证 schema 和实际 API 的一致性？
- Security checks：具体查什么？硬编码 secret？SQL injection？XSS？
- Runtime validation：生成的 server 能不能真正启动并响应请求？

### 建议

1. **Agentify 自身的 CI/CD**：
   - GitHub Actions workflow：lint -> type-check -> unit test -> integration test -> build
   - Turborepo 的 `turbo.json` 必须定义清晰的 build pipeline
   - 版本管理用 changesets（monorepo 标配）
   - npm publish 自动化（GitHub release trigger）
2. **生成的 MCP Server 的验证**：
   - **Static validation**：生成的代码能 `tsc --noEmit` 通过
   - **Runtime validation**：启动 server，发送 MCP `initialize` 请求，验证 `listTools` 返回正确
   - **Smoke test**：每个生成的 tool 至少调用一次，验证 schema compliance
   - **Contract test**：对比上游 API spec 和生成的 tool schema 的一致性
3. **持续同步机制**：
   - Watch 模式：监控上游 spec 变更，自动触发 re-generation
   - Diff 报告：显示 spec 变更对已生成 server 的影响
   - Breaking change 检测：识别不兼容变更并告警
4. **生成物也应包含 CI 模板**：
   - `.github/workflows/test.yml`
   - 基础的 lint + type-check + test pipeline

### 严重程度：CRITICAL

> 没有 CI/CD 的开源项目 = 没有质量保证的承诺

---

## 五、安全运维

### 问题

生成的 MCP Server 代码里必然涉及 API key、OAuth token、数据库密码等敏感信息。但产品计划对此只有轻描淡写的"认证友好度"评估。

具体缺失：
- **Secret 注入方式？** 环境变量？.env 文件？Vault？
- **Secret rotation？** API key 过期了怎么办？
- **Secret 不小心被提交到 git？** 有 pre-commit hook 检测吗？
- **生成的代码里会不会硬编码 secret？** 模板引擎会不会意外把 secret 写进代码？
- **MCP Server 的权限控制？** 哪些 Agent 可以调用哪些 tool？
- **Audit log？** 谁在什么时候调用了什么 tool？传了什么参数？

### 特别关注：Agentify 自身作为 MCP Server 时的安全

Agentify 的 dog-fooding MCP Server（`@agentify/mcp-server`）会接收 Agent 发来的：
- URL、文件路径（`analyze_product` tool）
- 输出目录路径（`generate_mcp_server` tool）

这些都是典型的 path traversal 和 SSRF 攻击面。

### 建议

1. **生成的代码必须使用环境变量管理 secret**：
   - 生成 `.env.example` 文件（只有 key 名，没有 value）
   - 生成 `config.ts` 用 Zod 验证所有环境变量
   - 生成 `.gitignore` 包含 `.env`
2. **提供 secret 管理集成指南**：
   - Docker secrets
   - AWS Secrets Manager / GCP Secret Manager
   - HashiCorp Vault
3. **生成 pre-commit hook**：
   - 检测硬编码的 API key pattern（`sk-`, `ghp_`, `AKIA` 等）
   - 集成 `gitleaks` 或类似工具
4. **Agentify 自身的输入验证**：
   - `analyze_product` 的 URL 参数必须白名单域名或用户确认
   - `generate_mcp_server` 的 outputDir 必须限制在允许的目录内
   - 文件路径必须 normalize 并检查 path traversal
5. **MCP Server 的 auth/authz**：
   - 生成的 server 应支持 token-based auth（至少 bearer token）
   - 支持 tool-level 的权限控制
   - 所有 tool 调用记录 audit log

### 严重程度：CRITICAL

> 一个 Agent 通过 Agentify 生成的 MCP Server 泄露了客户的 API key。新闻标题："AI 工具链成为最大安全隐患"。

---

## 六、规模化问题

### 问题

产品计划的成功指标提到：Phase 3 目标是"月活 Agent 调用量 10,000+"、"Capability Graph 中产品 1,000+"。但架构完全没有考虑规模化。

#### A. Agentify 自身的规模化

- **Capability Graph 在内存里**（Phase 1）：1000 个产品的 graph 能放进内存吗？
- **代码生成是 CPU 密集型**：ts-morph AST 操作很慢，1000 个并发生成请求怎么处理？
- **LLM API 调用**：文档解析依赖 LLM，LLM API 有 rate limit 和延迟
- **Monorepo 构建**：Turborepo 在大规模时的表现如何？

#### B. 作为 MCP Server 时的规模化

Agentify 作为 MCP Server 跑在 stdio 模式下 = 单进程、单用户。如果要服务多个 Agent：
- HTTP transport 的并发能力？
- 是否需要 load balancer？
- Session 管理？

### 建议

1. **Phase 1 就要做 capacity planning**：
   - 一个 Capability Graph 大概多少节点/边？内存占用？
   - 单次 OpenAPI spec 解析 + MCP 生成需要多少时间/内存？
   - 基于此计算单机能服务多少并发请求
2. **代码生成 worker 化**：
   - 把 ts-morph 代码生成放到 worker thread 或 child process
   - 避免阻塞主线程（尤其是 MCP Server 模式下）
3. **LLM API 调用加 circuit breaker**：
   - 使用 circuit breaker pattern（如 `cockatiel` 库）
   - LLM API 降级策略：LLM 不可用时 fallback 到纯静态分析
4. **Capability Graph 分级存储**：
   - Hot: 内存 (Map)
   - Warm: SQLite
   - Cold: 文件系统 JSON
5. **HTTP transport 模式下加队列**：
   - 生成请求放入队列（BullMQ / in-memory queue）
   - 返回 job ID，异步查询结果

### 严重程度：MEDIUM（Phase 1 影响不大，但必须在 Phase 2 前解决）

---

## 七、灾难恢复

### 问题

- **用户生成的 Capability Graph 丢了怎么办？** Phase 1 是内存图，进程一重启就没了
- **生成的代码丢了怎么办？** 如果输出目录没有 git 管理
- **Agentify 自身的配置/状态丢了怎么办？**
- **LLM API key 失效了怎么办？** Agentify 的核心功能直接不可用

### 场景推演：周五凌晨三点的灾难

1. Agentify MCP Server 被一个大型 OpenAPI spec（5000+ endpoints）的分析请求打爆 OOM
2. 进程被 kernel 杀掉
3. 内存中的 Capability Graph 全部丢失
4. 其他正在排队的请求全部失败
5. 没有日志（因为没有配 log rotation，日志盘满了）
6. 没有 alert（因为没有监控）
7. 没有 auto-restart（因为没有 process manager）
8. 用户第二天发现："Agentify 挂了，我昨天分析的 50 个产品的结果都没了"

### 建议

1. **Capability Graph 持久化不能等到 Phase 3**：
   - Phase 1 就用 SQLite（用 `better-sqlite3`）
   - 或者至少把 graph 序列化为 JSON 文件，每次修改时写盘
2. **生成的代码自动提交 git**：
   - 在输出目录自动 `git init` + `git commit`
   - 每次重新生成都有历史记录
3. **Agentify 自身的状态恢复**：
   - 所有 pipeline 状态可序列化
   - Pipeline 中断后可从最后一个 checkpoint 恢复
4. **依赖服务的 fallback**：
   - LLM API：提供多个 provider fallback（Claude -> GPT -> local model）
   - OpenAPI 解析器：纯本地运行，不依赖外部服务
5. **数据导出/导入**：
   - `agentify export` / `agentify import`
   - JSON 格式，人类可读

### 严重程度：HIGH

> 数据丢失是用户信任的终结。

---

## 八、版本兼容

### 问题

MCP spec 在快速演进（从 SSE 到 Streamable HTTP，从 basic auth 到 OAuth 2.1）。产品计划在"风险"部分提到"MCP 协议快速变化 — 紧跟 spec 更新，Plugin 架构解耦"，但这不是方案，这是一句口号。

具体问题：
- **已生成的 MCP Server 用的是哪个版本的 MCP spec？** 版本信息记录在哪？
- **MCP spec 更新后，旧的 server 还能用吗？** Client 端是否向后兼容？
- **用户怎么升级已生成的 server？** 重新生成？手动迁移？
- **MCP SDK 大版本升级时（breaking change），生成模板怎么更新？**
- **@modelcontextprotocol/sdk 本身的版本管理**？pinned 还是 floating？

### 建议

1. **生成的代码必须包含 MCP spec 版本信息**：
   - 在 `package.json` 的 `metadata` 字段记录
   - 在 server 的 `initialize` 响应中返回
2. **提供升级路径**：
   - `agentify upgrade <server-dir>` 命令
   - Diff 显示新旧版本的变更
   - 用户可选择 auto-apply 或 manual review
3. **兼容性矩阵**：
   - 记录每个 Agentify 版本支持的 MCP spec 范围
   - 生成的代码标注最低兼容的 client 版本
4. **MCP SDK 版本策略**：
   - 生成的 `package.json` 中 pin 精确版本（不用 `^`）
   - Agentify 自身跟踪 SDK 更新，release notes 中标注 breaking changes
5. **生成的 server 加版本协商**：
   - 支持多个 MCP spec 版本（至少 N-1）
   - Client 连接时协商版本

### 严重程度：HIGH

> MCP spec 发了新版，10,000 个已生成的 server 全部不兼容。用户："我以为 Agentify 帮我处理了这些"。

---

## 九、额外运维关注点

### 9.1 日志和 Debug

- 生成的 MCP Server 需要一个统一的 debug 模式（`DEBUG=mcp:*` 或 `LOG_LEVEL=debug`）
- 生成 request/response 的 trace log（默认关闭，debug 时开启）
- 错误信息必须包含 correlation ID，方便追踪 Agent -> MCP Server -> upstream API 的完整链路

### 9.2 Configuration Management

- 生成的 server 的配置应该支持多种来源：环境变量 > .env 文件 > 默认值
- 配置变更不应需要重启 server（至少对 non-critical 配置）
- 配置必须有 validation，启动时检查所有必需配置

### 9.3 Network Resilience

- 生成的 server 调用上游 API 时必须有 retry 策略（exponential backoff）
- 上游 API timeout 设置
- DNS resolution caching
- Connection pooling（如果使用 HTTP/1.1）

### 9.4 Resource Cleanup

- 临时文件清理（代码生成过程中可能产生临时文件）
- 内存中的 Capability Graph 过期回收
- HTTP 连接池清理

---

## 十、运维成熟度评估

| 维度 | 当前状态 | 目标状态 | 差距 |
|------|---------|---------|------|
| 部署方案 | 无 | Docker + 多平台模板 | CRITICAL |
| 健康检查 | 无 | HTTP /health + stdio ping | CRITICAL |
| 日志 | 无规划 | 结构化日志 + 集中收集 | HIGH |
| 监控 | 无 | OpenTelemetry + Prometheus + Grafana | HIGH |
| 告警 | 无 | PagerDuty/OpsGenie 集成 | HIGH |
| CI/CD | 只选了 Vitest | 完整 pipeline + 自动发布 | CRITICAL |
| Secret 管理 | 无 | 环境变量 + Vault 集成 | CRITICAL |
| 灾难恢复 | 无 | 持久化 + 备份 + 恢复 | HIGH |
| 版本管理 | 口号级 | 自动升级 + 兼容性矩阵 | HIGH |
| 容量规划 | 无 | Benchmark + 水平扩展方案 | MEDIUM |

---

## 总结

Agentify 的产品愿景很好，技术架构也有深度。但从运维角度看，这是一个**只画了蓝图但没有盖好下水道的城市规划**。

**最关键的三个问题：**

1. **生成物的运行时生命周期完全没有设计** — 这不是"后面再做"的事情，这是产品核心体验的一部分。用户不只是要代码，用户要的是"能跑的、可靠的、可维护的" MCP Server。

2. **零 observability** — 一个产品如果看不见自己的运行状态，就不能说自己是 production-ready 的。Agentify 自身和生成物都需要 observability。

3. **没有 CI/CD 和版本管理策略** — 一个开源项目如果没有 CI/CD，contributor 不敢提 PR，用户不敢用 latest。

**我的核心建议：**

在 Phase 1 的 checklist 里，加上以下必做项：

- [ ] 生成物包含 Dockerfile + docker-compose.yml
- [ ] 生成物包含结构化日志（pino）
- [ ] 生成物包含 health check
- [ ] 生成物包含 .env.example + config validation
- [ ] Agentify 自身有完整 CI/CD pipeline
- [ ] Agentify 自身集成 OpenTelemetry（至少 traces）
- [ ] Capability Graph 有 SQLite 持久化（不等 Phase 3）
- [ ] 生成物标注 MCP spec 版本
- [ ] 生成物 pin 所有依赖版本

> 好的架构是让开发者 sleep well at night 的架构。
> 现在的计划，让我这个运维工程师 sleep 不了。

---

*评审完毕。如需进一步讨论某个维度的具体实施方案，随时 page 我——反正我凌晨三点也醒着。*
