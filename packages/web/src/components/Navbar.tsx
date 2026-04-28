import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useState } from 'react';

export function Navbar() {
  const { isAuthenticated, user, login, register, logout } = useAuthStore();
  const [showAuth, setShowAuth] = useState(false);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isRegister, setIsRegister] = useState(false);

  const handleAuth = async () => {
    if (!username.trim()) return;
    try {
      if (isRegister) {
        await register(username.trim(), displayName.trim() || username.trim());
      } else {
        await login(username.trim());
      }
      setShowAuth(false);
      setUsername('');
      setDisplayName('');
    } catch {
      // error handled in store
    }
  };

  return (
    <nav className="border-b border-gray-800 bg-surface/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="text-lg font-bold text-cyber-blue hover:opacity-80 transition">
          OmniPlan
        </Link>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400">{user?.display_name}</span>
              <button onClick={logout} className="text-sm text-gray-500 hover:text-danger-red transition">
                Logout
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => { setShowAuth(true); setIsRegister(false); }}
                className="text-sm text-gray-400 hover:text-cyber-blue transition"
              >
                Login
              </button>
              <button
                onClick={() => { setShowAuth(true); setIsRegister(true); }}
                className="px-3 py-1 text-sm bg-cyber-blue text-surface rounded hover:opacity-80 transition"
              >
                Register
              </button>
            </>
          )}
        </div>
      </div>

      {showAuth && (
        <div className="border-t border-gray-800 p-4 bg-surface-card">
          <div className="max-w-sm mx-auto flex flex-col gap-3">
            <h3 className="text-white font-medium">{isRegister ? 'Register' : 'Login'}</h3>
            <input
              type="text" value={username} onChange={(e) => setUsername(e.target.value)}
              placeholder="Username" className="px-3 py-2 bg-surface border border-gray-700 rounded text-white text-sm focus:border-cyber-blue outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
            />
            {isRegister && (
              <input
                type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Display name (optional)" className="px-3 py-2 bg-surface border border-gray-700 rounded text-white text-sm focus:border-cyber-blue outline-none"
                onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
              />
            )}
            <div className="flex gap-2">
              <button onClick={handleAuth} className="px-4 py-1.5 bg-cyber-blue text-surface rounded text-sm">
                {isRegister ? 'Register' : 'Login'}
              </button>
              <button onClick={() => setShowAuth(false)} className="px-4 py-1.5 bg-gray-700 text-white rounded text-sm">
                Cancel
              </button>
              <button
                onClick={() => setIsRegister(!isRegister)}
                className="px-4 py-1.5 text-gray-400 text-sm hover:text-cyber-blue"
              >
                {isRegister ? 'Have account? Login' : 'Need account? Register'}
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
