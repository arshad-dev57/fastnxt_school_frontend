"use client";

import { Award, Download, Printer } from "lucide-react";
import { Btn, Card, CardHead, PageHeader, StatCard } from "@/components/ui";
import { PortalBoard } from "@/components/portal/portal-board";
import { ProgressMeter } from "@/components/portal/portal-ui";
import { PORTAL_STUDENT, studentResults } from "@/lib/portal-data";

/* Student Results = the Admin /results module scoped to the student's own
   published result rows. Grade colouring is copied from the Admin page. */
const gradeColor = (g: string) =>
  g.startsWith("A") ? "var(--theme-success)" : g.startsWith("B") ? "var(--theme-info)" : g.startsWith("C") ? "var(--theme-warning)" : "var(--theme-danger)";

export default function StudentResultsPage() {
  const latest = studentResults[0];
  const best = studentResults.reduce((m, r) => (r.percentage > m.percentage ? r : m), studentResults[0]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--theme-surface)]">
      <PageHeader
        title="My Results"
        subtitle={`Published exam results for ${PORTAL_STUDENT.cls}-${PORTAL_STUDENT.section}.`}
        actions={<><Btn variant="secondary" Icon={Download}>Download</Btn><Btn variant="primary" Icon={Printer}>Print Report Card</Btn></>}
      />

      <div className="grid grid-cols-2 gap-3 px-4 pt-4 sm:grid-cols-4 sm:px-6">
        <StatCard label="Latest Percentage" value={latest ? `${latest.percentage}%` : "—"} Icon={Award} tone="blue" sub={latest?.exam ?? "No results"} />
        <StatCard label="Latest Grade" value={latest?.grade ?? "—"} Icon={Award} tone="green" sub={latest ? `${latest.obtained} / ${latest.total} marks` : "—"} />
        <StatCard label="Class Position" value={latest ? `#${latest.position}` : "—"} Icon={Award} tone="purple" sub={PORTAL_STUDENT.session} />
        <StatCard label="Best Result" value={best ? `${best.percentage}%` : "—"} Icon={Award} tone="orange" sub={best?.exam ?? "—"} />
      </div>

      <div className="mt-2">
        <PortalBoard
          title="Results & Report Cards"
          subtitle="Every published result with marks, grade and class position."
          Icon={Award}
          nameLabel="Exam"
          rows={studentResults}
          keyOf={(r) => r.id}
          nameOf={(r) => r.exam}
          subtitleOf={(r) => `${r.cls}-${r.section} · ${r.obtained} / ${r.total} marks`}
          searchTextOf={(r) => `${r.exam} ${r.grade} ${r.percentage}`}
          searchPlaceholder="Search exam or grade"
          scopeLabel={`${PORTAL_STUDENT.cls}-${PORTAL_STUDENT.section}`}
          countNoun="results"
          groupBy={(r) => r.exam}
          groupColorOf={() => "var(--theme-primary)"}
          columns={[
            { key: "marks", label: "Marks", width: "120px", cell: (r) => `${r.obtained} / ${r.total}` },
            { key: "pct", label: "%", width: "90px", cell: (r) => `${r.percentage}%` },
            { key: "bar", label: "Score", width: "minmax(150px,1fr)", cell: (r) => (
              <div className="min-w-[120px]"><ProgressMeter value={r.percentage} tone={gradeColor(r.grade)} label={`${r.percentage}%`} /></div>
            ) },
            { key: "grade", label: "Grade", width: "90px", cell: (r) => <span className="font-semibold" style={{ color: gradeColor(r.grade) }}>{r.grade}</span> },
            { key: "pos", label: "Position", width: "100px", cell: (r) => `#${r.position}` },
          ]}
          detailFields={(r) => [
            { label: "Exam", value: r.exam },
            { label: "Class", value: `${r.cls}-${r.section}` },
            { label: "Marks", value: `${r.obtained} / ${r.total}` },
            { label: "Percentage", value: `${r.percentage}%` },
            { label: "Grade", value: <span className="font-semibold" style={{ color: gradeColor(r.grade) }}>{r.grade}</span> },
            { label: "Class Position", value: `#${r.position}` },
          ]}
          emptyTitle="No results published"
          emptyMessage="Your exam results will appear here once they are published."
          minWidth={820}
        />
      </div>

      <div className="px-4 pb-24 sm:px-6">
        <Card pad={false}>
          <CardHead title="Grading scale" subtitle="Grades follow the Admin results module." Icon={Award} />
          <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
            {[{ g: "A+", r: "90 – 100" }, { g: "A", r: "80 – 89" }, { g: "B+", r: "70 – 79" }, { g: "B", r: "60 – 69" }].map((x) => (
              <div key={x.g} className="rounded-lg border border-[var(--theme-border)] px-3 py-2">
                <p className="text-[18px] font-bold" style={{ color: gradeColor(x.g) }}>{x.g}</p>
                <p className="text-[12px] text-[var(--theme-text-faint)]">{x.r}%</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
