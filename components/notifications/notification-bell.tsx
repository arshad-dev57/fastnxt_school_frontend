"use client";

import Link from "next/link";
import {
  Bell, Briefcase, CalendarCheck, CheckCheck, Maximize2, MessageSquare, ReceiptText, UserPlus, Wallet, Sparkles,
} from "lucide-react";
import { cn, TONE } from "@/components/ui";
import { IconButton } from "@/components/icons";
import { SCHOOL_HEADER_IMAGES } from "@/components/school-stickers";
import { useNotifications } from "@/lib/notifications-context";
import type { AppNotification } from "@/lib/auth/api-client";
import type { IconType } from "@/components/ui";

const NOTIF_ICON: Record<string, IconType> = {
  user: UserPlus,
  fee: Wallet,
  invoice: ReceiptText,
  calendar: CalendarCheck,
  staff: Briefcase,
  chat: MessageSquare,
  system: Sparkles,
  mail: MessageSquare,
};

export function NotificationBell({
  open,
  onOpenChange,
  settingsHref = "/settings/account",
  expandHref = "/notifications",
  useLucideIcon = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settingsHref?: string;
  expandHref?: string;
  /** Use Lucide bell instead of the school-bell sticker (student portal). */
  useLucideIcon?: boolean;
}) {
  const { items, unread, markRead, markAllRead } = useNotifications();

  return (
    <div className="relative z-50">
      <IconButton
        {...(useLucideIcon
          ? { Icon: Bell }
          : { imgSrc: SCHOOL_HEADER_IMAGES.schoolBell, imgSize: 24 })}
        label="Notifications"
        ariaExpanded={open}
        onClick={() => onOpenChange(!open)}
        active={open}
        badge={unread}
        shake={unread > 0}
        shakeKey={unread}
      />

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => onOpenChange(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-[360px] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl bg-[var(--theme-surface)] text-[var(--theme-text)] shadow-2xl ring-1 ring-black/10">
            <div className="flex items-center justify-between gap-2 border-b border-[var(--theme-border)] px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-[16px] font-semibold">Notifications</p>
                <p className="truncate text-[12px] text-[var(--theme-text-muted)]">
                  {unread > 0 ? `${unread} unread` : "You're all caught up"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void markAllRead()}
                disabled={unread === 0}
                className="flex shrink-0 items-center gap-1.5 rounded px-2 py-1 text-[13px] font-medium text-[var(--theme-primary)] hover:bg-[var(--theme-hover)] disabled:cursor-not-allowed disabled:text-[var(--theme-text-faint)] disabled:hover:bg-transparent"
              >
                <CheckCheck className="h-4 w-4" /> Mark all read
              </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {items.length === 0 && (
                <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--theme-subtle)] text-[var(--theme-text-faint)]">
                    <Bell className="h-6 w-6" />
                  </span>
                  <p className="text-[15px] font-semibold">No notifications</p>
                  <p className="text-[13px] text-[var(--theme-text-muted)]">You have no notifications right now.</p>
                </div>
              )}
              {items.slice(0, 12).map((n) => (
                <NotificationRowButton
                  key={n.id}
                  n={n}
                  onClick={() => {
                    void markRead(n.id);
                    onOpenChange(false);
                  }}
                />
              ))}
            </div>

            <div className="grid grid-cols-2 border-t border-[var(--theme-border)]">
              <Link
                href={expandHref}
                onClick={() => onOpenChange(false)}
                className="flex items-center justify-center gap-1.5 px-3 py-3 text-center text-[13px] font-medium text-[var(--theme-primary)] hover:bg-[var(--theme-hover)]"
              >
                <Maximize2 className="h-3.5 w-3.5" /> Expand
              </Link>
              <Link
                href={settingsHref}
                onClick={() => onOpenChange(false)}
                className="border-l border-[var(--theme-border)] px-3 py-3 text-center text-[13px] font-medium text-[var(--theme-text-muted)] hover:bg-[var(--theme-hover)]"
              >
                Settings
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function NotificationRowButton({ n, onClick }: { n: AppNotification; onClick: () => void }) {
  const NIcon = NOTIF_ICON[n.icon] || Sparkles;
  const t = TONE[(n.tone as keyof typeof TONE) || "blue"] || TONE.blue;
  const inner = (
    <span className={cn("flex w-full items-start gap-3 border-b border-[var(--theme-border)] px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-[var(--theme-hover)]", !n.read && "bg-[var(--theme-info-soft)]")}>
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: t.bg, color: t.fg }}>
        <NIcon className="h-[18px] w-[18px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start gap-2">
          <span className="min-w-0 flex-1 truncate text-[14px] font-medium">{n.title}</span>
          {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--theme-primary)]" />}
        </span>
        <span className="mt-0.5 block text-[13px] leading-snug text-[var(--theme-text-muted)]">{n.message}</span>
        <span className="mt-1 block text-[12px] text-[var(--theme-text-faint)]">{n.time}</span>
      </span>
    </span>
  );

  if (n.href) {
    return (
      <Link href={n.href} onClick={onClick} className="block">
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className="block w-full">
      {inner}
    </button>
  );
}

export { NOTIF_ICON };
