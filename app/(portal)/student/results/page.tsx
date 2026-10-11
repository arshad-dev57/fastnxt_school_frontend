"use client";

import { useCallback, useEffect, useState } from "react";
import { Award } from "lucide-react";
import { EmptyState, PageHeader, StatCard } from "@/components/ui";
import { PortalBoard } from "@/components/portal/portal-board";
import { StatusPill } from "@/components/board-kit";
import { describeApiError, examsApi, type ExamResultItem } from "@/lib/auth/api-client";
import { useMyStudent } from "@/lib/hooks/use-my-student";

const gradeColor = (g: string) =>
  g.startsWith("A")
    ? "var(--theme-success)"
    : g.startsWith("B")
      ? "var(--theme-info)"
      : g.startsWith("C")
        ? "var(--theme-warning)"
        : "var(--theme-danger)";

export default function StudentResultsPage() {
  const { student, loading: profileLoading, error: profileError, scopeLabel } = useMyStudent();
  const [results, setResults] = useState<ExamResultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await examsApi.myResults();
      setResults(res.results ?? []);
    } catch (err) {
      setError(describeApiError(err).message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const latest = results[0];

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--theme-surface)]">
      <PageHeader
        title="My Results"
        subtitle={
          student
            ? `Published exam results for ${scopeLabel}.`
            : "Your published exam results"
        }
      />

      {(error || profileError) && (
        <p className="px-4 pt-2 text-[13px] text-[var(--theme-danger)] sm:px-6">
          {error || profileError}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 px-4 pt-4 sm:grid-cols-3 sm:px-6">
        <StatCard
          label="Published exams"
          value={results.length}
          Icon={Award}
          tone="blue"
          sub={loading || profileLoading ? "Loading…" : "With announced results"}
        />
        <StatCard
          label="Latest %"
          value={latest ? `${latest.percentage}%` : "—"}
          Icon={Award}
          tone="green"
          sub={latest?.exam || "No results yet"}
        />
        <StatCard
          label="Latest grade"
          value={latest?.grade || "—"}
          Icon={Award}
          tone="purple"
          sub={latest ? `Position #${latest.position}` : "—"}
        />
      </div>

      <div className="mt-2">
        {results.length === 0 && !loading ? (
          <div className="px-4 py-8 sm:px-6">
            <EmptyState
              Icon={Award}
              title="Results not published yet"
              message="When the school announces results for an exam, they will appear here with subject-wise marks."
            />
          </div>
        ) : (
          <PortalBoard
            title="Published results"
            subtitle="Only exams the school has officially announced."
            Icon={Award}
            nameLabel="Exam"
            rows={results}
            keyOf={(r) => `${r.examId}-${r.studentId}`}
            nameOf={(r) => r.exam}
            subtitleOf={(r) => `${r.cls}-${r.section} · Grade ${r.grade}`}
            searchTextOf={(r) => `${r.exam} ${r.grade} ${r.subjects.map((s) => s.subject).join(" ")}`}
            searchPlaceholder="Search exam"
            scopeLabel={scopeLabel}
            countNoun="results"
            groupBy={(r) => r.exam}
            groupColorOf={() => "var(--theme-info)"}
            columns={[
              { key: "marks", label: "Marks", width: "120px", cell: (r) => `${r.obtained}/${r.total}` },
              { key: "pct", label: "%", width: "90px", cell: (r) => `${r.percentage}%` },
              {
                key: "grade",
                label: "Grade",
                width: "90px",
                cell: (r) => (
                  <span className="font-semibold" style={{ color: gradeColor(r.grade) }}>
                    {r.grade}
                  </span>
                ),
              },
              { key: "pos", label: "Position", width: "100px", cell: (r) => `#${r.position}` },
              {
                key: "announced",
                label: "Announced",
                width: "130px",
                cell: (r) => r.resultAnnounceDate || r.publishedAt || "—",
              },
            ]}
            detailFields={(r) => [
              { label: "Exam", value: r.exam },
              { label: "Marks", value: `${r.obtained} / ${r.total}` },
              { label: "Percentage", value: `${r.percentage}%` },
              { label: "Grade", value: r.grade },
              { label: "Position", value: `#${r.position}` },
              {
                label: "Subjects",
                value: r.subjects.map((s) => `${s.subject}: ${s.obtained}/${s.total} (${s.grade})`).join(" · ") || "—",
              },
              { label: "Status", value: <StatusPill label={r.status} /> },
            ]}
            emptyTitle="No results"
            emptyMessage="No published results yet."
            minWidth={760}
          />
        )}
      </div>
    </div>
  );
}
