# Agentify 产品计划工程评审：老派开发者视角

> 评审人：资深老派开发者（20+ 年经验）
> 评审日期：2026-03-02
> 评审范围：CLAUDE.md、产品计划、四份调研报告
> 态度：善意但残酷的诚实

---

## 总评

这是一份雄心勃勃的产品计划，调研做得扎实全面。但计划有一个致命的通病：**它是在设计一个平台，而不是在解决一个问题。** 20+ 年的经验告诉我，成功的开源项目从来不是先设计一个精美的架构然后期望用户到来，而是先解决一个让人痛到骨头里的问题，然后架构自然生长出来。

**一句话总结：砍掉 70% 的复杂度，先做一个让人惊叹的 OpenAPI -> MCP 转换器。**

---

## 1. 过度工程风险：Capability Graph 真的需要吗？

### 问题分析

产品计划把 Capability Graph 定义为"核心竞争力"——5 种实体类型、6 种关系类型、内存图结构，未来还要升级到 Neo4j。

**老实说，这是典型的"先有锤子再找钉子"。**

让我们回到 Phase 1 的目标：**OpenAPI spec -> MCP Server**。这个流程本质上是：

```
OpenAPI JSON/YAML -> 解析 -> 提取 endpoints/schemas -> 渲染成 MCP Server 代码
```

这是一个 **线性转换管线**，不是一个图问题。OpenAPI spec 本身已经是高度结构化的——它有 paths、operations、schemas、parameters、responses。你把这些东西先解构成一个自定义的 Graph，再从 Graph 重构成 MCP Server 代码，**中间多了一层不必要的间接性（indirection）**。

### 具体质疑

1. **Phase 1 只有一种输入（OpenAPI）和一种输出（MCP Server）**。Graph 的价值在于"多输入多输出"的枢纽——但 Phase 1 没有多输入多输出。
2. **Graph 的 6 种关系类型在 Phase 1 大部分用不到**。`depends_on` 和 `composes` 在 OpenAPI->MCP 场景中几乎无用——OpenAPI 的 endpoints 基本是独立的。
3. **内存图结构意味着你需要设计序列化/反序列化**。这是额外的复杂度，Phase 1 完全不需要持久化。
4. **Graph 增加了调试难度**。当生成的 MCP Server 有 bug 时，你需要同时检查 OpenAPI 解析是否正确、Graph 构建是否正确、Graph->MCP 转换是否正确。三层排查。

### 反提案：扁平的 Intermediate Representation

```typescript
// 不需要 Graph，一个简单的扁平结构就够了
interface ParsedCapability {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly httpMethod: string
  readonly path: string
  readonly inputSchema: ZodSchema
  readonly outputSchema: ZodSchema
  readonly auth: AuthRequirement | null
  readonly tags: readonly string[]  // 用于分组，替代 "Domain" 节点
}

interface ParsedProduct {
  readonly name: string
  readonly version: string
  readonly baseUrl: string
  readonly capabilities: readonly ParsedCapability[]
  readonly globalAuth: AuthConfig
}
```

**Phase 1 用这个就够了。** 当 Phase 2 真的需要多输入源时，再考虑是否需要更复杂的中间表示。到那时你会有真实的需求来指导设计，而不是现在的臆测。

### 核心原则

> **"Make it work, make it right, make it fast."** — Kent Beck
>
> 你连 "make it work" 都还没做到，就在设计 "make it right" 的架构了。

---

## 2. 依赖地狱

### 当前依赖清单（Phase 1）

```
@modelcontextprotocol/sdk    — 必需，核心
zod                          — 必需，schema 验证
typescript                   — 必需，语言
@apidevtools/swagger-parser  — 必需，OpenAPI 解析
ts-morph                     — 存疑
handlebars                   — 存疑
turborepo                    — 存疑
commander                    — 可以延后
vitest                       — 必需，测试
prettier                     — 可以延后
eslint                       — 可以延后
```

### 必须砍掉或延后的

