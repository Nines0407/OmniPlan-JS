import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTaskStore } from '../stores/taskStore';
import { useTargetStore } from '../stores/targetStore';
import { useMilestoneStore } from '../stores/milestoneStore';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';
import type { Task, TaskStatus, MilestoneStatus } from '@omniplan/shared';

const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: 'text-gray-400',
  in_progress: 'text-cyber-blue',
  review: 'text-yellow-400',
  done: 'text-neon-green line-through',
  cancelled: 'text-gray-600 line-through',
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'text-danger-red',
  high: 'text-orange-400',
  medium: 'text-yellow-400',
  low: 'text-gray-400',
};

export function TaskView() {
  const { pid, tid } = useParams<{ pid: string; tid: string }>();
  const { tasks, loading, loadTasks, addTask, editTask, removeTask } = useTaskStore();
  const { targets, loadTargets } = useTargetStore();
  const { isAuthenticated } = useAuthStore();
  const { addToast } = useUiStore();
  const { milestones, loadMilestones, addMilestone, editMilestone, removeMilestone } = useMilestoneStore();
  const [showCreate, setShowCreate] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [newStartDate, setNewStartDate] = useState('');
  const [newDurationDays, setNewDurationDays] = useState(1);
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [now, setNow] = useState(new Date());
  const [showMilestoneCreate, setShowMilestoneCreate] = useState(false);
  const [milestoneName, setMilestoneName] = useState('');
  const [milestoneDueDate, setMilestoneDueDate] = useState('');
  const [milestoneDesc, setMilestoneDesc] = useState('');

  const target = targets.find((t) => t.id === tid);

  useEffect(() => {
    if (pid) { loadTargets(pid); loadMilestones(pid); }
    if (tid) loadTasks(tid);
  }, [pid, tid]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getElapsedPercent = (t: Task) => {
    if (!t.start_date || !t.duration_days) return 0;
    const start = new Date(t.start_date);
    const end = new Date(start);
    end.setDate(end.getDate() + t.duration_days);
    const elapsed = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    if (elapsed <= 0) return 0;
    if (elapsed >= t.duration_days) return 100;
    return Math.round((elapsed / t.duration_days) * 100);
  };

  const handleCreate = async () => {
    if (!taskName.trim() || !tid) return;
    try {
      await addTask(tid, {
        name: taskName.trim(),
        priority: newPriority,
        start_date: newStartDate || undefined,
        duration_days: newDurationDays,
      });
      addToast('Task created', 'success');
      setTaskName('');
      setNewPriority('medium');
      setNewStartDate('');
      setNewDurationDays(1);
      setShowCreate(false);
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  };

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    const progress = status === 'done' ? 100 : 0;
    try {
      await editTask(taskId, { status, progress });
      setEditingCell(null);
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  };

  const handleCellEdit = async (taskId: string, field: string, value: unknown) => {
    try {
      await editTask(taskId, { [field]: value });
      setEditingCell(null);
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  };

  const commitEditingValue = async (task: Task, field: string, raw: string) => {
    if (field === 'progress' || field === 'duration_days') {
      const val = raw === '' ? 0 : Number(raw);
      if (isNaN(val)) { setEditingCell(null); return; }
      await handleCellEdit(task.id, field, val);
    } else {
      await handleCellEdit(task.id, field, raw || null);
    }
  };

  const enterEdit = (task: Task, field: string) => {
    const val = field === 'duration_days' ? String(task.duration_days)
      : field === 'progress' ? String(task.progress)
      : field === 'start_date' ? (task.start_date || '')
      : '';
    setEditingValue(val);
    setEditingCell({ id: task.id, field });
  };

  const handleDelete = async (taskId: string) => {
    try {
      await removeTask(taskId);
      addToast('Task deleted', 'success');
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  };

  const handleMilestoneCreate = async () => {
    if (!milestoneName.trim() || !milestoneDueDate || !pid) return;
    try {
      await addMilestone(pid, { name: milestoneName.trim(), due_date: milestoneDueDate, description: milestoneDesc.trim() || undefined });
      addToast('Milestone created', 'success');
      setMilestoneName('');
      setMilestoneDueDate('');
      setMilestoneDesc('');
      setShowMilestoneCreate(false);
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  };

  const handleMilestoneDelete = async (id: string) => {
    if (!confirm('Delete this milestone?')) return;
    try {
      await removeMilestone(id);
      addToast('Milestone deleted', 'success');
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  };

  const groupByDate = (taskList: Task[]) => {
    const groups: Record<string, Task[]> = {};
    for (const t of taskList) {
      const wk = t.start_date || 'Unscheduled';
      if (!groups[wk]) groups[wk] = [];
      groups[wk]!.push(t);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link to={`/projects/${pid}`} className="text-gray-400 hover:text-cyber-blue">&larr; Back</Link>
        <h1 className="text-2xl font-bold text-white">{target?.name || 'Tasks'}</h1>
      </div>

      {milestones.length > 0 && (
        <div className="mb-6 p-4 bg-surface-card rounded-lg border border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-400">Milestones</h3>
          </div>
          <div className="space-y-2">
            {milestones.map((m) => (
              <div key={m.id} className="flex items-center gap-3 group">
                <span className="text-yellow-400 text-sm">&diams;</span>
                <span className="text-sm text-white flex-1">{m.name}</span>
                {m.description && <span className="text-xs text-gray-500 truncate max-w-[200px]">{m.description}</span>}
                <span className="text-xs text-gray-500">{m.due_date}</span>
                <select
                  value={m.status}
                  onChange={(e) => editMilestone(m.id, { status: e.target.value })}
                  className={`text-xs px-1.5 py-0.5 rounded border ${m.status === 'completed' ? 'bg-neon-green/20 text-neon-green border-neon-green/30' : m.status === 'cancelled' ? 'bg-gray-700 text-gray-400 border-gray-600' : 'bg-surface border-gray-700 text-white'}`}
                >
                  <option value="pending">pending</option>
                  <option value="completed">completed</option>
                  <option value="cancelled">cancelled</option>
                </select>
                {isAuthenticated && (
                  <button
                    onClick={() => handleMilestoneDelete(m.id)}
                    className="text-gray-600 hover:text-danger-red text-xs opacity-0 group-hover:opacity-100 transition"
                  >
                    &#x2715;
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {isAuthenticated && (
        <div className="mb-4">
          {!showMilestoneCreate ? (
            <button onClick={() => setShowMilestoneCreate(true)} className="px-3 py-1.5 bg-surface-card border border-gray-700 text-white rounded text-sm mr-2">
              + Add Milestone
            </button>
          ) : (
            <div className="mb-4 p-4 bg-surface-card rounded-lg border border-cyber-blue/30">
              <div className="flex flex-wrap gap-2 mb-2">
                <input
                  type="text" value={milestoneName} onChange={(e) => setMilestoneName(e.target.value)}
                  placeholder="Milestone name" className="px-3 py-1.5 bg-surface border border-gray-700 rounded text-white text-sm flex-1 min-w-[200px]"
                  onKeyDown={(e) => e.key === 'Enter' && handleMilestoneCreate()}
                />
                <input
                  type="date" value={milestoneDueDate} onChange={(e) => setMilestoneDueDate(e.target.value)}
                  className="px-2 py-1.5 bg-surface border border-gray-700 rounded text-white text-sm"
                />
                <input
                  type="text" value={milestoneDesc} onChange={(e) => setMilestoneDesc(e.target.value)}
                  placeholder="Description (optional)" className="px-3 py-1.5 bg-surface border border-gray-700 rounded text-white text-sm flex-1 min-w-[150px]"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={handleMilestoneCreate} className="px-4 py-1.5 bg-cyber-blue text-surface rounded text-sm">Create</button>
                <button onClick={() => setShowMilestoneCreate(false)} className="px-4 py-1.5 bg-gray-700 text-white rounded text-sm">Cancel</button>
              </div>
            </div>
          )}

          {!showCreate ? (
            <button onClick={() => setShowCreate(true)} className="px-3 py-1.5 bg-surface-card border border-gray-700 text-white rounded text-sm">
              + Add Task
            </button>
          ) : (
            <div className="flex flex-wrap gap-2">
              <input
                type="text" value={taskName} onChange={(e) => setTaskName(e.target.value)}
                placeholder="Task name" className="px-3 py-1.5 bg-surface border border-gray-700 rounded text-white text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                className="px-2 py-1.5 bg-surface border border-gray-700 rounded text-white text-xs"
              >
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
                <option value="urgent">urgent</option>
              </select>
              <input
                type="date"
                value={newStartDate}
                onChange={(e) => setNewStartDate(e.target.value)}
                className="px-2 py-1.5 bg-surface border border-gray-700 rounded text-white text-sm"
              />
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={newDurationDays}
                  onChange={(e) => setNewDurationDays(Number(e.target.value) || 1)}
                  className="w-14 px-2 py-1.5 bg-surface border border-gray-700 rounded text-white text-sm text-center"
                />
                <span>d</span>
              </div>
              <button onClick={handleCreate} className="px-3 py-1.5 bg-cyber-blue text-surface rounded text-sm">Add</button>
              <button onClick={() => setShowCreate(false)} className="px-3 py-1.5 bg-gray-700 text-white rounded text-sm">Cancel</button>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-500 py-12">Loading...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center text-gray-500 py-12">No tasks yet</div>
      ) : (
        <div className="space-y-6">
          {groupByDate(tasks).map(([week, weekTasks]) => (
            <div key={week}>
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                {week === 'Unscheduled' ? 'Unscheduled' : `${week}`}
                <span className="ml-2 text-gray-600">({weekTasks.length})</span>
              </h3>
              <div className="bg-surface-card rounded-lg overflow-hidden border border-gray-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-500 text-left">
                      <th className="px-4 py-2 font-medium">Task</th>
                      <th className="px-4 py-2 font-medium">Status</th>
                      <th className="px-4 py-2 font-medium">Priority</th>
                      <th className="px-4 py-2 font-medium">Start</th>
                      <th className="px-4 py-2 font-medium">Duration</th>
                      <th className="px-4 py-2 font-medium">Elapsed</th>
                      <th className="px-4 py-2 font-medium">Progress</th>
                      <th className="px-4 py-2 font-medium w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {weekTasks.map((t) => (
                      <tr key={t.id} className="border-b border-gray-800/50 hover:bg-white/5">
                        <td className={`px-4 py-2.5 ${STATUS_COLORS[t.status]}`}>
                          {t.name}
                        </td>
                        <td className="px-4 py-2.5">
                          {isAuthenticated ? (
                            <select
                              value={t.status}
                              onChange={(e) => handleStatusChange(t.id, e.target.value as TaskStatus)}
                              className="bg-surface border border-gray-700 rounded px-1.5 py-0.5 text-xs text-white"
                            >
                              <option value="todo">Todo</option>
                              <option value="in_progress">In Progress</option>
                              <option value="review">Review</option>
                              <option value="done">Done</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          ) : (
                            <span className={`text-xs ${STATUS_COLORS[t.status]}`}>{t.status.replace('_', ' ')}</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          {isAuthenticated ? (
                            editingCell?.id === t.id && editingCell?.field === 'priority' ? (
                              <select
                                value={t.priority}
                                onChange={(e) => handleCellEdit(t.id, 'priority', e.target.value)}
                                onBlur={() => setEditingCell(null)}
                                autoFocus
                                className="bg-surface border border-cyber-blue rounded px-1.5 py-0.5 text-xs text-white"
                              >
                                <option value="low">low</option>
                                <option value="medium">medium</option>
                                <option value="high">high</option>
                                <option value="urgent">urgent</option>
                              </select>
                            ) : (
                              <span
                                className={`text-xs ${PRIORITY_COLORS[t.priority]} cursor-pointer hover:underline`}
                                onClick={() => enterEdit(t, 'priority')}
                              >
                                {t.priority}
                              </span>
                            )
                          ) : (
                            <span className={`text-xs ${PRIORITY_COLORS[t.priority]}`}>{t.priority}</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          {isAuthenticated ? (
                            editingCell?.id === t.id && editingCell?.field === 'start_date' ? (
                              <input
                                type="date"
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                onBlur={() => commitEditingValue(t, 'start_date', editingValue)}
                                onKeyDown={(e) => e.key === 'Enter' && commitEditingValue(t, 'start_date', editingValue)}
                                autoFocus
                                className="bg-surface border border-cyber-blue rounded px-1.5 py-0.5 text-xs text-white w-28"
                              />
                            ) : (
                              <span
                                className="text-xs text-gray-400 cursor-pointer hover:underline"
                                onClick={() => enterEdit(t, 'start_date')}
                              >
                                {t.start_date || '—'}
                              </span>
                            )
                          ) : (
                            <span className="text-xs text-gray-400">{t.start_date || '—'}</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          {isAuthenticated ? (
                            editingCell?.id === t.id && editingCell?.field === 'duration_days' ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="1"
                                  max="365"
                                  value={editingValue}
                                  onChange={(e) => setEditingValue(e.target.value)}
                                  onBlur={() => commitEditingValue(t, 'duration_days', editingValue)}
                                  onKeyDown={(e) => e.key === 'Enter' && commitEditingValue(t, 'duration_days', editingValue)}
                                  autoFocus
                                  className="bg-surface border border-cyber-blue rounded px-1.5 py-0.5 text-xs text-white w-12 text-center"
                                />
                                <span className="text-xs text-gray-500">d</span>
                              </div>
                            ) : (
                              <span
                                className="text-xs text-gray-400 cursor-pointer hover:underline"
                                onClick={() => enterEdit(t, 'duration_days')}
                              >
                                {t.duration_days}d
                              </span>
                            )
                          ) : (
                            <span className="text-xs text-gray-400">{t.duration_days}d</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          {t.start_date && t.duration_days > 0 ? (
                            <div className="flex items-center gap-1">
                              <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden max-w-[60px]">
                                <div
                                  className={`h-full transition-all ${getElapsedPercent(t) >= 100 ? 'bg-danger-red' : 'bg-amber-400'}`}
                                  style={{ width: `${getElapsedPercent(t)}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500">{getElapsedPercent(t)}%</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-600">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          {isAuthenticated ? (
                            editingCell?.id === t.id && editingCell?.field === 'progress' ? (
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                onBlur={() => commitEditingValue(t, 'progress', editingValue)}
                                onKeyDown={(e) => e.key === 'Enter' && commitEditingValue(t, 'progress', editingValue)}
                                autoFocus
                                className="bg-surface border border-cyber-blue rounded px-1.5 py-0.5 text-xs text-white w-14 text-center"
                              />
                            ) : (
                              <div
                                className="flex items-center gap-2 cursor-pointer"
                                onClick={() => enterEdit(t, 'progress')}
                              >
                                <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden max-w-[80px]">
                                  <div
                                    className="h-full bg-neon-green transition-all"
                                    style={{ width: `${t.progress}%` }}
                                  />
                                </div>
                                <span className="text-xs text-gray-500">{t.progress}%</span>
                              </div>
                            )
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden max-w-[80px]">
                                <div
                                  className="h-full bg-neon-green transition-all"
                                  style={{ width: `${t.progress}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500">{t.progress}%</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          {isAuthenticated && (
                            <button
                              onClick={() => handleDelete(t.id)}
                              className="text-gray-600 hover:text-danger-red text-xs"
                            >
                              Del
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
