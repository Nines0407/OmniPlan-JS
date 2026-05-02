import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { ToastContainer } from './components/Toast';
import { OfflineBar } from './components/OfflineBar';
import { ProjectList } from './pages/ProjectList';
import { ProjectDetail } from './pages/ProjectDetail';
import { TaskView } from './pages/TaskView';
import { Timeline } from './pages/Timeline';
import { Settings } from './pages/Settings';
import { useAuthStore } from './stores/authStore';
import { useWsStore } from './stores/wsStore';

export function App() {
  const token = useAuthStore((s) => s.token);
  const { subscribe, unsubscribe } = useWsStore();

  useEffect(() => {
    if (token) {
      subscribe();
    } else {
      unsubscribe();
    }
  }, [token, subscribe, unsubscribe]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-surface text-white flex flex-col">
        <Navbar />
        <OfflineBar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<ProjectList />} />
            <Route path="/projects/:pid" element={<ProjectDetail />} />
            <Route path="/projects/:pid/timeline" element={<Timeline />} />
            <Route path="/projects/:pid/tasks" element={<TaskView />} />
            <Route path="/projects/:pid/settings" element={<Settings />} />
            <Route path="/projects/:pid/targets/:tid" element={<TaskView />} />
          </Routes>
        </main>
        <ToastContainer />
      </div>
    </ErrorBoundary>
  );
}
