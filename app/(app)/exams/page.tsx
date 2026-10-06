"use client";

import Link from "next/link";
import { GraduationCap, CalendarDays, Award } from "lucide-react";
import { BranchBoard } from "@/components/branch/branch-board";
import { StatusPill } from "@/components/board-kit";
import { EXAMS, type ExamRow } from "@/lib/school-mock-data";

const COLORS: Record<string, string> = {
  Scheduled: "var(--theme-info)", "Marks Entry": "var(--theme-warning)", Verification: "var(--theme-accent-2)",
  Published: "var(--theme-success)", Draft: "var(--theme-pending)",
};

export default function ExamsPage() {
  return (
    <BranchBoard<ExamRow>
      title="Examinations"
      subtitle="Exam lifecycle — schedule, marks entry, verification and publication."
      Icon={GraduationCap}
      nameLabel="Exam"
      countNoun="exams"
      rows={EXAMS}
      groupBy={(r) => r.status}
      groupColorOf={(k) => COLORS[k]}
      nameOf={(r) => r.name}
      subtitleOf={(r) => `${r.type} · ${r.session}`}
      searchTextOf={(r) => `${r.name} ${r.type} ${r.session} ${r.status}`}
      primaryAction={
        <>
          <Link href="/exams/schedule" className="hidden h-9 items-center gap-2 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 text-[14px] hover:bg-[var(--theme-hover)] lg:inline-flex">
            <CalendarDays className="h-[18px] w-[18px]" /> Date Sheet
          </Link>
          <Link href="/results" className="ic-plus-btn inline-flex h-9 items-center gap-2 rounded bg-[var(--theme-primary)] px-3.5 text-[14px] font-medium text-white hover:bg-[var(--theme-primary-hover)]">
            <Award className="ic-plus h-[18px] w-[18px]" /> Results
          </Link>
        </>
      }
      columns={[
        { key: "type", label: "Type", width: "120px", cell: (r) => r.type },
        { key: "session", label: "Session", width: "120px", cell: (r) => r.session },
        { key: "start", label: "Start", width: "120px", cell: (r) => r.startDate },
        { key: "end", label: "End", width: "120px", cell: (r) => r.endDate },
        { key: "classes", label: "Classes", width: "90px", cell: (r) => r.classes },
        { key: "status", label: "Status", width: "130px", cell: (r) => <StatusPill label={r.status} /> },
      ]}
      detailFields={(r) => [
        { label: "Exam", value: r.name },
        { label: "Type", value: r.type },
        { label: "Session", value: r.session },
        { label: "Start", value: r.startDate },
        { label: "End", value: r.endDate },
        { label: "Classes", value: r.classes },
        { label: "Status", value: r.status },
      ]}
      mobileRows={(r) => [
        { label: "Type", value: r.type },
        { label: "Session", value: r.session },
        { label: "Start", value: r.startDate },
        { label: "Status", value: <StatusPill label={r.status} /> },
      ]}
      emptyTitle="No exams"
      emptyMessage="No exams match the current campus scope or search."
    />
  );
}
