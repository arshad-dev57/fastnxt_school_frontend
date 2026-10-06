"use client";

import { BookOpen, Search } from "lucide-react";
import { Badge, Card, CardHead, EmptyState, PageHeader, StatCard, rs } from "@/components/ui";
import { PortalBoard } from "@/components/portal/portal-board";
import { StatusPill } from "@/components/board-kit";
import { STUDENT_FULL_NAME, studentBookIssues, studentBorrowedTitles } from "@/lib/portal-data";
import { BOOKS } from "@/lib/school-mock-data";

/* Student Library = the Admin /library (catalogue) + /library/issue modules.
   A student may browse the catalogue and see their own loans — issuing and
   returning stay with the Librarian role, exactly as branch-access defines. */
const ISSUE_COLORS: Record<string, string> = {
  Issued: "var(--theme-info)", Returned: "var(--theme-success)", Overdue: "var(--theme-danger)", Lost: "var(--theme-danger)",
};

export default function StudentLibraryPage() {
  const overdue = studentBookIssues.filter((b) => b.status === "Overdue");
  const fines = studentBookIssues.reduce((s, b) => s + b.fine, 0);
  const catalogue = BOOKS.map((b) => ({ ...b, borrowed: studentBorrowedTitles.has(b.title) }));

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--theme-surface)]">
      <PageHeader title="Library" subtitle={`Catalogue and issued books for ${STUDENT_FULL_NAME}.`} />

      <div className="grid grid-cols-3 gap-3 px-4 pt-4 sm:px-6">
        <StatCard label="Books Issued" value={studentBookIssues.length} Icon={BookOpen} tone="blue" sub="Currently with you" />
        <StatCard label="Overdue" value={overdue.length} Icon={BookOpen} tone={overdue.length ? "red" : "green"} sub="Past due date" />
        <StatCard label="Outstanding Fine" value={rs(fines)} Icon={BookOpen} tone={fines ? "orange" : "green"} sub="Pay at the library desk" />
      </div>

      <div className="mt-2">
        <PortalBoard
          title="My Borrowed Books"
          subtitle="Issue date, due date and any fine accrued on each loan."
          Icon={BookOpen}
          nameLabel="Book"
          rows={studentBookIssues}
          keyOf={(r) => r.id}
          nameOf={(r) => r.book}
          subtitleOf={(r) => `Issued ${r.issueDate}`}
          searchTextOf={(r) => `${r.book} ${r.status} ${r.issueDate} ${r.dueDate}`}
          searchPlaceholder="Search book"
          scopeLabel="My loans"
          countNoun="loans"
          groupBy={(r) => r.status}
          groupColorOf={(k) => ISSUE_COLORS[k]}
          columns={[
            { key: "issue", label: "Issue Date", width: "120px", cell: (r) => r.issueDate },
            { key: "due", label: "Due Date", width: "120px", cell: (r) => r.dueDate },
            { key: "return", label: "Returned", width: "120px", cell: (r) => r.returnDate },
            { key: "fine", label: "Fine", width: "110px", cell: (r) => (r.fine > 0 ? <span className="font-medium text-[var(--theme-danger-text)]">{rs(r.fine)}</span> : "—") },
            { key: "status", label: "Status", width: "120px", cell: (r) => <StatusPill label={r.status} /> },
          ]}
          detailFields={(r) => [
            { label: "Book", value: r.book },
            { label: "Member", value: r.member },
            { label: "Class", value: r.cls },
            { label: "Issue Date", value: r.issueDate },
            { label: "Due Date", value: r.dueDate },
            { label: "Return Date", value: r.returnDate },
            { label: "Fine", value: r.fine > 0 ? rs(r.fine) : "—" },
            { label: "Status", value: <StatusPill label={r.status} /> },
          ]}
          emptyTitle="No books issued"
          emptyMessage="You have no books on loan from the library right now."
          minWidth={760}
        />
      </div>

      <div className="px-4 pb-24 sm:px-6">
        {/* CATALOGUE — Admin /library, read-only for the student */}
        <Card pad={false} className="mt-2">
          <CardHead title="Library Catalogue" subtitle={`${BOOKS.length} titles available`} Icon={Search} />
          {catalogue.length === 0 ? (
            <EmptyState Icon={BookOpen} title="No titles" message="The catalogue is empty." />
          ) : (
            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {catalogue.map((b) => (
                <div key={b.id} className="flex items-start gap-3 rounded-lg border border-[var(--theme-border)] p-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--theme-primary-soft)] text-[var(--theme-primary-hover)]">
                    <BookOpen className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium">{b.title}</p>
                    <p className="truncate text-[12px] text-[var(--theme-text-muted)]">{b.author}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <Badge label={b.category} tone="gray" />
                      {b.borrowed && <Badge label="With you" tone="blue" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
