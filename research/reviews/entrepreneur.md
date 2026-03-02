# Agentify 商业可行性评审

> 评审人: 资深创业者视角 (3 exits, angel investor, 见过太多 "改变世界" 的 pitch deck 最后变成 side project)
> 日期: 2026-03-02
> 立场: 对创始人负责, 不对理想负责

---

## TL;DR — 一句话判断

Agentify 的市场洞察是真实的，但产品计划是一个经典的 "调研做得太好导致什么都想做" 的陷阱。如果现在就按这个计划执行，6个月后你会有一个 30% 完成度的 monorepo 和零用户。**砍掉 80%，一周内发一个能用的东西，才是正确的第一步。**

---

## 1. MVP 范围太大 — Phase 1 就是一个完整产品

### 问题

Phase 1 包含:
- Capability Graph 引擎（这本身就是一个独立项目）
- OpenAPI 解析器
- MCP Server 生成器
- CLI 工具（3 个子命令）
- 验证引擎（schema + 运行时）
- Readiness Score 算法
- 5 个 demo 转换
- 开源发布

**这不是 MVP，这是 V1.0。** 4-6 周做完？我投过 20+ 公司，从来没见过有人按计划完成这种规模的 Phase 1。真实时间线通常是估计的 2-3 倍。

### 具体分析

| 组件 | 你的估计 | 真实工时（经验值） | 原因 |
|------|---------|------------------|------|
| Turborepo monorepo 搭建 | "脚手架" | 3-5 天 | CI/CD, lint, test setup, package linking |
| Capability Graph 引擎 | Phase 1 内 | 2-3 周 | 图数据结构 + 序列化 + 查询 + 测试 |
| OpenAPI 解析器 | Phase 1 内 | 1-2 周 | OpenAPI 3.0/3.1 差异, edge cases 极多 |
| MCP 生成器 | Phase 1 内 | 2-3 周 | 模板引擎 + 代码生成 + auth 处理 |
| CLI | Phase 1 内 | 1 周 | 三个命令 + 错误处理 + 帮助文档 |
| 验证引擎 | Phase 1 内 | 1-2 周 | Schema 验证 + 运行时验证 |
| Readiness Score | Phase 1 内 | 1 周 | 算法设计 + 评分校准 |
| 5 个 demo | Phase 1 内 | 1 周 | 每个 API 都有 spec 的坑 |
| **合计** | **4-6 周** | **10-15 周** | |

你一个人（或小团队）做 10-15 周，也就是说 Phase 1 可能要到 Q3 才能发布。到那时候 Stainless 可能已经加了 Readiness Score。

### 建议

**Phase 1 应该只有一件事: `npx agentify <openapi-spec-url>`，输出一个可运行的 MCP Server。** 就这样。一个命令，一个输出。不要 Graph 引擎，不要 Readiness Score，不要 monorepo。一个单独的 npm package。

---

## 2. "12-18 月窗口" 的真实性

### 这个判断基于什么？

你的调研说 "12 个月内 Stainless/Cloudflare 可能扩展，18 个月内云厂商推出原生工具"。但实际情况是:

**云厂商已经在做了:**
- **AWS**: 已发布 60+ 官方 MCP servers，2026年2月17日推出 Agent Plugins for AWS（开源，给 coding agents 加 AWS 能力）
- **Azure**: Azure Functions 已原生支持 MCP，Azure API Management 已有 REST → MCP 转换
- **GCP**: Google Cloud 已发布官方 MCP servers，Vertex AI 通过 Agent Development Kit (ADK) 原生支持 MCP

**所以你的 18 个月窗口已经不存在了。** 云厂商不是 "可能" 推出，而是 "已经" 推出了。

### 但并非全是坏消息

云厂商做的是 **自己生态内** 的 MCP 工具（AWS → AWS MCP, Azure → Azure MCP）。它们不会帮 Stripe 生成 MCP server。**跨生态的通用转换工具** 仍有空间，但这个窗口比你想象的小得多。

### 建议

不要再说 "12-18 月窗口"。改为: **"跨生态通用 API → MCP 转换" 的窗口期大约 6-9 个月。** Manufact 刚拿了 $6.3M seed（2026年2月），已有 500 万下载量——你的竞争对手在加速。

---

## 3. 客户到底是谁 — 5 个用户群太分散

### 问题

你的目标用户:
1. SaaS 产品团队 (P0)
2. API-first 公司 (P0)
3. 独立开发者 (P1)
4. 传统软件公司 (P1)
5. 企业 IT 部门 (P2)

**两个 P0 + 两个 P1 + 一个 P2 = 谁都服务不好。**

### 分析每个用户群

