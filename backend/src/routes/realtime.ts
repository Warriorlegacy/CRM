import { Router } from 'express';
import { subscribe } from '../realtime/events';

export const realtimeRouter = Router();

realtimeRouter.get('/events', (req, res) => {
  const workspaceId = (req as any).workspaceId || (req.query.workspaceId as string);
  if (!workspaceId) {
    return res.status(400).json({ error: 'Workspace ID required' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const unsubscribe = subscribe(workspaceId, (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  });

  req.on('close', () => {
    unsubscribe();
  });
});
