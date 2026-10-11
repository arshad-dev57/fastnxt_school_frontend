"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarOff, CheckCircle2, XCircle } from "lucide-react";
import { BranchBoard } from "@/components/branch/branch-board";
import { StatusPill } from "@/components/board-kit";
import { Select } from "@/components/ui";
import { useBranch } from "@/lib/branch-context";
import {
  describeApiError,
  leaveApi,
  type LeaveRequestItem,
} from "@/lib/auth/api-client";

const COLORS: Record<string, string> = {
  Pending: "var(--theme-warning)",
  Approved: "var(--theme-success)",
  Rejected: "var(--theme-danger)",
};

export default function LeavePage() {
  const { currentBranchId } = useBranch();
  const [rows, setRows] = useState<LeaveRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applicantType, setApplicantType] = useState("");
  const [status, setStatus] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await leaveApi.list({
        branchId: currentBranchId !== "all" ? currentBranchId : undefined,
        applicantType: applicantType
          ? (applicantType as "Student" | "Teacher")
          : undefined,
        status: status || undefined,
      });
      setRows(res.leave ?? []);
    } catch (err) {
      setError(describeApiError(err).message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [currentBranchId, applicantType, status]);

  useEffect(() => {
    load();
  }, [load]);

  const review = async (row: LeaveRequestItem, next: "Approved" | "Rejected") => {
    try {
      const res = await leaveApi.review(row.id, { status: next });
      setRows((prev) => prev.map((r) => (r.id === row.id ? res.leave : r)));
    } catch (err) {
      setError(describeApiError(err).message);
    }
  };

  return (
    <BranchBoard<LeaveRequestItem>
      title="Leave Management"
      subtitle="Student and teacher leave applications. Student leave also goes to the class teacher."
      Icon={CalendarOff}
      nameLabel="Applicant"
      countNoun="requests"
      rows={rows}
      loading={loading}
      groupBy={(r) => r.status}
      groupColorOf={(k) => COLORS[k]}
      nameOf={(r) => r.person}
      subtitleOf={(r) => `${r.role} · ${r.type} leave`}
      searchTextOf={(r) => `${r.person} ${r.role} ${r.type} ${r.reason} ${r.applicantType}`}
      toolbar={
        <div className="flex flex-wrap items-center gap-2">
          <Select
            options={["All applicants", "Student", "Teacher"]}
            value={applicantType || "All applicants"}
            onChange={(e) =>
              setApplicantType(e.target.value === "All applicants" ? "" : e.target.value)
            }
            className="w-40"
          />
          <Select
            options={["All statuses", "Pending", "Approved", "Rejected"]}
            value={status || "All statuses"}
            onChange={(e) =>
              setStatus(e.target.value === "All statuses" ? "" : e.target.value)
            }
            className="w-40"
          />
        </div>
      }
      menu={(r) =>
        r.status === "Pending"
          ? [
              {
                label: "Approve",
                Icon: CheckCircle2,
                onClick: () => review(r, "Approved"),
              },
              {
                label: "Reject",
                Icon: XCircle,
                onClick: () => review(r, "Rejected"),
              },
            ]
          : []
      }
      columns={[
        { key: "who", label: "Type", width: "100px", cell: (r) => r.applicantType },
        { key: "type", label: "Leave", width: "110px", cell: (r) => r.type },
        { key: "from", label: "From", width: "120px", cell: (r) => r.from },
        { key: "to", label: "To", width: "120px", cell: (r) => r.to },
        { key: "days", label: "Days", width: "80px", cell: (r) => r.days },
        { key: "reason", label: "Reason", width: "minmax(160px,1.3fr)", cell: (r) => r.reason },
        { key: "status", label: "Status", width: "120px", cell: (r) => <StatusPill label={r.status} /> },
      ]}
      detailFields={(r) => [
        { label: "Applicant", value: r.person },
        { label: "Role", value: r.role },
        { label: "Applicant Type", value: r.applicantType },
        { label: "Leave Type", value: r.type },
        { label: "From", value: r.from },
        { label: "To", value: r.to },
        { label: "Days", value: r.days },
        { label: "Reason", value: r.reason },
        { label: "Status", value: r.status },
        { label: "Reviewed by", value: r.reviewedBy || "—" },
      ]}
      mobileRows={(r) => [
        { label: "Type", value: `${r.applicantType} · ${r.type}` },
        { label: "Dates", value: `${r.from} → ${r.to}` },
        { label: "Days", value: r.days },
        { label: "Status", value: <StatusPill label={r.status} /> },
      ]}
      emptyTitle={error ? "Could not load leave requests" : "No leave requests"}
      emptyMessage={error || "No leave requests match the current campus scope or filters."}
    />
  );
}
