"use client";

import Link from "next/link";
import { Bell, CheckCheck, Sparkles } from "lucide-react";
import { Btn, Card, EmptyState, PageHeader, cn, TONE } from "@/components/ui";
import { useNotifications } from "@/lib/notifications-context";
import { NOTIF_ICON } from "@/components/notifications/notification-bell";

export default function NotificationsPage() {
  const { items, unread, loading, markRead, markAllRead, refresh } = useNotifications();

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="All in-app alerts for your account — admissions, fees, system and more."
        actions={
          <div className="flex items-center gap-2">
            <Btn variant="secondary" onClick={() => void refresh()} disabled={loading}>
              Refresh
            </Btn>
            <Btn variant="primary" Icon={CheckCheck} onClick={() => void markAllRead()} disabled={unread === 0}>
              Mark all read
            </Btn>
          </div>
        }
      />

      <div className="space-y-4 px-4 pb-24 pt-4 sm:px-6">
        <p className="text-[13px] text-[var(--theme-text-muted)]">
          {loading ? "Loading…" : `${items.length} notification${items.length === 1 ? "" : "s"} · ${unread} unread`}
        </p>

        {!loading && items.length === 0 && (
          <EmptyState Icon={Bell} title="No notifications" message="When something needs your attention, it will show up here and in the header bell." />
        )}

        <Card pad={false}>
          <div className="divide-y divide-[var(--theme-border)]">
            {items.map((n) => {
              const NIcon = NOTIF_ICON[n.icon] || Sparkles;
              const t = TONE[(n.tone as keyof typeof TONE) || "blue"] || TONE.blue;
              const body = (
                <div className={cn("flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-[var(--theme-hover)]", !n.read && "bg-[var(--theme-info-soft)]")}>
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ background: t.bg, color: t.fg }}>
                    <NIcon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2">
                      <p className="min-w-0 flex-1 text-[15px] font-semibold">{n.title}</p>
                      {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--theme-primary)]" />}
                    </div>
                    <p className="mt-0.5 text-[14px] leading-snug text-[var(--theme-text-muted)]">{n.message}</p>
                    <p className="mt-1.5 text-[12px] text-[var(--theme-text-faint)]">{n.time}</p>
                  </div>
                </div>
              );

              if (n.href) {
                return (
                  <Link key={n.id} href={n.href} onClick={() => void markRead(n.id)} className="block">
                    {body}
                  </Link>
                );
              }
              return (
                <button key={n.id} type="button" className="block w-full text-left" onClick={() => void markRead(n.id)}>
                  {body}
                </button>
              );
            })}
          </div>
        </Card>
      </div>
    </>
  );
}
