# 多输出愿景工程探索：老派开发者视角

> 评审人：资深老派开发者（20+ 年经验）
> 日期：2026-03-02
> 范围：多输出产品转型平台的工程可行性分析
> 态度：一如既往，善意但残酷的诚实

---

## 总评

上次我说"先做一个让人惊叹的 OpenAPI -> MCP 转换器"。现在愿景升级了——不只是 MCP Server，而是一个产品 -> N 种 Agent 消费格式的投影平台。

**这个愿景本身是对的。** 一个产品的能力确实需要在多个"面"上被 Agent 消费。MCP Server 给 Claude/ChatGPT 用，Skills 给 Claude Code 用，CLI 给终端 Agent 用，Agent-friendly Docs 给 RAG 管线用——这些不是独立的产品，是同一个能力的不同投影。

但"愿景对"和"能做出来"之间有一条很深的沟。让我逐项拆解。

---

## 一、工程可行性：共享解析层真的可行吗？

### 核心问题

多输出格式能不能共享一个解析层？答案是：**部分可以，但没你想的那么多。**

让我把所有输出格式按"需要什么输入信息"分类：

```
                    需要的信息维度
输出格式            API结构  参数Schema  认证  描述文本  使用示例  语义分组  依赖关系
─────────────────────────────────────────────────────────────────────────────────
MCP Server (tools)    *        *         *      *                   *
MCP Resources         *                  *      *                   *
MCP Prompts                                     *        *          *        *
Skills (.md)                                    *        *          *        *
CLI wrapper           *        *         *      *
Agent-friendly docs                             *        *          *
.cursorrules/CLAUDE.md                          *        *                   *
A2A Agent Cards       *                  *      *                   *
API SDK               *        *         *      *        *
Webhooks/Events       *        *         *      *                            *
```

观察这张表，几个结论：

1. **API 结构 + 参数 Schema + 认证** 是最大的公因子——大多数输出格式都需要这些。这恰好就是 OpenAPI spec 直接提供的。
2. **描述文本** 几乎所有格式都需要，但质量要求不同——MCP tool description 需要精炼（<1024 chars），Agent docs 需要详细，Skills 需要带上下文的指令。
3. **使用示例** 和 **语义分组** 是差异化关键——Skills 和 Prompts 需要大量"怎么用"的知识，而 MCP Server 只需要"是什么"。
4. **依赖关系** 只有 Prompts 和 Webhooks 真正需要理解 capability 之间的因果/流程关系。

### 共享的中间表示（IR）长什么样

上次我建议用扁平的 `ParsedCapability[]`。对于单输出（MCP Server）这足够了。但多输出需要更丰富的 IR——不过仍然不需要 Graph。

```typescript
// 多输出 IR —— 比扁平的多一层，但仍然不是 Graph
interface ProductIR {
  readonly meta: ProductMeta            // 产品基础信息
  readonly auth: AuthConfig             // 全局认证配置
  readonly domains: readonly DomainIR[] // 按领域分组
}

interface DomainIR {
  readonly name: string                 // 领域名（如 "Users", "Orders"）
  readonly description: string          // 领域描述
  readonly capabilities: readonly CapabilityIR[]
}

interface CapabilityIR {
  readonly id: string
  readonly name: string
  readonly description: string          // 原始描述
  readonly enrichedDescription?: string // LLM 增强描述（可选）
  readonly httpMethod: string
  readonly path: string
  readonly inputSchema: JSONSchema      // 保持 JSON Schema，不急着转 Zod
  readonly outputSchema: JSONSchema
  readonly auth: AuthRequirement | null
  readonly tags: readonly string[]
  readonly examples?: readonly UsageExample[]  // 使用示例
  readonly sideEffects: boolean         // 是否有副作用（GET vs POST/PUT/DELETE）
  readonly idempotent: boolean          // 是否幂等
  readonly rateLimit?: RateLimitInfo    // 限流信息
}

interface UsageExample {
  readonly scenario: string             // "创建新用户"
  readonly input: Record<string, unknown>
  readonly expectedOutput?: Record<string, unknown>
}
```

**关键设计决策：**

