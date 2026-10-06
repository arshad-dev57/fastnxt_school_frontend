"use client";

import { CalendarCheck } from "lucide-react";
import { BranchBoard } from "@/components/branch/branch-board";
import { StatusPill } from "@/components/board-kit";
import { STUDENT_ATTENDANCE, type StudentAttendance } from "@/lib/school-mock-data";

const COLORS: Record<string, string> = {
  Present: "var(--theme-success)", Absent: "var(--theme-danger)", Late: "var(--theme-warning)", Leave: "var(--theme-info)",
};

export default function AttendancePage() {
  return (
    <BranchBoard<StudentAttendance>
      title="Student Attendance"
      subtitle="Daily attendance register for the active campus scope."
      Icon={CalendarCheck}
      nameLabel="Student"
      countNoun="entries"
      rows={STUDENT_ATTENDANCE}
      groupBy={(r) => r.status}
      groupColorOf={(k) => COLORS[k]}
      nameOf={(r) => r.student}
      subtitleOf={(r) => `${r.cls}-${r.section} · ${r.date}`}
      searchTextOf={(r) => `${r.student} ${r.cls} ${r.section} ${r.date} ${r.status}`}
      columns={[
        { key: "cls", label: "Class", width: "130px", cell: (r) => `${r.cls}-${r.section}` },
        { key: "date", label: "Date", width: "120px", cell: (r) => r.date },
        { key: "status", label: "Status", width: "120px", cell: (r) => <StatusPill label={r.status} /> },
        { key: "remark", label: "Remark", width: "minmax(160px,1fr)", cell: (r) => r.remark || "—" },
      ]}
      detailFields={(r) => [
        { label: "Student", value: r.student },
        { label: "Class", value: `${r.cls}-${r.section}` },
        { label: "Date", value: r.date },
        { label: "Status", value: r.status },
        { label: "Remark", value: r.remark || "—" },
      ]}
      mobileRows={(r) => [
        { label: "Class", value: `${r.cls}-${r.section}` },
        { label: "Status", value: <StatusPill label={r.status} /> },
        { label: "Date", value: r.date },
        { label: "Remark", value: r.remark || "—" },
      ]}
      emptyTitle="No attendance records"
      emptyMessage="No attendance entries match the current campus scope or search."
    />
  );
}
