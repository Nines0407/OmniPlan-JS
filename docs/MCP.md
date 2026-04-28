# MCP Server

OmniPlan exposes a Model Context Protocol (MCP) server that allows AI assistants (opencode, Claude Code, etc.) to operate the project management system via natural language.

## Quick Start

```bash
# Start MCP server via stdio
npm run dev:mcp

# Or with HTTP+SSE transport (for remote AI tools)
OMNIPLAN_API_URL=http://localhost:3000 node packages/mcp/dist/index.js
```

## Configuration

| Variable | Default | Description |
|---|---|---|
| `OMNIPLAN_API_URL` | `http://localhost:3000` | Core API base URL |
| `OMNIPLAN_API_KEY` | (empty) | API key for authenticated write operations |

## Available Tools

### Projects

| Tool | Parameters | Auth |
|---|---|---|
| `list_projects` | none | No |
| `get_project` | `project_id: string` | No |
| `create_project` | `name, description?, color?` | Yes |
| `update_project` | `project_id, name?, description?, color?` | Yes |
| `delete_project` | `project_id` | Yes |

### Targets

| Tool | Parameters | Auth |
|---|---|---|
| `list_targets` | `project_id` | No |
| `get_target` | `target_id` | No |
| `create_target` | `project_id, name, description?` | Yes |
| `update_target` | `target_id, name?, description?` | Yes |
| `delete_target` | `target_id` | Yes |

### Tasks

| Tool | Parameters | Auth |
|---|---|---|
| `list_tasks` | `target_id, status?, assignee_id?, week_start?` | No |
| `get_task` | `task_id` | No |
| `create_task` | `target_id, name, description?, priority?, week_start?, duration_weeks?, assignee_id?` | Yes |
| `update_task` | `task_id, status?, progress?, priority?, name?, week_start?, assignee_id?, duration_weeks?` | Yes |
| `delete_task` | `task_id` | Yes |
| `add_dependency` | `task_id, dependency_id, dependency_type?` | Yes |
| `remove_dependency` | `task_id, dependency_id` | Yes |
| `bulk_update_tasks` | `task_ids, status?, progress?, week_start?` | Yes |

### Milestones

| Tool | Parameters | Auth |
|---|---|---|
| `list_milestones` | `project_id` | No |
| `create_milestone` | `project_id, name, due_date, description?` | Yes |
| `update_milestone` | `milestone_id, name?, due_date?, status?` | Yes |
| `delete_milestone` | `milestone_id` | Yes |

### Stats

| Tool | Parameters | Auth |
|---|---|---|
| `get_stats` | `project_id?, target_id?` | No |
| `get_timeline` | `project_id` | No |

### Auth

| Tool | Parameters | Auth |
|---|---|---|
| `register_user` | `username, display_name` | No |
| `login` | `username` | No |

## opencode/Claude Code Configuration

### opencode (via stdio)

Add to opencode's MCP configuration:
```json
{
  "mcpServers": {
    "omniplan": {
      "command": "node",
      "args": ["packages/mcp/dist/index.js"],
      "cwd": "/path/to/omniplan-js"
    }
  }
}
```

### With API Key (for write access)

```json
{
  "mcpServers": {
    "omniplan": {
      "command": "node",
      "args": ["packages/mcp/dist/index.js"],
      "cwd": "/path/to/omniplan-js",
      "env": {
        "OMNIPLAN_API_KEY": "op_xxxxxxxxxxxxxxxxxxxxx"
      }
    }
  }
}
```

## Example Interaction

```
User: "What's the progress on the 'Research & Analysis' target?"

AI (internal):
  1. list_targets(project_id="prj_xxx") → finds target "研究与分析"
  2. get_stats(target_id="tgt_xxx") → completion_rate: 80%

Response: "The Research & Analysis target is 80% complete.
  4 of 5 tasks are done. 1 task (Data Collection) is overdue."

User: "Move all uncompleted tasks to next week"

AI (internal):
  1. list_tasks(target_id="tgt_xxx", status="in_progress,todo")
  2. bulk_update_tasks(task_ids=[...], changes={ week_start: "2026-05-11" })

Response: "Done. Moved 3 tasks to week of May 11."
```

## Architecture Note

The MCP server contains **no business logic or LLM integration**. It is a thin stateless wrapper that:
1. Receives tool calls from the AI tool
2. Translates them to HTTP requests to the Core API
3. Returns formatted JSON responses

The AI tool's own LLM handles the "natural language → tool selection" reasoning.
