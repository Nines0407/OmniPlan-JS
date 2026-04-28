-- 001: Initial schema
-- Creates all core tables and views for OmniPlan

CREATE TABLE IF NOT EXISTS users (
  id           TEXT PRIMARY KEY,
  username     TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS projects (
  id          TEXT PRIMARY KEY,
  owner_id    TEXT NOT NULL REFERENCES users(id),
  name        TEXT NOT NULL,
  description TEXT,
  color       TEXT DEFAULT '#3b82f6',
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS targets (
  id           TEXT PRIMARY KEY,
  project_id   TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  description  TEXT,
  cover_url    TEXT,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tasks (
  id             TEXT PRIMARY KEY,
  target_id      TEXT NOT NULL REFERENCES targets(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  description    TEXT,
  status         TEXT NOT NULL DEFAULT 'todo'
                 CHECK (status IN ('todo', 'in_progress', 'review', 'done', 'cancelled')),
  priority       TEXT NOT NULL DEFAULT 'medium'
                 CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  week_start     TEXT,
  duration_weeks INTEGER DEFAULT 1,
  assignee_id    TEXT REFERENCES users(id),
  progress       REAL NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  tags           TEXT DEFAULT '[]',
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS task_dependencies (
  id               TEXT PRIMARY KEY,
  task_id          TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  dependency_id    TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  dependency_type  TEXT NOT NULL DEFAULT 'finish_to_start'
                   CHECK (dependency_type IN ('finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish')),
  UNIQUE(task_id, dependency_id)
);

CREATE TABLE IF NOT EXISTS milestones (
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

-- Views
CREATE VIEW IF NOT EXISTS target_stats AS
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

CREATE VIEW IF NOT EXISTS week_summary AS
SELECT
  week_start,
  target_id,
  COUNT(*) AS task_count,
  COUNT(CASE WHEN status = 'done' THEN 1 END) AS done_count,
  COUNT(CASE WHEN status = 'in_progress' THEN 1 END) AS in_progress_count
FROM tasks
WHERE week_start IS NOT NULL
GROUP BY week_start, target_id;
