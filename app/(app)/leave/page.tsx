"use client";

import { CalendarOff } from "lucide-react";
import { BranchBoard } from "@/components/branch/branch-board";
import { StatusPill } from "@/components/board-kit";
import { LEAVE_REQUESTS, type LeaveRow } from "@/lib/school-mock-data";

const COLORS: Record<string, string> = { Pending: "var(--theme-warning)", Approved: "var(--theme-success)", Rejected: "var(--theme-danger)" };

export default function LeavePage() {
  return (
    <BranchBoard<LeaveRow>
      title="Leave Management"
      subtitle="Student and employee leave applications with approval workflow."
      Icon={CalendarOff}
      nameLabel="Applicant"
      countNoun="requests"
      rows={LEAVE_REQUESTS}
      groupBy={(r) => r.status}
      groupColorOf={(k) => COLORS[k]}
      nameOf={(r) => r.person}
      subtitleOf={(r) => `${r.role} · ${r.type} leave`}
      searchTextOf={(r) => `${r.person} ${r.role} ${r.type} ${r.reason}`}
      columns={[
        { key: "type", label: "Type", width: "110px", cell: (r) => r.type },
        { key: "from", label: "From", width: "120px", cell: (r) => r.from },
        { key: "to", label: "To", width: "120px", cell: (r) => r.to },
        { key: "days", label: "Days", width: "80px", cell: (r) => r.days },
        { key: "reason", label: "Reason", width: "minmax(160px,1.3fr)", cell: (r) => r.reason },
        { key: "status", label: "Status", width: "120px", cell: (r) => <StatusPill label={r.status} /> },
      ]}
      detailFields={(r) => [
        { label: "Applicant", value: r.person },
        { label: "Role", value: r.role },
        { label: "Leave Type", value: r.type },
        { label: "From", value: r.from },
        { label: "To", value: r.to },
        { label: "Days", value: r.days },
        { label: "Reason", value: r.reason },
        { label: "Status", value: r.status },
      ]}
      mobileRows={(r) => [
        { label: "Type", value: r.type },
        { label: "Dates", value: `${r.from} → ${r.to}` },
        { label: "Days", value: r.days },
        { label: "Status", value: <StatusPill label={r.status} /> },
      ]}
      emptyTitle="No leave requests"
      emptyMessage="No leave requests match the current campus scope."
    />
  );
}
