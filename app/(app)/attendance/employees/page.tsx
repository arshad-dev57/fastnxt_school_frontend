"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  StatCard,
  cn,
} from "@/components/ui";
import { ProgressMeter } from "@/components/portal/portal-ui";
import { useBranch } from "@/lib/branch-context";
import {
  attendanceApi,
  describeApiError,
  type StaffAttendanceItem,
  type StaffAttendanceRosterRow,
} from "@/lib/auth/api-client";

const STATUSES = ["Present", "Absent", "Late", "Leave"] as const;
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

export default function StaffAttendancePage() {
  const { currentBranchId } = useBranch();
  const [tab, setTab] = useState<"mark" | "history">("mark");
  const [date, setDate] = useState(todayIso());
  const [roster, setRoster] = useState<StaffAttendanceRosterRow[]>([]);
  const [history, setHistory] = useState<StaffAttendanceItem[]>([]);
  const [marks, setMarks] = useState<Mark>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const branchScope = currentBranchId !== "all" ? currentBranchId : undefined;

  const loadRoster = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      const res = await attendanceApi.staffRoster({ date, branchId: branchScope });
      setRoster(res.roster ?? []);
      const initial: Mark = {};
      for (const row of res.roster ?? []) {
        if (row.marked) initial[row.employeeId] = row.status;
      }
      setMarks(initial);
    } catch (err) {
      setError(describeApiError(err).message);
      setRoster([]);
    } finally {
      setLoading(false);
    }
  }, [date, branchScope]);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await attendanceApi.listStaff({ branchId: branchScope });
      setHistory(res.attendance ?? []);
    } catch (err) {
      setError(describeApiError(err).message);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [branchScope]);

  useEffect(() => {
    if (tab === "mark") loadRoster();
    else loadHistory();
  }, [tab, loadRoster, loadHistory]);

  const statusOf = (id: string): string => marks[id] ?? "Present";
  const setStatus = (id: string, status: string) =>
    setMarks((m) => ({ ...m, [id]: status }));
  const markAll = (status: string) =>
    setMarks(Object.fromEntries(roster.map((r) => [r.employeeId, status])));

  const summary = useMemo(() => {
    const c: Record<string, number> = { Present: 0, Absent: 0, Late: 0, Leave: 0 };
    for (const r of roster) c[statusOf(r.employeeId)] = (c[statusOf(r.employeeId)] ?? 0) + 1;
    return c;
  }, [roster, marks]);

  const rate = roster.length
    ? Math.round((((summary.Present ?? 0) + (summary.Late ?? 0)) / roster.length) * 100)
    : 0;

  const save = async () => {
    if (roster.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      await attendanceApi.markStaff({
        date,
        branchId: branchScope ?? null,
        records: roster.map((r) => ({
          employeeId: r.employeeId,
          status: statusOf(r.employeeId),
          inTime: statusOf(r.employeeId) === "Present" || statusOf(r.employeeId) === "Late" ? "08:30" : "",
          outTime: statusOf(r.employeeId) === "Present" || statusOf(r.employeeId) === "Late" ? "15:30" : "",
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

  if (tab === "history") {
    return (
      <BranchBoard<StaffAttendanceItem>
        title="Staff Attendance"
        subtitle="Employee attendance history with in/out timings."
        Icon={Briefcase}
        nameLabel="Employee"
        countNoun="entries"
        rows={history}
        loading={loading}
        groupBy={(r) => r.status}
        groupColorOf={(k) => COLORS[k]}
        nameOf={(r) => r.employee}
        subtitleOf={(r) => `${r.designation || "—"} · ${r.department || "—"}`}
        searchTextOf={(r) => `${r.employee} ${r.designation} ${r.department} ${r.status} ${r.date}`}
        primaryAction={
          <Btn variant="primary" onClick={() => setTab("mark")}>
            Mark Attendance
          </Btn>
        }
        columns={[
          { key: "dept", label: "Department", width: "150px", cell: (r) => r.department || "—" },
          { key: "date", label: "Date", width: "120px", cell: (r) => r.date },
          { key: "status", label: "Status", width: "120px", cell: (r) => <StatusPill label={r.status} /> },
          { key: "in", label: "In", width: "90px", cell: (r) => r.inTime || "—" },
          { key: "out", label: "Out", width: "90px", cell: (r) => r.outTime || "—" },
        ]}
        detailFields={(r) => [
          { label: "Employee", value: r.employee },
          { label: "Designation", value: r.designation || "—" },
          { label: "Department", value: r.department || "—" },
          { label: "Date", value: r.date },
          { label: "Status", value: r.status },
          { label: "In / Out", value: `${r.inTime || "—"} – ${r.outTime || "—"}` },
        ]}
        mobileRows={(r) => [
          { label: "Status", value: <StatusPill label={r.status} /> },
          { label: "Department", value: r.department || "—" },
          { label: "Date", value: r.date },
          { label: "In", value: r.inTime || "—" },
          { label: "Out", value: r.outTime || "—" },
        ]}
        emptyTitle={error ? "Could not load attendance" : "No staff attendance"}
        emptyMessage={error || "No staff attendance records match the current campus scope."}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Staff Attendance"
        subtitle="Day-wise staff register — office/admin only (teachers and students cannot mark employees)."
        actions={
          <div className="flex flex-wrap gap-2">
            <Btn variant="secondary" onClick={() => setTab("history")}>
              View History
            </Btn>
            <Btn variant="primary" Icon={Save} onClick={save} loading={saving} loadingLabel="Saving…">
              Save Attendance
            </Btn>
          </div>
        }
      />

      <div className="px-4 pb-10 pt-4 sm:px-6">
        {error ? (
          <p className="mb-3 rounded-lg bg-[var(--theme-danger-soft)] px-3 py-2 text-[13px] text-[var(--theme-danger-text)]">
            {error}
          </p>
        ) : null}

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-[13px] text-[var(--theme-text-muted)]">
            Date
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-40" />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13px] text-[var(--theme-text-muted)]">Mark all:</span>
            {STATUSES.map((s) => (
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

        <div className="grid grid-cols-2 gap-3 pb-4 sm:grid-cols-4">
          <StatCard label="Attendance" value={`${rate}%`} Icon={CalendarCheck} tone={rate >= 90 ? "green" : "orange"} />
          <StatCard label="Present" value={summary.Present ?? 0} Icon={Users} tone="green" />
          <StatCard label="Absent" value={summary.Absent ?? 0} Icon={Users} tone="red" />
          <StatCard label="Late / Leave" value={(summary.Late ?? 0) + (summary.Leave ?? 0)} Icon={Users} tone="blue" />
        </div>

        <Card pad={false}>
          <CardHead
            title={`Register — ${date}`}
            subtitle="Tap a status for each employee"
            Icon={Briefcase}
            right={
              <span className="rounded-full bg-[var(--theme-primary-soft)] px-2.5 py-1 text-[12px] font-medium text-[var(--theme-primary-hover)]">
                {roster.length} staff
              </span>
            }
          />
          {loading ? (
            <p className="px-4 py-8 text-center text-[13px] text-[var(--theme-text-muted)]">Loading roster…</p>
          ) : roster.length === 0 ? (
            <EmptyState Icon={Users} title="No employees" message="No active employees found for this campus." />
          ) : (
            <div className="divide-y divide-[var(--theme-border)]">
              {roster.map((r) => (
                <div key={r.employeeId} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <Avatar name={r.employee} size={34} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium">{r.employee}</p>
                    <p className="truncate text-[12px] text-[var(--theme-text-faint)]">
                      {r.designation || "Staff"}
                      {r.department ? ` · ${r.department}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {STATUSES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStatus(r.employeeId, s)}
                        aria-pressed={statusOf(r.employeeId) === s}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors",
                          statusOf(r.employeeId) === s
                            ? "text-white"
                            : "bg-[var(--theme-subtle)] text-[var(--theme-text-muted)] hover:bg-[var(--theme-border)]"
                        )}
                        style={statusOf(r.employeeId) === s ? { background: statusColor(s) } : undefined}
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
          <p className="mb-2 text-[13px] font-medium">Day distribution</p>
          <div className="space-y-2">
            {STATUSES.map((s) => (
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
              <CheckCircle2 className="h-4 w-4" /> Staff attendance saved for {date}.
              <StatusPill label="Saved" />
            </p>
          ) : null}
        </Card>
      </div>
    </>
  );
}
