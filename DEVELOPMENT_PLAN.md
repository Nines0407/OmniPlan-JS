# OmniPlan-JS 开发计划

## 技术栈决策

| 层 | 选型 |
|:---|:---|
| 前端 | React + Vite + TailwindCSS + TanStack Table + Gantt 组件 |
| 状态管理 | Zustand |
| 后端 | Express + TypeScript + better-sqlite3 |
| 实时通信 | ws（WebSocket） |
| AI 操作入口 | MCP Server（供 opencode、Claude Code 等 AI 工具调用） |
| 部署 | Docker Compose |

---

## AI 交互方式说明

**本项目的 AI 能力不自行实现 LLM 调用**，而是遵循以下分层设计：

```
AI 工具（opencode / Claude Code / etc.）
    │
    │ MCP 协议（Tool Calling）
    ▼
MCP Server（packages/mcp）
    │
    │ HTTP（本地或内网）
    ▼
Core API（packages/server）
    │
    ▼
SQLite 数据库
```

- **Core API** 提供完整的 REST + WebSocket 接口，对所有操作做严格校验
- **MCP Server** 将 Core API 封装为 MCP Tools，暴露给 AI 工具。AI 工具自行完成"自然语言 → Tool 调用"的推理，本项目无需维护 LLM 集成代码
- 用户可以直接用 opencode、Claude Code 等工具的自然语言界面操作项目数据，无需额外开发 CLI Agent

**优势**：
- 零额外 LLM API 费用（由 AI 工具侧承担）
- 无需维护 Chain-of-Thought / Prompt Engineering 逻辑
- 任何支持 MCP 的工具都能操作你的项目管理系统

---

## Phase 1: 项目脚手架

```
omniplan-js/
├── packages/
│   ├── server/          # Express + SQLite 核心服务
│   ├── web/             # React + Vite 前端
│   ├── mcp/             # MCP Server（AI 工具操作入口）
│   └── shared/          # 共享 TypeScript 类型 & 常量 & DTO 校验
├── docs/                # 开发文档 & 接口文档（开发过程中同步产出）
├── docker-compose.yml
└── package.json         # npm workspaces
```

- 初始化 npm workspaces monorepo
- 配置 TypeScript（strict）、ESLint、Prettier、TailwindCSS
- 配置 tsx（开发热重载）、tsup（共享包构建）
- 配置 Dockerfile（`server`、`web`、`mcp` 三个容器）

---

## Phase 2: 数据模型 (`packages/server`)

### 数据库表设计

```sql
-- 用户表（支持多用户，为后续协作打下基础）
CREATE TABLE users (
  id           TEXT PRIMARY KEY,
  username     TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 项目表（多项目隔离）
CREATE TABLE projects (
  id          TEXT PRIMARY KEY,
  owner_id    TEXT NOT NULL REFERENCES users(id),
  name        TEXT NOT NULL,
  description TEXT,
  color       TEXT DEFAULT '#3b82f6',
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 目标表（一个项目下可以有多个目标）
CREATE TABLE targets (
  id           TEXT PRIMARY KEY,
  project_id   TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  description  TEXT,
  cover_url    TEXT,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 任务表
CREATE TABLE tasks (
  id             TEXT PRIMARY KEY,
  target_id      TEXT NOT NULL REFERENCES targets(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  description    TEXT,
  status         TEXT NOT NULL DEFAULT 'todo'
                 CHECK (status IN ('todo', 'in_progress', 'review', 'done', 'cancelled')),
  priority       TEXT NOT NULL DEFAULT 'medium'
                 CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  week_start     TEXT,           -- ISO 周起始日期（YYYY-MM-DD）
  duration_weeks INTEGER DEFAULT 1,
  assignee_id    TEXT REFERENCES users(id),
  progress       REAL NOT NULL DEFAULT 0  CHECK (progress >= 0 AND progress <= 100),
  tags           TEXT DEFAULT '[]',       -- JSON 数组
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 任务依赖表（前置任务）
CREATE TABLE task_dependencies (
  id               TEXT PRIMARY KEY,
  task_id          TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  dependency_id    TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  dependency_type  TEXT NOT NULL DEFAULT 'finish_to_start'
                   CHECK (dependency_type IN ('finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish')),
  UNIQUE(task_id, dependency_id)
);

-- 里程碑表
CREATE TABLE milestones (
  id          TEXT PRIMARY KEY,
  project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  due_date    TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### 视图（计算字段）

```sql
-- 目标统计视图
CREATE VIEW target_stats AS
SELECT
  t.id AS target_id,
  COUNT(tk.id) AS total_tasks,
  COUNT(CASE WHEN tk.status = 'done' THEN 1 END) AS done_tasks,
  CASE
    WHEN COUNT(tk.id) = 0 THEN 0
    ELSE ROUND(CAST(COUNT(CASE WHEN tk.status = 'done' THEN 1 END) AS REAL) / COUNT(tk.id) * 100, 1)
  END AS completion_rate,
  COUNT(CASE WHEN tk.week_start < date('now') AND tk.status != 'done' THEN 1 END) AS overdue_tasks
