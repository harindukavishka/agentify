# Agentify 多输出愿景：运维工程师深度探索

> 评审人：老派运维工程师（15 年 SRE 经验）
> 日期：2026-03-02
> 立场：上次评审完 Phase 0.5 我就没睡好，现在你们要搞 10 种输出格式，我彻底失眠了

---

## 前言：从"一种输出"到"十种输出"的运维复杂度不是 10x，是 100x

上一轮评审我说 Agentify "只画了蓝图但没有盖好下水道"。Phase 0.5 修订后解决了一部分——Dockerfile、结构化日志、health check 都加上了。但现在新愿景要生成 **10 种输出格式**（MCP Server、Skills、CLI tools、Agent docs、.cursorrules、A2A Cards、API SDK、Webhooks 等），运维复杂度不是线性增长——是组合爆炸。

每种输出格式有不同的：
- **运行时需求**（有的需要 process，有的是静态文件，有的是 SaaS 配置）
- **部署方式**（npm publish、Docker push、文件复制、API 注册）
- **生命周期**（有的需要持续运行，有的一次性生成）
- **测试方法**（runtime test、schema validation、lint check、integration test）
- **更新机制**（rebuild、re-deploy、re-publish、hot reload）

这不是一个"多跑几次 codegen"能解决的问题。这是一个**分布式系统编排问题**。

---

## 一、多输出的部署复杂度矩阵

### 1.1 每种输出格式的运维特征

| 输出格式 | 运行时 | 部署方式 | 状态 | 更新频率 | 运维复杂度 |
|---------|--------|---------|------|---------|-----------|
| MCP Server | Node.js process / Docker | Container registry / stdio | Stateful (connections) | 随 API 更新 | **极高** |
| CLI Tool | 用户终端 / npx | npm publish / homebrew / binary | Stateless | 版本发布 | **高** |
| Skills | 静态 JSON/YAML | 文件系统 / git | Stateless | 随 API 更新 | **低** |
| Agent Docs | 静态 Markdown | 文件系统 / hosting | Stateless | 随 API 更新 | **低** |
| .cursorrules | 静态文本 | 文件系统 | Stateless | 低频 | **极低** |
| A2A Cards | JSON manifest | 注册到 A2A registry | Stateless | 随 capability 变更 | **中** |
| API SDK | TypeScript/Python package | npm/pypi publish | Stateless | 随 API 更新 | **高** |
| Webhooks | HTTP server / Lambda | Cloud deploy | Stateful (subscriptions) | 随事件定义更新 | **高** |
| Grafana Dashboard | JSON config | Grafana API import | Stateless | 随 metrics 变更 | **低** |
| Docker Compose | YAML config | 文件系统 | Stateless | 随部署需求变更 | **低** |

### 1.2 核心矛盾：运行时异构性

这 10 种格式的运维需求天差地别：

**Category A — 需要持续运行的 process：**
- MCP Server（Node.js process、需要端口、需要 health check）
- Webhooks endpoint（HTTP server、需要公网 IP/域名、需要 TLS）

**Category B — 需要 publish 到 registry 的 package：**
- CLI Tool（npm registry、homebrew tap、GitHub releases）
- API SDK（npm/pypi/crates、版本号管理、changelog）

**Category C — 静态文件/配置：**
- Skills、Agent Docs、.cursorrules、A2A Cards、Grafana Dashboard、Docker Compose

**运维复杂度分析：**

Category A 是真正的运维噩梦——需要 process management、monitoring、log rotation、secret management、auto-restart、scaling、backup。这些都是我上一轮评审中提到的问题，**每种 process 类型都要独立解决一遍**。

Category B 需要 registry 认证、版本号策略、publish CI pipeline、breaking change 检测。publish 一个坏版本到 npm 可以影响所有下游用户。

Category C 相对简单，但也有 freshness 问题——文件生成后怎么知道它过时了？

### 1.3 我的方案：分层部署架构

