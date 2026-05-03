# Frontend Architecture

## Routes

| Path | Component | Stores Used | Key Features |
|---|---|---|---|
| `/` | ProjectList | project, auth | Project cards + inline delete, Master Timeline (lazy-load) |
| `/projects/:pid` | ProjectDetail | project, target, auth | Goal cards: inline priority edit / delete, create form with priority+duration |
| `/projects/:pid/timeline` | Timeline | milestone, auth | Day-precision Gantt, milestone markers on chart, milestone delete |
| `/projects/:pid/tasks` | TaskView | task, target, auth, milestone | Task table with inline editing, Elapsed bar, Milestone CRUD |
| `/projects/:pid/settings` | Settings | project, auth, ui | Project settings |
| `/projects/:pid/targets/:tid` | TaskView | task, target, auth, milestone | Same component, scoped to target |

## Component Tree

```
App
├── ErrorBoundary
│   ├── Navbar
│   ├── OfflineBar
│   ├── Routes
│   │   ├── ProjectList        (+ Master Timeline toggle)
│   │   ├── ProjectDetail      (+ goal delete, goal create with priority/duration)
│   │   ├── Timeline           (+ milestone markers, milestone delete)
│   │   ├── TaskView           (+ Elapsed column, milestone section)
│   │   └── Settings
│   └── ToastContainer
```

## Store Design

### authStore
- `user`, `token`, `isAuthenticated`
- Actions: `login()`, `register()`, `logout()`
- Token persisted in localStorage

### projectStore
- `projects: Project[]`, `currentProject: Project | null`
- Actions: `loadProjects()`, `loadProject(id)`, `addProject()`, `editProject()`, `removeProject()`
- `removeProject()` → soft delete (sets `is_archived=1`)

### targetStore
- `targets: TargetStats[]`
- Actions: `loadTargets(projectId)`, `addTarget()`, `editTarget()`, `removeTarget()`
- `addTarget()` accepts `name`, `description?`, `priority?(default medium)`, `duration?(nullable days)`
- `removeTarget()` → hard cascade delete (tasks + dependencies)

### taskStore
- `tasks: Task[]`, `filters: { status?, assignee_id?, start_date? }`
- Actions: `loadTasks()`, `addTask()`, `editTask()`, `removeTask()`
- `addTask()` accepts `name`, `priority?`, `start_date?`, `duration_days?`, `tags?`
- Task defaults: `status="todo"`, `progress=0`, `duration_days=1`

### milestoneStore
- `milestones: Milestone[]`
- Actions: `loadMilestones(projectId)`, `addMilestone()`, `editMilestone()`, `removeMilestone()`
- `addMilestone()` accepts `name`, `due_date(YYYY-MM-DD)`, `description?`
- New milestones default to `status="pending"`
- Status enum: `pending | completed | cancelled`

### wsStore
- `connected: boolean`, `reconnectAttempts: number`
- Actions: `subscribe()`, `unsubscribe()`
- Exponential backoff reconnection (1s, 2s, 4s... max 30s)
- Dynamically imports other stores to avoid circular deps
- **Note**: server `broadcast()` defined but not wired; no live WS events currently

### uiStore
- `toasts: Toast[]`
- Actions: `addToast(message, type)`, `removeToast(id)`
- Toasts auto-dismiss after 4 seconds

## Inline Editing Pattern (TaskView)

Task table cells use a deferred-commit pattern to avoid API calls on every keystroke:

1. **Click** on a cell → `enterEdit(task, field)` sets `editingCell` + initializes `editingValue` from current task data
2. **Type** in the input → `setEditingValue(e.target.value)` tracks raw string locally
3. **Blur or Enter** → `commitEditingValue(task, field, raw)` parses the value and calls `editTask(id, { [field]: parsedValue })`

Applies to: `start_date` (date input), `duration_days` (number), `progress` (number 0-100), `priority` (select).

## Elapsed Time Bar (TaskView)

Read-only column between Duration and Progress. Computed as:

```
elapsed% = (now - start_date) / duration_days × 100
```

- Updates every 60 seconds via `setInterval`
- No `start_date` → shows `—`
- `elapsed% >= 100` → red bar (`bg-danger-red`)
- Else → amber bar (`bg-amber-400`)

## Master Timeline (ProjectList)

- Button `Show Master Timeline` at bottom of project list page
- Fetches `GET /api/timeline` (no `project_id`) → all non-archived projects
- Groups tasks by `project_name`, colored by `project_color`
- Milestones shown as diamond markers on timeline axis
- Project name links to project detail

## Milestone Markers (Timeline)

- Diamond symbols on the day axis at each milestone's `due_date` position
- Colors: pending=yellow, completed=green, cancelled=gray
- Delete button on the milestone list below the chart

## WebSocket → UI Mapping (planned)

| WsEvent | Store Update |
|---|---|
| `task.updated` | taskStore.editTask() |
| `task.created` | taskStore.loadTasks() |
| `task.deleted` | taskStore.removeTask() |
| `target.updated` | targetStore.editTarget() |
| `project.updated` | projectStore.loadProjects() |
| `milestone.completed` | milestoneStore refresh |

## Theme Customization

Dark theme colors:
- `cyber-blue: #00d4ff` — primary accent
- `neon-green: #39ff14` — success / completion
- `danger-red: #ff4444` — overdue / danger / delete hover
- `amber-400` — elapsed time bar
- `surface: #121212` — page background
- `surface-card: #1e1e1e` — card / table background

CSS variables:
```css
--color-cyber-blue: #00d4ff;
--color-neon-green: #39ff14;
--color-danger-red: #ff4444;
--color-surface: #121212;
--color-surface-card: #1e1e1e;
```

## Error Handling

- **Error Boundary**: wraps entire app, catches render crashes, shows retry button
- **Toast**: API errors shown via `addToast(err.message, 'error')`
- **API Retry**: 10s timeout, no automatic retry
- **Optimistic Updates**: store updated before API response, reverted on failure