#### ts-morph（强烈建议砍掉）

ts-morph 是 TypeScript Compiler API 的封装，用于 AST 级别的代码操作。它的安装大小约 **15MB**，依赖 `typescript` 包的特定版本，版本冲突风险极高。

**问题是：你真的需要 AST 级别的代码生成吗？**

你生成的是 MCP Server 代码——本质上是一堆按模式排列的 TypeScript 文件。这不是重构器（refactoring tool），不需要精确到 AST 节点。**字符串模板完全够用。**

看看竞品怎么做的：
- `openapi-mcp-generator`：用 Jinja2 模板，工作得很好
- `openapi-mcp-codegen`：也是模板，也工作得很好
- Stainless：生成的代码结构固定，不需要 AST

**AST 级代码生成的真正用例是 IDE 插件或 codemod 工具**，而不是脚手架生成器。

#### Handlebars（可以简化）

如果砍掉 ts-morph，那 Handlebars 可以继续用。但考虑更轻量的方案：
- **Tagged template literals**（原生 JavaScript，零依赖）
- **EJS**（更轻量，语法更直觉）

或者，如果代码结构足够固定（Phase 1 确实如此），**直接用模板字符串加 `prettier` 格式化**就行了：

```typescript
function generateToolFile(capability: ParsedCapability): string {
  return `
import { z } from 'zod';

export const ${capability.name}Tool = {
  name: '${capability.id}',
  description: '${escapeString(capability.description)}',
  inputSchema: ${schemaToZodString(capability.inputSchema)},
  async execute(args: unknown) {
    // ... generated implementation
  }
};
`
}
```

#### Turborepo（Phase 1 不需要）

详见第 4 节。

### 建议的最小依赖集（Phase 1）

```
@modelcontextprotocol/sdk    — MCP 协议
zod                          — Schema 验证
@apidevtools/swagger-parser  — OpenAPI 解析
vitest                       — 测试
commander                    — CLI（或者用更轻量的 citty）
```

**5 个运行时依赖。** 干净、清晰、可控。

---

## 3. YAGNI 违反清单

YAGNI = "You Aren't Gonna Need It"。以下是产品计划中 Phase 1 不应该出现的东西：

### 3.1 Plugin 系统（最严重的 YAGNI）

产品计划在 Phase 1 就规划了完整的 Plugin 系统：

```typescript
interface AgentifyPlugin {
  name: string
  version: string
  type: 'ingestor' | 'transformer' | 'validator'
  register(registry: PluginRegistry): void
}
```

**Phase 1 只有一个 ingestor（OpenAPI）和一个 transformer（MCP）。你在为一个用户（你自己）设计一个 Plugin marketplace。**

正确的做法：

1. Phase 1：把 OpenAPI ingestor 和 MCP transformer 写成普通函数/类，内联在 core 包里
2. Phase 2：如果确实要加 GraphQL，再提取出 interface。到时候你有两个实现可以参考，interface 设计会更准确
3. Phase 3：如果社区真的有需求，再加 Plugin registry

> **"The right time to write an abstraction is after you have three concrete examples."** — Rule of Three

### 3.2 Readiness Score 算法（Phase 1 可以更简单）

产品计划中的 Readiness Score 有 6 个维度。Phase 1 只解析 OpenAPI，那 Score 可以简化为：

```typescript
function calculateReadinessScore(spec: OpenApiSpec): number {
  const checks = [
    hasCompleteSchemas(spec),        // schemas 是否完整
    hasDescriptions(spec),           // 描述是否充分
    hasAuthDefinition(spec),         // 是否定义了认证
    hasErrorResponses(spec),         // 是否有错误响应定义
    hasExamples(spec),               // 是否有示例
  ]
  return checks.filter(Boolean).length * 20  // 简单的百分比
}
```

**20 行代码，而不是一个独立的包。** 等有真实用户反馈后再迭代。

### 3.3 `@agentify/validator` 作为独立包

