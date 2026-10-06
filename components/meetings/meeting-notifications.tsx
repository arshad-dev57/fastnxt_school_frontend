"use client";

import { CheckCheck, Info, BellRing, CalendarPlus, CalendarX, FileText } from "lucide-react";
import { Btn, Card, CardHead, cn, type IconType } from "@/components/ui";
import { EmptyArt } from "@/components/meetings/empty-art";
import { useMeetings } from "@/lib/meetings-store";
import { MEETING_KIND_LABEL, type MeetingNotificationKind, type MeetingScope } from "@/lib/meetings-data";

/* ============================================================================
   Meeting notifications — the in-app notification surface for the Meetings
   module. Lives on the Meetings page of every panel (and feeds the header bell
   badge). Clicking an item marks it read and opens the meeting details.
   ========================================================================== */

const KIND_ICON: Record<MeetingNotificationKind, IconType> = {
  invite: CalendarPlus,
  reminder: BellRing,
  update: Info,
  cancelled: CalendarX,
  summary: FileText,
};

const KIND_TONE: Record<MeetingNotificationKind, { bg: string; fg: string }> = {
  invite: { bg: "var(--theme-info-soft)", fg: "var(--theme-primary-hover)" },
  reminder: { bg: "var(--theme-warning-soft)", fg: "var(--theme-warning-text)" },
  update: { bg: "var(--theme-accent-soft)", fg: "var(--theme-accent-strong)" },
  cancelled: { bg: "var(--theme-danger-soft)", fg: "var(--theme-danger-text)" },
  summary: { bg: "var(--theme-success-soft)", fg: "var(--theme-success-text)" },
};

export function MeetingNotificationsCard({ scope, onOpenMeeting }: {
  scope: MeetingScope;
  onOpenMeeting: (meetingId: string) => void;
}) {
  const { notificationsFor, markRead, markAllRead, unreadCount } = useMeetings();
  const items = notificationsFor(scope);
  const unread = unreadCount(scope);

  return (
    <Card pad={false}>
      <CardHead
        title="Meeting notifications"
        subtitle={unread > 0 ? `${unread} unread` : "You're all caught up"}
        Icon={BellRing}
        right={
          <Btn size="sm" variant="ghost" Icon={CheckCheck} disabled={unread === 0} onClick={() => markAllRead(scope)}>
            <span className="hidden sm:inline">Mark all read</span>
          </Btn>
        }
      />
      {items.length === 0 ? (
        <EmptyArt
          art="notifications"
          size={150}
          title="No meeting notifications"
          message="Invitations, reminders and cancellations for your meetings will appear here."
        />
      ) : (
        <div className="max-h-[420px] divide-y divide-[var(--theme-border)] overflow-y-auto">
          {items.map((n) => {
            const Icon = KIND_ICON[n.kind];
            const tone = KIND_TONE[n.kind];
            return (
              <button key={n.id} type="button"
                onClick={() => { markRead(n.id); onOpenMeeting(n.meetingId); }}
                className={cn("flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--theme-hover)]",
                  !n.read && "bg-[var(--theme-info-soft)]")}>
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: tone.bg, color: tone.fg }}>
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-start gap-2">
                    <span className="min-w-0 flex-1 truncate text-[14px] font-medium">{n.title}</span>
                    {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--theme-primary)]" />}
                  </span>
                  <span className="mt-0.5 block text-[13px] leading-snug text-[var(--theme-text-muted)]">{n.message}</span>
                  <span className="mt-1 flex items-center gap-2 text-[12px] text-[var(--theme-text-faint)]">
                    <span className="rounded-full bg-[var(--theme-subtle)] px-2 py-0.5 font-medium">{MEETING_KIND_LABEL[n.kind]}</span>
                    {n.time}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}
