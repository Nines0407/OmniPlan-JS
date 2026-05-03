import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProjectStore } from '../stores/projectStore';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';
import { getTimeline } from '../api/stats';
import type { TimelineData } from '@omniplan/shared';

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function dateDiff(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export function ProjectList() {
  const { projects, loading, loadProjects, addProject, removeProject } = useProjectStore();
  const { isAuthenticated } = useAuthStore();
  const { addToast } = useUiStore();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [timeline, setTimeline] = useState<TimelineData | null>(null);
  const [showGantt, setShowGantt] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (showGantt && !timeline) {
      getTimeline().then((res) => { if (res?.data) setTimeline(res.data); }).catch(() => {});
    }
  }, [showGantt]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      await addProject({ name: name.trim() });
      addToast('Project created', 'success');
      setName('');
      setShowCreate(false);
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete project "${name}"?`)) return;
    try {
      await removeProject(id);
      addToast('Project deleted', 'success');
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-cyber-blue">Loading...</div>
      </div>
    );
  }

  const timelineTasks = timeline?.tasks?.filter((t) => t.start_date && t.duration_days > 0) || [];
  let ganttContent = null;

  if (timelineTasks.length > 0) {
    let minDate = new Date(timelineTasks[0]!.start_date);
    let maxDate = new Date(timelineTasks[0]!.start_date);
    for (const t of timelineTasks) {
      const d = new Date(t.start_date);
      if (d < minDate) minDate = d;
      const end = addDays(d, t.duration_days - 1);
      if (end > maxDate) maxDate = end;
    }
    for (const m of timeline?.milestones || []) {
      if (!m.due_date) continue;
      const d = new Date(m.due_date);
      if (d < minDate) minDate = d;
      if (d > maxDate) maxDate = d;
    }

    const totalDays = dateDiff(minDate, maxDate) + 1;
    const allDates: Date[] = [];
    for (let i = 0; i < totalDays; i++) allDates.push(addDays(minDate, i));

    const groupedByProject: Record<string, typeof timelineTasks> = {};
    for (const t of timelineTasks) {
      const key = t.project_name || t.project_id;
      if (!groupedByProject[key]) groupedByProject[key] = [];
      groupedByProject[key]!.push(t);
    }

    ganttContent = (
      <div className="mt-8 p-4 bg-surface-card rounded-lg border border-gray-800">
        <h2 className="text-lg font-semibold text-white mb-4">Master Timeline</h2>
        <div className="overflow-x-auto">
          <div style={{ minWidth: `${allDates.length * 24 + 200}px` }}>
            {/* Month labels */}
            <div className="flex border-b border-gray-800 pb-1 mb-1">
              <div className="w-40 flex-shrink-0" />
              <div className="flex-1 flex">
                {allDates.map((d, i) => {
                  const prev = i > 0 ? allDates[i - 1] : null;
                  const showMonth = !prev || d.getMonth() !== prev.getMonth();
                  return (
                    <div key={i} className="text-center text-xs text-gray-600" style={{ flex: 1 }}>
                      {showMonth ? d.toLocaleDateString('en-US', { month: 'short' }) : ''}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Day headers */}
            <div className="flex border-b border-gray-800 pb-1 mb-2">
              <div className="w-40 flex-shrink-0 text-xs text-gray-500">Project</div>
              <div className="flex-1 flex">
                {allDates.map((d, i) => (
                  <div key={i} className="text-center text-xs text-gray-700" style={{ flex: 1 }}>
                    {d.getDate()}
                  </div>
                ))}
              </div>
            </div>

            {Object.entries(groupedByProject).map(([projName, ptasks]) => {
              const projColor = ptasks[0]?.project_color || '#3b82f6';
              const projMilestones = (timeline?.milestones || []).filter(
                (m) => m.project_id === ptasks[0]?.project_id && m.due_date
              );
              return (
                <div key={projName} className="mb-3">
                  <div className="flex items-center mb-1">
                    <div className="w-40 flex-shrink-0 flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: projColor }} />
                      <Link to={`/projects/${ptasks[0]?.project_id}`} className="text-xs text-gray-300 hover:text-cyber-blue truncate">
                        {projName}
                      </Link>
                    </div>
                    <div className="flex-1 flex relative h-6">
                      {allDates.map((_, i) => (
                        <div key={i} className="flex-1 border-l border-gray-800/20" />
                      ))}
                      {ptasks.map((t) => {
                        const taskStart = new Date(t.start_date);
                        const startOffset = dateDiff(minDate, taskStart);
                        const width = Math.max(t.duration_days, 1);
                        return (
                          <div
                            key={t.id}
                            className="absolute top-1 h-4 rounded opacity-70"
                            title={`${t.name} (${t.target_name})`}
                            style={{
                              left: `${(startOffset / totalDays) * 100}%`,
                              width: `${(width / totalDays) * 100}%`,
                              backgroundColor: projColor,
                            }}
                          />
                        );
                      })}
                      {projMilestones.map((m) => {
                        const mDate = new Date(m.due_date);
                        const offset = dateDiff(minDate, mDate);
                        if (offset < 0 || offset >= totalDays) return null;
                        return (
                          <div
                            key={m.id}
                            className="absolute top-0 -translate-x-1/2"
                            style={{ left: `${(offset / totalDays) * 100}%` }}
                            title={`${m.name} (${m.status})`}
                          >
                            <span className={`text-xs ${m.status === 'completed' ? 'text-neon-green' : m.status === 'cancelled' ? 'text-gray-600' : 'text-yellow-400'}`}>
                              &#x25C6;
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-cyber-blue">Projects</h1>
        {isAuthenticated && (
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-cyber-blue text-surface rounded-lg hover:opacity-80 transition"
          >
            New Project
          </button>
        )}
      </div>

      {showCreate && (
        <div className="mb-6 p-4 bg-surface-card rounded-lg border border-cyber-blue/30">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Project name"
            className="w-full px-3 py-2 bg-surface border border-gray-700 rounded text-white mb-3 focus:border-cyber-blue outline-none"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <div className="flex gap-2">
            <button onClick={handleCreate} className="px-4 py-1.5 bg-cyber-blue text-surface rounded text-sm">
              Create
            </button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-1.5 bg-gray-700 text-white rounded text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="text-center text-gray-500 py-16">
          <p className="text-lg">No projects yet</p>
          {isAuthenticated && <p className="text-sm mt-2">Create your first project to get started</p>}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <Link
                key={p.id}
                to={`/projects/${p.id}`}
                className="p-5 bg-surface-card rounded-lg border border-gray-800 hover:border-cyber-blue/50 transition group relative"
              >
                {isAuthenticated && (
                  <button
                    onClick={(e) => handleDelete(e, p.id, p.name)}
                    className="absolute top-3 right-3 text-gray-600 hover:text-danger-red text-xs opacity-0 group-hover:opacity-100 transition"
                    title="Delete"
                  >
                    &#x2715;
                  </button>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color || '#3b82f6' }} />
                  <h3 className="text-lg font-semibold text-white group-hover:text-cyber-blue transition">
                    {p.name}
                  </h3>
                </div>
                {p.description && (
                  <p className="text-sm text-gray-400 line-clamp-2">{p.description}</p>
                )}
              </Link>
            ))}
          </div>

          <div className="mt-6">
            {!showGantt ? (
              <button
                onClick={() => setShowGantt(true)}
                className="px-4 py-2 bg-surface-card border border-gray-700 text-gray-400 rounded text-sm hover:border-cyber-blue/50"
              >
                Show Master Timeline
              </button>
            ) : (
              ganttContent
            )}
          </div>
        </>
      )}
    </div>
  );
}