FROM targets t
LEFT JOIN tasks tk ON tk.target_id = t.id
GROUP BY t.id;

-- 周次聚合视图
CREATE VIEW week_summary AS
SELECT
  week_start,
  target_id,
  COUNT(*) AS task_count,
  COUNT(CASE WHEN status = 'done' THEN 1 END) AS done_count,
  COUNT(CASE WHEN status = 'in_progress' THEN 1 END) AS in_progress_count
FROM tasks
WHERE week_start IS NOT NULL
GROUP BY week_start, target_id;
```

### 迁移策略

- 使用 `better-sqlite3` 的 `user_version` PRAGMA 管理 schema 版本
- `packages/server/migrations/` 目录下按版本号命名迁移脚本，如 `001_initial.sql`、`002_add_tags.sql`
- 启动时自动按序执行未应用的迁移

### 种子数据

- Seed 脚本生成一个示例项目、2 个目标、10+ 条任务和依赖关系
- 时间跨度覆盖过去/当前/未来 3 周，用于验证过期、进度、甘特图渲染

### 备份

- 每日通过 node-cron 将 `omniplan.db` 快照到 `backups/YYYY-MM-DD.db`
- 保留最近 7 天备份

---

## Phase 3: Core API (`packages/server`)

### REST 端点

```
POST   /api/auth/register      # 注册用户
POST   /api/auth/login          # 登录（返回 API-Key）

GET    /api/projects            # 项目列表
POST   /api/projects            # 创建项目
GET    /api/projects/:id        # 项目详情
PATCH  /api/projects/:id        # 更新项目
DELETE /api/projects/:id        # 删除项目（软删除：is_archived）

GET    /api/projects/:pid/targets        # 目标列表（含 target_stats 聚合）
POST   /api/projects/:pid/targets        # 创建目标
PATCH  /api/targets/:id                  # 更新目标
DELETE /api/targets/:id                  # 删除目标

GET    /api/targets/:tid/tasks           # 任务列表（支持 ?week_start=, ?status=, ?assignee= 过滤）
POST   /api/targets/:tid/tasks           # 创建任务
GET    /api/tasks/:id                    # 任务详情（含依赖关系）
PATCH  /api/tasks/:id                    # 更新任务（仅传变更字段）
DELETE /api/tasks/:id                    # 删除任务

POST   /api/tasks/:id/dependencies       # 添加任务依赖
DELETE /api/tasks/:id/dependencies/:depId # 移除任务依赖

POST   /api/projects/:pid/milestones     # 创建里程碑
PATCH  /api/milestones/:id               # 更新里程碑
DELETE /api/milestones/:id               # 删除里程碑

GET    /api/stats?project_id=&target_id= # 聚合统计
GET    /api/timeline?project_id=         # 时间线数据（供甘特图消费）

