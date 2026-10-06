"use client";

import { useMemo, useState } from "react";
import { CalendarClock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardHead, PageHeader, Select, cn } from "@/components/ui";
import { BranchScopeBar } from "@/components/branch/branch-ui";
import { useBranch } from "@/lib/branch-context";
import { PERIODS, PERIOD_TIMES, TIMETABLE_SLOTS, WEEK_DAYS, type TimetableSlot } from "@/lib/school-mock-data";

type Mode = "Class" | "Teacher" | "Room";
const MODES: Mode[] = ["Class", "Teacher", "Room"];

/** Detect teacher / room / class double-bookings for the same day + period. */
function findConflicts(slots: TimetableSlot[]) {
  const conflicts: { slot: string; resource: string; kind: string }[] = [];
  const byCell = new Map<string, TimetableSlot[]>();
  for (const s of slots) byCell.set(`${s.day}·P${s.period}`, [...(byCell.get(`${s.day}·P${s.period}`) ?? []), s]);
  for (const [cell, group] of byCell) {
    if (group.length < 2) continue;
    for (const field of ["teacher", "room", "cls"] as const) {
      const seen = new Map<string, number>();
      for (const s of group) {
        const key = field === "cls" ? `${s.cls}-${s.section}` : s[field];
        seen.set(key, (seen.get(key) ?? 0) + 1);
      }
      for (const [key, count] of seen) {
        if (count < 2) continue;
        const kind = field === "cls" ? "Class" : field === "room" ? "Room" : "Teacher";
        conflicts.push({ slot: cell, resource: key, kind });
      }
    }
  }
  return conflicts;
}

export default function TimetablePage() {
  const { currentBranchId } = useBranch();
  const [mode, setMode] = useState<Mode>("Class");

  const scoped = useMemo(
    () => (currentBranchId === "all" ? TIMETABLE_SLOTS : TIMETABLE_SLOTS.filter((s) => s.branchId === currentBranchId)),
    [currentBranchId],
  );

  const targets = useMemo(() => {
    const set = new Set<string>();
    for (const s of scoped) set.add(mode === "Class" ? `${s.cls}-${s.section}` : mode === "Teacher" ? s.teacher : s.room);
    return [...set].sort();
  }, [scoped, mode]);

  const [target, setTarget] = useState("");
  const active = target && targets.includes(target) ? target : targets[0] ?? "";

  const match = (s: TimetableSlot) => (mode === "Class" ? `${s.cls}-${s.section}` : mode === "Teacher" ? s.teacher : s.room) === active;
  const conflicts = useMemo(() => findConflicts(scoped), [scoped]);

  return (
    <>
      <PageHeader title="Timetable" subtitle="Class, teacher and room timetables with automatic conflict detection." />
      <div className="px-4 pb-24 sm:px-6">
        <BranchScopeBar count={scoped.length} noun="period slots" />
        <div className="flex flex-wrap items-center gap-3 py-3">
          <label className="flex items-center gap-2 text-[13px] text-[var(--theme-text-muted)]">
            View
            <Select options={MODES} value={mode} onChange={(e) => { setMode(e.target.value as Mode); setTarget(""); }} className="w-36" />
          </label>
          <label className="flex items-center gap-2 text-[13px] text-[var(--theme-text-muted)]">
            {mode}
            <Select options={targets} value={active} onChange={(e) => setTarget(e.target.value)} placeholder={`All ${mode.toLowerCase()}s`} className="w-56" />
          </label>
        </div>

        <Card pad={false} className="mb-5">
          <CardHead Icon={conflicts.length ? AlertTriangle : CheckCircle2}
            title={conflicts.length ? "Scheduling conflicts detected" : "No scheduling conflicts"}
            subtitle={conflicts.length ? "Resolve these before publishing the timetable." : "Teacher, room and class allocations are all clear."} />
          <div className="p-4">
            {conflicts.length === 0 ? (
              <p className="flex items-center gap-2 text-[13px] text-[var(--theme-success-text)]"><CheckCircle2 className="h-4 w-4" /> All slots are conflict-free for this campus scope.</p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {conflicts.map((c) => (
                  <li key={`${c.slot}-${c.kind}-${c.resource}`} className="flex items-start gap-2 rounded-lg bg-[var(--theme-danger-soft)] px-3 py-2 text-[13px] text-[var(--theme-danger-text)]">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span><strong>{c.kind} double-booked:</strong> {c.resource} at {c.slot.replace("·P", " · Period ")}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <Card pad={false}>
          <CardHead Icon={CalendarClock} title={`${mode} timetable — ${active || "—"}`} subtitle="Weekly grid for the selected campus." />
          <div className="overflow-x-auto p-3">
            <table className="w-full min-w-[760px] border-collapse text-[13px]">
              <thead>
                <tr>
                  <th className="w-28 border border-[var(--theme-border)] bg-[var(--theme-sidebar)] px-2 py-2 text-left text-[12px] font-semibold uppercase tracking-wide text-[var(--theme-text-muted)]">Period</th>
                  {WEEK_DAYS.map((d) => <th key={d} className="border border-[var(--theme-border)] bg-[var(--theme-sidebar)] px-2 py-2 text-left text-[12px] font-semibold uppercase tracking-wide text-[var(--theme-text-muted)]">{d}</th>)}
                </tr>
              </thead>
              <tbody>
                {PERIODS.map((p) => (
                  <tr key={p}>
                    <td className="border border-[var(--theme-border)] px-2 py-2 align-top">
                      <p className="font-semibold">Period {p}</p>
                      <p className="text-[11px] text-[var(--theme-text-faint)]">{PERIOD_TIMES[p].start}–{PERIOD_TIMES[p].end}</p>
                    </td>
                    {WEEK_DAYS.map((d) => {
                      const cell = scoped.filter((s) => s.day === d && s.period === p && match(s));
                      return (
                        <td key={d} className={cn("border border-[var(--theme-border)] px-2 py-2 align-top", cell.length > 1 && "bg-[var(--theme-danger-soft)]")}>
                          {cell.length === 0 ? <span className="text-[12px] text-[var(--theme-text-faint)]">—</span> :
                            cell.map((s) => (
                              <div key={s.id} className="mb-1 last:mb-0 rounded bg-[var(--theme-primary-soft)] px-2 py-1">
                                <p className="font-medium text-[var(--theme-primary-hover)]">{s.subject}</p>
                                <p className="text-[11px] text-[var(--theme-text-muted)]">{mode === "Teacher" ? `${s.cls}-${s.section}` : s.teacher} · {s.room}</p>
                              </div>
                            ))}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}