Phase 1 的验证需求：
1. 检查生成的 MCP Server 代码是否通过 TypeScript 编译
2. 检查生成的 tools 是否符合 MCP schema

这用不着一个独立的包。一个 `validate.ts` 文件就够了，里面调用 `tsc --noEmit` 和 MCP SDK 的 schema 验证。

### 3.4 `@agentify/templates` 作为独立包

Phase 1 只生成 TypeScript MCP Server。模板直接放在 `@agentify/core` 里的一个 `templates/` 目录就行了。等 Phase 2 需要 Python 模板时再考虑拆包。

### 3.5 Dog-fooding MCP Server（Phase 1）

产品计划把 `@agentify/mcp-server` 列在 Phase 2，但 CLAUDE.md 里有这个包。确认一下：**Phase 1 不要做自己的 MCP Server**。先做一个优秀的 CLI 工具，dog-fooding 的对象应该是 CLI 本身，不是 MCP Server。

### 3.6 多输出格式

Phase 1 只需要 MCP Server 输出。Skills、API Wrapper、Agent Config 全部推到 Phase 2+。一种输入一种输出，做到极致。

---

## 4. Monorepo 复杂度

### 当前规划：7-10 个包

```
@agentify/core
@agentify/cli
@agentify/mcp-server
@agentify/plugin-openapi
@agentify/plugin-mcp
@agentify/plugin-graphql
@agentify/plugin-docs
@agentify/plugin-skills
@agentify/templates
@agentify/validator
```

**一个还没写第一行代码的项目，规划了 10 个包。这是过度组织。**

### 问题分析

1. **Turborepo 配置成本**：`turbo.json`、workspace 配置、包之间的依赖管理、构建顺序——这些在早期全是负担
2. **包之间的类型共享**：需要发布 `.d.ts` 或用 project references，增加构建复杂度
3. **版本管理**：多包意味着多 `package.json`，版本同步是持续的维护成本
4. **新贡献者门槛**：clone 一个 10 包的 monorepo vs 一个简单项目，哪个更容易上手？
5. **CI/CD 复杂度**：构建缓存、增量构建、发布流水线——这些都是必须维护的基础设施

### 反提案：单包起步