POST   /api/bulk/tasks                   # 批量更新任务状态/周次
```

### PATCH 变更请求体设计

```typescript
// PATCH /api/tasks/:id 示例
{
  "changes": {
    "status": "done",
    "progress": 100
  },
  "expected_version": "2024-01-01T00:00:00Z"  // 乐观锁：updated_at 不匹配则拒绝
}
```

### 中间件

- **API-Key 校验**：写操作（POST/PATCH/DELETE）校验 `Authorization: Bearer <api_key>`
- **CORS**：允许 web 前端域名
- **Rate Limiting**：`express-rate-limit`，写操作 60 次/分钟
- **乐观锁**：写操作校验 `expected_version`（若传入），防止并发覆盖

### 输入校验

- 使用 `zod` 在 `packages/shared` 定义所有请求/响应 DTO schema
- server 和 web 端共享校验逻辑
- 通过 `zod-to-openapi` 从 Zod schema 自动生成 OpenAPI 3.1 文档
- 开发环境挂载 Swagger UI（`/api/docs`），前端和 AI 工具均可实时查阅接口

### WebSocket

- 路径：`ws://host/ws?token=<api_key>`
- 事件模型（全量增量推送，客户端无需二次查询）：

```typescript
// 服务端推送的消息体
type WsEvent =
  | { type: "task.updated"; entity: Task }          // PATCH 后的完整 Task 对象
  | { type: "task.created"; entity: Task }
  | { type: "task.deleted"; id: string }
  | { type: "target.updated"; entity: TargetStats } // 含 completion_rate
  | { type: "milestone.completed"; entity: Milestone }
  | { type: "project.updated"; entity: Project }
  | { type: "bulk.updated"; entities: Task[] };
```

- 前端 Zustand store 直接根据事件类型更新本地状态，无需轮询
- 重连时全量拉取当前视图数据补全

---

## Phase 4: 前端 UI (`packages/web`)

### 路由设计

```
/                          # 项目列表页
/projects/:pid             # 项目详情（目标卡片网格）
/projects/:pid/timeline    # 甘特图页面
/projects/:pid/tasks       # 任务表格（按周分组）
/projects/:pid/settings    # 项目设置
```

### 深色主题

- 主背景 `#121212`，卡片/表格背景 `#1e1e1e`
- 主色调 Cyber Blue `#00d4ff`，成功色 Neon Green `#39ff14`
- 延期高亮红色 `#ff4444`
- CSS 变量实现，后续可扩展浅色主题

### 目标卡片网格

- 响应式 CSS Grid：`grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))`
- 每张卡片包含：封面图（可选）、目标名称、进度条、状态统计（已完成/总数/延期）
- 进度条改为**连续长条**而非离散方块，精确反映 `completion_rate`
- 额外显示延期任务数（红色 badge）

### 任务表格（TanStack Table）

- 列：名称、状态、优先级、负责人、周次、进度、依赖数、操作
- 支持按周次分组折叠，组头显示聚合计数
- 列内筛选 + 排序
- 行内编辑（双击单元格 → 输入框 → 失焦保存）
- 状态语义化渲染：
  - 已完成 → 删除线 + 文字置灰
  - 延期 → 红色文字 + 日历图标警告
  - 进行中 → 蓝色标签

### 甘特图（Gantt）

- 使用 `@nivo/bar` 或自研 Canvas 组件实现简易甘特图
- X 轴 = 时间（以周为单位），Y 轴 = 任务列表
- 每个 bar 表示一个任务，长度 = `duration_weeks`
- 依赖关系以箭头连线表示
- 里程碑以菱形标记在对应日期
- 支持拖拽调整任务的周次和持续时间（→ PATCH 更新）

### 状态管理（Zustand）

```
packages/web/src/stores/
├── authStore.ts        # 用户登录状态 + token
├── projectStore.ts     # 项目列表 + 当前项目
├── targetStore.ts      # 目标列表 + target_stats 缓存
├── taskStore.ts        # 任务列表 + 筛选/排序状态
├── wsStore.ts          # WebSocket 连接状态 + 重连
└── uiStore.ts          # 主题、侧栏折叠等 UI 状态
```

- WebSocket 收到事件 → 直接 mutate 对应 store，触发 React 重渲染
- 乐观更新：用户操作先更新 store → 发送 PATCH → 失败则回滚

### 错误处理 & 离线支持

- **Error Boundary**：每个页面包裹 React Error Boundary，崩溃时显示"出错了"+ 重试按钮
- **请求重试**：API 调用失败自动重试 2 次（指数退避：1s / 2s），超时 10s
- **离线检测**：`navigator.onLine` + WebSocket 断连 → 顶部显示黄色离线条
- **Toast 通知**：创建/更新/删除操作成功/失败均弹出 toast

