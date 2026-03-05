type Listener = (data: any) => void;

const listeners = new Map<string, Set<Listener>>();

export function subscribe(workspaceId: string, cb: Listener) {
  if (!listeners.has(workspaceId)) {
    listeners.set(workspaceId, new Set());
  }
  listeners.get(workspaceId)!.add(cb);

  return () => {
    listeners.get(workspaceId)!.delete(cb);
  };
}

export function publish(workspaceId: string, payload: any) {
  const subs = listeners.get(workspaceId);
  if (!subs) return;

  for (const cb of subs) {
    cb(payload);
  }
}