```
agentify transform <openapi-url> --all
  │
  ├─ Output Manifest (agentify-output.json)
  │   ├── outputs[]
  │   │   ├── type: "mcp-server"
  │   │   │   ├── path: "./output/mcp-server/"
  │   │   │   ├── deploy: { strategy: "docker", registry: "..." }
  │   │   │   ├── runtime: { port: 3000, health: "/health" }
  │   │   │   └── lifecycle: "long-running"
  │   │   ├── type: "cli-tool"
  │   │   │   ├── path: "./output/cli/"
  │   │   │   ├── deploy: { strategy: "npm-publish", scope: "@myorg" }
  │   │   │   └── lifecycle: "versioned-release"
  │   │   ├── type: "skills"
  │   │   │   ├── path: "./output/skills/"
  │   │   │   ├── deploy: { strategy: "file-copy", target: "~/.claude/skills/" }
  │   │   │   └── lifecycle: "static-sync"
  │   │   └── ...
  │   └── sourceSpec: { url: "...", hash: "sha256:...", fetchedAt: "..." }
  │
  └─ Per-output deployment scripts
      ├── deploy-mcp-server.sh
      ├── deploy-cli.sh
      └── deploy-skills.sh
```

关键设计原则：

1. **Output Manifest 是核心** — 一个 `agentify-output.json` 描述所有生成物的元数据、部署策略、运行时需求。这是后续所有自动化的基础。

2. **每种输出有独立的 deploy strategy** — 不要试图用一种部署方式统一所有格式。MCP Server 用 Docker，Skills 用文件复制，CLI 用 npm publish。承认异构性，拥抱异构性。

3. **Source Spec 指纹** — 记录源 OpenAPI spec 的 hash 和获取时间，用于后续增量更新判断。

---

## 二、生成物的生命周期管理

### 2.1 核心问题：源 API 更新时，10 种格式怎么同步？

假设用户的 API 从 v2.3 升级到 v2.4，新增了 3 个 endpoint，修改了 2 个 endpoint 的参数，废弃了 1 个 endpoint。现在需要更新 10 种输出格式。

**最笨的方案：全量重新生成。** 问题：
- 用户可能在生成物上做了手动修改（customization）
- 全量重新生成丢失用户修改
- 10 种格式全部重新生成速度慢、资源浪费

**我要求的方案：增量更新 + 三向合并（three-way merge）。**

### 2.2 增量更新设计

```
Source Spec v2.3 ──→ Generated Output v2.3 ──→ User Modified v2.3.1
                                                      │
Source Spec v2.4 ──→ Diff(v2.3, v2.4) ──→ Incremental Transform
                                                      │
                                          ┌───────────┘
                                          ▼
                                Three-Way Merge
                                          │
                                          ▼
                                Output v2.4 (with user modifications preserved)
```

实现需要的基础设施：

1. **Spec Diff Engine**
   - 计算两个 OpenAPI spec 版本之间的 semantic diff
   - 不是文本 diff，是**语义 diff**：新增 endpoint、修改参数类型、废弃字段
   - 输出结构化的 `SpecChangeset`

2. **Per-Format Incremental Transformer**
   - 每种输出格式有自己的增量更新器
   - 接收 `SpecChangeset`，输出 `OutputPatch`
   - MCP Server：新增/修改 tool handlers
   - CLI：新增/修改 commands
   - Skills：新增/修改 skill definitions
   - SDK：新增/修改 client methods

3. **User Modification Tracker**
   - 在生成物中嵌入 marker（如 `// @agentify-generated`、`// @agentify-user-modified`）
   - 通过 git history 追踪用户修改
   - Three-way merge 时保留用户修改区域

4. **版本控制策略**

   ```
   agentify-output.json
   {
     "version": "2.4.0",
     "sourceSpecVersion": "v2.4",
     "agentifyVersion": "1.3.0",
     "outputs": {
       "mcp-server": {
         "generatedAt": "2026-03-15T10:00:00Z",
         "generatedFrom": "sha256:abc...",
         "userModifications": [
           { "file": "src/tools/custom-handler.ts", "type": "user-added" },
           { "file": "src/tools/get-users.ts", "lines": "15-20", "type": "user-modified" }
         ]
       }
     }
   }
   ```

### 2.3 版本号策略

