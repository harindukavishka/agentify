# Agentify "多格式输出平台" 商业可行性深度分析

> 评审人: 资深创业者视角 (3 exits, angel investor)
> 日期: 2026-03-02
> 背景: 基于上一轮评审，重新审视 "One Product → All Agent Surfaces" 的更大愿景
> 立场: 对创始人负责，不对美好愿景负责

---

## TL;DR — 三句话判断

这个更大的愿景 **方向是对的**，但时机和执行节奏决定了成败。2026 年的 agent 生态正在经历 "格式爆炸"（MCP, Skills, A2A Cards, .cursorrules, CLI, SDK...），**谁能统一 "一次定义，多格式输出" 的体验，谁就占据了下一个平台级位置**。但如果你现在就去做 10 种输出格式，你会在 6 个月后拥有 10 个半成品和零用户。

**核心结论: 愿景升级为 "全格式平台"，但执行策略必须是 "MCP 先行，格式递增"。**

---

## 1. 更大愿景对商业模式的影响

### 1.1 好消息：价值天花板显著提升

原来的定位是 "OpenAPI → MCP 生成器"。这个定位的问题我上次说过：

- MCP 生态 11,000+ servers，不到 5% 被货币化
- 单一格式的 CLI 工具很难收费
- 竞品（Stainless, Speakeasy, Manufact）都在做 MCP 生成

新定位 "One Product → All Agent Surfaces" 的价值公式完全不同：

| 维度 | MCP 生成器 | 全格式平台 |
|------|----------|----------|
| 价值主张 | "帮你生成一个 MCP Server" | "帮你的产品进入所有 agent 生态" |
| 付费意愿 | 低（一次性工具） | 中高（持续性平台） |
| 用户粘性 | 生成完就走 | 需要持续同步、更新 |
| 竞品数量 | 5-10 个直接竞品 | 目前为零 |
| TAM | MCP 工具市场（$50-100M） | Agent 化转型市场（$1-5B） |

**关键洞察**: Speakeasy 走的就是这条路——从 "SDK 生成" 扩展到 "SDK + MCP + Terraform + Docs"。Speakeasy 的定价从 $250/月起，证明多格式输出的付费意愿是真实的。但 Speakeasy 的多格式是 **手动添加** 的，不是从统一 IR 生成的。这是你的差异化空间。

### 1.2 坏消息：聚焦难度指数级增长

多格式输出意味着：

- 每种格式都有自己的生态、规范、更新节奏
- MCP spec 在快速演进，A2A 刚发了 v0.3，Skills 生态才 2 个月
- 你需要跟踪 5-10 个生态的变化，而不是 1 个
- 每种格式的 "做好" 标准不同

**风险**: 你可能变成一个 "什么都能做但什么都做不好" 的工具。每种格式做到 60% 的质量，不如一种格式做到 95%。

### 1.3 我的判断

**愿景从 "MCP 生成器" 升级为 "全格式平台" 是正确的战略方向**，但这应该是你的 **18 个月愿景**，不是你的 **3 个月执行计划**。

---

## 2. "格式即产品" 的商业机会

### 2.1 每种格式的商业价值分析

| 输出格式 | 生态成熟度 | 目标用户 | 独立产品价值 | 优先级 |
|---------|----------|---------|------------|-------|
| MCP Server | 高（18K+ servers） | API 公司, 开发者 | 高——但竞争激烈 | P0 |
| Skills (Vercel skills.sh) | 爆发期（78K+ skills, 8K publishers） | Agent 工具开发者 | 高——生态刚起步，窗口大 | P1 |
| A2A Agent Card | 早期（150+ org 支持） | 企业 IT, agent 平台 | 中——标准未稳定 | P2 |
| CLI 包装 | 成熟 | 开发者 | 低——太简单，不值得单独卖 | P3 |
| .cursorrules / .claude/rules | 成熟但碎片化 | 开发者 | 低——格式太简单 | P3 |
| SDK (多语言) | 成熟（Speakeasy/Stainless 已占据） | API 公司 | 高——但已有强竞品 | P2 |
| API Docs | 成熟 | API 公司 | 中——Readme, Bump.sh 已有 | P3 |

### 2.2 拆分卖还是一体化？

**我的建议：一体化，但分层解锁。**

