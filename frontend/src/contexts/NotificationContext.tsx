'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration: number;
  createdAt: number;
}

interface AddNotificationOptions {
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (options: AddNotificationOptions) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const MAX_NOTIFICATIONS = 5;
const DEFAULT_DURATION = 4000;

const TYPE_STYLES: Record<NotificationType, string> = {
  success: 'bg-emerald-900/90 border-emerald-700 text-emerald-100',
  error: 'bg-red-900/90 border-red-700 text-red-100',
  warning: 'bg-amber-900/90 border-amber-700 text-amber-100',
  info: 'bg-zinc-800/90 border-zinc-700 text-zinc-100',
};

const TYPE_ICONS: Record<NotificationType, string> = {
  success: '\u2713',
  error: '\u2717',
  warning: '\u26A0',
  info: '\u2139',
};

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const addNotification = useCallback(
    (options: AddNotificationOptions) => {
      const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const duration = options.duration ?? DEFAULT_DURATION;

      const notification: Notification = {
        id,
        type: options.type,
        title: options.title,
        message: options.message,
        duration,
        createdAt: Date.now(),
      };

      setNotifications((prev) => {
        const next = [notification, ...prev];
        return next.slice(0, MAX_NOTIFICATIONS);
      });

      if (duration > 0) {
        const timer = setTimeout(() => {
          removeNotification(id);
        }, duration);
        timersRef.current.set(id, timer);
      }
    },
    [removeNotification]
  );

  const clearAll = useCallback(() => {
    for (const timer of timersRef.current.values()) {
      clearTimeout(timer);
    }
    timersRef.current.clear();
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, clearAll }}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={`pointer-events-auto max-w-sm w-full border rounded-xl px-4 py-3 shadow-2xl backdrop-blur-sm transition-all animate-[slideIn_0.2s_ease-out] ${TYPE_STYLES[notif.type]}`}
          >
            <div className="flex items-start gap-3">
              <span className="text-lg mt-0.5">{TYPE_ICONS[notif.type]}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{notif.title}</p>
                {notif.message && (
                  <p className="text-sm opacity-80 mt-0.5">{notif.message}</p>
                )}
              </div>
              <button
                onClick={() => removeNotification(notif.id)}
                className="text-current opacity-50 hover:opacity-100 transition-opacity ml-2"
              >
                &times;
              </button>
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