生成物应该有自己的版本号，和源 API 版本号解耦：

```
生成物版本 = <source-api-major>.<source-api-minor>.<agentify-generation-revision>

例如：
- 源 API v2.4，第一次生成 → 2.4.0
- 源 API v2.4，用户手动修改后 Agentify 重新生成 → 2.4.1
- 源 API v2.5 → 2.5.0
```

对于需要 publish 到 registry 的格式（CLI、SDK），版本号直接影响用户的 dependency resolution。**必须遵循 semver**，并且 breaking changes 必须 bump major version。

### 2.4 运维警告：增量更新的几个深坑

1. **Merge Conflict** — 当用户修改和 spec 变更冲突时，必须有 conflict resolution UI 或策略（auto-resolve / manual / abort）
2. **隐式依赖** — 用户修改可能依赖被废弃的 endpoint。增量更新必须检测这种 breaking dependency。
3. **跨格式一致性** — MCP Server 更新了但 Skills 没更新 = 行为不一致。需要原子更新或至少一致性检查。
4. **Rollback** — 增量更新出错时，必须能回滚到上一个已知好的版本。Output Manifest 中记录历史版本。

---

## 三、一键部署的现实路径

### 3.1 方案评估

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|---------|
| **Docker Compose** | 统一运行时、一键启动 | 只适合 process 类型、不能 publish packages | 本地开发/自托管 |
| **Monorepo + CI** | 统一代码管理 | 每种格式的 CI 不同 | 专业团队 |
| **独立 publish** | 每种格式独立管理 | 用户要管 10 个地方 | 不推荐 |
| **Agentify Cloud** | 全托管、一键搞定 | 需要建 SaaS 基础设施 | 长期愿景 |
| **Hybrid（推荐）** | 按类型分组、最优部署 | 有一定复杂度 | 中期方案 |

### 3.2 推荐方案：Hybrid 分组部署

```bash
agentify deploy --target local     # Category A: Docker Compose 启动所有 process
agentify deploy --target publish   # Category B: npm/pypi publish CLI+SDK
agentify deploy --target install   # Category C: 复制静态文件到指定位置
agentify deploy --target all       # 以上全部
```

具体实现：

**Step 1: `agentify deploy --target local`**
```yaml
# 自动生成的 docker-compose.yml
version: "3.9"
services:
  mcp-server:
    build: ./output/mcp-server
    ports:
      - "3000:3000"
    env_file: ./output/mcp-server/.env
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

  webhook-server:
    build: ./output/webhooks
    ports:
      - "3001:3001"
    env_file: ./output/webhooks/.env
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
    restart: unless-stopped

  # Optional: 本地监控
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./output/monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"
```

**Step 2: `agentify deploy --target publish`**
```bash
# CLI Tool
cd output/cli && npm publish --access public

# API SDK
cd output/sdk && npm publish --access public

# 需要预配置的 registry 凭证
# agentify config set npm.token <token>
# agentify config set pypi.token <token>
```

**Step 3: `agentify deploy --target install`**
```bash
# Skills → Claude Skills 目录
cp -r output/skills/* ~/.claude/skills/

# .cursorrules → 项目根目录
cp output/cursorrules/.cursorrules ./

# Agent Docs → 指定目录
cp -r output/agent-docs/* ./docs/agent/

# A2A Card → 注册到 A2A registry
curl -X POST https://a2a-registry.example.com/cards \
  -H "Authorization: Bearer $A2A_TOKEN" \
  -d @output/a2a/card.json
```

### 3.3 一键部署的前提条件

**用户必须提前配置的东西（`agentify config`）：**

```json
{
  "deploy": {
    "docker": {
      "registry": "ghcr.io/myorg",
      "credentials": "env:DOCKER_TOKEN"
    },
    "npm": {
      "scope": "@myorg",
      "credentials": "env:NPM_TOKEN"
    },
    "skills": {
      "installPath": "~/.claude/skills/"
    },
    "a2a": {
      "registryUrl": "https://a2a.example.com",
      "credentials": "env:A2A_TOKEN"
    },
    "monitoring": {
      "prometheusEndpoint": "http://prometheus:9090",
      "grafanaEndpoint": "http://grafana:3000"
    }
  }
}
```

