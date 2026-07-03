import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import url from 'url';
import { verifyToken } from '../middleware/auth';
import { logger } from '../middleware/logger';

// Store active connections grouped by workspaceId
// Key: workspaceId, Value: Set of active WebSocket connections
const workspaceConnections = new Map<string, Set<WebSocket>>();

const AUTH_TIMEOUT_MS = 10_000;

export function initWebSocketServer(httpServer: HttpServer) {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (request, socket, head) => {
    const parsedUrl = url.parse(request.url || '', true);
    const pathname = parsedUrl.pathname;

    // Route for realtime connections
    if (pathname === '/realtime/events') {
      // Accept the upgrade without token in URL; auth happens via first message
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
      socket.destroy();
    }
  });

  wss.on('connection', (ws: WebSocket, request: any) => {
    let authenticated = false;
    let workspaceId = '';
    let userId = '';

    // Require auth message within timeout
    const authTimer = setTimeout(() => {
      if (!authenticated) {
        logger.warn('WebSocket auth timeout - closing connection');
        ws.close(4001, 'Authentication timeout');
      }
    }, AUTH_TIMEOUT_MS);

    const originalOnMessage = ws.on.bind(ws);

    ws.on('message', (message) => {
      if (!authenticated) {
        // First message must be auth
        try {
          const parsed = JSON.parse(message.toString());
          if (parsed.type !== 'auth' || !parsed.token) {
            logger.warn('WebSocket first message must be { type: "auth", token: "..." }');
            ws.close(4002, 'Expected auth message');
            clearTimeout(authTimer);
            return;
          }

          const payload = verifyToken(parsed.token);
          workspaceId = payload.workspaceId;
          userId = payload.userId;
          authenticated = true;
          clearTimeout(authTimer);

          logger.info(`🔌 WebSocket connection authenticated for workspace ${workspaceId}, user ${userId}`);

          // Register connection
          if (!workspaceConnections.has(workspaceId)) {
            workspaceConnections.set(workspaceId, new Set());
          }
          workspaceConnections.get(workspaceId)!.add(ws);

          // Send confirmation
          ws.send(JSON.stringify({ type: 'auth_ok', workspaceId, userId }));

          // Keepalive ping/pong
          let isAlive = true;
          ws.on('pong', () => {
            isAlive = true;
          });

          const pingInterval = setInterval(() => {
            if (!isAlive) {
              logger.info(`WebSocket connection lost (ping timeout) for workspace ${workspaceId}`);
              ws.terminate();
              return;
            }
            isAlive = false;
            ws.ping();
          }, 30000);

          // Store interval for cleanup
          (ws as any)._pingInterval = pingInterval;
        } catch (err: any) {
          logger.warn('WebSocket auth failed', { error: err.message });
          ws.close(4003, 'Authentication failed');
          clearTimeout(authTimer);
        }
        return;
      }

      // Post-auth message handling
      try {
        const parsed = JSON.parse(message.toString());
        logger.debug(`Received WebSocket message for workspace ${workspaceId}`, { payload: parsed });
      } catch (err: any) {
        logger.warn('Failed to parse incoming WebSocket message', { error: err.message });
      }
    });

    ws.on('close', () => {
      clearTimeout(authTimer);
      if (authenticated) {
        const pingInterval = (ws as any)._pingInterval;
        if (pingInterval) clearInterval(pingInterval);

        const conns = workspaceConnections.get(workspaceId);
        if (conns) {
          conns.delete(ws);
          if (conns.size === 0) {
            workspaceConnections.delete(workspaceId);
          }
        }
        logger.info(`🔌 WebSocket connection closed for workspace ${workspaceId}, user ${userId}`);
      }
    });

    ws.on('error', (err) => {
      logger.error('WebSocket connection error', { error: err.message, workspaceId, userId });
    });
  });

  return wss;
}

export function publishWs(workspaceId: string, event: { type: string; data: any }) {
  const conns = workspaceConnections.get(workspaceId);
  if (!conns || conns.size === 0) return;

  const payload = JSON.stringify(event);
  for (const client of conns) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}
