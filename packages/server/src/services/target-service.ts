import { db } from '../db/connection';
import type { Target, TargetStats, CreateTargetInput, UpdateTargetInput } from '@omniplan/shared';
import { NotFoundError, ConflictError } from './project-service';

function generateId(prefix: string): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = prefix + '_';
  for (let i = 0; i < 8; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export function listTargets(projectId: string): TargetStats[] {
  return db.prepare(`
    SELECT t.*, 
      COALESCE(ts.total_tasks, 0) AS total_tasks,
      COALESCE(ts.done_tasks, 0) AS done_tasks,
      COALESCE(ts.completion_rate, 0) AS completion_rate,
      COALESCE(ts.overdue_tasks, 0) AS overdue_tasks
    FROM targets t
    LEFT JOIN target_stats ts ON ts.target_id = t.id
    WHERE t.project_id = ?
    ORDER BY t.sort_order ASC, t.created_at DESC
  `).all(projectId) as TargetStats[];
}

export function getTarget(id: string): Target {
  const target = db.prepare('SELECT * FROM targets WHERE id = ?').get(id) as Target | undefined;
  if (!target) throw new NotFoundError(`Target ${id} not found`);
  return target;
}

export function getTargetStats(id: string): TargetStats {
  const target = getTarget(id);
  const stats = db.prepare('SELECT * FROM target_stats WHERE target_id = ?').get(id) as {
    total_tasks: number; done_tasks: number; completion_rate: number; overdue_tasks: number;
  } | undefined;
  return { ...target, ...stats } as TargetStats;
}

export function createTarget(projectId: string, data: CreateTargetInput): Target {
  const id = generateId('tgt');
  const now = new Date().toISOString();
  const maxSort = db.prepare('SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM targets WHERE project_id = ?').get(projectId) as { next: number };
  db.prepare(
    'INSERT INTO targets (id, project_id, name, description, cover_url, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  ).run(id, projectId, data.name, data.description || null, data.cover_url || null, maxSort.next, now, now);
  return getTarget(id);
}

export function updateTarget(id: string, data: UpdateTargetInput, expectedVersion?: string): Target {
  const target = getTarget(id);
  if (expectedVersion && target.updated_at !== expectedVersion) {
    throw new ConflictError('Target has been modified by another request');
  }
  const now = new Date().toISOString();
  const sets: string[] = [];
  const vals: unknown[] = [];
  if (data.name !== undefined) { sets.push('name = ?'); vals.push(data.name); }
  if (data.description !== undefined) { sets.push('description = ?'); vals.push(data.description); }
  if (data.cover_url !== undefined) { sets.push('cover_url = ?'); vals.push(data.cover_url); }
  if (data.sort_order !== undefined) { sets.push('sort_order = ?'); vals.push(data.sort_order); }
  if (sets.length === 0) return target;
  sets.push('updated_at = ?');
  vals.push(now);
  vals.push(id);
  db.prepare(`UPDATE targets SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
  return getTarget(id);
}

export function deleteTarget(id: string): void {
  getTarget(id);
  db.prepare('DELETE FROM targets WHERE id = ?').run(id);
}
