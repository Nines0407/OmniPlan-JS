import { useUiStore } from '../stores/uiStore';

export function ToastContainer() {
  const { toasts, removeToast } = useUiStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-2.5 rounded-lg text-sm shadow-lg cursor-pointer flex items-center gap-2 min-w-[200px] ${
            t.type === 'success'
              ? 'bg-neon-green/20 text-neon-green border border-neon-green/30'
              : t.type === 'error'
              ? 'bg-danger-red/20 text-danger-red border border-danger-red/30'
              : 'bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/30'
          }`}
          onClick={() => removeToast(t.id)}
        >
          <span className="flex-1">{t.message}</span>
          <span className="text-xs opacity-60">×</span>
        </div>
      ))}
    </div>
  );
}
