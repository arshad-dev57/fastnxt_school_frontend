"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarCheck } from "lucide-react";
import { StatCard } from "@/components/ui";
import { PortalBoard } from "@/components/portal/portal-board";
import { StatusPill } from "@/components/board-kit";
import { useAuth } from "@/lib/auth/auth-context";
import {
  attendanceApi,
  describeApiError,
  type StudentAttendanceItem,
} from "@/lib/auth/api-client";

const COLORS: Record<string, string> = {
  Present: "var(--theme-success)",
  Absent: "var(--theme-danger)",
  Late: "var(--theme-warning)",
  Leave: "var(--theme-info)",
};

export default function StudentAttendancePage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<StudentAttendanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await attendanceApi.myAttendance();
      setRows(res.attendance ?? []);
    } catch (err) {
      setError(describeApiError(err).message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { Present: 0, Absent: 0, Late: 0, Leave: 0 };
    for (const r of rows) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [rows]);

  const rate = rows.length
    ? Math.round((((counts.Present ?? 0) + (counts.Late ?? 0)) / rows.length) * 100)
    : 0;

  const scope =
    rows[0] ? `${rows[0].cls}-${rows[0].section}` : user?.name || "Student";

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--theme-surface)]">
      <div className="grid grid-cols-2 gap-3 px-4 pt-4 sm:grid-cols-4 sm:px-6">
        <StatCard
          label="Attendance Rate"
          value={`${rate}%`}
          Icon={CalendarCheck}
          tone={rate >= 90 ? "green" : "orange"}
          sub={scope}
        />
        <StatCard label="Present" value={counts.Present ?? 0} Icon={CalendarCheck} tone="green" sub="Days marked present" />
        <StatCard label="Absent" value={counts.Absent ?? 0} Icon={CalendarCheck} tone="red" sub="Days marked absent" />
        <StatCard
          label="Late / Leave"
          value={(counts.Late ?? 0) + (counts.Leave ?? 0)}
          Icon={CalendarCheck}
          tone="blue"
          sub="Late and medical leave"
        />
      </div>

      <div className="mt-2">
        <PortalBoard
          title="My Attendance"
          subtitle={`Day-wise register for ${user?.name || "you"}`}
          Icon={CalendarCheck}
          nameLabel="Date"
          rows={rows}
          loading={loading}
          keyOf={(r) => r.id}
          nameOf={(r) => r.date}
          subtitleOf={(r) => `${r.cls}-${r.section}`}
          searchTextOf={(r) => `${r.date} ${r.status} ${r.remark || ""}`}
          searchPlaceholder="Search date or remark"
          scopeLabel={scope}
          countNoun="entries"
          groupBy={(r) => r.status}
          groupColorOf={(k) => COLORS[k]}
          columns={[
            { key: "cls", label: "Class", width: "130px", cell: (r) => `${r.cls}-${r.section}` },
            { key: "status", label: "Status", width: "120px", cell: (r) => <StatusPill label={r.status} /> },
            { key: "remark", label: "Remark", width: "minmax(180px,1fr)", cell: (r) => r.remark || "—" },
          ]}
          detailFields={(r) => [
            { label: "Date", value: r.date },
            { label: "Class", value: `${r.cls}-${r.section}` },
            { label: "Status", value: <StatusPill label={r.status} /> },
            { label: "Remark", value: r.remark || "—" },
          ]}
          emptyTitle={error ? "Could not load attendance" : "No attendance records"}
          emptyMessage={
            error ||
            "No attendance entries have been published for you yet. Your class teacher marks attendance daily."
          }
          minWidth={620}
        />
      </div>
    </div>
  );
}
