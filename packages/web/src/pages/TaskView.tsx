import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTaskStore } from '../stores/taskStore';
import { useTargetStore } from '../stores/targetStore';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';
import type { Task, TaskStatus } from '@omniplan/shared';

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
  const [showCreate, setShowCreate] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [newStartDate, setNewStartDate] = useState('');
  const [newDurationDays, setNewDurationDays] = useState(1);
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);

  const target = targets.find((t) => t.id === tid);

  useEffect(() => {
    if (pid) loadTargets(pid);
    if (tid) loadTasks(tid);
  }, [pid, tid]);

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

  const handleDelete = async (taskId: string) => {
    try {
      await removeTask(taskId);
      addToast('Task deleted', 'success');
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

      {isAuthenticated && (
        <div className="mb-4">
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
                                onClick={() => setEditingCell({ id: t.id, field: 'priority' })}
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
                                value={t.start_date || ''}
                                onChange={(e) => handleCellEdit(t.id, 'start_date', e.target.value || null)}
                                onBlur={() => setEditingCell(null)}
                                autoFocus
                                className="bg-surface border border-cyber-blue rounded px-1.5 py-0.5 text-xs text-white w-28"
                              />
                            ) : (
                              <span
                                className="text-xs text-gray-400 cursor-pointer hover:underline"
                                onClick={() => setEditingCell({ id: t.id, field: 'start_date' })}
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
                                  value={t.duration_days}
                                  onChange={(e) => handleCellEdit(t.id, 'duration_days', Number(e.target.value) || 1)}
                                  onBlur={() => setEditingCell(null)}
                                  autoFocus
                                  className="bg-surface border border-cyber-blue rounded px-1.5 py-0.5 text-xs text-white w-12 text-center"
                                />
                                <span className="text-xs text-gray-500">d</span>
                              </div>
                            ) : (
                              <span
                                className="text-xs text-gray-400 cursor-pointer hover:underline"
                                onClick={() => setEditingCell({ id: t.id, field: 'duration_days' })}
                              >
                                {t.duration_days}d
                              </span>
                            )
                          ) : (
                            <span className="text-xs text-gray-400">{t.duration_days}d</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          {isAuthenticated ? (
                            editingCell?.id === t.id && editingCell?.field === 'progress' ? (
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={t.progress}
                                onChange={(e) => handleCellEdit(t.id, 'progress', Number(e.target.value))}
                                onBlur={() => setEditingCell(null)}
                                autoFocus
                                className="bg-surface border border-cyber-blue rounded px-1.5 py-0.5 text-xs text-white w-14 text-center"
                              />
                            ) : (
                              <div
                                className="flex items-center gap-2 cursor-pointer"
                                onClick={() => setEditingCell({ id: t.id, field: 'progress' })}
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
