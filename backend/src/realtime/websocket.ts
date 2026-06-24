import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import url from 'url';
import { verifyToken } from '../middleware/auth';
import { logger } from '../middleware/logger';

// Store active connections grouped by workspaceId
// Key: workspaceId, Value: Set of active WebSocket connections
const workspaceConnections = new Map<string, Set<WebSocket>>();

export function initWebSocketServer(httpServer: HttpServer) {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (request, socket, head) => {
    const parsedUrl = url.parse(request.url || '', true);
    const pathname = parsedUrl.pathname;

    // Route for realtime connections
    if (pathname === '/realtime/events') {
      const token = parsedUrl.query.token as string;
      if (!token) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      try {
        const payload = verifyToken(token);
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request, payload);
        });
      } catch (err: any) {
        logger.warn('WebSocket connection authentication failed', { error: err.message });
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
      }
    } else {
      socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
      socket.destroy();
    }
  });

  wss.on('connection', (ws: WebSocket, request: any, payload: any) => {
    const { workspaceId, userId } = payload;
    logger.info(`🔌 WebSocket connection established for workspace ${workspaceId}, user ${userId}`);

    // Register connection
    if (!workspaceConnections.has(workspaceId)) {
      workspaceConnections.set(workspaceId, new Set());
    }
    workspaceConnections.get(workspaceId)!.add(ws);

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

    // Message handler (for bidirectional communication)
    ws.on('message', (message) => {
      try {
        const parsed = JSON.parse(message.toString());
        logger.debug(`Received WebSocket message for workspace ${workspaceId}`, { payload: parsed });
        
        // Echo or process client messages here if needed in the future
      } catch (err: any) {
        logger.warn('Failed to parse incoming WebSocket message', { error: err.message });
      }
    });

    ws.on('close', () => {
      clearInterval(pingInterval);
      const conns = workspaceConnections.get(workspaceId);
      if (conns) {
        conns.delete(ws);
        if (conns.size === 0) {
          workspaceConnections.delete(workspaceId);
        }
      }
      logger.info(`🔌 WebSocket connection closed for workspace ${workspaceId}, user ${userId}`);
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
