"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { notificationsApi, type AppNotification } from "@/lib/auth/api-client";
import { useAuth } from "@/lib/auth/auth-context";

type NotificationsContextValue = {
  items: AppNotification[];
  unread: number;
  loading: boolean;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { signedIn, ready } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!signedIn) {
      setItems([]);
      setUnread(0);
      return;
    }
    try {
      setLoading(true);
      const res = await notificationsApi.list({ limit: 40 });
      setItems(res.notifications || []);
      setUnread(res.unread || 0);
    } catch {
      /* keep previous */
    } finally {
      setLoading(false);
    }
  }, [signedIn]);

  useEffect(() => {
    if (!ready) return;
    void refresh();
    if (!signedIn) return;
    const id = window.setInterval(() => void refresh(), 45000);
    return () => window.clearInterval(id);
  }, [ready, signedIn, refresh]);

  const markRead = useCallback(async (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n)));
    setUnread((u) => Math.max(0, u - 1));
    try {
      await notificationsApi.markRead(id);
    } catch {
      void refresh();
    }
  }, [refresh]);

  const markAllRead = useCallback(async () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true, readAt: n.readAt || new Date().toISOString() })));
    setUnread(0);
    try {
      await notificationsApi.markAllRead();
    } catch {
      void refresh();
    }
  }, [refresh]);

  const value = useMemo(
    () => ({ items, unread, loading, refresh, markRead, markAllRead }),
    [items, unread, loading, refresh, markRead, markAllRead],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    return {
      items: [] as AppNotification[],
      unread: 0,
      loading: false,
      refresh: async () => {},
      markRead: async () => {},
      markAllRead: async () => {},
    };
  }
  return ctx;
}
