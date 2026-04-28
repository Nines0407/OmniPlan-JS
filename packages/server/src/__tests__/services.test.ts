/**
 * Unit tests for server services
 */
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const TEST_DB_PATH = path.resolve(process.cwd(), 'data', 'test.db');

function setupTestDb() {
  if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
  const db = new Database(TEST_DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Run migration
  const migrationPath = path.resolve(import.meta.dirname, '../db/migrations/001_initial.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');
  db.exec(sql);

  return db;
}

describe('Project Service', () => {
  let db: Database.Database;

  beforeAll(() => {
    // Override db connection to use test db
    process.env.NODE_ENV = 'test';
    db = setupTestDb();
  });

  it('should create and list projects', () => {
    const ownerId = 'usr_test1';
    db.prepare('INSERT INTO users (id, username, display_name) VALUES (?, ?, ?)').run(ownerId, 'testuser', 'Test');
    
    const id = 'prj_test1';
    const now = new Date().toISOString();
    db.prepare(
      'INSERT INTO projects (id, owner_id, name, description, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ).run(id, ownerId, 'Test Project', 'Test Desc', '#3b82f6', now, now);

    const projects = db.prepare('SELECT * FROM projects WHERE is_archived = 0').all();
    expect(projects).toHaveLength(1);
    expect((projects[0] as any).name).toBe('Test Project');
  });

  it('should soft-delete projects', () => {
    db.prepare('UPDATE projects SET is_archived = 1 WHERE id = ?').run('prj_test1');
    const projects = db.prepare('SELECT * FROM projects WHERE is_archived = 0').all();
    expect(projects).toHaveLength(0);
  });
});

describe('Task Service', () => {
  let db: Database.Database;

  beforeAll(() => {
    db = setupTestDb();
    // Setup minimal data
    db.prepare('INSERT INTO users (id, username, display_name) VALUES (?, ?, ?)').run('u1', 'user1', 'U1');
    db.prepare('INSERT INTO projects (id, owner_id, name) VALUES (?, ?, ?)').run('p1', 'u1', 'Project');
    db.prepare('INSERT INTO targets (id, project_id, name) VALUES (?, ?, ?)').run('t1', 'p1', 'Target');
  });

  it('should create a task with defaults', () => {
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO tasks (id, target_id, name, status, priority, progress, tags, created_at, updated_at)
       VALUES (?, ?, ?, 'todo', 'medium', 0, '[]', ?, ?)`,
    ).run('tsk_1', 't1', 'Test Task', now, now);

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get('tsk_1') as any;
    expect(task.name).toBe('Test Task');
    expect(task.status).toBe('todo');
    expect(task.priority).toBe('medium');
    expect(task.progress).toBe(0);
  });

  it('should enforce status check constraint', () => {
    expect(() => {
      db.prepare("UPDATE tasks SET status = 'invalid' WHERE id = 'tsk_1'").run();
    }).toThrow();
  });

  it('should track progress correctly', () => {
    db.prepare("UPDATE tasks SET status = 'in_progress', progress = 50 WHERE id = 'tsk_1'").run();
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get('tsk_1') as any;
    expect(task.status).toBe('in_progress');
    expect(task.progress).toBe(50);
  });

  it('should create task dependencies', () => {
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO tasks (id, target_id, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
    ).run('tsk_2', 't1', 'Dependent Task', now, now);

    db.prepare(
      'INSERT INTO task_dependencies (id, task_id, dependency_id, dependency_type) VALUES (?, ?, ?, ?)',
    ).run('dep_1', 'tsk_2', 'tsk_1', 'finish_to_start');

    const deps = db.prepare('SELECT * FROM task_dependencies WHERE task_id = ?').all('tsk_2');
    expect(deps).toHaveLength(1);
    expect((deps[0] as any).dependency_type).toBe('finish_to_start');
  });
});

describe('Target Stats View', () => {
  let db: Database.Database;

  beforeAll(() => {
    db = setupTestDb();
    db.prepare('INSERT INTO users (id, username, display_name) VALUES (?, ?, ?)').run('u1', 'user1', 'U1');
    db.prepare('INSERT INTO projects (id, owner_id, name) VALUES (?, ?, ?)').run('p1', 'u1', 'Project');
    db.prepare('INSERT INTO targets (id, project_id, name) VALUES (?, ?, ?)').run('t1', 'p1', 'Target');
  });

  it('should calculate completion rate correctly', () => {
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO tasks (id, target_id, name, status, progress, created_at, updated_at) VALUES (?, ?, ?, 'done', 100, ?, ?)`,
    ).run('tsk_a', 't1', 'Done Task', now, now);
    db.prepare(
      `INSERT INTO tasks (id, target_id, name, status, progress, created_at, updated_at) VALUES (?, ?, ?, 'todo', 0, ?, ?)`,
    ).run('tsk_b', 't1', 'Todo Task', now, now);

    const stats = db.prepare('SELECT * FROM target_stats WHERE target_id = ?').get('t1') as any;
    expect(stats.total_tasks).toBe(2);
    expect(stats.done_tasks).toBe(1);
    expect(stats.completion_rate).toBe(50);
  });
});