1. **保持 JSON Schema 而非 Zod** —— JSON Schema 是通用中间格式，MCP Server 生成器负责转 Zod，API SDK 生成器负责转 TypeScript types，各取所需。过早转换会丢失信息。
2. **Domain 分组但不建图** —— tags/domains 是扁平分组，不需要 edge 和 traversal。够用于生成 Skills 的分类和 CLAUDE.md 的结构。
3. **UsageExample 可选** —— Phase 0.5 没有 examples（OpenAPI spec 自带的 examples 质量参差不齐），Phase 1 用 LLM 生成。
4. **sideEffects / idempotent 标注** —— 这对 Skills 和 Prompts 生成至关重要。Agent 需要知道哪些操作是"安全的"（读取）哪些是"危险的"（写入）。

### 结论

**共享解析层可行，但共享的是"解析 + IR 构建"这一步，不是"IR -> 输出"这一步。** 每种输出格式的生成器（Generator/Emitter）必须是独立的，因为它们关注 IR 的不同维度。

```
OpenAPI Spec
    |
    v
[ Parser + Sanitizer ] ——共享——
    |
    v
  ProductIR            ——共享——
    |
    +——> MCP Server Generator    ——独立——
    +——> MCP Resources Generator ——独立——
    +——> Skills Generator         ——独立——
    +——> CLI Wrapper Generator    ——独立——
    +——> Docs Generator           ——独立——
    +——> CLAUDE.md Generator      ——独立——
    ...
```

这是经典的 **编译器前端/后端分离架构**。前端（Parser -> IR）共享，后端（IR -> 输出）独立。GCC、LLVM、Babel 都是这个模式。

---

## 二、渐进式实现路径

### 输出格式优先级排序

按三个维度评估：用户价值、实现难度、代码复用。

```
                    用户价值    实现难度    与 MCP Server 的代码复用    建议 Phase
──────────────────────────────────────────────────────────────────────────────
MCP Server (tools)    10/10      中          基准                      0.5
MCP Resources         6/10       低          高（同一 MCP SDK）        1
Skills (.md)          8/10       低          低（完全不同的输出）      1
Agent-friendly docs   7/10       低          低                        1
.cursorrules/CLAUDE.md 6/10     很低        低                        1
CLI wrapper           5/10       中          中（参数解析可复用）      2
MCP Prompts           7/10       中-高       中（需要理解 workflow）   2
A2A Agent Cards       4/10       中          低                        2
API SDK               6/10       高          低                        3
Webhooks/Events       5/10       高          低                        3
```

### 推荐实现顺序和理由

**Phase 0.5（已确定）：MCP Server**
- 这是基础，所有后续格式的 Parser + IR 层从这里来。
- 这是最能证明产品价值的输出。

**Phase 1 第一批（MCP Server 发布后 2 周内）：Skills + Agent-friendly Docs + CLAUDE.md**

为什么是这三个？

1. **它们几乎不需要新的解析逻辑** —— 复用 Phase 0.5 的 ProductIR，只需要新的"文本渲染器"。
2. **实现难度极低** —— 本质上就是模板渲染，生成 Markdown 文件。
3. **组合价值巨大** —— 用户运行一次 `npx agentify`，同时得到 MCP Server + Skills + CLAUDE.md + Docs。这个"一次解析，多种输出"的体验就是产品差异化的最佳 demo。
4. **Skills 是 Claude Code 生态的重要入口** —— 目前几乎没有工具能自动生成 Skills，这是蓝海。

```bash
# Phase 1 的用户体验
npx agentify https://api.stripe.com/openapi.json --output ./stripe-agent

# 生成：
stripe-agent/
  mcp-server/           # MCP Server（Phase 0.5 已有）
  skills/               # Claude Code Skills
    create-payment.md
    list-customers.md
    refund-charge.md
  docs/                 # Agent-friendly 文档
    api-reference.md
    authentication.md
    common-workflows.md
  CLAUDE.md             # 项目级 Agent 上下文
```

**Phase 1 第二批：MCP Resources**
- 和 MCP Server 共享同一个 SDK，实现成本低。
- 可以把 API 的 list/get 类 endpoint 同时暴露为 Resources（读取型）和 Tools（操作型）。

**Phase 2：CLI wrapper + MCP Prompts + A2A Agent Cards**
- CLI wrapper 需要额外的参数映射逻辑（HTTP params -> CLI flags）。
- MCP Prompts 需要理解 capability 间的 workflow 关系，这需要 IR 层的增强。
- A2A 标准还在早期，不急。

**Phase 3：API SDK + Webhooks**
- API SDK 生成是 Stainless 的地盘，正面竞争不明智。
- Webhooks 需要理解事件模型，这需要 OpenAPI spec 之外的信息。

### 依赖关系图

