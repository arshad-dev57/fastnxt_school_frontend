"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, X } from "lucide-react";
import { notificationsApi, type AppNotification } from "@/lib/auth/api-client";
import { useAuth } from "@/lib/auth/auth-context";
import { useNotifications } from "@/lib/notifications-context";

/**
 * Floating dashboard toasts for notifications that have never been floated.
 * Shown once per notification, then acknowledged via /notifications/float/ack.
 */
export function DashboardNotificationFloat() {
  const { signedIn, ready } = useAuth();
  const { refresh } = useNotifications();
  const [queue, setQueue] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!ready || !signedIn) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await notificationsApi.pendingFloat();
        if (!cancelled) setQueue(res.notifications || []);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, signedIn]);

  const dismiss = async (id: string) => {
    setQueue((prev) => prev.filter((n) => n.id !== id));
    try {
      await notificationsApi.ackFloat([id]);
      void refresh();
    } catch {
      /* ignore */
    }
  };

  const dismissAll = async () => {
    const ids = queue.map((n) => n.id);
    setQueue([]);
    if (!ids.length) return;
    try {
      await notificationsApi.ackFloat(ids);
      void refresh();
    } catch {
      /* ignore */
    }
  };

  if (!queue.length) return null;

  return (
    <div className="dashboard-float no-print pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
      {queue.slice(0, 3).map((n) => (
        <div
          key={n.id}
          className="pointer-events-auto rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-3 shadow-2xl ring-1 ring-black/5"
        >
          <div className="flex items-start gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--theme-primary-soft)] text-[var(--theme-primary-hover)]">
              <Bell className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold">{n.title}</p>
              <p className="mt-0.5 line-clamp-2 text-[13px] text-[var(--theme-text-muted)]">{n.message}</p>
              <div className="mt-2 flex items-center gap-2">
                {n.href ? (
                  <Link
                    href={n.href}
                    onClick={() => void dismiss(n.id)}
                    className="text-[12px] font-medium text-[var(--theme-primary)] hover:underline"
                  >
                    Open
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={() => void dismiss(n.id)}
                  className="text-[12px] text-[var(--theme-text-muted)] hover:underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => void dismiss(n.id)}
              className="rounded p-1 text-[var(--theme-text-faint)] hover:bg-[var(--theme-hover)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
      {queue.length > 1 && (
        <button
          type="button"
          onClick={() => void dismissAll()}
          className="pointer-events-auto self-end rounded-full bg-[var(--theme-surface)] px-3 py-1 text-[12px] font-medium text-[var(--theme-text-muted)] shadow ring-1 ring-[var(--theme-border)] hover:bg-[var(--theme-hover)]"
        >
          Dismiss all
        </button>
      )}
    </div>
  );
}
