"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Briefcase, CalendarCheck, CheckCircle2, Save, Users } from "lucide-react";
import { BranchBoard } from "@/components/branch/branch-board";
import { StatusPill, statusColor } from "@/components/board-kit";
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
import { ProgressMeter } from "@/components/portal/portal-ui";
import { useBranch } from "@/lib/branch-context";
import {
  attendanceApi,
  classesApi,
  describeApiError,
  type ClassItem,
  type StudentAttendanceItem,
  type StudentAttendanceRosterRow,
} from "@/lib/auth/api-client";
const ATTENDANCE_STATUSES = ["Present", "Absent", "Late", "Leave"] as const;
const COLORS: Record<string, string> = {
  Present: "var(--theme-success)",
  Absent: "var(--theme-danger)",
  Late: "var(--theme-warning)",
  Leave: "var(--theme-info)",
};

type Mark = Record<string, string>;

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function AttendancePage() {
  const { currentBranchId } = useBranch();
  const branchScope = currentBranchId !== "all" ? currentBranchId : undefined;

  const [tab, setTab] = useState<"mark" | "history">("mark");
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [cls, setCls] = useState("");
  const [section, setSection] = useState("");
  const [date, setDate] = useState(todayIso());
  const [roster, setRoster] = useState<StudentAttendanceRosterRow[]>([]);
  const [marks, setMarks] = useState<Mark>({});
  const [history, setHistory] = useState<StudentAttendanceItem[]>([]);
  const [historyDate, setHistoryDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    classesApi
      .list({ status: "Active", branchId: branchScope })
      .then((res) => {
        const list = res.classes ?? [];
        setClasses(list);
        if (!cls && list[0]) {
          setCls(list[0].name);
          setSection(list[0].sections?.[0] || "A");
        }
      })
      .catch(() => setClasses([]));
  }, [branchScope]);

  const sectionOptions = useMemo(() => {
    const c = classes.find((x) => x.name === cls);
    return c?.sections?.length ? c.sections : ["A"];
  }, [classes, cls]);

  const loadRoster = useCallback(async () => {
    if (!cls || !section) {
      setRoster([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      const res = await attendanceApi.studentRoster({
        cls,
        section,
        date,
        branchId: branchScope,
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
  }, [cls, section, date, branchScope]);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await attendanceApi.listStudents({
        branchId: branchScope,
        date: historyDate || undefined,
      });
      setHistory(res.attendance ?? []);
    } catch (err) {
      setError(describeApiError(err).message);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [branchScope, historyDate]);

  useEffect(() => {
    if (tab === "mark") loadRoster();
    else loadHistory();
  }, [tab, loadRoster, loadHistory]);

  const statusOf = (id: string) => marks[id] ?? "Present";
  const setStatus = (id: string, status: string) => setMarks((m) => ({ ...m, [id]: status }));
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
    if (!cls || !section || roster.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      await attendanceApi.markStudents({
        date,
        cls,
        section,
        branchId: branchScope || null,
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

  return (
    <>
      <PageHeader
        title="Student Attendance"
        subtitle="Day-wise register — class teachers mark from Teacher Portal; admin can cover any class here."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/attendance/employees"
              className="inline-flex h-9 items-center gap-2 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 text-[14px] hover:bg-[var(--theme-hover)]"
            >
              <Briefcase className="h-4 w-4" /> Employee attendance
            </Link>
            {tab === "mark" ? (
              <Btn
                variant="primary"
                Icon={Save}
                onClick={save}
                loading={saving}
                loadingLabel="Saving…"
                disabled={!cls || roster.length === 0}
              >
                Save Attendance
              </Btn>
            ) : null}
          </div>
        }
      />

      <div className="px-4 pb-24 sm:px-6">
        <div className="mb-4 flex gap-2 border-b border-[var(--theme-border)]">
          {(
            [
              ["mark", "Mark today"],
              ["history", "History"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                "border-b-2 px-3 py-2 text-[14px] font-medium",
                tab === key
                  ? "border-[var(--theme-primary)] text-[var(--theme-primary)]"
                  : "border-transparent text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {error ? (
          <p className="mb-3 rounded-lg bg-[var(--theme-danger-soft)] px-3 py-2 text-[13px] text-[var(--theme-danger-text)]">
            {error}
          </p>
        ) : null}

        {tab === "mark" ? (
          <>
            <div className="grid grid-cols-2 gap-3 py-2 sm:grid-cols-4">
              <StatCard label="Class Attendance" value={`${rate}%`} Icon={CalendarCheck} tone={rate >= 90 ? "green" : "orange"} sub={date} />
              <StatCard label="Present" value={summary.Present ?? 0} Icon={CalendarCheck} tone="green" />
              <StatCard label="Absent" value={summary.Absent ?? 0} Icon={CalendarCheck} tone="red" />
              <StatCard label="Late / Leave" value={(summary.Late ?? 0) + (summary.Leave ?? 0)} Icon={CalendarCheck} tone="blue" />
            </div>

            <div className="mb-3 flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-[13px] text-[var(--theme-text-muted)]">
                Class
                <Select
                  options={classes.map((c) => c.name)}
                  value={cls}
                  onChange={(e) => {
                    setCls(e.target.value);
                    const next = classes.find((c) => c.name === e.target.value);
                    setSection(next?.sections?.[0] || "A");
                  }}
                  className="w-40"
                  placeholder="Select class"
                />
              </label>
              <label className="flex items-center gap-2 text-[13px] text-[var(--theme-text-muted)]">
                Section
                <Select
                  options={sectionOptions}
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="w-28"
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
                    className="rounded-full px-3 py-1 text-[12px] font-medium text-white"
                    style={{ background: statusColor(s) }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <Card pad={false}>
              <CardHead
                title={`Register — ${cls || "—"}-${section || "—"} · ${date}`}
                subtitle="Admin can mark any class; teachers mark their own sections from Teacher Portal"
                Icon={CalendarCheck}
                right={
                  <span className="rounded-full bg-[var(--theme-primary-soft)] px-2.5 py-1 text-[12px] font-medium text-[var(--theme-primary-hover)]">
                    {roster.length} students
                  </span>
                }
              />
              {loading ? (
                <p className="px-4 py-8 text-center text-[13px] text-[var(--theme-text-muted)]">Loading roster…</p>
              ) : !cls ? (
                <EmptyState Icon={Users} title="Select a class" message="Choose class and section to load the day register." />
              ) : roster.length === 0 ? (
                <EmptyState Icon={Users} title="No students" message="This section has no active students." />
              ) : (
                <div className="divide-y divide-[var(--theme-border)]">
                  {roster.map((r) => (
                    <div key={r.studentId} className="flex flex-wrap items-center gap-3 px-4 py-3">
                      <Avatar name={r.student} size={34} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-medium">{r.student}</p>
                        <p className="truncate text-[12px] text-[var(--theme-text-faint)]">{r.studentCode || r.studentId}</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {ATTENDANCE_STATUSES.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setStatus(r.studentId, s)}
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

            {saved ? (
              <p className="mt-4 flex items-center gap-2 text-[13px] text-[var(--theme-success-text)]">
                <CheckCircle2 className="h-4 w-4" /> Attendance saved for {cls}-{section} on {date}.
              </p>
            ) : null}

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
            </Card>
          </>
        ) : (
          <BranchBoard<StudentAttendanceItem>
            title="Attendance history"
            subtitle="All marked student attendance entries."
            Icon={CalendarCheck}
            nameLabel="Student"
            countNoun="entries"
            rows={history}
            loading={loading}
            groupBy={(r) => r.status}
            groupColorOf={(k) => COLORS[k]}
            nameOf={(r) => r.student}
            subtitleOf={(r) => `${r.cls}-${r.section} · ${r.date}`}
            searchTextOf={(r) => `${r.student} ${r.cls} ${r.section} ${r.date} ${r.status}`}
            toolbar={
              <label className="flex items-center gap-2 text-[13px] text-[var(--theme-text-muted)]">
                Date
                <Input type="date" value={historyDate} onChange={(e) => setHistoryDate(e.target.value)} className="w-40" />
                {historyDate ? (
                  <button type="button" onClick={() => setHistoryDate("")} className="text-[12px] text-[var(--theme-primary)] hover:underline">
                    All days
                  </button>
                ) : null}
              </label>
            }
            columns={[
              { key: "cls", label: "Class", width: "130px", cell: (r) => `${r.cls}-${r.section}` },
              { key: "date", label: "Date", width: "120px", cell: (r) => r.date },
              { key: "status", label: "Status", width: "120px", cell: (r) => <StatusPill label={r.status} /> },
              { key: "by", label: "Marked by", width: "minmax(140px,1fr)", cell: (r) => r.markedBy || "—" },
            ]}
            detailFields={(r) => [
              { label: "Student", value: r.student },
              { label: "Class", value: `${r.cls}-${r.section}` },
              { label: "Date", value: r.date },
              { label: "Status", value: r.status },
              { label: "Marked by", value: r.markedBy || "—" },
            ]}
            mobileRows={(r) => [
              { label: "Class", value: `${r.cls}-${r.section}` },
              { label: "Status", value: <StatusPill label={r.status} /> },
            ]}
            emptyTitle="No attendance"
            emptyMessage="No student attendance records for this filter."
          />
        )}
      </div>
    </>
  );
}