```
Phase 0.5: Parser + IR + MCP Server Generator
              |
              v
Phase 1a: Skills Generator ─────────┐
          Docs Generator ───────────┤
          CLAUDE.md Generator ──────┤──→ 共享 "文本渲染" 工具函数
              |                     │
Phase 1b: MCP Resources Generator ─┘
              |
              v
Phase 2:  CLI Wrapper Generator (需要增强 IR: 参数映射)
          MCP Prompts Generator (需要增强 IR: workflow 关系)
          A2A Agent Card Generator
              |
              v
Phase 3:  API SDK Generator (需要完整的类型系统生成)
          Webhooks Generator (需要事件模型)
```

---

## 三、代码复用 vs 独立性

### 可复用的部分

```typescript
// 1. Parser 层 —— 100% 复用
//    所有输出格式共享同一个 OpenAPI Parser
const ir = await parseOpenAPI(specUrl)

// 2. IR 层 —— 100% 复用
//    ProductIR 是共享数据结构

// 3. 描述文本处理 —— 80% 复用
//    截断、清理、格式化——但每种输出格式的长度限制和格式要求不同
function truncateDescription(desc: string, maxLength: number): string
function sanitizeDescription(desc: string): string
function formatAsMarkdown(desc: string): string

// 4. Schema 转换工具 —— 部分复用
//    JSON Schema -> Zod (MCP Server)
//    JSON Schema -> TypeScript interface (API SDK)
//    JSON Schema -> Markdown table (Docs, Skills)
//    共享 JSON Schema 遍历逻辑，但输出格式独立

// 5. 认证配置 —— 高复用
//    认证模板在 MCP Server / CLI / API SDK 中相似
```

### 必须独立的部分

```typescript
// 每种输出格式的 Generator 必须独立
// 因为输出结构和关注点完全不同

// MCP Server Generator: 生成 TypeScript 代码 + project scaffold
// Skills Generator: 生成 Markdown 文件，关注"指令"和"使用场景"
// Docs Generator: 生成结构化文档，关注"完整性"和"可搜索性"
// CLI Generator: 生成 shell script 或 Node CLI，关注"参数映射"
// CLAUDE.md Generator: 生成单文件，关注"项目上下文"和"约定"
```

### 复用比例估算

| 层 | 代码量估计 | 复用度 |
|---|---|---|
| Parser + IR | ~800 行 | 100%（所有格式共享） |
| 工具函数（描述处理、schema 转换） | ~400 行 | 70-80% |
| MCP Server Generator | ~600 行 | 基准（不复用其他） |
| Skills Generator | ~300 行 | ~20%（用工具函数） |
| Docs Generator | ~400 行 | ~25%（用工具函数） |
| CLAUDE.md Generator | ~150 行 | ~15% |
| CLI Wrapper Generator | ~500 行 | ~30%（参数解析可复用） |
| MCP Resources Generator | ~200 行 | ~60%（和 MCP Server 共享 SDK 用法） |
| MCP Prompts Generator | ~400 行 | ~15% |

**总结：Parser + IR + 工具函数大约 1200 行可以 100% 复用。每新增一种输出格式，增量代码约 200-600 行。这是合理的——不需要为了复用而扭曲设计。**

---

## 四、简单性保证

### Plugin/Adapter 模式够用吗？

**够用，但不要过早引入。**

先看问题：10+ 输出格式，如果没有统一的接口，`cli.ts` 会变成一堆 if-else：

```typescript
// 糟糕的做法
if (format === 'mcp-server') { generateMCPServer(ir) }
if (format === 'skills') { generateSkills(ir) }
if (format === 'docs') { generateDocs(ir) }
// ... 10 more
```

需要的是一个最简的 Generator 接口：

```typescript
// 够用的抽象层级
interface OutputGenerator {
  readonly name: string           // 'mcp-server', 'skills', 'docs', ...
  readonly description: string
  generate(ir: ProductIR, options: GeneratorOptions): Promise<GeneratedOutput>
}

interface GeneratedOutput {
  readonly files: readonly GeneratedFile[]
  readonly summary: string
}

interface GeneratedFile {
  readonly path: string           // 相对于输出目录的路径
  readonly content: string
}
```

**注意：这不是 Plugin 系统。** 没有 registry，没有 lifecycle hooks，没有动态加载。就是一个 interface + 一个数组：

