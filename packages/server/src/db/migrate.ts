import fs from 'fs';
import path from 'path';
import { db } from './connection';

const MIGRATIONS_DIR = path.resolve(import.meta.dirname, 'migrations');

function getCurrentVersion(): number {
  return db.pragma('user_version', { simple: true }) as number;
}

function setVersion(version: number): void {
  db.pragma(`user_version = ${version}`);
}

function getAppliedMigrations(): Set<string> {
  const currentVersion = getCurrentVersion();
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const applied = new Set<string>();
  let count = 0;
  for (const file of files) {
    if (count < currentVersion) {
      applied.add(file);
    }
    count++;
  }
  return applied;
}

export function migrate(): void {
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const applied = getAppliedMigrations();

  for (let i = 0; i < files.length; i++) {
    const file = files[i]!;
    if (applied.has(file)) continue;

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');
    console.warn(`[migrate] applying ${file}...`);

    db.transaction(() => {
      db.exec(sql);
      setVersion(i + 1);
    })();

    console.warn(`[migrate] ${file} applied (version ${i + 1})`);
  }
}

// Run migrations on import
migrate();
