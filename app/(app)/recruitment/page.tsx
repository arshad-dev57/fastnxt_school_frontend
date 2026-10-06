"use client";

import Link from "next/link";
import { Briefcase, Users } from "lucide-react";
import { BranchBoard } from "@/components/branch/branch-board";
import { StatusPill } from "@/components/board-kit";
import { JOB_OPENINGS, type JobRow } from "@/lib/school-mock-data";

const COLORS: Record<string, string> = { Open: "var(--theme-success)", "On Hold": "var(--theme-warning)", Closed: "var(--theme-pending)" };

export default function RecruitmentPage() {
  return (
    <BranchBoard<JobRow>
      title="Recruitment — Job Openings"
      subtitle="Active vacancies, applicant counts and hiring status per campus."
      Icon={Briefcase}
      nameLabel="Position"
      countNoun="openings"
      rows={JOB_OPENINGS}
      groupBy={(r) => r.status}
      groupColorOf={(k) => COLORS[k]}
      nameOf={(r) => r.title}
      subtitleOf={(r) => `${r.department} · ${r.type}`}
      searchTextOf={(r) => `${r.title} ${r.department} ${r.type} ${r.status}`}
      primaryAction={
        <Link href="/recruitment/candidates" className="ic-plus-btn inline-flex h-9 items-center gap-2 rounded bg-[var(--theme-primary)] px-3.5 text-[14px] font-medium text-white hover:bg-[var(--theme-primary-hover)]">
          <Users className="ic-plus h-[18px] w-[18px]" /> Candidates
        </Link>
      }
      columns={[
        { key: "dept", label: "Department", width: "minmax(130px,1fr)", cell: (r) => r.department },
        { key: "type", label: "Type", width: "110px", cell: (r) => r.type },
        { key: "pos", label: "Positions", width: "100px", cell: (r) => r.positions },
        { key: "apps", label: "Applicants", width: "110px", cell: (r) => r.applicants },
        { key: "closing", label: "Closing", width: "120px", cell: (r) => r.closing },
        { key: "status", label: "Status", width: "110px", cell: (r) => <StatusPill label={r.status} /> },
      ]}
      detailFields={(r) => [
        { label: "Position", value: r.title },
        { label: "Department", value: r.department },
        { label: "Type", value: r.type },
        { label: "Positions", value: r.positions },
        { label: "Applicants", value: r.applicants },
        { label: "Posted", value: r.posted },
        { label: "Closing", value: r.closing },
        { label: "Status", value: r.status },
      ]}
      mobileRows={(r) => [
        { label: "Department", value: r.department },
        { label: "Applicants", value: r.applicants },
        { label: "Closing", value: r.closing },
        { label: "Status", value: <StatusPill label={r.status} /> },
      ]}
      emptyTitle="No job openings"
      emptyMessage="No vacancies match the current campus scope."
    />
  );
}
