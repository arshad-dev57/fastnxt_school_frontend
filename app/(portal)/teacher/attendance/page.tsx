"use client";

import { useMemo, useState } from "react";
import { CalendarCheck, CheckCircle2, Save, Users } from "lucide-react";
import { Avatar, Btn, Card, CardHead, EmptyState, PageHeader, Select, StatCard, cn } from "@/components/ui";
import { StatusPill, statusColor } from "@/components/board-kit";
import { PortalScopeBar, ProgressMeter } from "@/components/portal/portal-ui";
import { simulateDelay } from "@/components/skeleton";
import {
  ATTENDANCE_STATUSES, PORTAL_TEACHER, TEACHER_META, attendanceRate,
  teacherAttendanceRegister, teacherClassSectionLabels, teacherClasses,
} from "@/lib/portal-data";
import type { AttendanceStatus } from "@/lib/school-mock-data";

/* ===========================================================================
   Teacher Attendance — the write side of the Admin /attendance module.

   The Admin board is read-only (it lists what was marked). A Teacher holds
   "create" + "edit" on attendance in branch-access.ts, so this page lets them
   mark their OWN sections only, using the exact same four statuses
   (Present / Absent / Late / Leave) and the same StudentAttendance shape.
   ========================================================================== */

type Mark = Record<string, string>;

export default function TeacherAttendancePage() {
  const [section, setSection] = useState(teacherClassSectionLabels[0] ?? "");
  const [marks, setMarks] = useState<Mark>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const roster = useMemo(() => {
    const registered = teacherAttendanceRegister.filter((r) => `${r.cls}-${r.section}` === section);
    const known = new Set(registered.map((r) => r.student));
    // Include every enrolled student so nobody is missing from the register.
    const own = teacherClasses.find((c) => c.label === section);
    const extra = (own?.members ?? []).filter((m) => !known.has(m.name))
      .map((m) => ({ id: m.id, student: m.name, cls: m.cls, section: m.section, date: "", status: "Present" as const, remark: "" }));
    return [...registered, ...extra];
  }, [section]);

  const statusOf = (student: string): AttendanceStatus =>
    (marks[student] as AttendanceStatus | undefined) ?? "Present";
  const setStatus = (student: string, status: string) => setMarks((m) => ({ ...m, [student]: status }));

  const summary = useMemo(() => {
    const c: Record<string, number> = { Present: 0, Absent: 0, Late: 0, Leave: 0 };
    for (const r of roster) c[statusOf(r.student)] = (c[statusOf(r.student)] ?? 0) + 1;
    return c;
  }, [roster, marks]);

  const rate = attendanceRate(roster.map((r) => ({ status: statusOf(r.student) })));

  const save = async () => { setSaving(true); await simulateDelay(); setSaving(false); setSaved(true); };
  const markAll = (status: string) => setMarks(Object.fromEntries(roster.map((r) => [r.student, status])));

  return (
    <>
      <PageHeader
        title="Mark Attendance"
        subtitle={`Daily register for your own classes · ${PORTAL_TEACHER.name}`}
        actions={<Btn variant="primary" Icon={Save} onClick={save} loading={saving} loadingLabel="Saving…">Save Attendance</Btn>}
      />

      <div className="px-4 pb-24 pt-4 sm:px-6">
        <PortalScopeBar count={roster.length} noun="students" label={section} Icon={Users} />

        <div className="grid grid-cols-2 gap-3 py-4 sm:grid-cols-4">
          <StatCard label="Class Attendance" value={`${rate}%`} Icon={CalendarCheck} tone={rate >= 90 ? "green" : "orange"} sub={TEACHER_META.campus} />
          <StatCard label="Present" value={summary.Present ?? 0} Icon={CalendarCheck} tone="green" />
          <StatCard label="Absent" value={summary.Absent ?? 0} Icon={CalendarCheck} tone="red" />
          <StatCard label="Late / Leave" value={(summary.Late ?? 0) + (summary.Leave ?? 0)} Icon={CalendarCheck} tone="blue" />
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-[13px] text-[var(--theme-text-muted)]">
            Section
            <Select options={teacherClassSectionLabels} value={section} onChange={(e) => { setSection(e.target.value); setMarks({}); }} className="w-44" />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13px] text-[var(--theme-text-muted)]">Mark all:</span>
            {ATTENDANCE_STATUSES.map((s) => (
              <button key={s} onClick={() => markAll(s)}
                className="rounded-full px-3 py-1 text-[12px] font-medium text-white transition-opacity hover:opacity-90"
                style={{ background: statusColor(s) }}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <Card pad={false}>
          <CardHead title={`Register — ${section}`} subtitle="Tap a status for each student" Icon={CalendarCheck}
            right={<span className="rounded-full bg-[var(--theme-primary-soft)] px-2.5 py-1 text-[12px] font-medium text-[var(--theme-primary-hover)]">{roster.length} students</span>} />
          {roster.length === 0 ? (
            <EmptyState Icon={Users} title="No students" message="This section has no students assigned." />
          ) : (
            <div className="divide-y divide-[var(--theme-border)]">
              {roster.map((r) => (
                <div key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <Avatar name={r.student} size={34} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium">{r.student}</p>
                    <p className="truncate text-[12px] text-[var(--theme-text-faint)]">{r.id}{r.remark ? ` · ${r.remark}` : ""}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {ATTENDANCE_STATUSES.map((s) => (
                      <button key={s} onClick={() => setStatus(r.student, s)} aria-pressed={statusOf(r.student) === s}
                        className={cn("rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors",
                          statusOf(r.student) === s ? "text-white" : "bg-[var(--theme-subtle)] text-[var(--theme-text-muted)] hover:bg-[var(--theme-border)]")}
                        style={statusOf(r.student) === s ? { background: statusColor(s) } : undefined}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="mt-5">
          <p className="mb-2 text-[13px] font-medium">Today's distribution</p>
          <div className="space-y-2">
            {ATTENDANCE_STATUSES.map((s) => (
              <div key={s}>
                <div className="mb-1 flex items-center justify-between text-[13px]">
                  <span className="text-[var(--theme-text-muted)]">{s}</span>
                  <span className="font-medium tabular-nums">{summary[s] ?? 0}</span>
                </div>
                <ProgressMeter value={roster.length ? ((summary[s] ?? 0) / roster.length) * 100 : 0} tone={statusColor(s)} />
              </div>
            ))}
          </div>
          {saved && (
            <p className="mt-4 flex flex-wrap items-center gap-2 text-[13px] text-[var(--theme-success-text)]">
              <CheckCircle2 className="h-4 w-4" /> Attendance saved for {section}.
              <StatusPill label="Saved" />
            </p>
          )}
        </Card>
      </div>
    </>
  );
}