**运维现实：** "一键部署"听起来美好，但真正的一键需要大量前置配置。建议采用 **Progressive Deployment**——先部署最简单的格式（静态文件），再引导用户配置和部署复杂格式。

```
agentify deploy
  → Deploying Skills... ✓ (copied to ~/.claude/skills/)
  → Deploying .cursorrules... ✓ (copied to ./)
  → Deploying Agent Docs... ✓ (copied to ./docs/agent/)
  → Deploying MCP Server... ⚠ Docker not configured. Run: agentify config set docker.registry
  → Deploying CLI Tool... ⚠ npm credentials not set. Run: agentify config set npm.token
  → Deploying Webhooks... ⚠ No deployment target configured. Run: agentify config set webhooks.target

  3/6 deployed. Run `agentify deploy --help` to configure remaining targets.
```

这种 progressive 的体验比"一键失败全部回滚"好 100 倍。

---

## 四、测试策略

### 4.1 每种格式的测试方法矩阵

| 输出格式 | Static Check | Unit Test | Integration Test | E2E Test |
|---------|-------------|-----------|-----------------|----------|
| MCP Server | tsc --noEmit | Tool handler logic | MCP protocol compliance | Agent 调用完整流程 |
| CLI Tool | tsc --noEmit | Command parsing, validation | 命令执行 + 输出验证 | 用户安装 + 使用全流程 |
| Skills | JSON Schema validation | — | Claude 加载 + 调用 | Agent 使用 skill 完成任务 |
| Agent Docs | Markdown lint | — | 文档完整性检查 | Agent 阅读文档后能正确使用 API |
| .cursorrules | 语法检查 | — | Cursor 加载验证 | — |
| A2A Cards | JSON Schema validation | — | A2A registry 注册 | Agent-to-Agent 通信 |
| API SDK | tsc --noEmit | 每个 method 调用 | 真实 API 调用 | SDK 在应用中的使用 |
| Webhooks | tsc --noEmit | Handler logic | Webhook 接收 + 处理 | 端到端事件流 |

### 4.2 测试分层架构

```
┌─────────────────────────────────────────────┐
│ Layer 4: Cross-Format Consistency Tests      │ 所有格式的行为一致性
│  "MCP Server 的 getUser 和 CLI 的 get-user   │
│   和 SDK 的 client.getUser 行为相同"          │
├─────────────────────────────────────────────┤
│ Layer 3: Per-Format E2E Tests               │ 每种格式的端到端验证
│  MCP: Agent 调用 → 返回正确结果               │
│  CLI: 命令行执行 → 正确输出                    │
│  SDK: 代码调用 → 正确返回                      │
├─────────────────────────────────────────────┤
│ Layer 2: Per-Format Integration Tests       │ 每种格式的协议/接口验证
│  MCP: initialize → listTools → callTool      │
│  CLI: --help → command → --format json       │
│  SDK: import → instantiate → method call     │
├─────────────────────────────────────────────┤
│ Layer 1: Universal Static Checks            │ 所有格式共用
│  TypeScript: tsc --noEmit                    │
│  JSON/YAML: schema validation               │
│  Security: no hardcoded secrets              │
│  Lint: format, naming conventions            │
└─────────────────────────────────────────────┘
```

### 4.3 关键测试：Cross-Format Consistency（Layer 4）

这是多输出架构中**最容易被忽略但最致命**的测试。

场景：用户的 API 有一个 `POST /users` endpoint。Agentify 生成了：
- MCP Server 的 `createUser` tool
- CLI 的 `create-user` command
- SDK 的 `client.users.create()` method
- Skills 的 `create-user` skill definition

这四种格式 **必须** 对同一个 endpoint 有一致的行为：
- 相同的参数名和类型
- 相同的必填/选填规则
- 相同的错误处理
- 相同的返回结构

