import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProjectStore } from '../stores/projectStore';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';

export function ProjectList() {
  const { projects, loading, loadProjects, addProject } = useProjectStore();
  const { isAuthenticated } = useAuthStore();
  const { addToast } = useUiStore();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-cyber-blue">Loading...</div>
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Link
              key={p.id}
              to={`/projects/${p.id}`}
              className="p-5 bg-surface-card rounded-lg border border-gray-800 hover:border-cyber-blue/50 transition group"
            >
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
      )}
    </div>
  );
}
