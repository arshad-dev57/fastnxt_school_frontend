"use client";

import { ListChecks } from "lucide-react";
import { BranchBoard } from "@/components/branch/branch-board";
import { StatusPill } from "@/components/board-kit";
import { TASKS, type TaskRow } from "@/lib/school-mock-data";

const COLORS: Record<string, string> = { "Not Started": "var(--theme-pending)", "Working on it": "var(--theme-warning)", Stuck: "var(--theme-danger)", Done: "var(--theme-success)" };
const PRIORITY_COLOR: Record<string, string> = { High: "var(--theme-danger)", Medium: "var(--theme-warning)", Low: "var(--theme-info)" };

export default function TasksPage() {
  return (
    <BranchBoard<TaskRow>
      title="Tasks & Work Management"
      subtitle="Monday-style task board linked to students, exams, fees, events and more."
      Icon={ListChecks}
      nameLabel="Task"
      countNoun="tasks"
      rows={TASKS}
      groupBy={(r) => r.status}
      groupColorOf={(k) => COLORS[k]}
      nameOf={(r) => r.title}
      subtitleOf={(r) => `${r.owner} · ${r.related}`}
      searchTextOf={(r) => `${r.title} ${r.owner} ${r.related} ${r.status}`}
      columns={[
        { key: "owner", label: "Owner", width: "minmax(150px,1fr)", cell: (r) => r.owner },
        { key: "priority", label: "Priority", width: "110px", cell: (r) => <span className="font-medium" style={{ color: PRIORITY_COLOR[r.priority] }}>{r.priority}</span> },
        { key: "related", label: "Related To", width: "130px", cell: (r) => r.related },
        { key: "due", label: "Due", width: "120px", cell: (r) => r.due },
        { key: "status", label: "Status", width: "140px", cell: (r) => <StatusPill label={r.status} /> },
      ]}
      detailFields={(r) => [
        { label: "Task", value: r.title },
        { label: "Owner", value: r.owner },
        { label: "Priority", value: r.priority },
        { label: "Status", value: r.status },
        { label: "Due", value: r.due },
        { label: "Related To", value: r.related },
      ]}
      mobileRows={(r) => [
        { label: "Owner", value: r.owner },
        { label: "Priority", value: r.priority },
        { label: "Due", value: r.due },
        { label: "Status", value: <StatusPill label={r.status} /> },
      ]}
      emptyTitle="No tasks"
      emptyMessage="No tasks match the current campus scope."
    />
  );
}