---

## Phase 5: MCP Server (`packages/mcp`)

### 设计原则

MCP Server 不包含任何业务逻辑，仅将 Core API 封装为 MCP Tools，供 AI 工具调用。AI 工具的 LLM 自行完成"自然语言 → 选择 Tool + 构造参数"的推理。

### 暴露的 Tools

```typescript
// 每个 Tool 的名称、描述、参数 schema（提供给 AI 工具理解）
const tools = [
  {
    name: 'list_projects',
    description: '列出所有项目',
    handler: () => fetch('/api/projects')
  },
  {
    name: 'get_project',
    description: '获取项目详情',
    parameters: { project_id: 'string' },
    handler: (args) => fetch(`/api/projects/${args.project_id}`)
  },
  {
    name: 'list_targets',
    description: '列出项目下的所有目标及其完成率',
    parameters: { project_id: 'string' },
    handler: (args) => fetch(`/api/projects/${args.project_id}/targets`)
  },
  {
    name: 'list_tasks',
    description: '列出目标下的所有任务，可按状态和周次过滤',
    parameters: { target_id: 'string', status: 'string?', week_start: 'string?' },
    handler: (args) => fetch(`/api/targets/${args.target_id}/tasks` + queryString(args))
  },
  {
    name: 'create_task',
    description: '创建任务。若未指定 target_id，默认放入收件箱目标',
    parameters: {
      target_id: 'string?',
      name: 'string',
      description: 'string?',
      priority: "'low'|'medium'|'high'|'urgent'?",
      week_start: 'string?',
      duration_weeks: 'number?'
    },
    handler: (args) => fetch(`/api/targets/${args.target_id}/tasks`, { method: 'POST', body: args })
  },
  {
    name: 'update_task',
    description: '更新任务。必须提供 task_id（非模糊匹配，精准定位）',
    parameters: {
      task_id: 'string',
      changes: 'object'  // { status?, progress?, priority?, name?, week_start?, assignee_id? }
    },
    handler: (args) => fetch(`/api/tasks/${args.task_id}`, { method: 'PATCH', body: args.changes })
  },
  {
    name: 'delete_task',
    description: '删除任务',
    parameters: { task_id: 'string' },
    handler: (args) => fetch(`/api/tasks/${args.task_id}`, { method: 'DELETE' })
  },
  {
    name: 'get_stats',
    description: '获取项目/目标的聚合统计数据',
    parameters: { project_id: 'string?', target_id: 'string?' },
    handler: (args) => fetch('/api/stats?' + queryString(args))
  },
  {
    name: 'get_timeline',
    description: '获取项目时间线数据（甘特图数据）',
    parameters: { project_id: 'string' },
    handler: (args) => fetch(`/api/timeline?project_id=${args.project_id}`)
  },
  {
    name: 'create_milestone',
    description: '创建里程碑',
    parameters: { project_id: 'string', name: 'string', due_date: 'string' },
    handler: (args) => fetch(`/api/projects/${args.project_id}/milestones`, { method: 'POST', body: args })
  },
]
```

### 实现

- 使用 `@modelcontextprotocol/sdk` 的 `McpServer` + `StdioServerTransport`
- MCP Server 通过 stdio 与 AI 工具通信，内部通过 HTTP 调用本机的 Core API
- 可同时启动 HTTP + WebSocket 传输模式（SSE），供不支持 stdio 的 AI 工具使用

### 推理示例（AI 工具自动完成）

```
用户: "把客户提案项目第一周的所有任务标为已完成"

AI 工具内部推理:
  1. 调用 list_targets(project_id="<通过名称模糊查找>")
  2. 调用 list_tasks(target_id="<客户提案目标ID>", week_start="2026-04-27")
  3. 对每个任务调用 update_task(task_id="...", changes={ status: "done", progress: 100 })

用户: "搞定了"

AI 工具内部推理:
  1. 根据对话历史，找到最近用户正在操作的上下文
  2. 推断用户指的是上一个目标中的未完成任务
  3. 执行批量更新
```

**本项目无需实现上述推理逻辑**——由 AI 工具自身承担。

---

## Phase 6: 测试 & 部署

### 测试