```
agentify/
├── src/
│   ├── index.ts              # 主入口
│   ├── cli/
│   │   ├── index.ts          # CLI 入口
│   │   └── commands/
│   │       ├── analyze.ts
│   │       ├── generate.ts
│   │       └── score.ts
│   ├── ingestors/
│   │   └── openapi.ts        # OpenAPI 解析
│   ├── generators/
│   │   └── mcp-server.ts     # MCP Server 生成
│   ├── templates/
│   │   └── mcp-typescript/   # MCP Server 模板
│   ├── validators/
│   │   └── mcp-validator.ts  # MCP Server 验证
│   ├── scoring/
│   │   └── readiness.ts      # Readiness 评分
│   └── types/
│       └── index.ts          # 共享类型
├── tests/
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

**单包、单 `package.json`、零 monorepo 配置。** 当（且仅当）以下条件满足时再拆包：
- 有外部用户需要单独安装某个子模块
- 某个模块的依赖太重，拖慢其他模块的安装
- 有独立的发布节奏需求

### 关于 Turborepo 的具体建议

**Phase 1 不使用 Turborepo。** 原因：
- 单包不需要 monorepo 工具
- `vitest` 本身已经很快
- `tsc` 增量编译已经足够
- 减少一个需要学习和维护的工具

如果 Phase 2 确实需要拆包，考虑用 **pnpm workspaces**（零额外依赖）而不是 Turborepo（又一个依赖）。

---

## 5. 技术栈质疑

### 5.1 Node.js 22 的原生 TS 支持

产品计划提到 "Node.js 22+ 原生 TS 支持"。我需要泼冷水：

**Node.js 22 的 type stripping 是实验性的（--experimental-strip-types），在 22.6.0 引入，到 22.18.0+ 才相对稳定。**

具体限制：
- 不支持 `enum`（需要 `--experimental-transform-types`）
- 不支持 `namespace`
- 不支持 decorator metadata
- 不支持 `import =` 语法
- 某些 `tsconfig.json` 选项不生效

**对于一个开源项目来说，依赖"刚稳定的实验性特性"是一个风险。** 用户可能在 Node 18/20 上运行。

### 替代建议

1. **开发时用 `tsx`（零配置 TypeScript 执行器）**，生产构建用 `tsup`。这是 2026 年最成熟的方案
2. **`engines` 字段设置为 `>=18.0.0`**，扩大兼容范围
3. 或者干脆用 **Bun**——如果选择先锋技术栈，不如选一个真正有生产力优势的。Bun 的构建速度和运行速度都显著优于 Node.js，且原生支持 TypeScript

### 5.2 Zod

Zod 是正确的选择，没有异议。Runtime schema validation + TypeScript type inference 的最佳方案。

但提醒一点：**OpenAPI spec 用的是 JSON Schema，Zod 用的是自己的 schema DSL。你需要 `openapi-to-zod` 之类的转换。** 确保这个转换的质量有保障。

### 5.3 Vitest

正确的选择。比 Jest 快，原生支持 TypeScript，生态已成熟。

---

## 6. 代码生成陷阱

### ts-morph + Handlebars 两套引擎的冲突

产品计划中同时使用两种代码生成方案：
- **ts-morph**: AST 级别的精确代码生成
- **Handlebars**: 模板级别的文本生成

**这两种方案的设计哲学是冲突的：**

| 维度 | ts-morph | Handlebars |
|------|----------|------------|
| 抽象层次 | AST (语法树) | 文本 (字符串) |
| 精确度 | 极高（类型安全） | 低（纯文本拼接） |
| 灵活性 | 低（必须符合语法） | 高（任意文本） |
| 学习曲线 | 陡峭 | 平缓 |
| 适用场景 | IDE 重构、codemod | 脚手架、模板渲染 |

**在一个项目中混用两套引擎的后果：**

1. **认知负担翻倍**：贡献者需要同时理解 ts-morph API 和 Handlebars 语法
2. **维护成本翻倍**：Bug 可能在 AST 层或模板层，需要两套调试手段
3. **职责不清**：哪些代码用 ts-morph 生成？哪些用 Handlebars？边界在哪里？
4. **格式不一致**：ts-morph 生成的代码格式和 Handlebars 生成的可能不一致

### 反提案：只用 Handlebars（或者更简单的方案）

**对于 MCP Server 脚手架生成，只需要模板引擎。**

原因：
1. 生成的代码结构是固定的（server.ts, tools/, resources/, schemas/）
2. 变量部分只是 tool name, description, schema, implementation——这些用模板替换足够了
3. 生成后用 `prettier` 统一格式化
4. 如果用户需要修改生成的代码，直接改就好——不需要 AST 保证

**更简单的方案：**

```typescript
// 用 tagged template literals，零依赖
function renderTool(cap: ParsedCapability): string {
  return dedent`
    import { z } from 'zod'

    export const ${camelCase(cap.name)}Tool = {
      name: ${JSON.stringify(cap.id)},
      description: ${JSON.stringify(cap.description)},
      inputSchema: ${renderZodSchema(cap.inputSchema)},
      async execute(args: z.infer<typeof this.inputSchema>) {
        const response = await fetch(
          \`\${config.baseUrl}${cap.path}\`,
          {
            method: ${JSON.stringify(cap.httpMethod)},
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(args),
          }
        )
        return response.json()
      }
    }
  `
}
```

**什么时候才需要 ts-morph？** 当你做 **codemod** 的时候——比如把已有的 TypeScript 代码转换为另一种形态。但那是 Phase 3 的 "SDK 源码分析" 场景，不是 Phase 1。

### 模板生成代码的质量保证

无论用什么方案生成代码，质量保证手段是一样的：

1. **编译检查**：`tsc --noEmit` 确保生成的代码类型正确
2. **运行时测试**：实际启动生成的 MCP Server，用 MCP Client 调用
3. **Snapshot 测试**：对已知 OpenAPI spec 的生成结果做 snapshot
4. **Golden File 测试**：维护一组"标准答案"，CI 中自动比对

---

## 7. 被忽视的简单方案

### 7.1 直接 fork FastMCP 的 from_openapi

**FastMCP** 的 Python 版已经有 `FastMCP.from_openapi()` 方法，能直接把 OpenAPI spec 转成 MCP Server。如果目标只是"快速让 OpenAPI 变成 MCP Server"，这已经是一个可用的方案。

**TypeScript 版本的 FastMCP** 也在发展中。你可以：
1. Fork FastMCP TypeScript 版
2. 增加 Readiness Score 功能
3. 改进 tool description 生成质量
4. 用 2 周而不是 6 周交付 Phase 1

**为什么这个方案被忽视了？** 可能因为计划团队在思考"如何构建一个平台"，而不是"如何最快解决用户问题"。

### 7.2 用 Stainless 的方式——两个 tool

Stainless 的 MCP Server 只暴露两个 tool：code execution 和 docs search。这种方式：
- Context window 占用极小
- 不需要为每个 endpoint 生成一个 tool
- LLM 自己写调用代码

**Agentify 可以提供这种模式作为选项**，而不是只做"一个 endpoint 一个 tool"。

### 7.3 配置驱动而非代码生成

另一个被忽视的方案：**不生成代码，生成配置。**

```yaml
# agentify.config.yaml
source:
  type: openapi
  spec: ./openapi.yaml