拆分卖（"Agentify MCP" / "Agentify Skills" / "Agentify A2A"）的问题：
- 品牌稀释——用户不知道你到底是什么
- 每个子产品都要独立 GTM
- 一个人做 3 个产品的 GTM = 每个产品 1/3 的资源

一体化的好处：
- 故事更强："一条命令，进入所有 agent 生态"
- 付费意愿更高：用户不为单一格式付费，但为 "全面覆盖" 付费
- 飞轮效应：统一 IR 让新格式的边际成本极低

**定价模型建议（详见第 6 节）：核心免费（MCP），增值付费（多格式输出）。**

### 2.3 Skills.sh 是你必须关注的信号

Vercel 2026 年 1 月推出 skills.sh，**6 小时内 top skill 2 万安装**。截至 2 月底已有 78K+ skills, 8K publishers。Stripe 当天就发布了官方 skills。

这意味着：
1. Skills 是一个 **真实的、快速增长的** 新分发渠道
2. API 公司不仅需要 MCP，还需要 Skills
3. 如果你能自动生成 Skills，这是一个 **巨大的差异化点**——目前没有人做 "OpenAPI → Skills" 的自动转换

**这可能是你的 P1 格式，紧跟 MCP 之后。**

---

## 3. 竞争分析更新

### 3.1 新竞争格局

原来的竞品分析聚焦在 MCP 生成。现在视野扩大到 "全格式输出"，竞品图谱完全不同：

| 竞品 | 做什么 | 输出格式 | 威胁等级 |
|------|--------|---------|---------|
| **Speakeasy** | OpenAPI → SDK/MCP/Terraform/Docs | 4-5 种格式 | **极高** |
| **Stainless** | OpenAPI → SDK/MCP/Docs | 3 种格式 | **高** |
| **Fern** | OpenAPI → SDK/Docs | 2 种格式 | 中 |
| **Manufact** | MCP infrastructure | 1 种（MCP） | 中 |
| **Skills.sh** | Skills 分发平台（不生成） | 分发层 | 低（互补） |
| **liblab** | SDK 生成 | SDK only | 低 |

### 3.2 关键发现：Speakeasy 是你真正的竞品

Speakeasy 已经在做 "OpenAPI → 多格式输出"：

- SDK（9+ 语言）
- MCP Server
- Terraform Provider
- API Docs
- Contract Tests

**Speakeasy 定价 $250/月起，已有企业客户。** 这证明了多格式输出的商业价值，但也意味着你面对的不是一群小工具，而是一个 **拿了钱的、有客户的、多格式平台**。

### 3.3 你和 Speakeasy 的差异在哪？

| 维度 | Speakeasy | Agentify |
|------|-----------|----------|
| 核心聚焦 | API 团队（SDK + DX） | Agent 生态（MCP + Skills + A2A） |
| 输出导向 | 传统 SDK + 新兴 MCP | Agent-native 格式优先 |
| 定位 | "API platform" | "Agent 化平台" |
| MCP 之外 | Terraform, Docs | Skills, A2A Cards, .cursorrules |
| 定价 | $250/月+ | TBD（应更低或免费核心） |

**差异化策略**: Speakeasy 的心智模型是 "API 开发者平台"。你的心智模型应该是 **"Agent 时代的分发平台"**。Speakeasy 做的是 "帮你的 API 被人用"，你做的是 "帮你的产品被 agent 用"。这两个故事不同，目标用户有重叠但不完全一样。

### 3.4 没人做的事情

截至 2026 年 3 月，**没有任何工具**做以下事情：
1. OpenAPI → Skills（Vercel skills.sh 格式）自动生成
2. OpenAPI → A2A Agent Card 自动生成
3. OpenAPI → .cursorrules / .claude/rules 自动生成
4. 统一 IR → 多 agent 格式的一键生成

这些是你的蓝海。尤其是 Skills——78K skills 里大部分是手写的。如果你能自动生成高质量 Skills，这是一个独特的价值主张。

---

## 4. 目标用户重新定义

### 4.1 谁需要 "全格式输出"？

说实话，不是每个人都需要。分析如下：

