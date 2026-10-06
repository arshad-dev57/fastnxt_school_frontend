"use client";

import Link from "next/link";
import { ArrowLeftRight } from "lucide-react";
import { BranchBoard } from "@/components/branch/branch-board";
import { StatusPill } from "@/components/board-kit";
import { rs } from "@/components/ui";
import { BOOK_ISSUES, type BookIssueRow } from "@/lib/school-mock-data";

const COLORS: Record<string, string> = { Issued: "var(--theme-info)", Returned: "var(--theme-success)", Overdue: "var(--theme-danger)", Lost: "var(--theme-pending)" };

export default function LibraryIssuePage() {
  return (
    <BranchBoard<BookIssueRow>
      title="Issue & Return"
      subtitle="Borrowing records, due dates, overdue tracking and fines."
      Icon={ArrowLeftRight}
      nameLabel="Book"
      countNoun="records"
      rows={BOOK_ISSUES}
      groupBy={(r) => r.status}
      groupColorOf={(k) => COLORS[k]}
      nameOf={(r) => r.book}
      subtitleOf={(r) => `${r.member} · ${r.cls}`}
      searchTextOf={(r) => `${r.book} ${r.member} ${r.cls} ${r.status}`}
      primaryAction={
        <Link href="/library" className="inline-flex h-9 items-center gap-2 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 text-[14px] hover:bg-[var(--theme-hover)]">
          ← Catalogue
        </Link>
      }
      columns={[
        { key: "member", label: "Member", width: "minmax(150px,1fr)", cell: (r) => r.member },
        { key: "issue", label: "Issued", width: "120px", cell: (r) => r.issueDate },
        { key: "due", label: "Due", width: "120px", cell: (r) => r.dueDate },
        { key: "fine", label: "Fine", width: "100px", cell: (r) => (r.fine ? rs(r.fine) : "—") },
        { key: "status", label: "Status", width: "120px", cell: (r) => <StatusPill label={r.status} /> },
      ]}
      detailFields={(r) => [
        { label: "Book", value: r.book },
        { label: "Member", value: r.member },
        { label: "Class", value: r.cls },
        { label: "Issued", value: r.issueDate },
        { label: "Due", value: r.dueDate },
        { label: "Returned", value: r.returnDate },
        { label: "Fine", value: r.fine ? rs(r.fine) : "—" },
        { label: "Status", value: r.status },
      ]}
      mobileRows={(r) => [
        { label: "Member", value: r.member },
        { label: "Due", value: r.dueDate },
        { label: "Fine", value: r.fine ? rs(r.fine) : "—" },
        { label: "Status", value: <StatusPill label={r.status} /> },
      ]}
      emptyTitle="No borrowing records"
      emptyMessage="No issue/return records match the current campus scope."
    />
  );
}