```typescript
// Cross-Format Consistency Test 伪代码
describe('Cross-Format Consistency: POST /users', () => {
  const testPayload = { name: 'Test User', email: 'test@example.com' }

  it('all formats accept the same required fields', () => {
    const mcpSchema = getMCPToolInputSchema('createUser')
    const cliArgs = getCLICommandArgs('create-user')
    const sdkParams = getSDKMethodParams('users.create')
    const skillParams = getSkillInputSchema('create-user')

    // 所有格式的 required fields 必须一致
    expect(mcpSchema.required).toEqual(cliArgs.required)
    expect(cliArgs.required).toEqual(sdkParams.required)
    expect(sdkParams.required).toEqual(skillParams.required)
  })

  it('all formats return the same structure', async () => {
    const mcpResult = await callMCPTool('createUser', testPayload)
    const cliResult = await execCLI('create-user', testPayload)
    const sdkResult = await callSDK('users.create', testPayload)

    // 返回结构一致（忽略 format-specific wrapper）
    expect(extractData(mcpResult)).toEqual(extractData(cliResult))
    expect(extractData(cliResult)).toEqual(extractData(sdkResult))
  })
})
```

### 4.4 运维警告：测试执行时间

10 种格式 × 4 层测试 = 40 个测试维度。如果每个维度 30 秒：

- 全量测试：~20 分钟
- 每次 API spec 更新触发全量测试 = 20 分钟反馈循环
- **不可接受**

解决方案：
1. **Layer 1（Static）必须 < 30 秒** — 本地 pre-commit 执行
2. **Layer 2（Integration）按格式并行** — 10 种格式并行执行
3. **Layer 3（E2E）只测变更的格式** — 增量测试
4. **Layer 4（Consistency）只测变更的 endpoint** — 针对 SpecChangeset 的 scope

---

## 五、CI/CD 管线设计

### 5.1 两条 CI/CD 管线

Agentify 的 CI/CD 需要分成两条独立管线：

**管线 A：Agentify 自身的 CI/CD**（开发者改了 Agentify 代码时触发）

```
Push to main
  → Lint + Type Check (30s)
  → Unit Tests (1min)
  → Integration Tests: 生成 Petstore/Stripe/GitHub 的所有格式 (3min)
  → Cross-Format Consistency Tests (2min)
  → Security Scan (1min)
  → Build (30s)
  → Publish to npm (if tagged release)
```

**管线 B：生成物的 CI/CD**（用户的 API spec 更新时触发）

```
API Spec Change Detected (webhook / manual / cron)
  → Fetch new spec + compute diff
  → Incremental re-generate affected outputs
  → Layer 1: Static checks on all changed outputs (parallel, 30s)
  → Layer 2: Integration tests on changed outputs (parallel, 2min)
  → Layer 3: E2E tests on affected outputs (parallel, 3min)
  → Layer 4: Cross-format consistency check (1min)
  → If all pass:
      → Auto-deploy static outputs (Skills, Docs, .cursorrules)
      → Create PR for process outputs (MCP Server, Webhooks)
      → Create draft release for package outputs (CLI, SDK)
  → If any fail:
      → Create issue with failure details
      → Notify user (Slack/email/webhook)
```

### 5.2 生成物的 CI 模板

Agentify 应该为用户生成可直接使用的 GitHub Actions workflow：

