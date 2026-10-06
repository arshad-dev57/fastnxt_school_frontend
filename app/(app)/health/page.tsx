"use client";

import { HeartPulse, ShieldAlert } from "lucide-react";
import { BranchBoard } from "@/components/branch/branch-board";
import { StatusPill } from "@/components/board-kit";
import { HEALTH_RECORDS, type HealthRow } from "@/lib/school-mock-data";

const COLORS: Record<string, string> = { Fit: "var(--theme-success)", Observation: "var(--theme-warning)", "Under Treatment": "var(--theme-danger)" };

export default function HealthPage() {
  return (
    <BranchBoard<HealthRow>
      title="Health & Medical Records"
      subtitle="Sensitive medical profiles — review access is permission-controlled."
      Icon={HeartPulse}
      nameLabel="Student"
      countNoun="records"
      rows={HEALTH_RECORDS}
      groupBy={(r) => r.status}
      groupColorOf={(k) => COLORS[k]}
      nameOf={(r) => r.student}
      subtitleOf={(r) => `${r.cls} · Blood group ${r.bloodGroup}`}
      searchTextOf={(r) => `${r.student} ${r.cls} ${r.condition} ${r.bloodGroup}`}
      columns={[
        { key: "blood", label: "Blood", width: "90px", cell: (r) => r.bloodGroup },
        { key: "condition", label: "Condition", width: "minmax(150px,1fr)", cell: (r) => r.condition },
        { key: "allergy", label: "Allergies", width: "minmax(130px,1fr)", cell: (r) => r.allergy },
        { key: "visit", label: "Last Visit", width: "120px", cell: (r) => r.lastVisit },
        { key: "status", label: "Status", width: "140px", cell: (r) => <StatusPill label={r.status} /> },
      ]}
      detailFields={(r) => [
        { label: "Student", value: r.student },
        { label: "Class", value: r.cls },
        { label: "Blood Group", value: r.bloodGroup },
        { label: "Condition", value: r.condition },
        { label: "Allergies", value: r.allergy },
        { label: "Last Visit", value: r.lastVisit },
        { label: "Status", value: r.status },
      ]}
      mobileRows={(r) => [
        { label: "Blood", value: r.bloodGroup },
        { label: "Condition", value: r.condition },
        { label: "Status", value: <StatusPill label={r.status} /> },
      ]}
      emptyTitle="No health records"
      emptyMessage="No medical records match the current campus scope."
      toolbar={
        <span className="ml-1 hidden items-center gap-1.5 rounded bg-[var(--theme-danger-soft)] px-2 py-1 text-[12px] font-medium text-[var(--theme-danger-text)] sm:inline-flex">
          <ShieldAlert className="h-3.5 w-3.5" /> Restricted
        </span>
      }
    />
  );
}