| 用户群 | 会付费吗？ | 获客成本 | 实际需求匹配度 |
|--------|-----------|---------|---------------|
| SaaS 产品团队 | 可能 | 高（需要 B2B sales） | 中（他们更需要咨询，不是工具） |
| API-first 公司 | 很可能 | 中（开发者营销） | 高（已有 OpenAPI spec，直接能用） |
| 独立开发者 | 不会 | 低 | 高但零收入 |
| 传统软件公司 | 可能 | 极高（需要 enterprise sales） | 低（他们连 API 都没有，你怎么帮？） |
| 企业 IT | 可能 | 极高 | 中（但你没有 enterprise features） |

### 建议

**Day 1 只做 API-first 公司。** 原因:
1. 他们 **已经有 OpenAPI spec**（你的输入）
2. 他们 **理解 MCP 的价值**（不需要教育市场）
3. 他们 **有预算** 但不需要 enterprise sales cycle
4. 他们 **是开发者**（你的自然分发渠道）
5. 他们的痛点最尖锐: "我有 API，但 AI agent 用不了"

具体 persona: **一个有 50-200 个 endpoint 的 REST API 的公司，CTO 想让自己的 API 能被 Claude/GPT 直接调用。** 这就是你 Day 1 的唯一客户。

---

## 4. 开源策略的陷阱

### 核心矛盾

你的计划:
- **开源核心**: OpenAPI → MCP 转换引擎 + CLI + 基础模板
- **付费 Pro**: Readiness 评估、Web UI/CLI/DB 转换、自动测试、持续同步

问题: **核心引擎开源了，Pro 卖什么？**

### Fork 风险分析

如果核心引擎足够好:
1. 社区会 fork
2. 有人会写一个 `agentify-score` 插件，开源 Readiness Score
3. 有人会写一个 `agentify-test` 插件，做免费的自动测试
4. 你的 Pro 功能被社区复制，付费壁垒消失

这不是假设，这是 **每一个 open-core 公司都会遇到的问题**。Redis、MongoDB、Elastic 全经历过。区别是他们有 VC 钱撑到找到 enterprise 价值。你有吗？

### MCP 工具的特殊困境

根据最新市场数据: 目前存在 11,000+ MCP servers，但只有不到 5% 被货币化。整个 MCP 生态还没有找到成熟的收费模式。开发者不习惯为 MCP 工具付费。

### 建议

两条路选一条:

**路线 A: 纯开源 → 靠咨询/services 赚钱**
- 核心工具完全免费
- 卖 "Agent 化转型咨询服务"（$5K-50K/项目）
- 前 5 个客户手把手做

**路线 B: 工具免费 → 平台收费**
- CLI 工具免费
- 但生成的 MCP server 部署到你的 hosted platform 收费
- 类似 Vercel 模式: 工具免费，hosting 收费
- 这比 "Readiness Score" 收费更自然

**不要走 open-core 路线**，在 MCP 生态当前阶段行不通。

---

## 5. 定价 — $29-99/mo 是不上不下的死亡区间

### 问题

| 价格 | 目标客户 | 问题 |
|------|---------|------|
| $29/mo | 独立开发者 | 他们用开源版就够了，不会付 |
| $99/mo | 小团队 | 对一个 CLI 工具来说太贵了 |
| Custom | 企业 | 你没有 SOC 2、没有 SSO、没有 SLA，企业不会认真对待 |

$29-99 是 **开发者工具的死亡区间**: 太贵，个人开发者不买; 太便宜，企业不信任。

### 对比

- **Stainless**: 定价未公开，但走的是 enterprise 路线
- **Composio**: 有免费 tier + enterprise pricing
- **Manufact**: $6.3M seed，目标是 enterprise（20% US 500 公司已在用）

### 建议

**放弃 SaaS 订阅模式（至少现在）。** 考虑:

1. **Usage-based pricing**: 按生成的 MCP server 数量收费（前 3 个免费，之后 $X/server/month 包含 hosting）
2. **Consulting-first**: 前 6 个月靠咨询赚钱（$5K-20K/客户），验证 PMF 后再做 SaaS
3. **Enterprise-only 付费**: 免费版给所有人，只对需要 SSO/audit/SLA 的企业收费（$500+/mo 起）

---

## 6. 竞争护城河 — 说实话，很薄

### "Capability Graph" 不是护城河

你说 Capability Graph 是核心竞争力。但:
- 它是一个 **内部数据结构**，用户看不到也不关心
- Stainless 用 "两个 meta-tool" 的架构，根本不需要 Graph
- 任何有 AST 解析经验的团队都能实现类似的中间表示
- **技术架构不是护城河，除非它产生了用户无法迁移的数据**

### "多输入支持" 不是护城河