```yaml
# .github/workflows/agentify-sync.yml（自动生成）
name: Agentify Sync

on:
  schedule:
    - cron: '0 6 * * 1'  # 每周一早上 6 点检查 spec 更新
  workflow_dispatch:
    inputs:
      force_regenerate:
        description: 'Force full regeneration'
        type: boolean
        default: false

jobs:
  check-spec:
    runs-on: ubuntu-latest
    outputs:
      changed: ${{ steps.diff.outputs.changed }}
      changeset: ${{ steps.diff.outputs.changeset }}
    steps:
      - uses: actions/checkout@v4
      - name: Fetch latest spec
        run: curl -o spec-latest.json ${{ vars.OPENAPI_SPEC_URL }}
      - name: Compute diff
        id: diff
        run: npx agentify diff spec-current.json spec-latest.json --output changeset.json

  regenerate:
    needs: check-spec
    if: needs.check-spec.outputs.changed == 'true' || inputs.force_regenerate
    runs-on: ubuntu-latest
    strategy:
      matrix:
        format: [mcp-server, cli, skills, agent-docs, a2a-card, api-sdk, webhooks]
    steps:
      - uses: actions/checkout@v4
      - name: Regenerate ${{ matrix.format }}
        run: npx agentify transform --format ${{ matrix.format }} --incremental
      - name: Test ${{ matrix.format }}
        run: npx agentify test --format ${{ matrix.format }}

  consistency-check:
    needs: regenerate
    runs-on: ubuntu-latest
    steps:
      - name: Cross-format consistency
        run: npx agentify test --cross-format

  deploy:
    needs: consistency-check
    runs-on: ubuntu-latest
    steps:
      - name: Deploy static outputs
        run: npx agentify deploy --target install --auto
      - name: Create PR for process outputs
        run: npx agentify deploy --target local --create-pr
      - name: Draft release for packages
        run: npx agentify deploy --target publish --draft
```

### 5.3 CI 性能优化

10 种格式的 CI 很容易变慢。关键优化：

1. **矩阵并行** — `strategy.matrix` 让每种格式独立跑在不同 runner 上
2. **缓存** — `actions/cache` 缓存 `node_modules`、Docker layers、生成中间产物
3. **增量构建** — 只重新生成 spec 变更影响的格式（通过 changeset 判断）
4. **分级 CI** — PR CI 只跑 Layer 1+2，merge 后跑 Layer 3+4
5. **Self-hosted runner** — 对于 E2E 测试，self-hosted runner 省钱且更快

---

## 六、监控和可观测性

### 6.1 监控分层

多输出格式的监控分三层：

**Layer 1：Agentify 引擎监控**（生成过程本身）

| Metric | 类型 | 说明 |
|--------|------|------|
| `agentify_transform_duration_seconds` | Histogram | 每种格式的生成耗时 |
| `agentify_transform_total` | Counter | 生成次数（by format, status） |
| `agentify_spec_parse_duration_seconds` | Histogram | Spec 解析耗时 |
| `agentify_spec_endpoints_count` | Gauge | 源 API 的 endpoint 数量 |
| `agentify_incremental_update_total` | Counter | 增量更新次数 |
| `agentify_merge_conflicts_total` | Counter | 三向合并冲突次数 |

**Layer 2：生成物运行时监控**（MCP Server、Webhooks 等 process 类型）

这部分延续上一轮评审的建议，但扩展到所有 process 类型的格式：

| Metric | 类型 | 适用格式 |
|--------|------|---------|
| `output_request_total` | Counter | MCP Server, Webhooks, API SDK |
| `output_request_duration_seconds` | Histogram | MCP Server, Webhooks, API SDK |
| `output_error_total` | Counter | All process types |
| `output_upstream_api_total` | Counter | All types that call upstream |
| `output_upstream_api_duration_seconds` | Histogram | All types |
| `output_auth_failures_total` | Counter | All authenticated types |

**Layer 3：生态健康监控**（宏观视角）

| Metric | 类型 | 说明 |
|--------|------|------|
| `agentify_output_freshness_seconds` | Gauge | 每种输出距上次更新的时间 |
| `agentify_output_spec_drift` | Gauge | 输出与源 spec 的差异程度（0=同步,1=完全不同步） |
| `agentify_cross_format_consistency` | Gauge | 跨格式一致性评分 |
| `agentify_output_usage_total` | Counter | 每种输出被使用的次数 |

### 6.2 Freshness 监控：多输出架构的独特挑战

10 种输出格式中，最危险的不是"某个格式挂了"，而是"某个格式过时了但没人知道"。

场景：
1. 源 API 更新了 `POST /users` 的参数（新增 `role` 字段）
2. MCP Server 自动更新了（CI/CD 触发）
3. CLI Tool 也更新了（同一个 CI pipeline）
4. 但 Skills 的更新被跳过了（CI 中 skills 格式的 test 失败了）
5. 用户用 Skills 调用 `create-user` 时缺少 `role` 参数
6. 上游 API 返回 400 Bad Request
7. 用户："为什么 MCP Server 可以用但 Skills 不行？"

