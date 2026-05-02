#!/bin/sh
set -e

echo "[entrypoint] Running migrations..."
npx tsx packages/server/src/db/migrate.ts

# Seed only if the database is empty (no projects yet)
PROJECT_COUNT=$(node -e "const Database=require('better-sqlite3');const db=new Database('data/omniplan.db');console.log(db.prepare('SELECT COUNT(*) as cnt FROM projects').get().cnt)" 2>/dev/null || echo "0")
if [ "$PROJECT_COUNT" = "0" ]; then
  echo "[entrypoint] Seeding sample data..."
  npx tsx packages/server/src/db/seed.ts
fi

echo "[entrypoint] Starting server..."
exec npx tsx packages/server/src/index.ts
