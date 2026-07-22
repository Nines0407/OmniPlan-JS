# OmniPlan-JS

> AI 驱动的项目管理工具 — 为开发者构建，由 AI 助手操作。

[![Tech Stack](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3-38BDF8?logo=tailwindcss)](https://tailwindcss.com)
[![Express](https://img.shields.io/badge/Express-4-000000?logo=express)](https://expressjs.com)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite)](https://sqlite.org)
[![WebSocket](https://img.shields.io/badge/WebSocket-8-010101?logo=websocket)](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
[![MCP](https://img.shields.io/badge/MCP-Protocol-FF6B35)](https://modelcontextprotocol.io)

---

## 特性

- **多项目管理** — 项目 → 目标 → 任务 三层模型，支持任务依赖、里程碑、按日排期
- **甘特图** — 按日精度渲染时间线，条形位置/宽度精确映射 start_date 和 duration_days
- **实时协作** — WebSocket 推送状态变更，全量增量更新，无需轮询
- **AI 原生** — 内置 MCP Server，支持 opencode / Claude Code 等 AI 工具用自然语言操作项目
- **离线上手** — SQLite 单文件数据库，零配置，秒级启动
- **暗色主题** — Cyber Blue 主色调，Neon Green 完成态，专为开发者优化

## 快速开始

### 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 初始化数据库 & 填充示例数据
npm run db:seed

# 3. 启动开发服务器 (API + WebSocket → :3000)
npm run dev:server
```

另一个终端启动前端：

```bash
npm run dev:web      # React 前端 → http://localhost:5173
```

### Docker 部署

**前置要求:** Docker + Docker Compose

```bash
docker compose up -d --build
```

**镜像加速配置**（若 Docker Hub 不可达）：

```bash
# 创建 /etc/docker/daemon.json，填入镜像加速地址
{
  "registry-mirrors": ["https://docker.m.daocloud.io"]
}
sudo systemctl restart docker
```

**npm 镜像配置**（构建时自动使用）：
容器构建阶段通过 Dockerfile 配置了 `registry.npmmirror.com` 镜像源，无需手动干预。

**数据持久化**：
数据库文件（`./data/omniplan.db`）和备份（`./backups/`）通过 volume 映射到宿主机，`git pull` 更新后重建容器不会丢失数据。

**web 端口**：
默认映射到 8080 端口（避免与系统 Apache 80 端口冲突），可在 `docker-compose.yml` 中修改：

- Web 前端 → `:8080`（nginx 代理 `/api` `/ws` → server:3000）
- API Server → `:3000`
- MCP Server → `:3100`

## 架构

```
AI 工具 (opencode / Claude Code)
        │  MCP 协议
        ▼
   MCP Server ──HTTP──▶ Core API ──▶ SQLite
                            │
                   WebSocket 广播
                            │
                            ▼
                      React 前端 (实时更新)
```

- **Core API** 提供 REST + WebSocket，对所有操作做严格校验
- **MCP Server** 将 Core API 封装为 AI Tools，不含任何 LLM 逻辑
- **Web 前端** 通过 Zustand Store 响应 WebSocket 事件，实现乐观更新

## 项目结构

```
omniplan-js/
├── packages/
│   ├── server/          # Express + better-sqlite3 核心服务
│   │   └── src/
│   │       ├── routes/       # REST 路由 (auth, projects, targets, tasks, milestones, stats)
│   │       ├── services/     # 业务逻辑层 (CRUD + 聚合查询)
│   │       ├── db/           # 数据库连接 + 迁移系统 + seed
│   │       ├── middleware/   # Auth / Validate / RateLimit
│   │       ├── websocket/    # WebSocket 广播
│   │       └── utils/        # 每日备份
│   ├── web/             # React + Vite + TailwindCSS 前端
│   │   └── src/
│   │       ├── pages/        # 页面 (项目列表/详情/甘特图/任务表格/设置)
│   │       ├── components/   # 可复用组件 (Navbar/Toast/ErrorBoundary/OfflineBar)
│   │       ├── stores/       # Zustand 状态管理 (auth/project/target/task/ws/ui)
│   │       ├── api/          # API 请求封装 (client + 各资源模块)
│   │       └── styles/       # 全局样式
│   ├── mcp/             # MCP Server (27 Tools for AI)
│   └── shared/          # 共享 TypeScript 类型 + Zod DTO
├── docs/                # 开发文档
├── docker-compose.yml   # 一键部署
└── package.json         # npm workspaces
```

## API 端点总览

| 方法 | 路径 | 说明 |
|---|---|---|
| `POST` | `/api/auth/register` | 注册用户 |
| `POST` | `/api/auth/login` | 登录获取 API Key |
| `GET` | `/api/projects` | 项目列表 |
| `POST` | `/api/projects` | 创建项目 |
| `GET/PATCH/DELETE` | `/api/projects/:id` | 项目 CRUD |
| `GET` | `/api/projects/:pid/targets` | 目标列表 (含统计) |
| `GET` | `/api/targets/:tid/tasks?status=&start_date=` | 任务列表 (可筛选) |
| `PATCH` | `/api/tasks/:id` | 更新任务 (支持乐观锁) |
| `POST` | `/api/tasks/:id/dependencies` | 添加任务依赖 |
| `POST` | `/api/bulk/tasks` | 批量更新任务 |
| `POST` | `/api/projects/:pid/milestones` | 创建里程碑 |
| `GET` | `/api/stats?project_id=` | 聚合统计 |
| `GET` | `/api/timeline?project_id=` | 甘特图数据 |

详细接口文档见 [docs/API.md](./docs/API.md)。

## AI 操作 (MCP)

本项目不自行调用 LLM，而是通过 MCP 协议将项目管理能力暴露给 AI 工具：

```
用户: "把研究与分析目标中所有未完成的任务标为进行中"
        │
  opencode / Claude Code (LLM 推理)
        │
  调用 MCP Tools: list_tasks → bulk_update_tasks
        │
  Core API: 校验 → 写数据库 → WebSocket 广播
        │
  前端 UI 实时更新
```

配置见 [docs/MCP.md](./docs/MCP.md)。

## 文档

| 文档 | 说明 |
|---|---|
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | 系统架构 & 数据流 |
| [API.md](./docs/API.md) | 完整 API 参考 |
| [DATABASE.md](./docs/DATABASE.md) | 数据库设计 & ER 图 |
| [FRONTEND.md](./docs/FRONTEND.md) | 前端组件 & 状态管理 |
| [MCP.md](./docs/MCP.md) | MCP Server 配置 |
| [SETUP.md](./docs/SETUP.md) | 开发环境 & Docker 部署 |
| [CONTRIBUTING.md](./docs/CONTRIBUTING.md) | 贡献指南 |

## 脚本

```bash
npm run dev:server     # 启动 API 服务 (热重载)
npm run dev:web        # 启动前端 (热更新)
npm run dev:mcp        # 启动 MCP Server
npm run build          # 构建全部包
npm run test           # 运行测试
npm run lint           # 代码检查
npm run typecheck      # TypeScript 类型检查
npm run db:seed        # 填充示例数据
npm run db:migrate     # 执行数据库迁移
```

## 部署

```bash
docker compose up -d --build
```

- API Server → `:3000`
- Web Frontend → `:8080` (nginx 代理)
- MCP Server → `:3100`

## 技术栈

| 层 | 选型 |
|---|---|
| 前端 | React 18 + Vite 5 + TailwindCSS 3 + TanStack Table |
| 状态管理 | Zustand |
| 后端 | Express 4 + TypeScript + better-sqlite3 |
| 实时通信 | ws (WebSocket) |
| 校验 | Zod (DTO 同源推导) |
| AI 入口 | MCP Server (@modelcontextprotocol/sdk) |
| 测试 | Vitest + Supertest |
| 部署 | Node.js 22 + Docker Compose |

## License

[MIT](./LICENSE)