- Web UI crawling → Playwright + LLM，任何人都能做
- CLI parsing → 解析 `--help` 输出，不复杂
- DB schema → DDL 解析，已有大量工具
- 这些功能是 **nice-to-have**，不是 **must-have**

### 真正可能的护城河

1. **社区和生态**: 如果你的 plugin 系统有 100+ 第三方 plugin，这才是护城河
2. **数据网络效应**: 如果你积累了 1000+ 产品的 Capability Graph 数据，新的转换可以参考已有数据提高质量
3. **品牌认知**: "Agent 化" → "用 Agentify"，成为品类代名词（像 Docker 之于容器）

但这些都需要 **时间和用户量**，不是 Day 1 能有的。

### 建议

**不要在 pitch deck 里说技术是护城河。** 说: "我们的竞争优势是速度和聚焦——在竞品还在做通用平台时，我们已经是 API → MCP 转换的最佳体验。" 然后用速度换时间，在窗口期内建立品牌和社区。

---

## 7. GTM 缺失 — "开源发布 → 然后呢？"

### 当前 GTM

你的计划: 开源发布 → developer mindshare → Pro 转化 → Enterprise 上探

这是 **每一个开发者工具公司的默认 GTM**，也是最常失败的。因为:
- "开源发布" 不等于 "有人用"
- GitHub Stars 不等于 用户
- 用户不等于 付费用户

### 缺失的关键环节

| 环节 | 你有吗？ | 竞品怎么做的 |
|------|---------|-------------|
| 内容策略 | 只有 "Agent-Readiness Report 系列"（太学术了） | Manufact: 技术博客 + 实战教程 |
| 社区策略 | 无 | Composio: Discord 5000+ 成员 |
| 分发渠道 | 无 | Smithery: 自己就是分发渠道 |
| 合作伙伴 | 提到 Smithery/FastMCP，但无具体计划 | Stainless: 直接和 API 公司合作 |
| Launch 策略 | "开源发布" | 需要 HN 首页 + PH launch + Twitter 病毒传播 |

### 建议: 前 30 天 GTM 计划

**第 1 周**: 发布一个能用的 CLI 工具 + 一篇杀手级博客 "我用一行命令把 Stripe API 变成了 MCP Server"

**第 2 周**: 提交 Hacker News + Product Hunt。准备 10 个知名 API 的转换 demo（Stripe, GitHub, Twilio, SendGrid, Shopify）

**第 3 周**: 在 Twitter/X 上发起 "Agent-ify your API" 挑战。用户分享转换结果，最佳的给 credit

**第 4 周**: 写 "The State of API Agent-Readiness"  报告，评估 Top 100 API 的 agent-readiness（这才是真正的内容营销——有数据、有排名、会被媒体引用）

---

## 8. 团队需求 — 一个人能走多远？

### 残酷的事实

看你的 Phase 1 计划（即使砍了之后），一个人能做到:
- 一个能用的 CLI 工具 ✅
- 基本的 OpenAPI → MCP 转换 ✅
- 开源发布 ✅

一个人做不到:
- Plugin 生态 ❌（需要 developer relations + 文档）
- Enterprise features ❌（SSO/audit/SLA）
- 社区运营 ❌（Discord/GitHub Issues/博客）
- B2B sales ❌
- 持续维护 + 新 feature ❌（MCP spec 在快速变化）

### Phase 2 需要的团队

| 角色 | 为什么需要 |
|------|-----------|
| 后端工程师 (1-2) | 核心引擎开发 + 新 ingestor |
| Developer Advocate (1) | 社区、内容、demo、合作伙伴 |
| 产品/创始人 (你) | 方向、客户、融资 |

最小团队: **3 人**。到 Phase 3 至少需要 5-6 人。

### 建议

**Phase 1 一个人做，但目标是验证 PMF，不是构建平台。** 如果前 3 个月能获得:
- 500+ GitHub stars
- 50+ 周活用户
- 3+ 有意向的付费客户

就值得找 co-founder 或融 seed。否则，这可能更适合作为一个开源 side project。

---

## 9. 更小的切入点 — 如果砍掉 80%

### 最小可行产品（真正的 MVP）

**一周内可以发布的东西:**

```bash
npx agentify https://api.stripe.com/openapi.json
```

输出: 一个可直接运行的 MCP Server 目录，包含 `index.ts` + `package.json` + `README.md`。

**就这样。不要:**
- ❌ Capability Graph
- ❌ Readiness Score
- ❌ Monorepo
- ❌ Plugin 系统
- ❌ 验证引擎
- ❌ CLI 的 3 个子命令（只要一个: `agentify <url>`）
- ❌ Dog-fooding MCP Server

