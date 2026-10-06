"use client";

import Link from "next/link";
import { Award } from "lucide-react";
import { BranchBoard } from "@/components/branch/branch-board";
import { RESULTS, type ResultRow } from "@/lib/school-mock-data";

const gradeColor = (g: string) =>
  g.startsWith("A") ? "var(--theme-success)" : g.startsWith("B") ? "var(--theme-info)" : g.startsWith("C") ? "var(--theme-warning)" : "var(--theme-danger)";

export default function ResultsPage() {
  return (
    <BranchBoard<ResultRow>
      title="Results & Report Cards"
      subtitle="Published exam results with grades, percentages and class positions."
      Icon={Award}
      nameLabel="Student"
      countNoun="results"
      rows={RESULTS}
      groupBy={(r) => r.exam}
      nameOf={(r) => r.student}
      subtitleOf={(r) => `${r.cls}-${r.section} · ${r.exam}`}
      searchTextOf={(r) => `${r.student} ${r.cls} ${r.section} ${r.exam} ${r.grade}`}
      primaryAction={
        <Link href="/exams" className="inline-flex h-9 items-center gap-2 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 text-[14px] hover:bg-[var(--theme-hover)]">
          ← All Exams
        </Link>
      }
      columns={[
        { key: "marks", label: "Marks", width: "120px", cell: (r) => `${r.obtained} / ${r.total}` },
        { key: "pct", label: "%", width: "90px", cell: (r) => `${r.percentage}%` },
        { key: "grade", label: "Grade", width: "90px", cell: (r) => <span className="font-semibold" style={{ color: gradeColor(r.grade) }}>{r.grade}</span> },
        { key: "pos", label: "Position", width: "100px", cell: (r) => `#${r.position}` },
      ]}
      detailFields={(r) => [
        { label: "Student", value: r.student },
        { label: "Class", value: `${r.cls}-${r.section}` },
        { label: "Exam", value: r.exam },
        { label: "Marks", value: `${r.obtained} / ${r.total}` },
        { label: "Percentage", value: `${r.percentage}%` },
        { label: "Grade", value: r.grade },
        { label: "Class Position", value: `#${r.position}` },
      ]}
      mobileRows={(r) => [
        { label: "Class", value: `${r.cls}-${r.section}` },
        { label: "Marks", value: `${r.obtained}/${r.total}` },
        { label: "Grade", value: r.grade },
        { label: "Position", value: `#${r.position}` },
      ]}
      emptyTitle="No results"
      emptyMessage="No published results match the current campus scope."
    />
  );
}