- **单元测试**：vitest，覆盖 Core API 的 service 层（数据库操作）
- **集成测试**：supertest，覆盖 Core API 的 REST 端点
- **E2E 测试**：Playwright，覆盖前端关键交互（创建项目 → 创建任务 → 拖拽甘特图 → 状态更新）
- **MCP 测试**：编写 integration test 脚本，模拟 AI 工具调用 MCP Tools

### 部署

```yaml
# docker-compose.yml 结构
services:
  server:   # Express + WebSocket，端口 3000，挂载 SQLite volume
  web:      # nginx 服务静态文件，端口 80
  mcp:      # MCP Server（HTTP+SSE 模式），端口 3100
```

- SQLite 数据文件通过 volume 挂载到宿主机 `./data/omniplan.db`
- 备份目录挂载到 `./backups/`
- 所有服务通过 Docker Compose 统一编排启动

---

---

## Phase 7: 代码规范 & 文档产出

### 代码规范

#### 目录与文件命名

```
packages/server/src/
├── routes/          # 路由层，一个文件对应一个资源（projects.ts, tasks.ts）
├── services/        # 业务逻辑层，每个 service 一个文件
├── db/
│   ├── schema.ts    # 建表语句 & 视图定义
│   └── migrations/  # 按版本号命名：001_initial.sql, 002_add_tags.sql
├── middleware/       # 中间件（auth.ts, cors.ts, rate-limit.ts）
├── websocket/       # WebSocket 事件处理
└── utils/           # 工具函数

packages/web/src/
├── pages/           # 页面组件，一个路由对应一个文件
├── components/      # 可复用 UI 组件
├── stores/          # Zustand store
├── hooks/           # 自定义 hooks
├── api/             # API 请求封装，一个文件对应一组端点
├── lib/             # 纯工具函数
└── styles/          # 全局样式 & TailwindCSS 配置
```

#### 命名约定

| 类型 | 约定 | 示例 |
|---|---|---|
| 文件名 | kebab-case | `task-service.ts` |
| React 组件 | PascalCase | `TaskTable.tsx` |
| 函数/变量 | camelCase | `getTasksByWeek()` |
| 常量 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| 数据库表 | snake_case 复数 | `task_dependencies` |
| 数据库列 | snake_case 单数 | `created_at` |
| REST 端点 | kebab-case | `/api/projects/:pid/targets` |
| Zod schema | PascalCase + `Schema` 后缀 | `CreateTaskSchema` |

#### 注释要求

- **每个 service 文件顶部**需有 JSDoc 注释，说明该模块职责和主要导出
- **每个公共函数/组件**需有 JSDoc 注释，说明参数、返回值、副作用
- **复杂业务逻辑块**前配单行注释解释上下文（如 `// 检查周次是否会与已有任务冲突`）
- **非直观的 SQL 查询**前配注释解释查询意图
- **TODO/FIXME/HACK** 标记必须附带日期和作者缩写
- **不写废话注释**（如 `// 循环遍历数组` 对 `for` 循环），注释只解释"为什么"而非"是什么"

```typescript
/**
 * 创建任务并检查周次冲突。
 * 若目标任务的 week_start 与已有任务重叠且 assignee 相同，返回冲突列表。
 * 
 * @param targetId 所属目标 ID
 * @param data     任务创建参数
 * @returns        创建的任务对象，若存在冲突则 tasks.conflict 字段有值
 * @throws         若 targetId 不存在则抛出 NotFoundError
 */
async function createTask(targetId: string, data: CreateTaskInput): Promise<Task> {
  // 检查目标是否存在
  const target = await db.targets.findById(targetId);
  if (!target) throw new NotFoundError(`Target ${targetId} not found`);

  // 检查同负责人同周次冲突
  const conflicts = await checkWeekConflicts(targetId, data.assignee_id, data.week_start);
  if (conflicts.length > 0) {
    return { ...created, conflicts };
  }

  return db.tasks.create({ ...data, target_id: targetId });
}
```

#### TypeScript 规范

- 启用 `strict: true`，禁止 `any`（除非有充分理由并附注释）
- 所有 DTO 类型定义在 `packages/shared/src/types/`，server 和 web 共同引用
- 所有请求/响应类型与 Zod schema 保持同源推导（`z.infer<typeof schema>`）
- 每个 service 导出清晰的 interface 契约

