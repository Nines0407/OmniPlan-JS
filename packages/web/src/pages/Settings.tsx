import { useParams, Link } from 'react-router-dom';
import { useProjectStore } from '../stores/projectStore';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';

export function Settings() {
  const { pid } = useParams<{ pid: string }>();
  const { currentProject, editProject, removeProject } = useProjectStore();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { theme, toggleTheme, addToast } = useUiStore();

  const handleArchive = async () => {
    if (!pid || !confirm('Archive this project?')) return;
    try {
      await removeProject(pid);
      addToast('Project archived', 'success');
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
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link to={`/projects/${pid}`} className="text-gray-400 hover:text-cyber-blue">&larr; Back</Link>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
      </div>

      <div className="space-y-6">
        {/* Theme */}
        <div className="p-5 bg-surface-card rounded-lg border border-gray-800">
          <h3 className="text-lg font-medium text-white mb-3">Appearance</h3>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Theme</span>
            <button
              onClick={toggleTheme}
              className="px-4 py-1.5 bg-surface border border-gray-700 text-white rounded text-sm"
            >
              {theme === 'dark' ? 'Dark' : 'Light'} Mode
            </button>
          </div>
        </div>

        {/* Account */}
        <div className="p-5 bg-surface-card rounded-lg border border-gray-800">
          <h3 className="text-lg font-medium text-white mb-3">Account</h3>
          {user ? (
            <div className="space-y-2 text-sm text-gray-400">
              <p>Logged in as <span className="text-white">{user.display_name}</span></p>
              <p>Username: {user.username}</p>
              <button onClick={logout} className="mt-3 px-4 py-1.5 bg-danger-red text-white rounded text-sm">
                Logout
              </button>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Not logged in</p>
          )}
        </div>

        {/* Danger zone */}
        {isAuthenticated && (
          <div className="p-5 bg-surface-card rounded-lg border border-danger-red/30">
            <h3 className="text-lg font-medium text-danger-red mb-3">Danger Zone</h3>
            <p className="text-sm text-gray-400 mb-3">Archive this project. It can be restored later.</p>
            <button onClick={handleArchive} className="px-4 py-1.5 bg-danger-red/20 text-danger-red border border-danger-red/30 rounded text-sm">
              Archive Project
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
