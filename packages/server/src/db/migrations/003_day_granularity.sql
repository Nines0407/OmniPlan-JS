-- 003: Rename week_start to start_date, duration_weeks to duration_days
ALTER TABLE tasks RENAME COLUMN week_start TO start_date;
ALTER TABLE tasks RENAME COLUMN duration_weeks TO duration_days;
UPDATE tasks SET duration_days = duration_days * 7;

-- Recreate the summary view with new column names
DROP VIEW IF EXISTS week_summary;
DROP VIEW IF EXISTS day_summary;
CREATE VIEW IF NOT EXISTS day_summary AS
SELECT
  start_date,
  target_id,
  COUNT(*) AS task_count,
  COUNT(CASE WHEN status = 'done' THEN 1 END) AS done_count,
  COUNT(CASE WHEN status = 'in_progress' THEN 1 END) AS in_progress_count
FROM tasks
WHERE start_date IS NOT NULL
GROUP BY start_date, target_id;
