"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarClock, Video } from "lucide-react";
import { Card, CardHead, cn } from "@/components/ui";
import { EmptyArt } from "@/components/meetings/empty-art";
import { MeetingDetailsModal } from "@/components/meetings/meeting-details";
import { MeetingStatusPill, ModeChip, ParticipantStack } from "@/components/meetings/meeting-bits";
import { useMeetings } from "@/lib/meetings-store";
import {
  formatMeetingDate, formatMeetingTime, relativeDateLabel, type MeetingScope,
} from "@/lib/meetings-data";

/* ============================================================================
   "Upcoming meetings" dashboard widget — one component reused by the Admin,
   Teacher and Student dashboards. Rows open the standard details modal.
   ========================================================================== */

export function UpcomingMeetingsCard({ scope, viewAllHref, limit = 4, title = "Upcoming meetings", subtitle }: {
  scope: MeetingScope;
  viewAllHref: string;
  limit?: number;
  title?: string;
  subtitle?: string;
}) {
  const { upcomingFor, statusOf } = useMeetings();
  const [openId, setOpenId] = useState<string | null>(null);
  const rows = upcomingFor(scope, limit);
  const open = openId ? rows.find((m) => m.id === openId) ?? null : null;

  return (
    <>
      <Card pad={false}>
        <CardHead
          title={title}
          subtitle={subtitle ?? (scope === "student" ? "Sessions your teachers invited you to" : "Scheduled for the coming days")}
          Icon={CalendarClock}
          right={
            <Link href={viewAllHref} className="flex items-center gap-1 text-[13px] font-medium text-[var(--theme-primary)] hover:underline">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
        {rows.length === 0 ? (
          <EmptyArt
            art="meetings"
            size={150}
            title="No upcoming meetings"
            message={scope === "student"
              ? "You have no class sessions or meetings scheduled yet. Check back after your teacher sends an invitation."
              : "Your calendar is clear. Schedule a meeting to coordinate with your team."}
          />
        ) : (
          <div className="divide-y divide-[var(--theme-border)]">
            {rows.map((m) => {
              const status = statusOf(m);
              return (
                <button key={m.id} type="button" onClick={() => setOpenId(m.id)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--theme-hover)]">
                  <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-[var(--theme-primary-soft)] text-[var(--theme-primary-hover)]">
                    <span className="text-[15px] font-bold leading-none">{m.date.slice(8, 10)}</span>
                    <span className="text-[10px] font-semibold uppercase">{formatMeetingDate(m.date, { month: "short" })}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start gap-2">
                      <span className="min-w-0 flex-1 truncate text-[14px] font-medium">{m.title}</span>
                      {(status === "Live" || status === "Today") && (
                        <MeetingStatusPill status={status} className={cn("shrink-0", status === "Live" && "animate-pulse")} />
                      )}
                    </span>
                    <span className="mt-0.5 block truncate text-[12px] text-[var(--theme-text-muted)]">
                      {formatMeetingTime(m)} · {relativeDateLabel(m.date)} · {m.organizer.name}
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-2">
                      <ModeChip mode={m.mode} platform={m.platform} />
                      <ParticipantStack participants={m.participants} max={4} size={22} />
                    </span>
                  </span>
                  {m.mode !== "physical" && m.link ? (
                    <span className="mt-1 hidden shrink-0 text-[var(--theme-primary)] sm:inline-flex"><Video className="h-4 w-4" /></span>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}
      </Card>

      <MeetingDetailsModal meeting={open} open={Boolean(open)} onClose={() => setOpenId(null)} scope={scope} />
    </>
  );
}