**加分项（如果有时间）:**
- 生成的 MCP server 可以 `npx agentify serve` 直接启动
- 自动推断 auth 模式（API Key / OAuth）

### 为什么这就够了？

1. **它解决一个真实痛点**: "我有 OpenAPI spec，想要 MCP server"
2. **它可以立刻被验证**: 用户跑一个命令就知道有没有用
3. **它有病毒传播潜力**: "一行命令把任何 API 变成 MCP Server"
4. **它足够简单**: 一个人一周能做完
5. **它是后续一切的基础**: 先有用户，再加功能

### 和竞品的区别

"等等，Stainless 和 Agoda APIAgent 不是已经做了吗？"

是的，但:
- **Stainless**: 不开源，需要他们的平台
- **Agoda APIAgent**: 是 runtime proxy，不是代码生成器。它不生成独立的 MCP server 代码
- **openapi-mcp-generator (多个)**: 质量参差不齐，没有统一的最佳实践

**你的差异化: 生成高质量、独立、可定制的 MCP server 代码** (不是 proxy，不是 hosted service)。这让开发者可以 fork、修改、拥有自己的 MCP server。

---

## 10. 总结: 我的建议（如果你是我投的公司）

### 不要做的事

1. ❌ 不要建 monorepo（一个 package 就够了）
2. ❌ 不要设计 Capability Graph（不需要中间表示，OpenAPI → MCP 直接转换）
3. ❌ 不要写 Readiness Score（市场不需要评分，需要工具）
4. ❌ 不要做 Plugin 系统（先有用户再说）
5. ❌ 不要想 Enterprise（你没有 enterprise GTM）
6. ❌ 不要定价 $29-99/mo（先免费，用用户数证明价值）

### 必须做的事

1. ✅ **一周内发布** `npx agentify <openapi-url>` → 可运行的 MCP server
2. ✅ **一篇爆款文章**: "How I turned any API into an MCP Server in 10 seconds"
3. ✅ **10 个 demo**: 为 Stripe, GitHub, Twilio 等知名 API 生成 MCP server 并发布
4. ✅ **提交 Hacker News + Product Hunt**
5. ✅ **Discord/GitHub Discussions** 建立社区
6. ✅ **收集用户反馈**，让用户告诉你下一步做什么

### 成功标准（30 天内）

| 指标 | 目标 | 意味着 |
|------|------|--------|
| GitHub Stars | 500+ | 有市场需求 |
| npm downloads | 1000+ | 有真实使用 |
| HN upvotes | 100+ | 故事有吸引力 |
| GitHub Issues | 50+ | 用户在意，想要更多 |
| 有人问 "能不能支持 GraphQL" | 至少 5 次 | Phase 2 方向验证 |

**如果 30 天内达不到这些数字，说明你的假设有问题。** 回去重新思考定位。不要在错误的方向上优化。

### 最后一句话

你的调研做得非常好——市场洞察、竞品分析、架构设计都是高质量的。但 **好的调研是行动的起点，不是行动本身**。创业最大的浪费不是做错了什么，而是花 6 个月做了一个完美的东西然后发现没人要。

**先发一个丑陋但能用的东西。** 让市场告诉你接下来做什么。

---

## 参考来源

- [Manufact raises $6.3M seed for MCP infrastructure](https://siliconangle.com/2026/02/12/manufact-raises-6-3m-help-developers-connect-ai-agents-model-context-protocol/)
- [AWS Agent Plugins (2026-02-17)](https://futurumgroup.com/insights/awss-deploy-to-aws-plugin-frictionless-deployment-or-developer-honeypot/)
- [Azure Functions MCP support](https://www.infoq.com/news/2026/01/azure-functions-mcp-support/)
- [Google Cloud MCP servers](https://techcrunch.com/2025/12/10/google-is-going-all-in-on-mcp-servers-agent-ready-by-design/)
- [Stainless MCP Server Generator](https://www.stainless.com/mcp/mcp-server-generator)
- [Agoda APIAgent open source](https://www.marktechpost.com/2026/02/16/agoda-open-sources-apiagent-to-convert-any-rest-pr-graphql-api-into-an-mcp-server-with-zero-code/)
- [MCP monetization challenges](https://dev.to/namel/mcp-server-monetization-2026-1p2j)
- [MCP economy and plugin monetization](https://cline.bot/blog/building-the-mcp-economy-lessons-from-21st-dev-and-the-future-of-plugin-monetization)
- [Amazon Bedrock AgentCore MCP](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/runtime-mcp.html)
- [AI Capex 2026: The $690B Infrastructure Sprint](https://futurumgroup.com/insights/ai-capex-2026-the-690b-infrastructure-sprint/)