| 用户类型 | 需要的格式 | 需要 "全格式" 吗？ | 付费意愿 |
|---------|----------|-----------------|---------|
| 独立开发者 | MCP only | 不需要 | $0 |
| 小 SaaS（<20 人） | MCP + maybe Skills | 不太需要 | $0-50/月 |
| 中型 API 公司（20-200 人） | MCP + Skills + Docs + SDK | **需要** | $100-500/月 |
| 大型平台（Stripe, Twilio 级） | 所有格式 | **非常需要** | $500-5000/月 |
| 企业 IT 部门 | MCP + A2A Cards | 看场景 | Custom |

### 4.2 Day 1 目标用户

上次我说 "Day 1 只做 API-first 公司"。这个建议不变，但用户画像需要更精确：

**Primary Persona**: 一个有 50-200 个 endpoint 的 REST API 公司的 CTO/DevRel Lead。他们已经有 OpenAPI spec，已经知道 MCP 是什么，**但还没有精力手写 Skills、A2A Cards 等新格式**。他们的痛点不是 "我不知道怎么做"，而是 **"格式太多了，我跟不上"**。

这个 persona 的关键特征：
- 已经有 OpenAPI spec（你的输入）
- 已经知道 MCP，可能已经手写了一个 MCP server
- 听说了 Skills.sh，但没时间研究
- 知道 A2A，但觉得太早
- **愿意为 "一键全覆盖" 付费，因为他们的时间比工具贵**

### 4.3 谁不是你的用户（至少现在不是）

- 独立开发者（他们只需要 MCP，用免费版就够了）
- 没有 API 的传统公司（他们连第一步都没迈出）
- 大型企业（你没有 enterprise sales 能力）

---

## 5. MVP 策略调整

### 5.1 核心问题：先发 MCP 再加格式，还是一开始就多格式？

**毫无疑问：先发 MCP，再递增加格式。**

原因：
1. MCP 是最成熟的格式，最容易验证 PMF
2. 你需要先证明 "生成引擎" 是靠谱的，然后才有资格说 "我能生成所有格式"
3. 如果 MCP 都做不好，用户凭什么相信你的 Skills 能好？
4. 每加一种格式都是增量价值，可以作为 "产品更新" 驱动 marketing

### 5.2 修订后的执行时间线

```
Phase 0.5 (1-2 周): MCP Server 生成 — 不变
  npx agentify <openapi-url> → 可运行的 MCP Server
  这是你的 MVP，你的 HN launch，你的第一个 wow moment

Phase 1 (2-4 周): + Skills 生成
  npx agentify <openapi-url> --format skills
  → 生成 Skills.sh 兼容的 skill 包
  这是你的 "第二个格式"，也是你和竞品的关键差异

Phase 1.5 (4-6 周): + A2A Agent Card
  npx agentify <openapi-url> --format a2a
  → 生成 A2A Agent Card (JSON)
  这是前瞻性布局，A2A 还在早期但增长快

Phase 2 (6-10 周): 统一输出 + 平台化
  npx agentify <openapi-url> --format all
  → 一键生成所有格式
  这是你讲 "全格式平台" 故事的时间点
  同时推出 Web Dashboard（可选）
```

### 5.3 关键架构决策

要让 "格式递增" 可行，**统一 IR 必须从 Day 1 设计好**。但实现上分阶段：

- Phase 0.5: IR 只服务 MCP，但数据结构预留扩展性
- Phase 1: IR 扩展，证明能同时服务 MCP 和 Skills
- Phase 2: IR 稳定，成为核心资产

这就是上次评审中 "简化派 vs 前瞻派" 的张力。我现在的看法是：**IR 的设计（数据结构）要前瞻，IR 的实现（代码）要简化**。用 TypeScript interface 定义一个干净的 IR，但 Phase 0.5 只实现 MCP 相关的字段。

---

## 6. 定价和包装

### 6.1 新的定价逻辑

上次我说 "$29-99/月是死亡区间"。新愿景下，定价逻辑完全不同：

**核心洞察**: 多格式输出天然适合 **分层定价**。每多一种格式，就多一层价值。

### 6.2 建议定价模型

