import { db } from '../db/connection';
import type { Milestone, CreateMilestoneInput, UpdateMilestoneInput } from '@omniplan/shared';
import { NotFoundError, ConflictError } from './project-service';

function generateId(prefix: string): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = prefix + '_';
  for (let i = 0; i < 8; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export function listMilestones(projectId: string): Milestone[] {
  return db.prepare('SELECT * FROM milestones WHERE project_id = ? ORDER BY due_date ASC').all(projectId) as Milestone[];
}

export function getMilestone(id: string): Milestone {
  const milestone = db.prepare('SELECT * FROM milestones WHERE id = ?').get(id) as Milestone | undefined;
  if (!milestone) throw new NotFoundError(`Milestone ${id} not found`);
  return milestone;
}

export function createMilestone(projectId: string, data: CreateMilestoneInput): Milestone {
  const id = generateId('mil');
  const now = new Date().toISOString();
  db.prepare(
    'INSERT INTO milestones (id, project_id, name, description, due_date, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  ).run(id, projectId, data.name, data.description || null, data.due_date, 'pending', now, now);
  return getMilestone(id);
}

export function updateMilestone(id: string, data: UpdateMilestoneInput, expectedVersion?: string): Milestone {
  const milestone = getMilestone(id);
  if (expectedVersion && milestone.updated_at !== expectedVersion) {
    throw new ConflictError('Milestone has been modified by another request');
  }
  const now = new Date().toISOString();
  const sets: string[] = [];
  const vals: unknown[] = [];
  if (data.name !== undefined) { sets.push('name = ?'); vals.push(data.name); }
  if (data.description !== undefined) { sets.push('description = ?'); vals.push(data.description); }
  if (data.due_date !== undefined) { sets.push('due_date = ?'); vals.push(data.due_date); }
  if (data.status !== undefined) { sets.push('status = ?'); vals.push(data.status); }
  if (sets.length === 0) return milestone;
  sets.push('updated_at = ?');
  vals.push(now);
  vals.push(id);
  db.prepare(`UPDATE milestones SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
  return getMilestone(id);
}

export function deleteMilestone(id: string): void {
  getMilestone(id);
  db.prepare('DELETE FROM milestones WHERE id = ?').run(id);
}
