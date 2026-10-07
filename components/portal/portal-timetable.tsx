"use client";

import { CalendarClock, Clock } from "lucide-react";
import { Card, CardHead, EmptyState, Select, cn } from "@/components/ui";
import { PERIODS, PERIOD_TIMES, WEEK_DAYS, type TimetableSlot } from "@/lib/school-mock-data";

/* ===========================================================================
   PortalTimetable — the weekly period grid lifted from the Admin
   app/(app)/timetable/page.tsx so both surfaces render identically.
   The Admin groups by Class / Teacher / Room; a portal user has exactly one of
   those, so the grouping control is dropped and a day highlight is used instead.
   ========================================================================== */

export type TimetableSlotView = {
  id: string;
  cls: string;
  section: string;
  day: string;
  period: number;
  subject: string;
  teacher: string;
  room?: string | null;
  startTime?: string | null;
  endTime?: string | null;
};

const ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function PortalTimetable({ slots, title, subtitle, highlightDay = "Monday" }: {
  slots: TimetableSlotView[];
  title: string;
  subtitle?: string;
  highlightDay?: string;
}) {
  const total = slots.length;

  return (
    <Card pad={false} className="mb-5">
      <CardHead
        Icon={CalendarClock}
        title={title}
        subtitle={subtitle}
        right={<span className="rounded-full bg-[var(--theme-primary-soft)] px-2.5 py-1 text-[12px] font-medium text-[var(--theme-primary-hover)]">
          {total} periods / week
        </span>}
      />

      {total === 0 ? (
        <EmptyState Icon={CalendarClock} title="No timetable published"
          message="No weekly periods have been scheduled for your account yet." />
      ) : (
        <>
          {/* DESKTOP / TABLET — period grid */}
          <div className="hidden overflow-x-auto p-3 md:block">
            <table className="w-full min-w-[760px] border-collapse text-[13px]">
              <thead>
                <tr>
                  <th className="w-28 border border-[var(--theme-border)] bg-[var(--theme-sidebar)] px-2 py-2 text-left text-[12px] font-semibold uppercase tracking-wide text-[var(--theme-text-muted)]">Period</th>
                  {ALL_DAYS.map((d) => (
                    <th key={d} className={cn("border border-[var(--theme-border)] bg-[var(--theme-sidebar)] px-2 py-2 text-left text-[12px] font-semibold uppercase tracking-wide text-[var(--theme-text-muted)]", d === highlightDay && "text-[var(--theme-primary-hover)] font-bold")}>
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERIODS.map((p) => {
                  const pTime = PERIOD_TIMES[p] || { start: "08:00", end: "08:45" };
                  return (
                    <tr key={p}>
                      <td className="border border-[var(--theme-border)] px-2 py-2 align-top">
                        <p className="font-semibold">Period {p}</p>
                        <p className="text-[11px] text-[var(--theme-text-faint)]">{pTime.start}–{pTime.end}</p>
                      </td>
                      {ALL_DAYS.map((d) => {
                        const items = slots.filter((s) => s.day === d && s.period === p);
                        return (
                          <td key={d} className={cn("border border-[var(--theme-border)] px-2 py-2 align-top", d === highlightDay && "bg-[var(--theme-primary-soft)]/25")}>
                            {items.length === 0 ? <span className="text-[12px] text-[var(--theme-text-faint)]">—</span> :
                              items.map((s) => (
                                <div key={s.id} className="mb-1 rounded bg-[var(--theme-primary-soft)] px-2 py-1.5 last:mb-0 border border-[var(--theme-primary-soft)]">
                                  <p className="font-medium text-[var(--theme-primary-hover)]">{s.subject}</p>
                                  <p className="text-[11px] text-[var(--theme-text-muted)]">{s.cls}-{s.section} · {s.room || "Room TBD"}</p>
                                  {(s.startTime || s.endTime) && (
                                    <p className="text-[10px] text-[var(--theme-text-faint)] mt-0.5">{s.startTime} - {s.endTime}</p>
                                  )}
                                </div>
                              ))}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* MOBILE — day-by-day list */}
          <div className="space-y-4 p-3 md:hidden">
            {ALL_DAYS.map((d) => {
              const daySlots = slots.filter((s) => s.day === d).sort((a, b) => a.period - b.period);
              if (daySlots.length === 0) return null;
              return (
                <div key={d}>
                  <p className="mb-2 text-[13px] font-semibold text-[var(--theme-text-muted)]">{d}</p>
                  <div className="space-y-2">
                    {daySlots.map((s) => (
                      <div key={s.id} className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-3 shadow-sm">
                        <div className="flex items-start justify-between gap-2">
                          <p className="min-w-0 truncate text-[15px] font-medium">{s.subject}</p>
                          <span className="shrink-0 rounded-full bg-[var(--theme-subtle)] px-2 py-0.5 text-[12px] font-medium text-[var(--theme-text-muted)]">P{s.period}</span>
                        </div>
                        <p className="mt-0.5 truncate text-[13px] text-[var(--theme-text-muted)]">{s.cls}-{s.section} · {s.room || "Room TBD"}</p>
                        <p className="mt-1 flex items-center gap-1.5 text-[12px] text-[var(--theme-text-faint)]">
                          <Clock className="h-3.5 w-3.5" />{s.startTime || PERIOD_TIMES[s.period as keyof typeof PERIOD_TIMES]?.start}–{s.endTime || PERIOD_TIMES[s.period as keyof typeof PERIOD_TIMES]?.end}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </Card>
  );
}


/** Day selector shared by both portal timetables. */
export function DayPicker({ value, onChange, days = [...WEEK_DAYS] }: {
  value: string; onChange: (d: string) => void; days?: readonly string[];
}) {
  return (
    <label className="flex items-center gap-2 text-[13px] text-[var(--theme-text-muted)]">
      Day
      <Select options={days} value={value} onChange={(e) => onChange(e.target.value)} className="w-40" />
    </label>
  );
}
