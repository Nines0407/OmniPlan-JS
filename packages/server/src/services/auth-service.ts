import { db } from '../db/connection';
import type { User } from '@omniplan/shared';

function generateId(prefix: string): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = prefix + '_';
  for (let i = 0; i < 8; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export function generateApiKey(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = 'op_';
  for (let i = 0; i < 24; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export function createApiKey(userId: string): string {
  const apiKey = generateApiKey();
  db.prepare('INSERT INTO api_keys (api_key, user_id) VALUES (?, ?)').run(apiKey, userId);
  return apiKey;
}

export function verifyApiKey(apiKey: string): string | null {
  const row = db.prepare('SELECT user_id FROM api_keys WHERE api_key = ?').get(apiKey) as { user_id: string } | undefined;
  return row?.user_id ?? null;
}

export function registerUser(username: string, displayName: string): User {
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    throw Object.assign(new Error('Username already exists'), { statusCode: 409 });
  }
  const id = generateId('usr');
  const now = new Date().toISOString();
  db.prepare(
    'INSERT INTO users (id, username, display_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
  ).run(id, username, displayName, now, now);
  return { id, username, display_name: displayName, created_at: now, updated_at: now };
}

export function findByUsername(username: string): User | undefined {
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username) as User | undefined;
}

export function findUserById(id: string): User | undefined {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined;
}
