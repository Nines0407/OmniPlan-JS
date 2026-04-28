import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import type { WsEvent } from '@omniplan/shared';

let wss: WebSocketServer | null = null;

const clients = new Set<WebSocket>();

export function initWebSocket(server: Server): WebSocketServer {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    clients.add(ws);
    console.warn(`[ws] client connected (total: ${clients.size})`);

    ws.on('close', () => {
      clients.delete(ws);
      console.warn(`[ws] client disconnected (total: ${clients.size})`);
    });

    ws.on('error', (err) => {
      console.error('[ws] error:', err.message);
      clients.delete(ws);
    });
  });

  console.warn('[ws] WebSocket server initialized');
  return wss;
}

export function broadcast(event: WsEvent): void {
  if (!wss) return;
  const data = JSON.stringify(event);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}
