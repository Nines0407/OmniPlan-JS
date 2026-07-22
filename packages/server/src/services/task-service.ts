import { db } from '../db/connection';
import type { Task, TaskDependency, CreateTaskInput, UpdateTaskInput, TaskStatus, TaskPriority } from '@omniplan/shared';
import { NotFoundError, ConflictError } from './project-service';
import { broadcast } from '../websocket/index';

function generateId(prefix: string): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = prefix + '_';
  for (let i = 0; i < 8; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

interface TaskQuery {
  status?: string;
  assignee_id?: string;
  start_date?: string;
}

export function listTasks(targetId: string, query: TaskQuery = {}): Task[] {
  const conditions: string[] = ['target_id = ?'];
  const params: unknown[] = [targetId];

  if (query.status) {
    conditions.push('status = ?');
    params.push(query.status);
  }
  if (query.assignee_id) {
    conditions.push('assignee_id = ?');
    params.push(query.assignee_id);
  }
  if (query.start_date) {
    conditions.push('start_date = ?');
    params.push(query.start_date);
  }

  return db.prepare(
    `SELECT * FROM tasks WHERE ${conditions.join(' AND ')} ORDER BY start_date ASC, priority ASC, created_at ASC`,
  ).all(...params) as Task[];
}

export function getTask(id: string): Task {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Task | undefined;
  if (!task) throw new NotFoundError(`Task ${id} not found`);
  return task;
}

export function getTaskDependencies(taskId: string): TaskDependency[] {
  return db.prepare('SELECT * FROM task_dependencies WHERE task_id = ? OR dependency_id = ?').all(taskId, taskId) as TaskDependency[];
}

export function createTask(targetId: string, data: CreateTaskInput): Task {
  const id = generateId('tsk');
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO tasks (id, target_id, name, description, status, priority, start_date, duration_days, assignee_id, progress, tags, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'todo', ?, ?, ?, ?, 0, ?, ?, ?)`,
  ).run(
    id, targetId, data.name,
    data.description || null,
    data.priority || 'medium',
    data.start_date || null,
    data.duration_days || 1,
    data.assignee_id || null,
    JSON.stringify(data.tags || []),
    now, now,
  );
  const task = getTask(id);
  broadcast({ type: 'task.created', entity: task });
  return task;
}

export function updateTask(id: string, data: UpdateTaskInput, expectedVersion?: string): Task {
  const task = getTask(id);
  if (expectedVersion && task.updated_at !== expectedVersion) {
    throw new ConflictError('Task has been modified by another request');
  }
  const now = new Date().toISOString();
  const sets: string[] = [];
  const vals: unknown[] = [];

  if (data.name !== undefined) { sets.push('name = ?'); vals.push(data.name); }
  if (data.description !== undefined) { sets.push('description = ?'); vals.push(data.description); }
  if (data.status !== undefined) { sets.push('status = ?'); vals.push(data.status); }
  if (data.priority !== undefined) { sets.push('priority = ?'); vals.push(data.priority); }
  if (data.start_date !== undefined) { sets.push('start_date = ?'); vals.push(data.start_date); }
  if (data.duration_days !== undefined) { sets.push('duration_days = ?'); vals.push(data.duration_days); }
  if (data.assignee_id !== undefined) { sets.push('assignee_id = ?'); vals.push(data.assignee_id); }
  if (data.progress !== undefined) { sets.push('progress = ?'); vals.push(data.progress); }
  if (data.tags !== undefined) { sets.push('tags = ?'); vals.push(JSON.stringify(data.tags)); }

  if (sets.length === 0) return task;
  sets.push('updated_at = ?');
  vals.push(now);
  vals.push(id);
  db.prepare(`UPDATE tasks SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
  const updated = getTask(id);
  broadcast({ type: 'task.updated', entity: updated });
  return updated;
}

export function deleteTask(id: string): void {
  getTask(id);
  db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  broadcast({ type: 'task.deleted', id });
}

export function addDependency(taskId: string, dependencyId: string, dependencyType: TaskDependency['dependency_type'] = 'finish_to_start'): TaskDependency {
  getTask(taskId);
  getTask(dependencyId);
  const id = generateId('dep');
  db.prepare(
    'INSERT INTO task_dependencies (id, task_id, dependency_id, dependency_type) VALUES (?, ?, ?, ?)',
  ).run(id, taskId, dependencyId, dependencyType);
  return { id, task_id: taskId, dependency_id: dependencyId, dependency_type: dependencyType };
}

export function removeDependency(taskId: string, depId: string): void {
  const result = db.prepare('DELETE FROM task_dependencies WHERE task_id = ? AND dependency_id = ?').run(taskId, depId);
  if (result.changes === 0) throw new NotFoundError(`Dependency not found`);
}

export function bulkUpdateTasks(taskIds: string[], changes: { status?: TaskStatus; progress?: number; start_date?: string | null }): Task[] {
  const now = new Date().toISOString();
  const updated: Task[] = [];

  const sets: string[] = [];
  const vals: unknown[] = [];
  if ('status' in changes) { sets.push('status = ?'); vals.push(changes.status ?? null); }
  if ('progress' in changes) { sets.push('progress = ?'); vals.push(changes.progress ?? null); }
  if ('start_date' in changes) { sets.push('start_date = ?'); vals.push(changes.start_date ?? null); }

  if (sets.length === 0) return updated;
  sets.push('updated_at = ?');
  vals.push(now);

  const updateStmt = db.prepare(`UPDATE tasks SET ${sets.join(', ')} WHERE id = ?`);

  db.transaction(() => {
    for (const taskId of taskIds) {
      const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as Task | undefined;
      if (!task) continue;
      updateStmt.run(...vals, taskId);
      updated.push(getTask(taskId));
    }
  })();

  if (updated.length > 0) {
    broadcast({ type: 'bulk.updated', entities: updated });
  }
  return updated;
}