```
Free Tier (开源):
  - MCP Server 生成（无限制）
  - 基础 CLI 体验
  - 社区支持

Pro ($99-199/月):
  - MCP + Skills + A2A + .cursorrules
  - 全格式一键生成
  - 持续同步（API 更新时自动重新生成）
  - Email 支持

Team ($299-499/月):
  - Pro 全部功能
  - 多 API 管理（管理 10+ API 的全格式输出）
  - 自定义模板
  - Webhook 集成
  - 优先支持

Enterprise (Custom):
  - Team 全部功能
  - SSO/SAML
  - SLA
  - 私有部署
  - 专属 onboarding
```

### 6.3 为什么这个定价能行？

1. **Free tier 足够有价值**: MCP 生成是免费的，建立用户基础
2. **付费的动机清晰**: "我已经用 Agentify 生成了 MCP，现在加 $99 就能覆盖 Skills 和 A2A？值。"
3. **避开死亡区间**: $99-199 对个人贵，但对公司不贵。你的目标用户是公司，不是个人
4. **参考 Speakeasy**: Speakeasy $250/月起卖 SDK + MCP，你卖 MCP + Skills + A2A 定 $99-199 是合理的
5. **Usage-based 可叠加**: Pro 价格包含一定数量的 API，超出按量计费

### 6.4 不要做的定价

- 不要按格式收费（"MCP $29, Skills $29, A2A $29"）——太碎片化
- 不要只做 usage-based——开发者讨厌不可预测的账单
- 不要 Day 1 就收费——先用 MCP 免费版获取用户，然后用多格式作为付费 upsell

---

## 7. 故事和叙事

### 7.1 原来的故事 vs 新的故事

**原来**: "一条命令把你的 API 变成 MCP Server"
- 问题：Stainless, Speakeasy 都能说这句话

**新的**: "一条命令让你的产品进入所有 AI agent 生态"
- 独特性：没人在说这个
- 紧迫性：格式在爆炸，公司跟不上
- 价值清晰：从 "生成一个文件" 变成 "进入一个生态"

### 7.2 Pitch Deck 核心 Slides

```
Slide 1: 问题
  "你的产品有 API。但 AI agents 不用 API。"
  "它们用 MCP. Skills. A2A Cards. 还有更多。"
  "每种格式都要手写。每种都在快速变化。"

Slide 2: 格式爆炸（数据驱动）
  - 2025 年初：只有 REST API
  - 2025 年底：MCP 成为标准 (18K+ servers)
  - 2026 年 1 月：Vercel 推出 Skills (78K+ skills in 2 months)
  - 2026 年 Q1：A2A v0.3 (150+ org)
  - 2026 年 Q2：还会有更多...
  "格式的数量在 18 个月内从 1 增长到 5+。你的 DevRel 团队能跟上吗？"

Slide 3: 解决方案
  "Agentify: One Product → All Agent Surfaces"
  一条命令。一个 IR。自动生成 MCP, Skills, A2A Card, CLI, Docs。
  Demo: npx agentify https://api.stripe.com/openapi.json --format all

Slide 4: 为什么是现在
  - Agent 格式正在爆炸，但没有统一工具
  - Speakeasy/Stainless 做 SDK + MCP，但不做 Skills/A2A
  - 6-9 个月的窗口期
  - 先发优势 + 开源社区 = 护城河

Slide 5: 商业模式
  - 免费: MCP 生成（开源核心，建立用户基础）
  - Pro: 全格式输出 + 持续同步 ($99-199/月)
  - Enterprise: 私有部署 + SLA (Custom)
  - TAM: Agent 化转型市场 $1-5B (2026-2028)

Slide 6: Traction（如果有的话）
  - GitHub stars, npm downloads, demo APIs
  - 社区反馈、用户故事

Slide 7: 团队 & Ask
```

### 7.3 一句话 Pitch（不同场景）

- **HN 标题**: "Show HN: Agentify -- one command to make your API available to every AI agent"
- **Twitter**: "Your API has one format. AI agents speak 5+. Agentify translates."
- **投资人**: "We're building the Babel for the agent economy -- one API spec in, every agent format out."
- **开发者**: "npx agentify your-api.json -- get MCP, Skills, A2A, and more. Automatically."

---

## 8. 时间线和资源

### 8.1 一个人能做什么？

