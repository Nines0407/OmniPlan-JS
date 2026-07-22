import { db } from '../db/connection';
import type { Project, CreateProjectInput, UpdateProjectInput } from '@omniplan/shared';
import { broadcast } from '../websocket/index';

function generateId(prefix: string): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = prefix + '_';
  for (let i = 0; i < 8; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export class NotFoundError extends Error {
  statusCode = 404;
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  statusCode = 409;
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export function listProjects(): Project[] {
  return db.prepare('SELECT * FROM projects WHERE is_archived = 0 ORDER BY created_at DESC').all() as Project[];
}

export function getProject(id: string): Project {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as Project | undefined;
  if (!project) throw new NotFoundError(`Project ${id} not found`);
  return project;
}

export function createProject(ownerId: string, data: CreateProjectInput): Project {
  const id = generateId('prj');
  const now = new Date().toISOString();
  db.prepare(
    'INSERT INTO projects (id, owner_id, name, description, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).run(id, ownerId, data.name, data.description || null, data.color || '#3b82f6', now, now);
  return getProject(id);
}

export function updateProject(id: string, data: UpdateProjectInput, expectedVersion?: string): Project {
  const project = getProject(id);
  if (expectedVersion && project.updated_at !== expectedVersion) {
    throw new ConflictError('Project has been modified by another request');
  }
  const now = new Date().toISOString();
  const sets: string[] = [];
  const vals: unknown[] = [];
  if (data.name !== undefined) { sets.push('name = ?'); vals.push(data.name); }
  if (data.description !== undefined) { sets.push('description = ?'); vals.push(data.description); }
  if (data.color !== undefined) { sets.push('color = ?'); vals.push(data.color); }
  if (sets.length === 0) return project;
  sets.push('updated_at = ?');
  vals.push(now);
  vals.push(id);
  db.prepare(`UPDATE projects SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
  const updated = getProject(id);
  broadcast({ type: 'project.updated', entity: updated });
  return updated;
}

export function deleteProject(id: string): void {
  const project = getProject(id);
  db.prepare('UPDATE projects SET is_archived = 1, updated_at = ? WHERE id = ?').run(new Date().toISOString(), id);
}
