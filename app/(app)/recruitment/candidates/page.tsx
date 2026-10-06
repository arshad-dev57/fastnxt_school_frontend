"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import { BranchBoard } from "@/components/branch/branch-board";
import { StatusPill } from "@/components/board-kit";
import { CANDIDATES, type CandidateRow } from "@/lib/school-mock-data";

const COLORS: Record<string, string> = {
  Applied: "var(--theme-pending)", Shortlisted: "var(--theme-info)", Interview: "var(--theme-accent-2)",
  Selected: "var(--theme-success)", Joined: "var(--theme-success)", Rejected: "var(--theme-danger)",
};

export default function CandidatesPage() {
  return (
    <BranchBoard<CandidateRow>
      title="Candidate Pipeline"
      subtitle="Applied → shortlisted → interview → selected → joined."
      Icon={Users}
      nameLabel="Candidate"
      countNoun="candidates"
      rows={CANDIDATES}
      groupBy={(r) => r.stage}
      groupColorOf={(k) => COLORS[k]}
      nameOf={(r) => r.name}
      subtitleOf={(r) => r.role}
      searchTextOf={(r) => `${r.name} ${r.role} ${r.stage}`}
      primaryAction={
        <Link href="/recruitment" className="inline-flex h-9 items-center gap-2 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 text-[14px] hover:bg-[var(--theme-hover)]">
          ← Job Openings
        </Link>
      }
      columns={[
        { key: "role", label: "Applied For", width: "minmax(170px,1.3fr)", cell: (r) => r.role },
        { key: "date", label: "Interview", width: "130px", cell: (r) => r.interviewDate },
        { key: "rating", label: "Rating", width: "100px", cell: (r) => (r.rating ? `${r.rating}/5` : "—") },
        { key: "status", label: "Stage", width: "130px", cell: (r) => <StatusPill label={r.stage} /> },
      ]}
      detailFields={(r) => [
        { label: "Candidate", value: r.name },
        { label: "Applied For", value: r.role },
        { label: "Stage", value: r.stage },
        { label: "Interview Date", value: r.interviewDate },
        { label: "Rating", value: r.rating ? `${r.rating}/5` : "—" },
        { label: "Record Status", value: r.status },
      ]}
      mobileRows={(r) => [
        { label: "Role", value: r.role },
        { label: "Interview", value: r.interviewDate },
        { label: "Rating", value: r.rating ? `${r.rating}/5` : "—" },
        { label: "Stage", value: <StatusPill label={r.stage} /> },
      ]}
      emptyTitle="No candidates"
      emptyMessage="No candidates match the current campus scope."
    />
  );
}
