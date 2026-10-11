"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Award, Mail, Megaphone, ShieldCheck } from "lucide-react";
import { BranchBoard } from "@/components/branch/branch-board";
import { Btn, Field, Input, Modal } from "@/components/ui";
import { useBranch } from "@/lib/branch-context";
import {
  describeApiError,
  examsApi,
  type ExamItem,
  type ExamResultItem,
} from "@/lib/auth/api-client";

const gradeColor = (g: string) =>
  g.startsWith("A")
    ? "var(--theme-success)"
    : g.startsWith("B")
      ? "var(--theme-info)"
      : g.startsWith("C")
        ? "var(--theme-warning)"
        : "var(--theme-danger)";

export default function ResultsPage() {
  const { currentBranchId } = useBranch();
  const [results, setResults] = useState<ExamResultItem[]>([]);
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [examId, setExamId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [announceDate, setAnnounceDate] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [publishing, setPublishing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [resRes, exRes] = await Promise.all([
        examsApi.listResults({
          examId: examId || undefined,
          branchId: currentBranchId !== "all" ? currentBranchId : undefined,
        }),
        examsApi.list({
          branchId: currentBranchId !== "all" ? currentBranchId : undefined,
        }),
      ]);
      setResults(resRes.results ?? []);
      setExams(exRes.exams ?? []);
    } catch (err) {
      setError(describeApiError(err).message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [currentBranchId, examId]);

  useEffect(() => {
    load();
  }, [load]);

  const selectedExam = exams.find((e) => e.id === examId) || null;

  const publish = async () => {
    if (!examId) return;
    setPublishing(true);
    try {
      const res = await examsApi.publish(examId, {
        resultAnnounceDate: announceDate || undefined,
        sendEmail,
      });
      alert(
        `Published. Notified ${res.studentsNotified} student(s)${
          sendEmail ? `, emailed ${res.emailsSent}` : ""
        }.`
      );
      setPublishOpen(false);
      await load();
    } catch (err) {
      alert(describeApiError(err).message);
    } finally {
      setPublishing(false);
    }
  };

  const verify = async () => {
    if (!examId) return;
    try {
      await examsApi.verify(examId);
      await load();
    } catch (err) {
      alert(describeApiError(err).message);
    }
  };

  return (
    <>
      <BranchBoard<ExamResultItem>
        title="Results & Report Cards"
        subtitle="Enter marks via Teachers → Exams, then verify and publish with announcement date + optional email."
        Icon={Award}
        nameLabel="Student"
        countNoun="results"
        rows={results}
        loading={loading}
        groupBy={(r) => r.exam}
        nameOf={(r) => r.student}
        subtitleOf={(r) => `${r.cls}-${r.section} · ${r.exam}`}
        searchTextOf={(r) => `${r.student} ${r.cls} ${r.section} ${r.exam} ${r.grade}`}
        toolbar={
          <label className="flex items-center gap-2 text-[13px] text-[var(--theme-text-muted)]">
            Exam
            <select
              value={examId}
              onChange={(e) => setExamId(e.target.value)}
              className="h-9 rounded border border-[var(--theme-border)] bg-[var(--theme-surface)] px-2 text-[13px]"
            >
              <option value="">All exams</option>
              {exams.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.status})
                </option>
              ))}
            </select>
          </label>
        }
        primaryAction={
          <>
            <Link
              href="/exams"
              className="hidden h-9 items-center gap-2 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 text-[14px] hover:bg-[var(--theme-hover)] lg:inline-flex"
            >
              ← Exams
            </Link>
            {examId && selectedExam?.status !== "Published" ? (
              <>
                <Btn size="sm" variant="secondary" Icon={ShieldCheck} onClick={verify}>
                  Verify
                </Btn>
                <Btn
                  size="sm"
                  variant="primary"
                  Icon={Megaphone}
                  onClick={() => {
                    setAnnounceDate(
                      selectedExam?.resultAnnounceDate ||
                        new Date().toISOString().slice(0, 10)
                    );
                    setPublishOpen(true);
                  }}
                >
                  Publish results
                </Btn>
              </>
            ) : null}
          </>
        }
        columns={[
          { key: "marks", label: "Marks", width: "120px", cell: (r) => `${r.obtained} / ${r.total}` },
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
          { key: "status", label: "Status", width: "120px", cell: (r) => r.status },
        ]}
        detailFields={(r) => [
          { label: "Student", value: r.student },
          { label: "Class", value: `${r.cls}-${r.section}` },
          { label: "Exam", value: r.exam },
          { label: "Marks", value: `${r.obtained} / ${r.total}` },
          { label: "Percentage", value: `${r.percentage}%` },
          { label: "Grade", value: r.grade },
          { label: "Class Position", value: `#${r.position}` },
          {
            label: "Subjects",
            value: r.subjects.map((s) => `${s.subject}: ${s.obtained}/${s.total}`).join(", ") || "—",
          },
          { label: "Announced", value: r.resultAnnounceDate || r.publishedAt || "—" },
        ]}
        mobileRows={(r) => [
          { label: "Class", value: `${r.cls}-${r.section}` },
          { label: "Marks", value: `${r.obtained}/${r.total}` },
          { label: "Grade", value: r.grade },
          { label: "Position", value: `#${r.position}` },
        ]}
        emptyTitle="No results"
        emptyMessage={
          error ||
          "No marks yet. Teachers enter subject marks after the date sheet; then admin verifies and publishes."
        }
      />

      <Modal
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        title="Publish & announce results"
        subtitle={selectedExam?.name}
        width="max-w-md"
        footer={
          <>
            <Btn variant="secondary" onClick={() => setPublishOpen(false)}>
              Cancel
            </Btn>
            <Btn
              variant="primary"
              Icon={Mail}
              loading={publishing}
              loadingLabel="Publishing…"
              onClick={publish}
            >
              Publish{sendEmail ? " + email" : ""}
            </Btn>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Result announcement date">
            <Input type="date" value={announceDate} onChange={(e) => setAnnounceDate(e.target.value)} />
          </Field>
          <label className="flex items-center gap-2 text-[13px]">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              className="h-4 w-4 accent-[var(--theme-primary)]"
            />
            Email students who have a login email on file
          </label>
        </div>
      </Modal>
    </>
  );
}
