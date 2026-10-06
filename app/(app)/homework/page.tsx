"use client";

import { NotebookPen } from "lucide-react";
import { BranchBoard } from "@/components/branch/branch-board";
import { StatusPill } from "@/components/board-kit";
import { HOMEWORK, type HomeworkRow } from "@/lib/school-mock-data";

const COLORS: Record<string, string> = {
  Open: "var(--theme-info)", "Due Soon": "var(--theme-warning)", Grading: "var(--theme-accent-2)", Closed: "var(--theme-success)",
};

export default function HomeworkPage() {
  return (
    <BranchBoard<HomeworkRow>
      title="Homework & Assignments"
      subtitle="Class assignments, due dates and submission progress across the campus."
      Icon={NotebookPen}
      nameLabel="Assignment"
      countNoun="assignments"
      rows={HOMEWORK}
      groupBy={(r) => r.status}
      groupColorOf={(k) => COLORS[k]}
      nameOf={(r) => r.title}
      subtitleOf={(r) => `${r.cls}-${r.section} · ${r.subject}`}
      searchTextOf={(r) => `${r.title} ${r.cls} ${r.section} ${r.subject} ${r.teacher}`}
      columns={[
        { key: "subject", label: "Subject", width: "140px", cell: (r) => r.subject },
        { key: "teacher", label: "Teacher", width: "150px", cell: (r) => r.teacher },
        { key: "due", label: "Due Date", width: "120px", cell: (r) => r.due },
        { key: "progress", label: "Submissions", width: "130px", cell: (r) => `${r.submitted}/${r.total}` },
        { key: "status", label: "Status", width: "120px", cell: (r) => <StatusPill label={r.status} /> },
      ]}
      detailFields={(r) => [
        { label: "Title", value: r.title },
        { label: "Class", value: `${r.cls}-${r.section}` },
        { label: "Subject", value: r.subject },
        { label: "Teacher", value: r.teacher },
        { label: "Assigned", value: r.assigned },
        { label: "Due", value: r.due },
        { label: "Submissions", value: `${r.submitted} of ${r.total}` },
        { label: "Status", value: r.status },
      ]}
      mobileRows={(r) => [
        { label: "Class", value: `${r.cls}-${r.section}` },
        { label: "Due", value: r.due },
        { label: "Submissions", value: `${r.submitted}/${r.total}` },
        { label: "Status", value: <StatusPill label={r.status} /> },
      ]}
      emptyTitle="No assignments"
      emptyMessage="No homework records match the current campus scope or search."
    />
  );
}