| 格式 | 工作量（一个人） | 质量预期 | 可行吗？ |
|------|----------------|---------|---------|
| MCP Server | 1-2 周 | 90%+ | 绝对可行 |
| Skills 包 | 1-2 周（MCP 之后） | 80%+ | 可行 |
| A2A Agent Card | 3-5 天 | 70%+（格式简单） | 可行 |
| .cursorrules | 2-3 天 | 80%+ | 可行 |
| CLI wrapper | 3-5 天 | 80%+ | 可行 |
| SDK (多语言) | 4-8 周 | 60%（太复杂） | 不可行（不做） |
| API Docs | 2-3 周 | 70%+ | 低优先级 |

**一个人可以在 6-8 周内做出 MCP + Skills + A2A Card + .cursorrules。** 这就是 4 种输出格式，已经足够讲 "多格式平台" 的故事了。

SDK 多语言生成不要碰——这是 Speakeasy/Stainless 的领地，你一个人做不过他们。

### 8.2 修订后的资源需求

```
Phase 0-1 (0-6 周): 1 人
  你自己。做 MCP + Skills + A2A。

Phase 1.5 (6-12 周): 2 人
  + 1 个后端工程师（帮你扩展格式 + 维护）
  或者找一个 DevRel co-founder

Phase 2 (3-6 月): 3-4 人
  + 1 DevRel（社区、内容、demo）
  + 1 后端工程师
  如果融了 seed，可以加人

Phase 3 (6-12 月): 5-8 人
  全格式覆盖 + Web Dashboard + Enterprise features
  这时候你需要 seed/Series A 的钱
```

### 8.3 融资时间节点

| 时间点 | 事件 | 融资准备度 |
|--------|------|----------|
| 第 2 周 | MCP MVP 发布 | 不融资——先验证 |
| 第 6 周 | Skills + A2A 加入 | 开始和 angels 聊 |
| 第 12 周 | 有 traction (1000+ stars, 500+ 周下载) | 可以融 pre-seed ($200-500K) |
| 第 6 月 | 有付费用户 (10+ Pro) | 可以融 seed ($1-3M) |

---

## 9. 风险清单（按严重度排序）

### CRITICAL

1. **Speakeasy 加入 Skills/A2A 输出**: 他们已经有 MCP + SDK + Terraform + Docs。如果他们在 3 个月内加入 Skills 和 A2A，你的差异化消失。**缓解**: 速度。你小、你快、你可以在 Speakeasy 反应之前建立 agent 格式的心智占有。

2. **格式战争/标准变化**: A2A 还在 v0.3，Skills 才 2 个月。如果某个格式死了或大改，你的投入白费。**缓解**: IR 抽象层。你的核心价值是 IR，不是具体格式的 codegen。格式是 IR 的 "皮肤"。

### HIGH

3. **MCP 本身被平台内化**: 如果 Anthropic, OpenAI, Google 直接在平台内提供 "上传 OpenAPI spec → 自动调用" 的体验，MCP server 本身不再需要。**缓解**: 多格式战略本身就是缓解——你不只依赖 MCP。

4. **"自动生成质量不如手写"**: 自动生成的 Skills 如果质量不好，反而伤害品牌。**缓解**: 先做少数高质量 demo，而不是大量低质量输出。

### MEDIUM

5. **一个人精力有限**: 4 种格式 + 社区运营 + GTM + 维护 = 燃尽（burnout）。**缓解**: Phase 0.5 只做 MCP，不要过早分散。

---

## 10. 总结：我的最终建议

### 愿景层面 -- YES

"One Product → All Agent Surfaces" 是一个 **值得追求的、有防御性的、有融资故事的** 大愿景。它把你从 "MCP 生成器"（工具）提升为 "Agent 化平台"（平台）。平台的估值是工具的 10-50 倍。

### 执行层面 -- 分阶段

```
第 1-2 周:  发布 MCP 生成器（免费、开源）
            HN + Product Hunt launch
            故事: "一条命令生成 MCP Server"

第 3-4 周:  加入 Skills 生成
            发布博客: "从 MCP 到 Skills: 为什么你的 API 需要多种 agent 格式"
            故事升级: "一条命令，两种 agent 格式"

第 5-6 周:  加入 A2A Agent Card + .cursorrules
            发布 "Agentify Format Report": 评估 Top 50 API 的 agent format coverage
            故事完整: "One Product → All Agent Surfaces"

第 7-8 周:  推出 Pro 版本（多格式一键输出 + 持续同步）
            开始收费
            故事: "免费生成 MCP，付费覆盖全格式"
```

