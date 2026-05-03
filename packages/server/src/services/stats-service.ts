import { db } from '../db/connection';
import type { ProjectStats, DaySummary, TimelineData } from '@omniplan/shared';

export function getStats(projectId?: string, targetId?: string): ProjectStats | { targets: unknown[] } {
  if (projectId) {
    const project = db.prepare('SELECT id, name FROM projects WHERE id = ?').get(projectId) as { id: string; name: string } | undefined;
    if (!project) return { targets: [] };

    const tasks = db.prepare('SELECT COUNT(*) as total FROM tasks tk JOIN targets t ON tk.target_id = t.id WHERE t.project_id = ?').get(projectId) as { total: number };
    const done = db.prepare("SELECT COUNT(*) as done FROM tasks tk JOIN targets t ON tk.target_id = t.id WHERE t.project_id = ? AND tk.status = 'done'").get(projectId) as { done: number };
    const overdue = db.prepare("SELECT COUNT(*) as overdue FROM tasks tk JOIN targets t ON tk.target_id = t.id WHERE t.project_id = ? AND tk.start_date < date('now') AND tk.status != 'done'").get(projectId) as { overdue: number };
    const targets = db.prepare('SELECT t.*, COALESCE(ts.total_tasks,0) as total_tasks, COALESCE(ts.done_tasks,0) as done_tasks, COALESCE(ts.completion_rate,0) as completion_rate, COALESCE(ts.overdue_tasks,0) as overdue_tasks FROM targets t LEFT JOIN target_stats ts ON ts.target_id = t.id WHERE t.project_id = ?').all(projectId);

    return {
      project_id: project.id,
      project_name: project.name,
      total_tasks: tasks.total,
      done_tasks: done.done,
      completion_rate: tasks.total > 0 ? Math.round((done.done / tasks.total) * 1000) / 10 : 0,
      overdue_tasks: overdue.overdue,
      targets: targets as ProjectStats['targets'],
    };
  }

  if (targetId) {
    const targets = db.prepare('SELECT t.*, COALESCE(ts.total_tasks,0) as total_tasks, COALESCE(ts.done_tasks,0) as done_tasks, COALESCE(ts.completion_rate,0) as completion_rate, COALESCE(ts.overdue_tasks,0) as overdue_tasks FROM targets t LEFT JOIN target_stats ts ON ts.target_id = t.id WHERE t.id = ?').all(targetId);
    return { targets };
  }

  return { targets: [] };
}

export function getTimeline(projectId: string): TimelineData {
  const tasks = db.prepare(`
    SELECT tk.id, tk.name, tk.target_id, t.name as target_name,
           tk.start_date, tk.duration_days, tk.status, tk.progress,
           u.display_name as assignee_name
    FROM tasks tk
    JOIN targets t ON tk.target_id = t.id
    LEFT JOIN users u ON tk.assignee_id = u.id
    WHERE t.project_id = ? AND tk.start_date IS NOT NULL
    ORDER BY tk.start_date ASC
  `).all(projectId);

  const milestones = db.prepare('SELECT id, name, due_date, status FROM milestones WHERE project_id = ? ORDER BY due_date ASC').all(projectId);

  const dependencies = db.prepare(`
    SELECT td.task_id, td.dependency_id, td.dependency_type
    FROM task_dependencies td
    JOIN tasks tk ON td.task_id = tk.id
    JOIN targets t ON tk.target_id = t.id
    WHERE t.project_id = ?
  `).all(projectId);

  return {
    tasks: tasks as TimelineData['tasks'],
    milestones: milestones as TimelineData['milestones'],
    dependencies: dependencies as TimelineData['dependencies'],
  };
}

export function getDaySummary(projectId?: string): DaySummary[] {
  if (projectId) {
    return db.prepare(`
      SELECT ds.* FROM day_summary ds
      JOIN targets t ON ds.target_id = t.id
      WHERE t.project_id = ?
      ORDER BY ds.start_date ASC
    `).all(projectId) as DaySummary[];
  }
  return db.prepare('SELECT * FROM day_summary ORDER BY start_date ASC').all() as DaySummary[];
}

