"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarCheck, CheckCircle2, Save, Users } from "lucide-react";
import {
  Avatar,
  Btn,
  Card,
  CardHead,
  EmptyState,
  Input,
  PageHeader,
  Select,
  StatCard,
  cn,
} from "@/components/ui";
import { StatusPill, statusColor } from "@/components/board-kit";
import { PortalScopeBar, ProgressMeter } from "@/components/portal/portal-ui";
import { useAuth } from "@/lib/auth/auth-context";
import { useBranch } from "@/lib/branch-context";
import {
  attendanceApi,
  describeApiError,
  type ClassSectionOption,
  type StudentAttendanceRosterRow,
} from "@/lib/auth/api-client";

const ATTENDANCE_STATUSES = ["Present", "Absent", "Late", "Leave"] as const;

type Mark = Record<string, string>;

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function TeacherAttendancePage() {
  const { user } = useAuth();
  const { currentBranchId } = useBranch();

  const [sections, setSections] = useState<ClassSectionOption[]>([]);
  const [sectionLabel, setSectionLabel] = useState("");
  const [date, setDate] = useState(todayIso());
  const [roster, setRoster] = useState<StudentAttendanceRosterRow[]>([]);
  const [marks, setMarks] = useState<Mark>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const branchScope = currentBranchId !== "all" ? currentBranchId : undefined;
  const selected = sections.find((s) => s.label === sectionLabel) || null;

  const loadSections = useCallback(async () => {
    if (!user) return;
    try {
      setError(null);
      const res = await attendanceApi.mySections();
      const list = res.sections ?? [];
      setSections(list);
      setSectionLabel((prev) => prev || list[0]?.label || "");
    } catch (err) {
      setError(describeApiError(err).message);
      setSections([]);
    }
  }, [user]);

  const loadRoster = useCallback(async () => {
    if (!selected) {
      setRoster([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      const res = await attendanceApi.studentRoster({
        cls: selected.cls,
        section: selected.section,
        date,
        branchId: selected.branchId || branchScope,
      });
      setRoster(res.roster ?? []);
      const initial: Mark = {};
      for (const row of res.roster ?? []) {
        if (row.marked) initial[row.studentId] = row.status;
      }
      setMarks(initial);
    } catch (err) {
      setError(describeApiError(err).message);
      setRoster([]);
    } finally {
      setLoading(false);
    }
  }, [selected, date, branchScope]);

  useEffect(() => {
    loadSections();
  }, [loadSections]);

  useEffect(() => {
    loadRoster();
  }, [loadRoster]);

  const statusOf = (id: string): string => marks[id] ?? "Present";
  const setStatus = (id: string, status: string) =>
    setMarks((m) => ({ ...m, [id]: status }));
  const markAll = (status: string) =>
    setMarks(Object.fromEntries(roster.map((r) => [r.studentId, status])));

  const summary = useMemo(() => {
    const c: Record<string, number> = { Present: 0, Absent: 0, Late: 0, Leave: 0 };
    for (const r of roster) c[statusOf(r.studentId)] = (c[statusOf(r.studentId)] ?? 0) + 1;
    return c;
  }, [roster, marks]);

  const rate = roster.length
    ? Math.round((((summary.Present ?? 0) + (summary.Late ?? 0)) / roster.length) * 100)
    : 0;

  const save = async () => {
    if (!selected || roster.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      await attendanceApi.markStudents({
        date,
        cls: selected.cls,
        section: selected.section,
        branchId: selected.branchId || branchScope || null,
        records: roster.map((r) => ({
          studentId: r.studentId,
          status: statusOf(r.studentId),
          remark: r.remark || "",
        })),
      });
      setSaved(true);
      await loadRoster();
    } catch (err) {
      setError(describeApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  const sectionOptions = sections.map((s) => s.label);

  return (
    <>
      <PageHeader
        title="Mark Attendance"
        subtitle={`Daily register for your class-teacher sections · ${user?.name || "Teacher"}`}
        actions={
          <Btn
            variant="primary"
            Icon={Save}
            onClick={save}
            loading={saving}
            loadingLabel="Saving…"
            disabled={!selected || roster.length === 0}
          >
            Save Attendance
          </Btn>
        }
      />

      <div className="px-4 pb-24 pt-4 sm:px-6">
        {error ? (
          <p className="mb-3 rounded-lg bg-[var(--theme-danger-soft)] px-3 py-2 text-[13px] text-[var(--theme-danger-text)]">
            {error}
          </p>
        ) : null}

        <PortalScopeBar
          count={roster.length}
          noun="students"
          label={sectionLabel || "No class assigned"}
          Icon={Users}
        />

        <div className="grid grid-cols-2 gap-3 py-4 sm:grid-cols-4">
          <StatCard
            label="Class Attendance"
            value={`${rate}%`}
            Icon={CalendarCheck}
            tone={rate >= 90 ? "green" : "orange"}
            sub={date}
          />
          <StatCard label="Present" value={summary.Present ?? 0} Icon={CalendarCheck} tone="green" />
          <StatCard label="Absent" value={summary.Absent ?? 0} Icon={CalendarCheck} tone="red" />
          <StatCard
            label="Late / Leave"
            value={(summary.Late ?? 0) + (summary.Leave ?? 0)}
            Icon={CalendarCheck}
            tone="blue"
          />
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-[13px] text-[var(--theme-text-muted)]">
            Section
            <Select
              options={sectionOptions.length ? sectionOptions : ["No class assigned"]}
              value={sectionLabel || "No class assigned"}
              onChange={(e) => {
                setSectionLabel(e.target.value);
                setMarks({});
              }}
              className="w-44"
              disabled={sectionOptions.length === 0}
            />
          </label>
          <label className="flex items-center gap-2 text-[13px] text-[var(--theme-text-muted)]">
            Date
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-40" />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13px] text-[var(--theme-text-muted)]">Mark all:</span>
            {ATTENDANCE_STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => markAll(s)}
                className="rounded-full px-3 py-1 text-[12px] font-medium text-white transition-opacity hover:opacity-90"
                style={{ background: statusColor(s) }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <Card pad={false}>
          <CardHead
            title={`Register — ${sectionLabel || "—"} · ${date}`}
            subtitle="Only class teachers can mark their own sections"
            Icon={CalendarCheck}
            right={
              <span className="rounded-full bg-[var(--theme-primary-soft)] px-2.5 py-1 text-[12px] font-medium text-[var(--theme-primary-hover)]">
                {roster.length} students
              </span>
            }
          />
          {loading ? (
            <p className="px-4 py-8 text-center text-[13px] text-[var(--theme-text-muted)]">Loading roster…</p>
          ) : sections.length === 0 ? (
            <EmptyState
              Icon={Users}
              title="No class assigned"
              message="You are not set as class teacher on any class. Ask admin to assign you as class teacher."
            />
          ) : roster.length === 0 ? (
            <EmptyState Icon={Users} title="No students" message="This section has no active students." />
          ) : (
            <div className="divide-y divide-[var(--theme-border)]">
              {roster.map((r) => (
                <div key={r.studentId} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <Avatar name={r.student} size={34} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium">{r.student}</p>
                    <p className="truncate text-[12px] text-[var(--theme-text-faint)]">
                      {r.studentCode || r.studentId}
                      {r.remark ? ` · ${r.remark}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {ATTENDANCE_STATUSES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStatus(r.studentId, s)}
                        aria-pressed={statusOf(r.studentId) === s}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors",
                          statusOf(r.studentId) === s
                            ? "text-white"
                            : "bg-[var(--theme-subtle)] text-[var(--theme-text-muted)] hover:bg-[var(--theme-border)]"
                        )}
                        style={statusOf(r.studentId) === s ? { background: statusColor(s) } : undefined}
                      >
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
          <p className="mb-2 text-[13px] font-medium">Day&apos;s distribution</p>
          <div className="space-y-2">
            {ATTENDANCE_STATUSES.map((s) => (
              <div key={s}>
                <div className="mb-1 flex items-center justify-between text-[13px]">
                  <span className="text-[var(--theme-text-muted)]">{s}</span>
                  <span className="font-medium tabular-nums">{summary[s] ?? 0}</span>
                </div>
                <ProgressMeter
                  value={roster.length ? ((summary[s] ?? 0) / roster.length) * 100 : 0}
                  tone={statusColor(s)}
                />
              </div>
            ))}
          </div>
          {saved ? (
            <p className="mt-4 flex flex-wrap items-center gap-2 text-[13px] text-[var(--theme-success-text)]">
              <CheckCircle2 className="h-4 w-4" /> Attendance saved for {sectionLabel} on {date}.
              <StatusPill label="Saved" />
            </p>
          ) : null}
        </Card>
      </div>
    </>
  );
}
