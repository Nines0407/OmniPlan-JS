import { useEffect, useState } from 'react';
import { useWsStore } from '../stores/wsStore';

export function OfflineBar() {
  const [online, setOnline] = useState(navigator.onLine);
  const { connected } = useWsStore();

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (online && connected) return null;

  return (
    <div className="bg-yellow-500/20 border-b border-yellow-500/30 text-yellow-400 text-center py-1.5 text-sm">
      {!online ? 'You are offline. Check your connection.' : 'Reconnecting to server...'}
    </div>
  );
}
