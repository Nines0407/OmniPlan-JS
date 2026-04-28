import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProjectStore } from '../stores/projectStore';
import { useTargetStore } from '../stores/targetStore';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';

export function ProjectDetail() {
  const { pid } = useParams<{ pid: string }>();
  const { currentProject, loadProject } = useProjectStore();
  const { targets, loading, loadTargets, addTarget } = useTargetStore();
  const { isAuthenticated } = useAuthStore();
  const { addToast } = useUiStore();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    if (pid) {
      loadProject(pid);
      loadTargets(pid);
    }
  }, [pid]);

  const handleCreate = async () => {
    if (!name.trim() || !pid) return;
    try {
      await addTarget(pid, { name: name.trim() });
      addToast('Target created', 'success');
      setName('');
      setShowCreate(false);
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  };

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-cyber-blue">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-2">
        <Link to="/" className="text-gray-400 hover:text-cyber-blue transition">&larr; Back</Link>
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: currentProject.color || '#3b82f6' }} />
        <h1 className="text-2xl font-bold text-white">{currentProject.name}</h1>
      </div>

      <div className="flex gap-4 mb-8 text-sm">
        <Link to={`/projects/${pid}/timeline`} className="text-cyber-blue hover:underline">Timeline</Link>
        <Link to={`/projects/${pid}/tasks`} className="text-cyber-blue hover:underline">Tasks</Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-300">Goals</h2>
        {isAuthenticated && (
          <button
            onClick={() => setShowCreate(true)}
            className="px-3 py-1.5 bg-surface-card border border-gray-700 text-white rounded text-sm hover:border-cyber-blue transition"
          >
            + Add Goal
          </button>
        )}
      </div>

      {showCreate && (
        <div className="mb-6 p-4 bg-surface-card rounded-lg border border-cyber-blue/30">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Goal name"
            className="w-full px-3 py-2 bg-surface border border-gray-700 rounded text-white mb-3 focus:border-cyber-blue outline-none"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <div className="flex gap-2">
            <button onClick={handleCreate} className="px-4 py-1.5 bg-cyber-blue text-surface rounded text-sm">Create</button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-1.5 bg-gray-700 text-white rounded text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {targets.map((t) => (
          <Link
            key={t.id}
            to={`/projects/${pid}/targets/${t.id}`}
            className="p-5 bg-surface-card rounded-lg border border-gray-800 hover:border-cyber-blue/50 transition group"
          >
            <h3 className="text-lg font-semibold text-white mb-3 group-hover:text-cyber-blue">
              {t.name}
            </h3>
            <div className="mb-3">
              <div className="h-2 bg-surface rounded-full overflow-hidden">
                <div
                  className="h-full bg-neon-green transition-all duration-300"
                  style={{ width: `${t.completion_rate || 0}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between text-sm text-gray-400">
              <span>{t.done_tasks}/{t.total_tasks} done</span>
              <span>{t.completion_rate || 0}%</span>
            </div>
            {t.overdue_tasks > 0 && (
              <div className="mt-2 inline-block px-2 py-0.5 bg-danger-red/20 text-danger-red text-xs rounded">
                {t.overdue_tasks} overdue
              </div>
            )}
          </Link>
        ))}
      </div>

      {!loading && targets.length === 0 && (
        <div className="text-center text-gray-500 py-12">No goals yet</div>
      )}
    </div>
  );
}