### 交付文档

开发完成后，以下文档必须在仓库根目录的 `docs/` 目录下产出：

```
docs/
├── README.md              # 项目概览 & 快速开始
├── ARCHITECTURE.md        # 架构全景
├── API.md                 # 接口文档
├── DATABASE.md            # 数据库设计
├── FRONTEND.md            # 前端组件 & 状态管理
├── MCP.md                 # MCP Server 使用说明
├── SETUP.md               # 开发环境搭建 & Docker 部署
└── CONTRIBUTING.md        # 贡献指南 & 代码规范
```

#### 文档内容要求

**README.md**
- 项目一句话简介
- 技术栈标签
- 快速开始（3 步以内启动开发环境）
- 项目结构概览图
- 许可证信息

**ARCHITECTURE.md**
- 系统整体架构图（ASCII art 或 Mermaid 图）
- 各子包职责边界说明
- 数据流图（用户操作 → API → DB → WebSocket → UI）
- 技术选型理由（为什么选 SQLite 而非 PostgreSQL、为什么选 Zustand 而非 Redux）
- 扩展点说明：哪里适合新增功能模块

**API.md** —— 自动生成 + 手动补充
- 使用 `zod-to-openapi` 从 Zod schema 自动生成 OpenAPI 3.1 spec
- 开发阶段通过 Swagger UI（`/api/docs`）实时预览
- 每轮迭代后手动补充非标准操作的文字说明
- 所有端点必须包含：请求示例、成功响应示例、错误响应示例

> 请求示例格式：
> ```json
> POST /api/targets/tgt_001/tasks
> Content-Type: application/json
> Authorization: Bearer <api_key>
> 
> {
>   "name": "完成客户提案初稿",
>   "priority": "high",
>   "week_start": "2026-05-04",
>   "duration_weeks": 2
> }
> 
> --- 201 Created ---
> {
>   "id": "tsk_042",
>   "name": "完成客户提案初稿",
>   "status": "todo",
>   "progress": 0,
>   ...
> }
> ```

**DATABASE.md**
- ER 图（Mermaid erDiagram）
- 每张表的字段说明、约束、索引
- 视图用途说明
- 迁移操作指南（如何新增迁移、如何回滚）

**FRONTEND.md**
- 路由表（路径 → 组件 → 所需 Store）
- 组件树（核心页面的组件嵌套关系）
- Store 设计（每个 store 的 state shape + actions 列表）
- WebSocket 事件 → UI 更新映射表
- 主题自定义指南（如何新增颜色变量、如何切换主题）

**MCP.md**
- MCP Server 启动方式（stdio / HTTP+SSE）
- 可用 Tools 完整列表（名称、参数、示例调用、返回格式）
- 对接 opencode / Claude Code 的配置示例

**SETUP.md**
- 环境要求（Node 版本、npm 版本）
- 本地开发启动步骤
- Docker Compose 一键部署步骤
- 环境变量说明表
- 常见问题 FAQ

**CONTRIBUTING.md**
- 分支策略（`main` 稳定 → `feat/xxx` 开发 → PR → squash merge）
- Commit 规范（Conventional Commits：`feat:`, `fix:`, `docs:`, `refactor:`）
- 提交前 checklist（lint 通过、类型检查通过、单元测试通过、新增文档）
- 代码审查要求

### 文档维护策略

- 每个 PR 合并前必须同步更新相关文档章节
- `API.md` 的 OpenAPI spec 在 CI 中自动校验与 Zod schema 一致性
- 每个 Phase 结束后进行文档审查，确保文档与代码同步
- `README.md` 和 `ARCHITECTURE.md` 的 Mermaid 图使用版本控制友好格式

---

## 关键交互流（更新后）

```
用户自然语言（通过 opencode / Claude Code / etc.）
    │
    │ MCP 协议（Tool Calling）
    ▼
MCP Server（packages/mcp）
    │
    │ HTTP REST 调用
    ▼
Core API（packages/server）：校验 → 写 SQLite
    │
    ├──▶ REST 响应返回 JSON
    │
    └──▶ WebSocket 广播事件（含完整实体数据）
              │
              ▼
         Web 前端 Zustand Store → React 实时更新 UI
```
