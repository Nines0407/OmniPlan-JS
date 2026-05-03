import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTimeline } from '../api/stats';
import type { TimelineData } from '@omniplan/shared';

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function dateDiff(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export function Timeline() {
  const { pid } = useParams<{ pid: string }>();
  const [data, setData] = useState<TimelineData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pid) return;
    getTimeline(pid)
      .then((res) => {
        if (res?.data) setData(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [pid]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-cyber-blue">Loading...</div>
      </div>
    );
  }

  if (!data || data.tasks.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link to={`/projects/${pid}`} className="text-gray-400 hover:text-cyber-blue">&larr; Back</Link>
        <div className="text-center text-gray-500 py-16">No scheduled tasks to display</div>
      </div>
    );
  }

  const tasks = data.tasks.filter((t) => t.start_date && t.duration_days > 0);
  if (tasks.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link to={`/projects/${pid}`} className="text-gray-400 hover:text-cyber-blue">&larr; Back</Link>
        <div className="text-center text-gray-500 py-16">No scheduled tasks to display</div>
      </div>
    );
  }

  let minDate = new Date(tasks[0]!.start_date);
  let maxDate = new Date(tasks[0]!.start_date);
  for (const t of tasks) {
    const d = new Date(t.start_date);
    if (d < minDate) minDate = d;
    const end = addDays(d, t.duration_days - 1);
    if (end > maxDate) maxDate = end;
  }

  const totalDays = dateDiff(minDate, maxDate) + 1;
  const allDates: Date[] = [];
  for (let i = 0; i < totalDays; i++) {
    allDates.push(addDays(minDate, i));
  }

  const groupedByTarget: Record<string, typeof tasks> = {};
  for (const t of tasks) {
    if (!groupedByTarget[t.target_name]) groupedByTarget[t.target_name] = [];
    groupedByTarget[t.target_name]!.push(t);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link to={`/projects/${pid}`} className="text-gray-400 hover:text-cyber-blue">&larr; Back</Link>
        <h1 className="text-2xl font-bold text-white">Timeline</h1>
      </div>

      <div className="overflow-x-auto">
        <div style={{ minWidth: `${allDates.length * 32 + 192}px` }}>
          {/* Month labels */}
          <div className="flex border-b border-gray-800 pb-1 mb-1">
            <div className="w-48 flex-shrink-0" />
            <div className="flex-1 flex">
              {allDates.map((d, i) => {
                const prev = i > 0 ? allDates[i - 1] : null;
                const showMonth = !prev || d.getMonth() !== prev.getMonth();
                return (
                  <div key={i} className="text-center text-xs text-gray-500" style={{ flex: 1 }}>
                    {showMonth ? d.toLocaleDateString('en-US', { month: 'short', year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined }) : ''}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Day column headers */}
          <div className="flex border-b border-gray-800 pb-2 mb-2">
            <div className="w-48 flex-shrink-0 text-sm text-gray-500 font-medium">Task</div>
            <div className="flex-1 flex">
              {allDates.map((d, i) => (
                <div key={i} className="text-center text-xs text-gray-600" style={{ flex: 1 }}>
                  {d.getDate()}
                </div>
              ))}
            </div>
          </div>

          {Object.entries(groupedByTarget).map(([targetName, targetTasks]) => (
            <div key={targetName} className="mb-6">
              <div className="text-sm text-cyber-blue font-medium mb-2">{targetName}</div>
              {targetTasks.map((t) => {
                const taskStart = new Date(t.start_date);
                const startOffset = dateDiff(minDate, taskStart);
                const width = Math.max(t.duration_days, 1);

                return (
                  <div key={t.id} className="flex items-center mb-1.5 group">
                    <div className="w-48 flex-shrink-0 text-sm text-gray-400 truncate pr-2" title={t.name}>
                      {t.name}
                    </div>
                    <div className="flex-1 flex relative h-7">
                      {allDates.map((_, i) => (
                        <div key={i} className="flex-1 border-l border-gray-800/30" />
                      ))}
                      <div
                        className="absolute top-1 h-5 rounded bg-cyber-blue/30 border border-cyber-blue/50"
                        style={{
                          left: `${(startOffset / totalDays) * 100}%`,
                          width: `${(width / totalDays) * 100}%`,
                        }}
                      >
                        <div
                          className="h-full rounded bg-cyber-blue/50"
                          style={{ width: `${t.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Milestones */}
          {data.milestones.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm text-gray-500 font-medium mb-3">Milestones</h3>
              {data.milestones.map((m) => (
                <div key={m.id} className="flex items-center gap-3 mb-2">
                  <span className="text-yellow-400 text-lg">&diams;</span>
                  <span className="text-sm text-white">{m.name}</span>
                  <span className="text-xs text-gray-500">{m.due_date}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${m.status === 'completed' ? 'bg-neon-green/20 text-neon-green' : 'bg-gray-700 text-gray-400'}`}>
                    {m.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