server:
  transport: stdio
  name: my-api-mcp-server

tools:
  include:
    - tag: users
    - tag: orders
  exclude:
    - operationId: internal_*

auth:
  type: bearer
  envVar: API_TOKEN
```

然后一个通用的 runtime server 根据这个配置动态创建 tools。**AWS OpenAPI MCP Server 就是这种模式。**

好处：
- 零代码生成，用户不需要"拥有"生成的代码
- 配置变更立即生效
- 升级 Agentify 不需要重新生成代码

坏处：
- 不可定制（不能修改 tool 实现）
- 调试需要理解 Agentify 的运行时

**建议：Phase 1 提供两种模式——配置驱动（快速预览）+ 代码生成（自定义需求）。**

### 7.4 单文件 MCP Server 生成

与其生成一个完整的 npm 项目（package.json, tsconfig, 目录结构），不如先生成**单个 TypeScript 文件**：

```bash
agentify generate --input openapi.yaml --output my-mcp-server.ts
```

用户可以直接 `npx tsx my-mcp-server.ts` 运行。**一个文件，零配置。**

这对于快速验证和原型设计远比一个完整项目更有价值。完整项目可以作为 `--scaffold` 选项提供。

---

## 8. 调研报告的盲点

### 8.1 对竞品的实际体验缺失

调研报告列出了大量竞品，但没有一份**实际使用报告**。我想看到：

1. 用 `openapi-mcp-generator` 生成一个 Stripe MCP Server，实际运行了吗？效果如何？
2. 用 FastMCP `from_openapi` 对比一下，差距在哪里？
3. Stainless 生成的 MCP Server 实际在 Claude 里使用的体验如何？
4. Agoda APIAgent 的零代码方案，对于你们的目标用户够用吗？

**没有 hands-on 对比，所有的"差异化"都是纸上谈兵。**

### 8.2 忽视了 "够好就行" 的用户

产品计划假设用户需要"端到端全链路"。但大多数开发者的实际需求可能是：

> "我有一个 OpenAPI spec，我想快速生成一个还行的 MCP Server，不需要完美。"

这个需求，`openapi-mcp-generator` 已经能解决。Agentify 的差异化需要建立在"明显比现有方案好"的基础上，而不是"功能更多"。

### 8.3 "12-18 个月窗口期" 的乐观偏差

每个创业计划都说"窗口期 12-18 个月"。现实是：
- Stainless 已经在做 OpenAPI -> MCP，且资金充裕
- Cloudflare 有平台优势，Code Mode 已经上线
- Azure API Management 已经集成 MCP
- Anthropic 自己可能随时推出类似工具

**真正的窗口期可能只有 6 个月。** 这更加说明了要快速交付 MVP，而不是花 4-6 周建 monorepo 脚手架。

---

## 9. 具体行动建议

### Phase 1 应该是什么样（2 周而非 6 周）

**Week 1：**

```
Day 1-2: 单包项目搭建，CLI 骨架
Day 3-4: OpenAPI spec -> ParsedProduct（扁平 IR）
Day 5: ParsedProduct -> MCP Server 代码（模板字符串 + prettier）
```

**Week 2：**

```
Day 1-2: Readiness Score（简单的清单检查）
Day 3: 用 5 个真实的 OpenAPI spec 测试（Stripe, GitHub, Notion, Slack, Twilio）
Day 4: 修 bug，完善 README
Day 5: 发布 0.1.0
```

### 砍掉的东西

| 原计划 | 处置 | 理由 |
|--------|------|------|
| Capability Graph | 砍，用扁平 IR | Phase 1 不需要图 |
| ts-morph | 砍 | 不需要 AST 级生成 |
| Turborepo | 砍 | 单包不需要 monorepo |
| Plugin 系统 | 推到 Phase 2 | 只有一种输入一种输出 |
| `@agentify/validator` 独立包 | 内联到 core | 一个文件就够 |
| `@agentify/templates` 独立包 | 内联到 core | 一个目录就够 |
| Node.js 22 原生 TS | 用 tsx + tsup | 更稳定、兼容性更好 |
| 10 个 npm 包 | 1 个包 | 过度拆分 |

### 保留的东西

| 组件 | 理由 |
|------|------|
| Zod | 正确选择，schema 验证核心 |
| @modelcontextprotocol/sdk | 必需 |
| @apidevtools/swagger-parser | 必需 |
| Vitest | 正确选择 |
| Handlebars 或模板字符串 | 代码生成方案 |
| CLI (commander) | 用户入口 |
| Readiness Score | 差异化功能，但简化实现 |
| Dog-fooding 理念 | 好想法，但推到 Phase 2 |

---

## 10. 最后的忠告

### 给团队的一句话

> **先做一个让开发者说 "卧槽这太好用了" 的 CLI 工具，然后一切都会跟着来。**

不要做一个让开发者说 "哇架构好精美但我不知道怎么用" 的平台。

### 历史教训

- **Webpack** 成功不是因为它的 Plugin 系统设计精美，而是因为它解决了 module bundling 的实际问题。Plugin 系统是后来长出来的。
- **Docker** 成功不是因为它的编排能力（那是 Kubernetes 后来做的），而是因为 `docker build` 和 `docker run` 太好用了。
- **Git** 成功不是因为它的分布式架构（大多数人当中心化用），而是因为 `git commit` 和 `git branch` 足够快。

### 核心原则

1. **先有用户，再有架构。** 不要为假想的用户设计。
2. **第一版必须能在 10 分钟内完成安装、使用、获得结果。** 如果不能，砍功能直到能。
3. **复杂度是慢慢挣来的，不是一开始就规划好的。** 当你的简单方案扛不住了，再加复杂度。
4. **每一个抽象层都有成本。** Capability Graph 是一个抽象层，Plugin 系统是一个抽象层，Monorepo 是一个抽象层。Phase 1 应该有零个额外抽象层。

---

> "Perfection is achieved, not when there is nothing more to add, but when there is nothing left to take away."
> — Antoine de Saint-Exupery
>
> "简单到极致，而非复杂到极致。"

---

*评审完毕。以上意见可能听着刺耳，但只要对项目有利，刺耳一点也无妨。祝 Agentify 成功。*
