import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTimeline } from '../api/stats';
import type { TimelineData, Task } from '@omniplan/shared';

interface TimelineItem {
  id: string;
  name: string;
  target_name: string;
  week_start: string;
  duration_weeks: number;
  status: string;
  progress: number;
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

  const weeks = new Set<string>();
  for (const t of data.tasks) {
    if (t.week_start) weeks.add(t.week_start);
  }
  const sortedWeeks = [...weeks].sort();

  const getWeekIndex = (weekStart: string) => sortedWeeks.indexOf(weekStart);

  const groupedByTarget: Record<string, TimelineItem[]> = {};
  for (const t of data.tasks) {
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
        <div className="min-w-[800px]">
          {/* Header */}
          <div className="flex border-b border-gray-800 pb-2 mb-2">
            <div className="w-48 flex-shrink-0 text-sm text-gray-500 font-medium">Task</div>
            <div className="flex-1 flex">
              {sortedWeeks.map((w) => (
                <div key={w} className="flex-1 text-center text-xs text-gray-500">
                  {new Date(w).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              ))}
            </div>
          </div>

          {Object.entries(groupedByTarget).map(([targetName, tasks]) => (
            <div key={targetName} className="mb-6">
              <div className="text-sm text-cyber-blue font-medium mb-2">{targetName}</div>
              {tasks.map((t) => (
                <div key={t.id} className="flex items-center mb-1.5 group">
                  <div className="w-48 flex-shrink-0 text-sm text-gray-400 truncate pr-2" title={t.name}>
                    {t.name}
                  </div>
                  <div className="flex-1 flex relative h-7">
                    {sortedWeeks.map((w, i) => (
                      <div key={w} className="flex-1 border-l border-gray-800/50" />
                    ))}
                    {t.week_start && (
                      <div
                        className="absolute top-1 h-5 rounded bg-cyber-blue/30 border border-cyber-blue/50"
                        style={{
                          left: `${(getWeekIndex(t.week_start) / sortedWeeks.length) * 100}%`,
                          width: `${(t.duration_weeks / sortedWeeks.length) * 100}%`,
                        }}
                      >
                        <div
                          className="h-full rounded bg-cyber-blue/50"
                          style={{ width: `${t.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
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
