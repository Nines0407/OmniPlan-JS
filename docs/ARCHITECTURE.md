# Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   AI Tools (opencode, Claude Code, etc.)    │
│                         │                                   │
│                    MCP Protocol                             │
│                         ▼                                   │
│             ┌─────────────────────┐                         │
│             │    MCP Server       │  packages/mcp           │
│             │  (stdio / HTTP)     │                         │
│             └────────┬────────────┘                         │
│                      │ HTTP REST                            │
│                      ▼                                      │
│  ┌──────────────────────────────────────┐                   │
│  │          Core API Server             │ packages/server   │
│  │  ┌──────────┐  ┌──────────────────┐ │                   │
│  │  │   REST   │  │    WebSocket     │ │                   │
│  │  │ Endpoints│  │   (real-time)    │ │                   │
│  │  └────┬─────┘  └────────┬─────────┘ │                   │
│  │       │                 │           │                   │
│  │  ┌────┴─────────────────┴──────┐    │                   │
│  │  │       Service Layer         │    │                   │
│  │  │  (business logic + validation)│  │                   │
│  │  └────────────┬────────────────┘    │                   │
│  │               │                     │                   │
│  │  ┌────────────┴────────────────┐    │                   │
│  │  │      SQLite Database        │    │                   │
│  │  └─────────────────────────────┘    │                   │
│  └──────────────────────────────────────┘                   │
│         │                                                   │
│         ▼                                                   │
│  ┌──────────────────────────────────────┐                   │
│  │          Web Frontend               │  packages/web     │
│  │  ┌──────────┐  ┌──────────────────┐ │                   │
│  │  │  React   │  │  Zustand Stores  │ │                   │
│  │  │   UI     │◄─┤  (local state)   │ │                   │
│  │  └──────────┘  └────────┬─────────┘ │                   │
│  │                         │           │                   │
│  │               WebSocket events      │                   │
│  │               (real-time updates)   │                   │
│  └─────────────────────────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

## Package Responsibilities

### `packages/shared`
- TypeScript type definitions for all entities (User, Project, Target, Task, Milestone)
- Zod validation schemas for all API inputs
- DTO interfaces for REST request/response bodies
- WebSocket event type definitions

### `packages/server`
- Express REST API (routes, middleware, services)
- SQLite database management (schema, migrations, seeds)
- WebSocket server for real-time updates
- Scheduled database backups
- Rate limiting, CORS, API key authentication

### `packages/web`
- React SPA with React Router
- Zustand state management (6 stores: auth, project, target, task, ws, ui)
- TanStack Table for task views
- Custom Gantt chart component
- Dark-themed responsive UI

### `packages/mcp`
- MCP server exposing OmniPlan as AI tools
- Stateless wrapper around Core API
- Supports stdio and HTTP+SSE transport

## Data Flow

```
User Action → API Call → Route Handler → Service → SQLite
                                                  ↓
                                           WebSocket Broadcast
                                                  ↓
                                          Zustand Store → React Re-render
```

## Design Decisions

### Why SQLite instead of PostgreSQL?
- Zero-config deployment (no separate DB container)
- Perfect for single-node / small-team use
- WAL mode provides concurrent read/write
- Easy backups (single file copy)

### Why Zustand instead of Redux?
- Minimal boilerplate
- Direct state mutations with Immer-like API
- No provider wrapping needed
- Built-in support for async actions

### Why MCP instead of direct LLM integration?
- Zero API cost for LLM calls (AI tool handles it)
- No prompt engineering maintenance
- Any MCP-compatible AI tool can operate the system
- Clean separation between AI reasoning and business logic

## Extension Points

- **New entity types**: Add table → migration → service → routes → MCP tool
- **Custom views**: Add SQL view → stats service → API endpoint
- **External integrations**: Hook into WebSocket events for webhooks/notifications
- **Multi-user collaboration**: Already supported by data model (user ownership + assignments)