```typescript
// generators/index.ts
import { mcpServerGenerator } from './mcp-server'
import { skillsGenerator } from './skills'
import { docsGenerator } from './docs'
import { claudeMdGenerator } from './claude-md'

// 硬编码的生成器列表——简单、明确、可 grep
export const generators: readonly OutputGenerator[] = [
  mcpServerGenerator,
  skillsGenerator,
  docsGenerator,
  claudeMdGenerator,
]
```

**什么时候升级为 Plugin 系统？** 当有第三方开发者想要添加自定义输出格式的时候。根据我的经验，这至少在发布 6 个月之后才可能发生。在那之前，硬编码列表完全够用。

### 保持简单的具体策略

1. **一个 Generator 一个文件** —— 不要试图在 Generator 之间做继承。每个 Generator 是独立的纯函数，输入 ProductIR，输出文件列表。复用通过调用共享工具函数实现，不通过继承。

2. **Generator 内部不要多层抽象** —— 一个 Skills Generator 不需要"SkillTemplate" + "SkillRenderer" + "SkillFormatter"三层。一个函数把 IR 变成 Markdown 字符串就行了。

3. **让用户选择输出格式，而不是全部生成** —— 默认生成最有用的子集（MCP Server + Skills + Docs），其他通过 flag 选择。避免"生成了 10 种格式但用户只需要 1 种"的尴尬。

```bash
# 默认：最有价值的组合
npx agentify https://api.example.com/openapi.json

# 指定格式
npx agentify https://api.example.com/openapi.json --formats mcp-server,skills

# 全部
npx agentify https://api.example.com/openapi.json --formats all
```

4. **每种格式有独立的测试** —— 不要写一个巨大的 integration test 覆盖所有格式。每种格式有自己的 snapshot 测试，独立运行，独立失败。

---

## 五、具体的模块设计

### 目录结构（单包，不要 monorepo）

```
agentify/
├── src/
│   ├── cli.ts                        # CLI 入口，参数解析
│   ├── index.ts                      # 库入口（programmatic API）
│   │
│   ├── parser/
│   │   ├── openapi-parser.ts         # OpenAPI spec -> ProductIR
│   │   ├── sanitizer.ts              # 输入净化
│   │   └── schema-utils.ts           # JSON Schema 处理工具
│   │
│   ├── ir/
│   │   └── types.ts                  # ProductIR 类型定义
│   │
│   ├── generators/
│   │   ├── types.ts                  # OutputGenerator interface
│   │   ├── index.ts                  # Generator 注册表（硬编码列表）
│   │   ├── shared/                   # 共享工具函数
│   │   │   ├── description.ts        # 描述文本处理
│   │   │   ├── schema-render.ts      # Schema -> 各种格式
│   │   │   └── auth-render.ts        # 认证配置渲染
│   │   ├── mcp-server/               # MCP Server 生成
│   │   │   ├── generator.ts
│   │   │   └── templates/            # Handlebars 模板
│   │   ├── mcp-resources/            # MCP Resources 生成
│   │   │   └── generator.ts
│   │   ├── skills/                   # Claude Code Skills 生成
│   │   │   ├── generator.ts
│   │   │   └── templates/
│   │   ├── docs/                     # Agent-friendly Docs 生成
│   │   │   ├── generator.ts
│   │   │   └── templates/
│   │   ├── claude-md/                # CLAUDE.md 生成
│   │   │   └── generator.ts
│   │   └── cli-wrapper/              # CLI Wrapper 生成（Phase 2）
│   │       └── generator.ts
│   │
│   ├── security/
│   │   ├── input-sanitizer.ts        # 输入净化
│   │   └── output-scanner.ts         # 生成代码安全扫描
│   │
│   └── strategies/
│       └── size-strategy.ts          # 小/中/大 API 分层策略
│
├── test/
│   ├── parser/
│   ├── generators/
│   │   ├── mcp-server/
│   │   ├── skills/
│   │   ├── docs/
│   │   └── __snapshots__/
│   └── fixtures/                     # 测试用 OpenAPI specs
│       ├── petstore.yaml
│       ├── stripe-subset.yaml
│       └── github-subset.yaml
│
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

### 模块间依赖关系

```
cli.ts
  |
  +---> parser/openapi-parser.ts ---> ir/types.ts
  |                                      |
  +---> generators/index.ts              |
         |                               |
         +---> generators/mcp-server/ ---+---> generators/shared/
         +---> generators/skills/ -------+---> generators/shared/
         +---> generators/docs/ ---------+---> generators/shared/
         +---> generators/claude-md/ ----+---> generators/shared/
         ...
