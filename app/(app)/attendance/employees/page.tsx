"use client";

import { Briefcase } from "lucide-react";
import { BranchBoard } from "@/components/branch/branch-board";
import { StatusPill } from "@/components/board-kit";
import { STAFF_ATTENDANCE, type StaffAttendance } from "@/lib/school-mock-data";

const COLORS: Record<string, string> = {
  Present: "var(--theme-success)", Absent: "var(--theme-danger)", Late: "var(--theme-warning)", Leave: "var(--theme-info)",
};

export default function StaffAttendancePage() {
  return (
    <BranchBoard<StaffAttendance>
      title="Staff Attendance"
      subtitle="Employee attendance with in/out timings for the active campus."
      Icon={Briefcase}
      nameLabel="Employee"
      countNoun="entries"
      rows={STAFF_ATTENDANCE}
      groupBy={(r) => r.status}
      groupColorOf={(k) => COLORS[k]}
      nameOf={(r) => r.employee}
      subtitleOf={(r) => `${r.designation} · ${r.department}`}
      searchTextOf={(r) => `${r.employee} ${r.designation} ${r.department} ${r.status}`}
      columns={[
        { key: "dept", label: "Department", width: "150px", cell: (r) => r.department },
        { key: "status", label: "Status", width: "120px", cell: (r) => <StatusPill label={r.status} /> },
        { key: "in", label: "In", width: "90px", cell: (r) => r.inTime },
        { key: "out", label: "Out", width: "90px", cell: (r) => r.outTime },
      ]}
      detailFields={(r) => [
        { label: "Employee", value: r.employee },
        { label: "Designation", value: r.designation },
        { label: "Department", value: r.department },
        { label: "Date", value: r.date },
        { label: "Status", value: r.status },
        { label: "In / Out", value: `${r.inTime} – ${r.outTime}` },
      ]}
      mobileRows={(r) => [
        { label: "Status", value: <StatusPill label={r.status} /> },
        { label: "Department", value: r.department },
        { label: "In", value: r.inTime },
        { label: "Out", value: r.outTime },
      ]}
      emptyTitle="No staff attendance"
      emptyMessage="No staff attendance records match the current campus scope."
    />
  );
}
