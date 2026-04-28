import { create } from 'zustand';
import type { WsEvent } from '@omniplan/shared';

interface WsState {
  connected: boolean;
  reconnectAttempts: number;
  subscribe: () => void;
  unsubscribe: () => void;
}

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

export const useWsStore = create<WsState>((set, get) => ({
  connected: false,
  reconnectAttempts: 0,

  subscribe: () => {
    if (ws) return;

    const token = localStorage.getItem('omniplan_token');
    if (!token) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?token=${token}`;

    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        set({ connected: true, reconnectAttempts: 0 });
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WsEvent;
          handleWsEvent(data);
        } catch {
          // ignore parse errors
        }
      };

      ws.onclose = () => {
        set({ connected: false });
        ws = null;
        // Reconnect with backoff
        const attempts = get().reconnectAttempts;
        const delay = Math.min(1000 * Math.pow(2, attempts), 30000);
        set({ reconnectAttempts: attempts + 1 });
        reconnectTimer = setTimeout(() => {
          get().subscribe();
        }, delay);
      };

      ws.onerror = () => {
        ws?.close();
      };
    } catch {
      // WebSocket not supported
    }
  },

  unsubscribe: () => {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (ws) {
      ws.close();
      ws = null;
    }
    set({ connected: false, reconnectAttempts: 0 });
  },
}));

// Import stores dynamically to avoid circular dependencies
function handleWsEvent(event: WsEvent) {
  // Lazy imports to avoid circular deps - stores update themselves
  import('./taskStore.js').then(({ useTaskStore }) => {
    const store = useTaskStore.getState();
    switch (event.type) {
      case 'task.updated':
        store.editTask(event.entity.id, event.entity as unknown as Record<string, unknown>);
        break;
      case 'task.created':
        store.loadTasks(event.entity.target_id);
        break;
      case 'task.deleted':
        store.removeTask(event.id);
        break;
    }
  });
  import('./targetStore.js').then(({ useTargetStore }) => {
    if (event.type === 'target.updated') {
      useTargetStore.getState().editTarget(event.entity.id, {});
    }
  });
  import('./projectStore.js').then(({ useProjectStore }) => {
    if (event.type === 'project.updated') {
      useProjectStore.getState().loadProjects();
    }
  });
}