```

**依赖方向始终是单向的：** cli -> parser -> ir <- generators <- shared。没有循环依赖，没有 God object。

### 每个模块的职责边界

| 模块 | 知道什么 | 不知道什么 |
|------|---------|----------|
| cli.ts | 命令行参数、用户交互 | IR 内部结构、生成逻辑 |
| parser/ | OpenAPI spec 结构 | 输出格式、生成逻辑 |
| ir/types.ts | 数据结构定义 | 任何逻辑 |
| generators/shared/ | IR 的通用处理 | 具体输出格式 |
| generators/xxx/ | 特定输出格式的一切 | 其他输出格式 |
| security/ | 安全规则 | 业务逻辑 |

---

## 六、风险点

### 风险 1：IR 不够用（中等概率，高影响）

**问题：** Phase 0.5 设计的 IR 可能在 Phase 2 发现不够用。比如 MCP Prompts 需要理解 capability 间的 workflow 关系（"先创建用户，再创建订单"），但当前 IR 没有这层信息。

**应对：** IR 是可以演进的。关键是保持 IR 类型定义的向后兼容——只加字段，不改字段。用 `readonly` 确保所有 Generator 都是 IR 的消费者而非修改者。

```typescript
// Phase 1 的 IR
interface CapabilityIR {
  readonly id: string
  readonly name: string
  // ...
}

// Phase 2 增加字段，不破坏 Phase 1 的 Generator
interface CapabilityIR {
  readonly id: string
  readonly name: string
  readonly relatedCapabilities?: readonly string[]  // 新增，可选
  readonly workflowStep?: WorkflowPosition          // 新增，可选
  // ...
}
```

### 风险 2：Skills 和 Prompts 的质量问题（高概率，中影响）

**问题：** MCP Server 的代码生成质量容易验证——能不能编译、能不能运行。但 Skills 和 Agent-friendly Docs 的质量是主观的——生成的 Markdown "好不好用"取决于 LLM 能不能理解。

**应对：** 需要建立评估机制。最简单的方式：

1. 生成 Skills 后，用 Claude 实际执行一遍，看成功率
2. 维护一组 "golden" Skills（手写的高质量 Skills），用作 benchmark
3. 接受"第一版质量一般"的现实，快速迭代

**坦白说：** 没有 LLM 辅助的 Skills 生成，质量上限不高。OpenAPI spec 的 description 字段通常是给人看的短句（"List users"），不是给 Agent 用的详细指令（"List all users with pagination. Use limit and offset parameters. Returns a paginated list with total count..."）。Phase 1 可以做基础版本，Phase 2 引入 LLM 增强。

### 风险 3：格式间的一致性问题（中等概率，中影响）

**问题：** 10 种输出格式，每种都有独立的 Generator。如果 MCP Server 里的 tool name 叫 `createUser`，Skills 里叫 `create-user`，Docs 里叫 `Create User`——用户会困惑。

**应对：** 命名规范必须在 IR 层统一，Generator 层只做格式转换：

```typescript
// IR 层定义规范名
interface CapabilityIR {
  readonly id: string        // 'create-user' (kebab-case, 规范形式)
  readonly name: string      // 'Create User' (人类可读)
}

// 各 Generator 根据目标格式转换
// MCP Server: camelCase('create-user') -> 'createUser'
// CLI: 保持 kebab-case -> 'create-user'
// Skills: 保持人类可读 -> 'Create User'
```

### 风险 4：某些格式可能做不了或不值得做（高概率，低影响）

**坦白说几个格式的问题：**

**A2A Agent Cards** —— A2A 协议（Google 主推）仍在非常早期，spec 还在变。投入时间做一个可能 3 个月后就过时的输出格式，ROI 不高。建议：关注但不急着做，等协议稳定后再加。

**Webhooks/Events** —— 这个格式有本质困难。OpenAPI spec 不描述事件模型（哪些操作会触发什么事件）。没有输入信息，就没法生成有意义的 Webhook 配置。除非用 LLM 推断，但推断的准确性存疑。建议：降低优先级，等 AsyncAPI spec 支持后再考虑。

**API SDK** —— 这是 Stainless 的核心业务，他们在这个领域投入了大量工程资源。正面竞争不明智。建议：生成轻量的 "API client snippet"（在 Docs 和 Skills 中嵌入），而不是完整的 SDK。

**CLI wrapper** —— 生成 shell 命令看起来简单，但参数映射（JSON body -> CLI flags）是个坑。嵌套对象怎么映射？数组参数怎么传？file upload 怎么处理？建议：先做最简单的 GET 类 endpoint，写入/复杂参数的延后。

### 风险 5：开发者体验的复杂度爆炸（中等概率，高影响）

**问题：** 支持 10 种输出格式后，`npx agentify --help` 会变得很长。每种格式有自己的选项，用户选择困难。

**应对：**
1. **智能默认** —— 不让用户选择，自动生成最有用的组合。
2. **Profile 模式** —— 提供预设组合而非单独选项：

```bash
# 给 Claude Code 用户
npx agentify https://api.example.com --profile claude
# 生成: MCP Server + Skills + CLAUDE.md

