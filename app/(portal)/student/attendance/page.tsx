"use client";

import { CalendarCheck, Download } from "lucide-react";
import { Btn, StatCard } from "@/components/ui";
import { PortalBoard } from "@/components/portal/portal-board";
import { StatusPill } from "@/components/board-kit";
import { PORTAL_STUDENT, STUDENT_FULL_NAME, attendanceRate, countBy, studentAttendance } from "@/lib/portal-data";

/* Student Attendance = the Admin /attendance module filtered to the signed-in
   student's own records. Same statuses (Present / Absent / Late / Leave),
   same columns and same status pills as the Admin board. */
const COLORS: Record<string, string> = {
  Present: "var(--theme-success)", Absent: "var(--theme-danger)",
  Late: "var(--theme-warning)", Leave: "var(--theme-info)",
};

export default function StudentAttendancePage() {
  const rate = attendanceRate(studentAttendance);
  const counts = countBy(studentAttendance, (r) => r.status);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--theme-surface)]">
      <div className="grid grid-cols-2 gap-3 px-4 pt-4 sm:grid-cols-4 sm:px-6">
        <StatCard label="Attendance Rate" value={`${rate}%`} Icon={CalendarCheck} tone={rate >= 90 ? "green" : "orange"} sub={PORTAL_STUDENT.session} />
        <StatCard label="Present" value={counts.Present ?? 0} Icon={CalendarCheck} tone="green" sub="Days marked present" />
        <StatCard label="Absent" value={counts.Absent ?? 0} Icon={CalendarCheck} tone="red" sub="Days marked absent" />
        <StatCard label="Late / Leave" value={(counts.Late ?? 0) + (counts.Leave ?? 0)} Icon={CalendarCheck} tone="blue" sub="Late and medical leave" />
      </div>

      <div className="mt-2">
        <PortalBoard
          title="My Attendance"
          subtitle={`Daily register for ${STUDENT_FULL_NAME} · ${PORTAL_STUDENT.cls}-${PORTAL_STUDENT.section}`}
          Icon={CalendarCheck}
          nameLabel="Date"
          rows={studentAttendance}
          keyOf={(r) => r.id}
          nameOf={(r) => r.date}
          subtitleOf={(r) => `${r.cls}-${r.section}`}
          searchTextOf={(r) => `${r.date} ${r.status} ${r.remark}`}
          searchPlaceholder="Search date or remark"
          scopeLabel={`${PORTAL_STUDENT.cls}-${PORTAL_STUDENT.section}`}
          countNoun="entries"
          primaryAction={<Btn variant="secondary" Icon={Download}>Export</Btn>}
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
          emptyTitle="No attendance records"
          emptyMessage="No attendance entries have been published for your class yet."
          minWidth={620}
        />
      </div>
    </div>
  );
}