**解决方案：Freshness Dashboard + Drift Alert**

```
┌─ Agentify Output Health Dashboard ─────────────────────┐
│                                                         │
│  Source: Petstore API v3.1.2 (updated 2h ago)           │
│                                                         │
│  Format          Version    Last Sync    Drift   Status │
│  ──────────────────────────────────────────────────────  │
│  MCP Server      3.1.2      2h ago       0%      ✅     │
│  CLI Tool        3.1.2      2h ago       0%      ✅     │
│  Skills          3.1.1      3d ago       12%     ⚠️     │
│  Agent Docs      3.1.2      2h ago       0%      ✅     │
│  A2A Card        3.1.0      7d ago       25%     🔴     │
│  API SDK         3.1.2      2h ago       0%      ✅     │
│  Webhooks        3.1.2      2h ago       0%      ✅     │
│                                                         │
│  ⚠️ 2 outputs are drifting from source spec.            │
│  Run: agentify sync --format skills,a2a-card            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

Alert 规则：
- `agentify_output_spec_drift > 0.1` for `> 24h` → WARNING
- `agentify_output_spec_drift > 0.3` for `> 1h` → CRITICAL
- `agentify_output_freshness_seconds > 7d` → WARNING（静态格式）
- `agentify_output_freshness_seconds > 1d` → WARNING（process 格式）

### 6.3 统一日志格式

所有 process 类型的生成物应该使用统一的日志格式，方便集中收集和分析：

```json
{
  "timestamp": "2026-03-15T10:30:00.123Z",
  "level": "info",
  "service": "petstore-mcp-server",
  "format": "mcp-server",
  "sourceApi": "petstore",
  "agentifyVersion": "1.3.0",
  "traceId": "abc-123-def",
  "spanId": "span-456",
  "event": "tool_call",
  "tool": "createUser",
  "duration_ms": 234,
  "status": "success",
  "upstream": {
    "url": "https://petstore.example.com/api/users",
    "status": 201,
    "duration_ms": 180
  }
}
```

统一字段：
- `service`：生成物的标识
- `format`：输出格式类型
- `sourceApi`：源 API 标识
- `agentifyVersion`：生成时的 Agentify 版本
- `traceId` / `spanId`：分布式追踪 ID

这样无论是 MCP Server、Webhooks 还是 CLI（写日志到文件时），都可以用同一套 ELK/Loki 查询语句分析。

---

## 七、运维自动化：`agentify ops` 命令族

多输出架构需要一套专门的运维命令：

```bash
# 状态概览
agentify status                    # 所有输出格式的状态、版本、freshness
agentify status --format mcp-server  # 特定格式的详细状态

# 同步
agentify sync                     # 检查源 spec 更新，增量同步所有格式
agentify sync --format skills     # 只同步特定格式
agentify sync --dry-run           # 预览变更，不实际执行
agentify sync --force             # 全量重新生成（忽略增量）

# 部署
agentify deploy --target local    # Docker Compose 启动 process 类型
agentify deploy --target publish  # 发布到 registry
agentify deploy --target install  # 安装静态文件
agentify deploy --rollback        # 回滚到上一个版本

# 健康检查
agentify health                   # 检查所有运行中的 process 的健康状态
agentify health --deep            # 深度检查（包括上游 API 可达性）

# 日志
agentify logs                     # 所有 process 的聚合日志
agentify logs --format mcp-server # 特定格式的日志
agentify logs --follow            # 实时跟踪