# 给通用 Agent 开发者
npx agentify https://api.example.com --profile agent
# 生成: MCP Server + Docs + A2A Card

# 给终端用户
npx agentify https://api.example.com --profile terminal
# 生成: CLI wrapper + Skills
```

3. **渐进式展示** —— 默认只显示核心输出，`--verbose` 或 `--all` 才展示全部。

---

## 七、最终建议

### 路线图修订

```
Phase 0.5 (1-2 周) — 已确定
  - OpenAPI Parser -> ProductIR -> MCP Server
  - 安全基线
  - 一条命令体验

Phase 1a (发布后 1-2 周) — 低悬果实
  - Skills Generator (最简模板，从 IR 生成 Markdown)
  - CLAUDE.md Generator (单文件，非常简单)
  - Agent-friendly Docs Generator
  - MCP Resources Generator
  * 关键: 一次 parse，四种输出。这就是"多输出平台"的 MVP。

Phase 1b (发布后 3-4 周) — IR 增强
  - IR 增加 enrichedDescription（LLM 辅助）
  - IR 增加 usageExamples（LLM 生成）
  - Skills 质量显著提升
  - Docs 质量显著提升

Phase 2 (发布后 5-8 周) — 扩展输出格式
  - CLI Wrapper (简单的 GET endpoints 先)
  - MCP Prompts (需要 workflow 理解)
  - OutputGenerator interface 正式化
  - 可能的 Plugin 系统（如果有社区需求）

Phase 3 (发布后 9-12 周) — 高级格式
  - A2A Agent Cards (等协议稳定)
  - API SDK snippets (不做完整 SDK)
  - 多输入源 (GraphQL, 文档)
```

### 核心原则（重申）

1. **先做 MCP Server 做到极致，再加格式。** 不要在 MCP Server 还没证明价值的时候就去做 10 种格式。
2. **每种新格式必须在 1-3 天内完成 v1。** 如果一种格式需要超过一周的工程投入，说明 IR 设计有问题或者这个格式不适合自动生成。
3. **格式之间的一致性比单个格式的完美更重要。** 用户不会因为 Skills 写得特别好而选择你，但会因为 MCP Server 和 Skills 之间不一致而放弃你。
4. **接受"80% 质量"。** 自动生成的 Skills/Docs 不可能比人类手写的好。目标是"比没有好很多"，不是"完美"。
5. **不要做 Stainless 做的事。** API SDK 生成是他们的地盘。做他们不做的事：Skills、Docs、CLAUDE.md、MCP Resources。

### 关于"多输出平台"这个定位

上次我说"先做一个让人惊叹的 CLI 工具"。这次我的看法有所调整：

**"多输出"本身就是让人惊叹的特性。** 如果用户运行一条命令，不只得到 MCP Server，还同时得到 Skills、Docs、CLAUDE.md——这个"一键全套"的体验确实是市面上没有的。

但前提是：**每种输出的质量都过及格线。** 生成一个跑不起来的 MCP Server + 一堆看不懂的 Skills + 一份没用的文档 = 不如只生成一个完美的 MCP Server。

**所以我的建议是：Phase 0.5 只做 MCP Server，做到无可挑剔。然后 Phase 1a 同时加 Skills + Docs + CLAUDE.md，让"多输出"成为 Phase 1 的 headline feature。** 这比一开始就铺开 10 种格式要明智得多。

---

> "Do one thing well, then do more things well."
>
> 先做好一件事，然后做好更多事。
>
> 不是"先规划好十件事，然后一件都做不好。"

---

*探索完毕。以上分析基于 20+ 年的工程经验和对过度设计的深深恐惧。多输出愿景是对的方向，但执行上必须克制。*
