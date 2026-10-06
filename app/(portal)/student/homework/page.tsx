"use client";

import { NotebookPen, Upload } from "lucide-react";
import { Btn } from "@/components/ui";
import { ProgressMeter } from "@/components/portal/portal-ui";
import { PortalBoard } from "@/components/portal/portal-board";
import { StatusPill } from "@/components/board-kit";
import { PORTAL_STUDENT, studentHomework } from "@/lib/portal-data";

/* Student Homework = the Admin /homework module scoped to the student's own
   class-section. A student can only VIEW and submit — the create action stays
   with the teacher, matching the Student role's view-only permission set. */
const COLORS: Record<string, string> = {
  Open: "var(--theme-info)", "Due Soon": "var(--theme-warning)",
  Grading: "var(--theme-accent-2)", Closed: "var(--theme-success)",
};

export default function StudentHomeworkPage() {
  return (
    <PortalBoard
      title="My Homework"
      subtitle={`Assignments for ${PORTAL_STUDENT.cls}-${PORTAL_STUDENT.section} with due dates and class progress.`}
      Icon={NotebookPen}
      nameLabel="Assignment"
      rows={studentHomework}
      keyOf={(r) => r.id}
      nameOf={(r) => r.title}
      subtitleOf={(r) => `${r.subject} · ${r.teacher}`}
      searchTextOf={(r) => `${r.title} ${r.subject} ${r.teacher} ${r.status}`}
      searchPlaceholder="Search assignment or subject"
      scopeLabel={`${PORTAL_STUDENT.cls}-${PORTAL_STUDENT.section}`}
      countNoun="assignments"
      groupBy={(r) => r.status}
      groupColorOf={(k) => COLORS[k]}
      primaryAction={<Btn variant="primary" Icon={Upload}>Submit Assignment</Btn>}
      columns={[
        { key: "subject", label: "Subject", width: "140px", cell: (r) => r.subject },
        { key: "teacher", label: "Teacher", width: "150px", cell: (r) => r.teacher },
        { key: "assigned", label: "Assigned", width: "120px", cell: (r) => r.assigned },
        { key: "due", label: "Due Date", width: "120px", cell: (r) => r.due },
        { key: "progress", label: "Class Submissions", width: "minmax(160px,1fr)", cell: (r) => (
          <div className="min-w-[130px]">
            <ProgressMeter value={r.total ? (r.submitted / r.total) * 100 : 0} label={`${r.submitted}/${r.total}`} />
          </div>
        ) },
        { key: "status", label: "Status", width: "120px", cell: (r) => <StatusPill label={r.status} /> },
      ]}
      detailFields={(r) => [
        { label: "Title", value: r.title },
        { label: "Subject", value: r.subject },
        { label: "Class", value: `${r.cls}-${r.section}` },
        { label: "Teacher", value: r.teacher },
        { label: "Assigned", value: r.assigned },
        { label: "Due", value: r.due },
        { label: "Submissions", value: `${r.submitted} of ${r.total}` },
        { label: "Status", value: <StatusPill label={r.status} /> },
      ]}
      menu={(r) => [
        { label: r.status === "Closed" ? "View feedback" : "Submit work", Icon: Upload, onClick: () => {} },
      ]}
      emptyTitle="No homework assigned"
      emptyMessage="No assignments have been posted for your class yet."
      minWidth={980}
    />
  );
}
