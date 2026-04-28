import { db } from './connection';
import '../db/migrate.js';

function generateId(prefix: string): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = prefix + '_';
  for (let i = 0; i < 8; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function weekStart(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay() + 1 + offset * 7); // Monday
  return d.toISOString().split('T')[0]!;
}

export function seed(): void {
  const existing = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (existing.count > 0) {
    console.warn('[seed] database already has data, skipping');
    return;
  }

  console.warn('[seed] populating sample data...');

  db.transaction(() => {
    // Users
    const u1 = generateId('usr');
    const u2 = generateId('usr');
    db.prepare('INSERT INTO users (id, username, display_name) VALUES (?, ?, ?)').run(u1, 'alice', 'Alice');
    db.prepare('INSERT INTO users (id, username, display_name) VALUES (?, ?, ?)').run(u2, 'bob', 'Bob');

    // Project
    const proj = generateId('prj');
    db.prepare('INSERT INTO projects (id, owner_id, name, description, color) VALUES (?, ?, ?, ?, ?)').run(
      proj, u1, '客户提案项目', '为客户XYZ准备年度合作提案', '#3b82f6',
    );

    // Targets
    const tgt1 = generateId('tgt');
    const tgt2 = generateId('tgt');
    db.prepare('INSERT INTO targets (id, project_id, name, description, sort_order) VALUES (?, ?, ?, ?, ?)').run(
      tgt1, proj, '研究与分析', '市场调研、竞品分析、客户需求梳理', 0,
    );
    db.prepare('INSERT INTO targets (id, project_id, name, description, sort_order) VALUES (?, ?, ?, ?, ?)').run(
      tgt2, proj, '提案制作', '撰写提案文档、设计演示材料', 1,
    );

    const tasks = [
      { n: '行业趋势调研',      s: 'done',       p: 'high',   w: weekStart(-2), d: 2, a: u1, progress: 100 },
      { n: '竞品分析报告',      s: 'done',       p: 'high',   w: weekStart(-2), d: 2, a: u1, progress: 100 },
      { n: '客户需求文档整理',  s: 'done',       p: 'medium', w: weekStart(-1), d: 1, a: u2, progress: 100 },
      { n: 'SWOT 分析',         s: 'done',       p: 'high',   w: weekStart(-1), d: 1, a: u1, progress: 100 },
      { n: '数据收集补充',      s: 'in_progress',p: 'medium', w: weekStart(-1), d: 1, a: u2, progress: 60 },
      { n: '提案大纲撰写',      s: 'done',       p: 'high',   w: weekStart(-1), d: 1, a: null, progress: 100 },
      { n: '提案初稿撰写',      s: 'in_progress',p: 'urgent', w: weekStart(0),  d: 2, a: u2, progress: 45 },
      { n: '演示材料设计',      s: 'in_progress',p: 'high',   w: weekStart(0),  d: 1, a: u1, progress: 30 },
      { n: '内部评审',          s: 'todo',       p: 'high',   w: weekStart(1),  d: 1, a: null, progress: 0 },
      { n: '报价方案测算',      s: 'todo',       p: 'urgent', w: weekStart(1),  d: 1, a: u1, progress: 0 },
      { n: '终稿修订',          s: 'todo',       p: 'high',   w: weekStart(2),  d: 1, a: u2, progress: 0 },
      { n: '客户演示彩排',      s: 'todo',       p: 'medium', w: weekStart(2),  d: 1, a: null, progress: 0 },
    ];

    const taskIds: Record<string, string> = {};
    const insertTask = db.prepare(`
      INSERT INTO tasks (id, target_id, name, description, status, priority, week_start, duration_weeks, assignee_id, progress, tags, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    const tgt1Tasks = tasks.slice(0, 5);
    const tgt2Tasks = tasks.slice(5);

    for (const t of tgt1Tasks) {
      const id = generateId('tsk');
      taskIds[t.n] = id;
      insertTask.run(id, tgt1, t.n, null, t.s, t.p, t.w, t.d, t.a, t.progress, '[]');
    }
    for (const t of tgt2Tasks) {
      const id = generateId('tsk');
      taskIds[t.n] = id;
      insertTask.run(id, tgt2, t.n, null, t.s, t.p, t.w, t.d, t.a, t.progress, '[]');
    }

    // Dependencies: proposal draft depends on outline
    if (taskIds['提案初稿撰写'] && taskIds['提案大纲撰写']) {
      db.prepare('INSERT INTO task_dependencies (id, task_id, dependency_id, dependency_type) VALUES (?, ?, ?, ?)').run(
        generateId('dep'), taskIds['提案初稿撰写'], taskIds['提案大纲撰写'], 'finish_to_start',
      );
    }

    // Milestones
    db.prepare('INSERT INTO milestones (id, project_id, name, description, due_date, status) VALUES (?, ?, ?, ?, ?, ?)').run(
      generateId('mil'), proj, '提案初稿完成', '完成提案初稿并提交内部评审', weekStart(1), 'pending',
    );
    db.prepare('INSERT INTO milestones (id, project_id, name, description, due_date, status) VALUES (?, ?, ?, ?, ?, ?)').run(
      generateId('mil'), proj, '客户提案交付', '向客户正式提交提案', weekStart(3), 'pending',
    );
  })();

  console.warn('[seed] sample data populated');
}

// Run if executed directly
const isMain = process.argv[1]?.includes('seed');
if (isMain) {
  seed();
}
