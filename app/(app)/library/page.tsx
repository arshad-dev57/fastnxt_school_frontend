"use client";

import Link from "next/link";
import { BookOpen, ArrowLeftRight } from "lucide-react";
import { BranchBoard } from "@/components/branch/branch-board";
import { StatusPill } from "@/components/board-kit";
import { BOOKS, type BookRow } from "@/lib/school-mock-data";

const COLORS: Record<string, string> = { Available: "var(--theme-success)", "Low Stock": "var(--theme-warning)", "Out of Stock": "var(--theme-danger)" };

export default function LibraryPage() {
  return (
    <BranchBoard<BookRow>
      title="Library Catalogue"
      subtitle="Book titles, categories and copy availability for the campus library."
      Icon={BookOpen}
      nameLabel="Title"
      countNoun="titles"
      rows={BOOKS}
      groupBy={(r) => r.status}
      groupColorOf={(k) => COLORS[k]}
      nameOf={(r) => r.title}
      subtitleOf={(r) => `${r.author} · ${r.category}`}
      searchTextOf={(r) => `${r.title} ${r.author} ${r.category} ${r.isbn}`}
      primaryAction={
        <Link href="/library/issue" className="ic-plus-btn inline-flex h-9 items-center gap-2 rounded bg-[var(--theme-primary)] px-3.5 text-[14px] font-medium text-white hover:bg-[var(--theme-primary-hover)]">
          <ArrowLeftRight className="ic-plus h-[18px] w-[18px]" /> Issue / Return
        </Link>
      }
      columns={[
        { key: "category", label: "Category", width: "140px", cell: (r) => r.category },
        { key: "isbn", label: "ISBN", width: "130px", cell: (r) => r.isbn },
        { key: "copies", label: "Copies", width: "100px", cell: (r) => r.copies },
        { key: "avail", label: "Available", width: "110px", cell: (r) => r.available },
        { key: "status", label: "Status", width: "130px", cell: (r) => <StatusPill label={r.status} /> },
      ]}
      detailFields={(r) => [
        { label: "Title", value: r.title },
        { label: "Author", value: r.author },
        { label: "Category", value: r.category },
        { label: "ISBN", value: r.isbn },
        { label: "Total Copies", value: r.copies },
        { label: "Available", value: r.available },
        { label: "Status", value: r.status },
      ]}
      mobileRows={(r) => [
        { label: "Category", value: r.category },
        { label: "Available", value: `${r.available} / ${r.copies}` },
        { label: "Status", value: <StatusPill label={r.status} /> },
      ]}
      emptyTitle="No books"
      emptyMessage="No catalogue entries match the current campus scope."
    />
  );
}
