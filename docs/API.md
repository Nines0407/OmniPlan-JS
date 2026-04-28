# API Reference

Base URL: `http://localhost:3000/api`

## Authentication

All write operations (POST/PATCH/DELETE) require an API key:
```
Authorization: Bearer <api_key>
```

### Register
```
POST /api/auth/register
Content-Type: application/json

{
  "username": "alice",
  "display_name": "Alice"
}

--- 201 Created ---
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_xxxxxxxx",
      "username": "alice",
      "display_name": "Alice",
      ...
    },
    "api_key": "op_xxxxxxxxxxxxxxxxxxxxxxxx"
  }
}
```

### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "username": "alice"
}

--- 200 OK ---
{
  "success": true,
  "data": {
    "user": { ... },
    "api_key": "op_xxxxxxxxxxxxxxxxxxxxxxxx"
  }
}
```

## Projects

### List Projects
```
GET /api/projects

--- 200 OK ---
{
  "success": true,
  "data": [
    {
      "id": "prj_xxxxxxxx",
      "owner_id": "usr_xxxxxxxx",
      "name": "Project Name",
      "description": "...",
      "color": "#3b82f6",
      "is_archived": 0,
      "created_at": "2026-01-01T00:00:00.000Z",
      "updated_at": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

### Create Project
```
POST /api/projects
Authorization: Bearer <api_key>
Content-Type: application/json

{
  "name": "New Project",
  "description": "Optional description",
  "color": "#3b82f6"
}

--- 201 Created ---
{ "success": true, "data": { ... } }
```

### Get Project
```
GET /api/projects/:id
--- 200 OK ---
{ "success": true, "data": { ... } }
```

### Update Project (PATCH with optimistic lock)
```
PATCH /api/projects/:id
Authorization: Bearer <api_key>
Content-Type: application/json

{
  "changes": { "name": "New Name" },
  "expected_version": "2026-01-01T00:00:00.000Z"
}

--- 200 OK ---
{ "success": true, "data": { ... } }
```

### Delete Project (soft-delete)
```
DELETE /api/projects/:id
Authorization: Bearer <api_key>
--- 200 OK ---
{ "success": true, "data": null }
```

## Targets

### List Targets (with stats)
```
GET /api/projects/:pid/targets

--- 200 OK ---
{
  "success": true,
  "data": [
    {
      "id": "tgt_xxxxxxxx",
      "project_id": "prj_xxxxxxxx",
      "name": "Goal Name",
      "total_tasks": 5,
      "done_tasks": 3,
      "completion_rate": 60.0,
      "overdue_tasks": 1,
      ...
    }
  ]
}
```

### Create Target
```
POST /api/projects/:pid/targets
Authorization: Bearer <api_key>

{ "name": "New Goal" }
--- 201 Created ---
```

### Get Target
```
GET /api/targets/:id
--- 200 OK ---
```

### Update Target
```
PATCH /api/targets/:id
Authorization: Bearer <api_key>

{ "changes": { "name": "Updated Goal" } }
--- 200 OK ---
```

### Delete Target
```
DELETE /api/targets/:id
Authorization: Bearer <api_key>
--- 200 OK ---
```

## Tasks

### List Tasks
```
GET /api/targets/:tid/tasks?status=in_progress&week_start=2026-05-04
--- 200 OK ---
{
  "success": true,
  "data": [
    {
      "id": "tsk_xxxxxxxx",
      "target_id": "tgt_xxxxxxxx",
      "name": "Task Name",
      "status": "in_progress",
      "priority": "high",
      "week_start": "2026-05-04",
      "duration_weeks": 2,
      "assignee_id": "usr_xxxxxxxx",
      "progress": 45,
      "tags": "[\"frontend\"]",
      ...
    }
  ]
}
```

Query parameters:
- `status`: filter by status
- `assignee_id`: filter by assignee
- `week_start`: filter by week

### Create Task
```
POST /api/targets/:tid/tasks
Authorization: Bearer <api_key>

{
  "name": "Task Name",
  "priority": "high",
  "week_start": "2026-05-04",
  "duration_weeks": 2,
  "assignee_id": "usr_xxxxxxxx"
}
--- 201 Created ---
```

### Get Task (with dependencies)
```
GET /api/tasks/:id

--- 200 OK ---
{
  "success": true,
  "data": {
    ...task fields,
    "dependencies": [
      {
        "id": "dep_xxxxxxxx",
        "task_id": "tsk_xxxxxxxx",
        "dependency_id": "tsk_yyyyyyyy",
        "dependency_type": "finish_to_start"
      }
    ]
  }
}
```

### Update Task
```
PATCH /api/tasks/:id
Authorization: Bearer <api_key>

{
  "changes": {
    "status": "done",
    "progress": 100
  }
}
--- 200 OK ---
```

### Delete Task
```
DELETE /api/tasks/:id
Authorization: Bearer <api_key>
--- 200 OK ---
```

### Add Dependency
```
POST /api/tasks/:id/dependencies
Authorization: Bearer <api_key>

{
  "dependency_id": "tsk_yyyyyyyy",
  "dependency_type": "finish_to_start"
}
--- 201 Created ---
```

### Remove Dependency
```
DELETE /api/tasks/:id/dependencies/:depId
Authorization: Bearer <api_key>
--- 200 OK ---
```

### Bulk Update Tasks
```
POST /api/bulk/tasks
Authorization: Bearer <api_key>

{
  "task_ids": ["tsk_xxx", "tsk_yyy"],
  "changes": {
    "status": "done",
    "progress": 100
  }
}
--- 200 OK ---
```

## Milestones

### List Milestones
```
GET /api/projects/:pid/milestones
--- 200 OK ---
```

### Create Milestone
```
POST /api/projects/:pid/milestones
Authorization: Bearer <api_key>

{
  "name": "Sprint 1 Release",
  "due_date": "2026-06-01"
}
--- 201 Created ---
```

### Update Milestone
```
PATCH /api/milestones/:id
Authorization: Bearer <api_key>

{ "changes": { "status": "completed" } }
--- 200 OK ---
```

### Delete Milestone
```
DELETE /api/milestones/:id
Authorization: Bearer <api_key>
--- 200 OK ---
```

## Statistics

### Get Stats
```
GET /api/stats?project_id=prj_xxx

--- 200 OK ---
{
  "success": true,
  "data": {
    "project_id": "prj_xxx",
    "project_name": "Project",
    "total_tasks": 12,
    "done_tasks": 5,
    "completion_rate": 41.7,
    "overdue_tasks": 2,
    "targets": [ ... ]
  }
}
```

### Get Timeline
```
GET /api/timeline?project_id=prj_xxx

--- 200 OK ---
{
  "success": true,
  "data": {
    "tasks": [ ... ],
    "milestones": [ ... ],
    "dependencies": [ ... ]
  }
}
```

## WebSocket

Connect to: `ws://localhost:3000/ws`

### Events (server → client)

| Event Type | Payload |
|---|---|
| `task.updated` | `{ type, entity: Task }` |
| `task.created` | `{ type, entity: Task }` |
| `task.deleted` | `{ type, id: string }` |
| `target.updated` | `{ type, entity: TargetStats }` |
| `milestone.completed` | `{ type, entity: Milestone }` |
| `project.updated` | `{ type, entity: Project }` |
| `bulk.updated` | `{ type, entities: Task[] }` |

## Error Responses

All errors follow this format:
```json
{
  "success": false,
  "error": "Human-readable error message",
  "details": { ... }  // Optional, for validation errors
}
```

Common status codes:
- 400: Validation error
- 401: Authentication required / invalid API key
- 404: Resource not found
- 409: Conflict (optimistic lock failure, duplicate)
- 429: Rate limit exceeded
