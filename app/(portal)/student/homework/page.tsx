"use client";

import { useEffect, useState } from "react";
import { NotebookPen } from "lucide-react";
import { ProgressMeter } from "@/components/portal/portal-ui";
import { PortalBoard } from "@/components/portal/portal-board";
import { StatusPill } from "@/components/board-kit";
import { describeApiError, homeworkApi, type HomeworkItem } from "@/lib/auth/api-client";
import { useMyStudent } from "@/lib/hooks/use-my-student";

const COLORS: Record<string, string> = {
  Open: "var(--theme-info)",
  "Due Soon": "var(--theme-warning)",
  Grading: "var(--theme-accent-2)",
  Closed: "var(--theme-success)",
};

export default function StudentHomeworkPage() {
  const { student, loading: profileLoading, error: profileError, scopeLabel } = useMyStudent();
  const [rows, setRows] = useState<HomeworkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!student) {
      setRows([]);
      setLoading(profileLoading);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await homeworkApi.list({
          cls: student.cls,
          section: student.section,
          branchId: student.branchId || undefined,
        });
        if (!cancelled) setRows(res.homework ?? []);
      } catch (err) {
        if (!cancelled) {
          setError(describeApiError(err).message);
          setRows([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [student, profileLoading]);

  return (
    <>
      {(error || profileError) && (
        <p className="px-4 pt-3 text-[13px] text-[var(--theme-danger)] sm:px-6">{error || profileError}</p>
      )}
      <PortalBoard
        title="My Homework"
        subtitle={
          loading
            ? "Loading assignments…"
            : `Assignments for ${scopeLabel} with due dates and class progress.`
        }
        Icon={NotebookPen}
        nameLabel="Assignment"
        rows={rows}
        keyOf={(r) => r.id}
        nameOf={(r) => r.title}
        subtitleOf={(r) => `${r.subject} · ${r.teacher}`}
        searchTextOf={(r) => `${r.title} ${r.subject} ${r.teacher} ${r.status}`}
        searchPlaceholder="Search assignment or subject"
        scopeLabel={scopeLabel}
        countNoun="assignments"
        groupBy={(r) => r.status}
        groupColorOf={(k) => COLORS[k]}
        columns={[
          { key: "subject", label: "Subject", width: "140px", cell: (r) => r.subject },
          { key: "teacher", label: "Teacher", width: "150px", cell: (r) => r.teacher },
          { key: "assigned", label: "Assigned", width: "120px", cell: (r) => r.assigned },
          { key: "due", label: "Due Date", width: "120px", cell: (r) => r.due },
          {
            key: "progress",
            label: "Class Submissions",
            width: "minmax(160px,1fr)",
            cell: (r) => (
              <div className="min-w-[130px]">
                <ProgressMeter value={r.total ? (r.submitted / r.total) * 100 : 0} label={`${r.submitted}/${r.total}`} />
              </div>
            ),
          },
          { key: "status", label: "Status", width: "120px", cell: (r) => <StatusPill label={r.status} /> },
        ]}
        detailFields={(r) => [
          { label: "Title", value: r.title },
          { label: "Subject", value: r.subject },
          { label: "Class", value: `${r.cls}-${r.section}` },
          { label: "Teacher", value: r.teacher },
          { label: "Assigned", value: r.assigned },
          { label: "Due", value: r.due },
          { label: "Instructions", value: r.instructions || "—" },
          { label: "Submissions", value: `${r.submitted} of ${r.total}` },
          { label: "Status", value: <StatusPill label={r.status} /> },
        ]}
        emptyTitle="No homework"
        emptyMessage="No assignments have been posted for your class yet."
      />
    </>
  );
}