### 必须做的 3 件事

1. **MCP 先行，2 周内发布** -- 不变，这是验证一切的基础
2. **Skills 作为第二格式** -- 这是你最大的差异化机会。78K skills, 8K publishers, 没有自动生成工具。谁先做谁赢。
3. **IR 要前瞻设计** -- 数据结构从 Day 1 就考虑多格式输出，但实现上只做 MCP。这样 Phase 1 加 Skills 时不用重写。

### 绝对不要做的 3 件事

1. **不要做 SDK 多语言生成** -- 这是 Speakeasy/Stainless 的领地，你打不过
2. **不要一开始就做 10 种格式** -- 4 种格式（MCP + Skills + A2A + .cursorrules）已经足够讲一个令人信服的故事
3. **不要在没有 MCP 验证之前就讲 "全格式平台" 的故事** -- 先证明你能做好一种，再说 "我能做好所有"

### 最后一句话

上次我说 "先发一个丑陋但能用的东西"。这次我要加一句：

**先发一个丑陋但能用的 MCP 生成器。然后在第 3 周加 Skills，在第 5 周加 A2A。到第 8 周，你就不再是 "又一个 MCP 工具"——你是 "agent 时代的多格式输出平台"。这个故事值 $2-5M 的 seed。**

但前提是：第一个 MCP 的质量必须过关。没人会相信一个连 MCP 都做不好的工具能做好 Skills。

---

## 参考来源

- [Speakeasy: Multi-format SDK + MCP + Terraform generation](https://www.speakeasy.com)
- [Speakeasy vs Stainless comparison](https://www.speakeasy.com/blog/speakeasy-vs-stainless)
- [Speakeasy Pricing ($250+/month)](https://www.speakeasy.com/pricing)
- [Stainless: SDK + MCP + Docs generation](https://www.stainless.com/blog/stainless-in-2025-building-the-api-platform-we-always-wanted)
- [Stainless MCP Server Generator](https://www.stainless.com/mcp/mcp-server-generator)
- [Vercel Skills.sh: 78K+ skills, 8K publishers](https://vercel.com/changelog/introducing-skills-the-open-agent-skills-ecosystem)
- [Skills.sh explosive growth](https://johnoct.github.io/blog/2026/02/12/skills-sh-open-agent-skills-ecosystem/)
- [Vercel Agent Skills ecosystem (InfoQ)](https://www.infoq.com/news/2026/02/vercel-agent-skills/)
- [A2A Protocol v0.3 upgrade, 150+ organizations](https://cloud.google.com/blog/products/ai-machine-learning/agent2agent-protocol-is-getting-an-upgrade)
- [A2A Protocol and Agent Cards (IBM)](https://www.ibm.com/think/topics/agent2agent-protocol)
- [A2A and MCP protocol relationship](https://a2a-protocol.org/latest/topics/a2a-and-mcp/)
- [MCP vs A2A: Multi-Agent Collaboration 2026](https://onereach.ai/blog/guide-choosing-mcp-vs-a2a-protocols/)
- [Agent-Native startups guide 2026](https://medium.com/@cosgn/building-agent-native-startups-a-guide-to-autonomous-workflows-in-the-2026-economy-52e9350196d1)
- [Entire Agent-Native Platform](https://futurumgroup.com/insights/is-entires-agent-native-platform-the-blueprint-for-software-development/)
- [Usage-based pricing trends (77% adoption)](https://flexprice.io/blog/best-usage-based-pricing-tools-saas-companies)
- [Developer tools pricing strategy](https://www.heavybit.com/library/article/pricing-developer-tools)
- [Credit-based pricing growth (126% YoY)](https://www.growthunhinged.com/p/2025-state-of-saas-pricing-changes)
- [Claude Skills guide](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)
- [Snyk + Vercel: Securing agent skill ecosystem](https://snyk.io/blog/snyk-vercel-securing-agent-skill-ecosystem/)
- [Stainless Pricing & Alternatives (Fern)](https://buildwithfern.com/post/stainless-pricing-alternatives)
- [AI Agent Protocols 2026: MCP, A2A, ACP & more](https://getstream.io/blog/ai-agent-protocols/)
