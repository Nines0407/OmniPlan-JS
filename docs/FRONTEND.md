# Frontend Architecture

## Routes

| Path | Component | Stores Used |
|---|---|---|
| `/` | ProjectList | project, auth |
| `/projects/:pid` | ProjectDetail | project, target, auth |
| `/projects/:pid/timeline` | Timeline | (direct API call) |
| `/projects/:pid/tasks` | TaskView | task, target, auth |
| `/projects/:pid/settings` | Settings | project, auth, ui |
| `/projects/:pid/targets/:tid` | TaskView | task, target, auth |

## Component Tree

```
App
├── ErrorBoundary
│   ├── Navbar
│   ├── OfflineBar
│   ├── Routes
│   │   ├── ProjectList
│   │   ├── ProjectDetail
│   │   ├── Timeline
│   │   ├── TaskView
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
- Optimistic: adds to local state immediately

### targetStore
- `targets: TargetStats[]`
- Actions: `loadTargets(projectId)`, `addTarget()`, `editTarget()`, `removeTarget()`

### taskStore
- `tasks: Task[]`, `filters: { status?, assignee_id?, week_start? }`
- Actions: `loadTasks()`, `addTask()`, `editTask()`, `removeTask()`, `setFilters()`

### wsStore
- `connected: boolean`, `reconnectAttempts: number`
- Actions: `subscribe()`, `unsubscribe()`
- Exponential backoff reconnection (1s, 2s, 4s... max 30s)
- Dynamically imports other stores to avoid circular deps

### uiStore
- `theme: 'dark' | 'light'`, `sidebarOpen: boolean`, `toasts: Toast[]`
- Actions: `toggleTheme()`, `toggleSidebar()`, `addToast()`, `removeToast()`
- Toasts auto-dismiss after 4 seconds

## WebSocket → UI Mapping

| WsEvent | Store Update |
|---|---|
| `task.updated` | taskStore.editTask() |
| `task.created` | taskStore.loadTasks() |
| `task.deleted` | taskStore.removeTask() |
| `target.updated` | targetStore.editTarget() |
| `project.updated` | projectStore.loadProjects() |
| `milestone.completed` | (handled via re-fetch) |

## Theme Customization

Dark theme colors are defined in TailwindCSS config:
- `cyber-blue: #00d4ff` — primary accent
- `neon-green: #39ff14` — success / completion
- `danger-red: #ff4444` — overdue / danger
- `surface: #121212` — page background
- `surface-card: #1e1e1e` — card / table background

CSS variables for programmatic access:
```css
--color-cyber-blue: #00d4ff;
--color-neon-green: #39ff14;
--color-danger-red: #ff4444;
--color-surface: #121212;
--color-surface-card: #1e1e1e;
```

To add a new theme:
1. Add colors to `tailwind.config.js`
2. Add corresponding CSS variables in `globals.css`
3. Update `uiStore.ts` theme toggle logic

## Offline & Error Handling

- **Error Boundary**: wraps entire app, catches render crashes, shows retry button
- **Offline Detection**: `navigator.onLine` + WebSocket disconnection → yellow banner
- **API Retry**: 10s timeout, no automatic retry (errors shown via toast)
- **Optimistic Updates**: store updated before API response, reverted on failure