# 监控
agentify metrics                  # 输出 Prometheus 格式 metrics
agentify metrics --export grafana # 导出 Grafana dashboard 配置
```

---

## 八、现实路径建议：分三步走

### Phase 0.5（当前）：只生成 MCP Server，但建好基础设施

- 实现 Output Manifest (`agentify-output.json`) 的数据结构
- 虽然只有一种输出，但用 manifest 管理
- 实现 source spec fingerprint（为增量更新做准备）
- `agentify status` 命令（单格式版本）

### Phase 1：新增 Skills + Agent Docs + .cursorrules（3 种静态格式）

- 静态格式运维简单，用于验证多输出架构
- 实现 `agentify sync` 的增量更新逻辑
- 实现 Layer 1 + Layer 2 测试
- 实现 `agentify deploy --target install`

### Phase 2：新增 CLI + SDK + A2A Cards + Webhooks（需要 publish/process 的格式）

- 实现 `agentify deploy --target publish` 和 `--target local`
- 实现 Layer 3 + Layer 4 测试
- 实现 freshness 监控和 drift alert
- 实现生成物的 CI 模板
- 实现 cross-format consistency 测试

**不要试图一步到位。** 每新增一种输出格式，都是新增一种运维负担。先把基础设施做对（manifest、sync、test framework），再逐步加格式。

---

## 九、风险评估

| 风险 | 可能性 | 影响 | 应对 |
|------|--------|------|------|
| 10 种格式的测试矩阵导致 CI 时间爆炸（>30min） | 高 | 中 | 矩阵并行 + 增量测试 + 分级 CI |
| 跨格式不一致导致用户困惑 | 高 | 高 | Cross-Format Consistency Tests + Drift Alert |
| 增量更新的三向合并冲突频发 | 中 | 高 | 清晰的 `@agentify-generated` marker + conflict UI |
| 用户不愿配置 10 种格式的 deploy target | 高 | 中 | Progressive Deployment + 合理默认值 |
| Freshness drift 导致格式间行为不一致 | 高 | 高 | Drift Dashboard + 自动 alert + 原子更新 |
| 某种格式的生成器 bug 拖累所有格式的发布 | 中 | 中 | 每种格式独立发布，不强制绑定 |
| Secret 泄露风险 × 10（每种格式都可能泄露） | 中 | 极高 | 统一 secret 管理 + pre-commit scan × 所有格式 |

---

## 十、总结

上一轮评审我说 Agentify "只画了蓝图但没有盖好下水道"。这次多输出愿景的复杂度让我不得不升级比喻：

**这不是一栋楼的下水道问题，这是一个城市的市政工程。**

10 种输出格式 = 10 种不同的运行时特征 × 10 种不同的部署方式 × 10 种不同的测试方法 × 10 种不同的更新机制。组合起来是一个巨大的运维矩阵。

**最关键的三件事：**

1. **Output Manifest 是一切的基础** — 没有结构化的元数据管理，多输出架构就是一堆散落的文件。`agentify-output.json` 必须在 Phase 0.5 就设计好，即使当前只有一种输出。

2. **Cross-Format Consistency 比单格式正确性更重要** — 每种格式单独正确但相互不一致，比一种格式有 bug 更危险。用户期望"同一个 API 的不同格式行为一致"，这个期望必须被测试保证。

3. **Progressive Deployment 是唯一现实的路径** — 不要试图"一键部署 10 种格式"。让用户先部署最简单的（静态文件），再逐步配置和部署复杂的（process、packages）。降低入门门槛，提供清晰的升级路径。

**给产品团队的忠告：**

每新增一种输出格式之前，先回答以下问题：
1. 这种格式的 CI/CD pipeline 长什么样？
2. 这种格式更新时，怎么保证和其他格式的一致性？
3. 这种格式运行时出问题了，用户怎么 debug？
4. 这种格式的 secret 管理方案是什么？
5. 这种格式的回滚策略是什么？

如果任何一个问题回答不了，就不要加这种格式。

> 好的多输出架构不是"能生成 10 种格式"，而是"10 种格式在生产环境中都能可靠运行、一致更新、安全管理"。
> 现在的愿景让我看到了前者的雄心，但还没看到后者的严谨。
>
> 不过这次至少方向是对的——先做好基础设施，再加格式。
> 凌晨三点我可能终于能睡着了。也许。

---

*评审完毕。多输出的运维矩阵让我头疼，但如果基础设施做对了，这将是 Agentify 最强的护城河——不是因为别人不能生成 10 种格式，而是因为别人不能让 10 种格式在生产环境中同步、一致、可靠地运行。*
