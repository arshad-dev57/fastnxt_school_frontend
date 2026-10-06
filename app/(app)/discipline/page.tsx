"use client";

import { ShieldAlert } from "lucide-react";
import { BranchBoard } from "@/components/branch/branch-board";
import { StatusPill } from "@/components/board-kit";
import { DISCIPLINE_CASES, type DisciplineRow } from "@/lib/school-mock-data";

const SEVERITY_COLOR: Record<string, string> = { Low: "var(--theme-success)", Medium: "var(--theme-warning)", High: "var(--theme-danger)" };
const STATUS_COLOR: Record<string, string> = { Open: "var(--theme-danger)", "Follow-up": "var(--theme-warning)", Resolved: "var(--theme-success)" };

export default function DisciplinePage() {
  return (
    <BranchBoard<DisciplineRow>
      title="Discipline & Behaviour"
      subtitle="Incident records, severity, corrective action and follow-up history."
      Icon={ShieldAlert}
      nameLabel="Student"
      countNoun="incidents"
      rows={DISCIPLINE_CASES}
      groupBy={(r) => r.status}
      groupColorOf={(k) => STATUS_COLOR[k]}
      nameOf={(r) => r.student}
      subtitleOf={(r) => `${r.cls} · ${r.type}`}
      searchTextOf={(r) => `${r.student} ${r.cls} ${r.type} ${r.reportedBy} ${r.status}`}
      columns={[
        { key: "date", label: "Date", width: "120px", cell: (r) => r.date },
        { key: "type", label: "Incident", width: "minmax(160px,1.2fr)", cell: (r) => r.type },
        { key: "sev", label: "Severity", width: "110px", cell: (r) => <span className="font-medium" style={{ color: SEVERITY_COLOR[r.severity] }}>{r.severity}</span> },
        { key: "by", label: "Reported By", width: "minmax(140px,1fr)", cell: (r) => r.reportedBy },
        { key: "action", label: "Action", width: "minmax(150px,1.2fr)", cell: (r) => r.action },
        { key: "status", label: "Status", width: "120px", cell: (r) => <StatusPill label={r.status} /> },
      ]}
      detailFields={(r) => [
        { label: "Student", value: r.student },
        { label: "Class", value: r.cls },
        { label: "Date", value: r.date },
        { label: "Incident", value: r.type },
        { label: "Severity", value: r.severity },
        { label: "Reported By", value: r.reportedBy },
        { label: "Action", value: r.action },
        { label: "Status", value: r.status },
      ]}
      mobileRows={(r) => [
        { label: "Date", value: r.date },
        { label: "Incident", value: r.type },
        { label: "Severity", value: r.severity },
        { label: "Status", value: <StatusPill label={r.status} /> },
      ]}
      emptyTitle="No incidents"
      emptyMessage="No discipline records match the current campus scope."
    />
  );
}
