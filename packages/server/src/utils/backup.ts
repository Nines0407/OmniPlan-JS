import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { db } from '../db/connection';

const BACKUP_DIR = path.resolve(process.cwd(), 'backups');
const MAX_BACKUPS = 7;

export function startBackupScheduler(): void {
  // Schedule daily backup at 2:00 AM
  cron.schedule('0 2 * * *', () => {
    performBackup();
    cleanupOldBackups();
  });

  console.warn('[backup] daily backup scheduler started (02:00)');
}

function performBackup(): void {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const date = new Date().toISOString().split('T')[0]!;
  const backupFile = path.join(BACKUP_DIR, `${date}.db`);

  db.backup(backupFile);
  console.warn(`[backup] database backed up to ${backupFile}`);
}

function cleanupOldBackups(): void {
  const files = fs.readdirSync(BACKUP_DIR)
    .filter((f) => f.endsWith('.db'))
    .sort()
    .reverse();

  if (files.length > MAX_BACKUPS) {
    for (const file of files.slice(MAX_BACKUPS)) {
      fs.unlinkSync(path.join(BACKUP_DIR, file));
      console.warn(`[backup] removed old backup: ${file}`);
    }
  }
}
