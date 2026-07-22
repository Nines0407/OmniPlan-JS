-- 004: Add api_keys table for persistent API key storage
CREATE TABLE IF NOT EXISTS api_keys (
  api_key TEXT PRIMARY KEY,
  user_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
