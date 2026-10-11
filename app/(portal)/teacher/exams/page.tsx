"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CalendarDays,
  FileUp,
  GraduationCap,
  MapPin,
  Paperclip,
  Save,
  Upload,
  X,
} from "lucide-react";
import {
  Btn,
  Card,
  CardHead,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  StatCard,
  Textarea,
  cn,
} from "@/components/ui";
import { PortalBoard } from "@/components/portal/portal-board";
import { StatusPill } from "@/components/board-kit";
import { useAuth } from "@/lib/auth/auth-context";
import {
  describeApiError,
  examsApi,
  uploadsApi,
  type ExamItem,
  type ExamMarkRosterRow,
  type ExamMarkSubjectOption,
  type ExamPaperFile,
  type ExamPaperTaskItem,
} from "@/lib/auth/api-client";

const PAPER_COLORS: Record<string, string> = {
  Pending: "var(--theme-warning)",
  Upcoming: "var(--theme-info)",
  Submitted: "var(--theme-success)",
  Approved: "var(--theme-success)",
  Rejected: "var(--theme-danger)",
  Overdue: "var(--theme-danger)",
};

export default function TeacherExamsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"papers" | "marks">("papers");
  const [tasks, setTasks] = useState<ExamPaperTaskItem[]>([]);
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitTask, setSubmitTask] = useState<ExamPaperTaskItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Marks entry state
  const [examId, setExamId] = useState("");
  const [subjects, setSubjects] = useState<ExamMarkSubjectOption[]>([]);
  const [subjectKey, setSubjectKey] = useState("");
  const [roster, setRoster] = useState<ExamMarkRosterRow[]>([]);
  const [obtained, setObtained] = useState<Record<string, string>>({});
  const [totals, setTotals] = useState<Record<string, string>>({});
  const [marksLoading, setMarksLoading] = useState(false);
  const [marksSaving, setMarksSaving] = useState(false);
  const [marksSaved, setMarksSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [paperRes, examRes] = await Promise.all([
        examsApi.myPapers(),
        examsApi.list().catch(() => ({ exams: [] as ExamItem[] })),
      ]);
      setTasks(paperRes.tasks ?? []);
      const list = (examRes.exams ?? []).filter((e) => e.status !== "Draft");
      setExams(list);
      if (!examId && list[0]) setExamId(list[0].id);
    } catch (err) {
      setError(describeApiError(err).message);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!examId || tab !== "marks") return;
    let cancelled = false;
    (async () => {
      try {
        const res = await examsApi.listMarkSubjects(examId);
        if (cancelled) return;
        const list = res.subjects ?? [];
        setSubjects(list);
        const first = list[0];
        setSubjectKey(first ? `${first.cls}|${first.section || "A"}|${first.subject}` : "");
      } catch (err) {
        if (!cancelled) {
          setSubjects([]);
          setError(describeApiError(err).message);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [examId, tab]);

  const selectedSubject = subjects.find(
    (s) => `${s.cls}|${s.section || "A"}|${s.subject}` === subjectKey
  );

  useEffect(() => {
    if (!examId || !selectedSubject || tab !== "marks") {
      setRoster([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setMarksLoading(true);
      setMarksSaved(false);
      try {
        const res = await examsApi.marksRoster(examId, {
          cls: selectedSubject.cls,
          section: selectedSubject.section || "A",
          subject: selectedSubject.subject,
        });
        if (cancelled) return;
        setRoster(res.roster ?? []);
        const o: Record<string, string> = {};
        const t: Record<string, string> = {};
        for (const row of res.roster ?? []) {
          o[row.studentId] = row.obtained == null ? "" : String(row.obtained);
          t[row.studentId] = String(row.total || 100);
        }
        setObtained(o);
        setTotals(t);
      } catch (err) {
        if (!cancelled) {
          setError(describeApiError(err).message);
          setRoster([]);
        }
      } finally {
        if (!cancelled) setMarksLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [examId, selectedSubject, tab]);

  const pending = tasks.filter(
    (t) => t.paperStatus === "Pending" || t.paperStatus === "Overdue" || t.paperStatus === "Rejected"
  ).length;
  const submitted = tasks.filter(
    (t) => t.paperStatus === "Submitted" || t.paperStatus === "Approved"
  ).length;

  const handleSubmit = async (data: { note: string; files: ExamPaperFile[] }) => {
    if (!submitTask) return;
    setSaving(true);
    setError(null);
    try {
      await examsApi.submitPaper({
        examId: submitTask.examId,
        slotId: submitTask.slotId,
        cls: submitTask.cls,
        section: submitTask.section,
        subject: submitTask.subject,
        note: data.note,
        files: data.files,
        teacherName: user?.name,
      });
      setSubmitTask(null);
      await load();
    } catch (err) {
      setError(describeApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  const saveMarks = async () => {
    if (!examId || !selectedSubject || roster.length === 0) return;
    setMarksSaving(true);
    setError(null);
    try {
      await examsApi.saveMarks(examId, {
        cls: selectedSubject.cls,
        section: selectedSubject.section || "A",
        subject: selectedSubject.subject,
        slotId: selectedSubject.slotId,
        records: roster.map((r) => ({
          studentId: r.studentId,
          obtained: Number(obtained[r.studentId] || 0),
          total: Number(totals[r.studentId] || 100),
        })),
      });
      setMarksSaved(true);
    } catch (err) {
      setError(describeApiError(err).message);
    } finally {
      setMarksSaving(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--theme-surface)]">
      <PageHeader
        title="Exams & Results"
        subtitle={`Question papers and marks entry for ${user?.name || "teacher"}.`}
        actions={
          tab === "marks" ? (
            <Btn
              variant="primary"
              Icon={Save}
              onClick={saveMarks}
              loading={marksSaving}
              loadingLabel="Saving…"
              disabled={!selectedSubject || roster.length === 0}
            >
              Save marks
            </Btn>
          ) : null
        }
      />

      <div className="px-4 pt-2 sm:px-6">
        <div className="mb-3 flex gap-2 border-b border-[var(--theme-border)]">
          {(
            [
              ["papers", "Question papers"],
              ["marks", "Enter marks"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                "border-b-2 px-3 py-2 text-[14px] font-medium",
                tab === key
                  ? "border-[var(--theme-primary)] text-[var(--theme-primary)]"
                  : "border-transparent text-[var(--theme-text-muted)]"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p className="px-4 text-[13px] text-[var(--theme-danger)] sm:px-6">{error}</p>
      ) : null}

      {tab === "papers" ? (
        <>
          <div className="grid grid-cols-2 gap-3 px-4 pt-2 sm:grid-cols-4 sm:px-6">
            <StatCard label="Paper tasks" value={tasks.length} Icon={GraduationCap} tone="blue" sub="Assigned to you" />
            <StatCard label="Pending" value={pending} Icon={Upload} tone="orange" sub="Need submission" />
            <StatCard label="Submitted" value={submitted} Icon={FileUp} tone="green" sub="Sent to admin" />
            <StatCard
              label="Upcoming"
              value={tasks.filter((t) => t.paperStatus === "Upcoming").length}
              Icon={CalendarDays}
              tone="purple"
              sub="Window not open"
            />
          </div>

          <div className="mt-2">
            <PortalBoard
              title="My question paper tasks"
              subtitle={
                loading
                  ? "Loading…"
                  : "Submit PDF / Word / image of the question paper within the given dates."
              }
              Icon={FileUp}
              nameLabel="Paper"
              rows={tasks}
              keyOf={(r) => r.id}
              nameOf={(r) => `${r.subject} · ${r.cls}${r.section ? `-${r.section}` : ""}`}
              subtitleOf={(r) => `${r.exam} · due ${r.paperSubmitTo || "—"}`}
              searchTextOf={(r) => `${r.exam} ${r.cls} ${r.subject} ${r.paperStatus}`}
              searchPlaceholder="Search paper task"
              scopeLabel="My subjects"
              countNoun="tasks"
              groupBy={(r) => r.paperStatus}
              groupColorOf={(k) => PAPER_COLORS[k] ?? "var(--theme-primary)"}
              columns={[
                { key: "exam", label: "Exam", width: "160px", cell: (r) => r.exam },
                {
                  key: "class",
                  label: "Class",
                  width: "110px",
                  cell: (r) => `${r.cls}${r.section ? `-${r.section}` : ""}`,
                },
                { key: "subject", label: "Subject", width: "130px", cell: (r) => r.subject },
                { key: "paperDate", label: "Paper date", width: "120px", cell: (r) => r.paperDate },
                {
                  key: "window",
                  label: "Submit by",
                  width: "120px",
                  cell: (r) => r.paperSubmitTo || "—",
                },
                {
                  key: "status",
                  label: "Status",
                  width: "120px",
                  cell: (r) => <StatusPill label={r.paperStatus} />,
                },
              ]}
              detailFields={(r) => [
                { label: "Exam", value: r.exam },
                { label: "Class", value: `${r.cls}${r.section ? `-${r.section}` : ""}` },
                { label: "Subject", value: r.subject },
                { label: "Paper date", value: `${r.paperDate} · ${r.startTime}–${r.endTime}` },
                {
                  label: "Submit window",
                  value: `${r.paperSubmitFrom || "—"} → ${r.paperSubmitTo || "—"}`,
                },
                { label: "Status", value: <StatusPill label={r.paperStatus} /> },
              ]}
              menu={(r) =>
                r.paperStatus === "Upcoming"
                  ? []
                  : [
                      {
                        label: r.submission ? "Resubmit paper" : "Submit question paper",
                        Icon: Upload,
                        onClick: () => setSubmitTask(r),
                      },
                    ]
              }
              emptyTitle="No paper tasks"
              emptyMessage="When admin publishes the date sheet for your subjects, tasks appear here."
              minWidth={920}
            />
          </div>

          <div className="px-4 pb-24 pt-2 sm:px-6">
            <Card pad={false}>
              <CardHead title="Invigilation / paper schedule" subtitle="Your assigned paper slots" Icon={CalendarDays} />
              {tasks.length === 0 ? (
                <p className="px-4 py-6 text-center text-[14px] text-[var(--theme-text-muted)]">No exam duties yet.</p>
              ) : (
                <div className="divide-y divide-[var(--theme-border)]">
                  {tasks.map((d) => (
                    <div key={d.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-medium">{d.subject}</p>
                        <p className="truncate text-[13px] text-[var(--theme-text-muted)]">
                          {d.exam} · {d.cls}
                          {d.section ? `-${d.section}` : ""}
                        </p>
                      </div>
                      <span className="flex shrink-0 items-center gap-1.5 text-[13px] text-[var(--theme-text-muted)]">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {d.paperDate}
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5 text-[13px] text-[var(--theme-text-muted)]">
                        <MapPin className="h-3.5 w-3.5" />
                        {d.room || "—"}
                      </span>
                      <StatusPill label={d.paperStatus} />
                      {d.paperStatus !== "Upcoming" ? (
                        <Btn variant="secondary" onClick={() => setSubmitTask(d)}>
                          {d.submission ? "Resubmit" : "Submit paper"}
                        </Btn>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      ) : (
        <div className="px-4 pb-24 sm:px-6">
          <div className="mb-3 flex flex-wrap items-end gap-3">
            <Field label="Exam" className="min-w-[220px]">
              <select
                value={examId}
                onChange={(e) => setExamId(e.target.value)}
                className="h-10 w-full rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 text-[14px]"
              >
                <option value="">Select exam</option>
                {exams.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.status})
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Class / Subject" className="min-w-[240px] flex-1">
              <select
                value={subjectKey}
                onChange={(e) => setSubjectKey(e.target.value)}
                className="h-10 w-full rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 text-[14px]"
              >
                <option value="">Select subject from date sheet</option>
                {subjects.map((s) => (
                  <option key={`${s.slotId}-${s.subject}`} value={`${s.cls}|${s.section || "A"}|${s.subject}`}>
                    {s.cls}
                    {s.section ? `-${s.section}` : ""} · {s.subject}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Card pad={false}>
            <CardHead
              title={
                selectedSubject
                  ? `Marks — ${selectedSubject.cls}${selectedSubject.section ? `-${selectedSubject.section}` : ""} · ${selectedSubject.subject}`
                  : "Marks entry"
              }
              subtitle="Enter obtained / total for each student after the paper is conducted."
              Icon={GraduationCap}
            />
            {marksLoading ? (
              <p className="px-4 py-8 text-center text-[13px] text-[var(--theme-text-muted)]">Loading roster…</p>
            ) : !selectedSubject ? (
              <EmptyState
                Icon={GraduationCap}
                title="Pick an exam subject"
                message="Subjects come from the admin date sheet assigned to you."
              />
            ) : roster.length === 0 ? (
              <EmptyState Icon={GraduationCap} title="No students" message="No active students in this class-section." />
            ) : (
              <div className="divide-y divide-[var(--theme-border)]">
                <div className="hidden grid-cols-[1fr_100px_100px_80px] gap-3 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--theme-text-faint)] md:grid">
                  <span>Student</span>
                  <span>Obtained</span>
                  <span>Total</span>
                  <span>%</span>
                </div>
                {roster.map((r) => {
                  const o = Number(obtained[r.studentId] || 0);
                  const t = Number(totals[r.studentId] || 100) || 100;
                  const pct = t > 0 ? Math.round((o / t) * 1000) / 10 : 0;
                  return (
                    <div
                      key={r.studentId}
                      className="grid grid-cols-1 gap-2 px-4 py-3 md:grid-cols-[1fr_100px_100px_80px] md:items-center md:gap-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-medium">{r.student}</p>
                        <p className="text-[12px] text-[var(--theme-text-faint)]">{r.studentCode || r.studentId}</p>
                      </div>
                      <Input
                        type="number"
                        min={0}
                        value={obtained[r.studentId] ?? ""}
                        onChange={(e) =>
                          setObtained((m) => ({ ...m, [r.studentId]: e.target.value }))
                        }
                      />
                      <Input
                        type="number"
                        min={1}
                        value={totals[r.studentId] ?? "100"}
                        onChange={(e) =>
                          setTotals((m) => ({ ...m, [r.studentId]: e.target.value }))
                        }
                      />
                      <span className="text-[13px] font-medium tabular-nums">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
          {marksSaved ? (
            <p className="mt-3 text-[13px] text-[var(--theme-success-text)]">
              Marks saved. Admin can verify and publish results from Results page.
            </p>
          ) : null}
        </div>
      )}

      <SubmitPaperModal
        task={submitTask}
        open={!!submitTask}
        saving={saving}
        onClose={() => setSubmitTask(null)}
        onSave={handleSubmit}
      />
    </div>
  );
}

function SubmitPaperModal({
  open,
  onClose,
  onSave,
  saving,
  task,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: { note: string; files: ExamPaperFile[] }) => Promise<void>;
  saving: boolean;
  task: ExamPaperTaskItem | null;
}) {
  const [note, setNote] = useState("");
  const [files, setFiles] = useState<ExamPaperFile[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setNote("");
    setFiles([]);
  }, [open, task?.id]);

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    setUploading(true);
    try {
      const uploaded: ExamPaperFile[] = [];
      for (const file of Array.from(list)) {
        const res = await uploadsApi.upload(file, { purpose: "exam-paper", folder: "exams/papers" });
        uploaded.push({
          name: res.upload.name || file.name,
          type: res.upload.type || file.type,
          size: res.upload.size || file.size,
          url: res.upload.url,
          publicId: res.upload.publicId,
        });
      }
      setFiles((prev) => [...prev, ...uploaded]);
    } catch (err) {
      alert(describeApiError(err).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      width="max-w-lg"
      title="Submit question paper"
      subtitle={
        task
          ? `${task.subject} · ${task.cls}${task.section ? `-${task.section}` : ""} · ${task.exam}`
          : ""
      }
      footer={
        <>
          <Btn variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Btn>
          <Btn
            variant="primary"
            loading={saving}
            loadingLabel="Submitting…"
            disabled={!files.length || uploading}
            onClick={() => onSave({ note, files })}
          >
            Send to admin
          </Btn>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-[13px] text-[var(--theme-text-muted)]">
          Submit between {task?.paperSubmitFrom || "—"} and {task?.paperSubmitTo || "—"}. Accepts
          PDF, Word, or image.
        </p>
        <Field label="Question paper file / image">
          <input
            type="file"
            accept="image/*,.pdf,.doc,.docx"
            multiple
            onChange={(e) => onFiles(e.target.files)}
            className="block w-full text-xs text-[var(--theme-text-muted)] file:mr-3 file:rounded-md file:border-0 file:bg-[var(--theme-primary-soft)] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[var(--theme-primary)]"
          />
          {files.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {files.map((f, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 rounded-md border border-[var(--theme-border)] px-2.5 py-1 text-xs"
                >
                  <Paperclip className="h-3.5 w-3.5" />
                  <span className="max-w-[180px] truncate">{f.name}</span>
                  <button
                    type="button"
                    onClick={() => setFiles((prev) => prev.filter((_, i) => i !== idx))}
                    className="text-[var(--theme-text-muted)] hover:text-[var(--theme-danger)]"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </Field>
        <Field label="Note (optional)">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="e.g. Total marks 50, MCQs + short questions"
          />
        </Field>
      </div>
    </Modal>
  );
}
