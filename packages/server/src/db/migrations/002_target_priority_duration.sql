-- 002: Add priority and duration to targets

ALTER TABLE targets ADD COLUMN priority TEXT NOT NULL DEFAULT 'medium'
  CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

ALTER TABLE targets ADD COLUMN duration INTEGER DEFAULT NULL;
