import { WebSocketServer, WebSocket } from 'ws';
import type { Server, IncomingMessage } from 'http';
import type { WsEvent } from '@omniplan/shared';
import { verifyApiKey } from '../services/auth-service';

let wss: WebSocketServer | null = null;

const clients = new Set<WebSocket>();

function parseToken(req: IncomingMessage): string | null {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  return url.searchParams.get('token');
}

export function initWebSocket(server: Server): WebSocketServer {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const token = parseToken(req);
    if (!token) {
      ws.close(4001, 'Authentication required');
      return;
    }
    const userId = verifyApiKey(token);
    if (!userId) {
      ws.close(4001, 'Invalid API key');
      return;
    }

    (ws as any).userId = userId;
    clients.add(ws);
    console.warn(`[ws] client connected (total: ${clients.size}, user: ${userId})`);

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
