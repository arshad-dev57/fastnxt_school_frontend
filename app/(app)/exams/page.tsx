"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Award,
  Bell,
  CalendarDays,
  Eye,
  FileText,
  GraduationCap,
  Mail,
  Plus,
  Trash2,
} from "lucide-react";
import { BranchBoard } from "@/components/branch/branch-board";
import { StatusPill } from "@/components/board-kit";
import {
  Btn,
  ConfirmDialog,
  Field,
  Input,
  Modal,
  Select,
  Textarea,
} from "@/components/ui";
import { useBranch } from "@/lib/branch-context";
import {
  classesApi,
  describeApiError,
  examsApi,
  lettersApi,
  type ExamItem,
  type QuestionPaperSubmissionItem,
} from "@/lib/auth/api-client";
import { letterHtmlForEmail } from "@/components/letters/official-letter";

const COLORS: Record<string, string> = {
  Scheduled: "var(--theme-info)",
  "Marks Entry": "var(--theme-warning)",
  Verification: "var(--theme-accent-2)",
  Published: "var(--theme-success)",
  Draft: "var(--theme-pending)",
  Notified: "var(--theme-accent-2)",
};

const EXAM_TYPES = ["Monthly", "Mid-Term", "Final", "Quiz", "Other"];
const STATUSES = ["Draft", "Notified", "Scheduled", "Marks Entry", "Verification", "Published"];

export default function ExamsPage() {
  const { currentBranchId } = useBranch();
  const [rows, setRows] = useState<ExamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<ExamItem | null>(null);
  const [papersExam, setPapersExam] = useState<ExamItem | null>(null);
  const [submissions, setSubmissions] = useState<QuestionPaperSubmissionItem[]>([]);
  const [classNames, setClassNames] = useState<string[]>([]);
  const [emailExam, setEmailExam] = useState<ExamItem | null>(null);
  const [emailTo, setEmailTo] = useState("");
  const [emailNote, setEmailNote] = useState("");
  const [emailing, setEmailing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await examsApi.list({
        branchId: currentBranchId !== "all" ? currentBranchId : undefined,
      });
      setRows(res.exams ?? []);
    } catch (err) {
      setError(describeApiError(err).message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [currentBranchId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    classesApi
      .list({
        status: "Active",
        branchId: currentBranchId !== "all" ? currentBranchId : undefined,
      })
      .then((res) => setClassNames((res.classes ?? []).map((c) => c.name)))
      .catch(() => setClassNames([]));
  }, [currentBranchId]);

  const notify = async (row: ExamItem) => {
    try {
      const res = await examsApi.notify(row.id);
      setRows((prev) => prev.map((r) => (r.id === row.id ? res.exam : r)));
    } catch (err) {
      setError(describeApiError(err).message);
    }
  };

  const openPapers = async (row: ExamItem) => {
    setPapersExam(row);
    try {
      const res = await examsApi.listSubmissions({ examId: row.id });
      setSubmissions(res.submissions ?? []);
    } catch (err) {
      setError(describeApiError(err).message);
      setSubmissions([]);
    }
  };

  const reviewPaper = async (id: string, status: "Approved" | "Rejected") => {
    try {
      const res = await examsApi.reviewSubmission(id, { status });
      setSubmissions((prev) => prev.map((s) => (s.id === id ? res.submission : s)));
    } catch (err) {
      setError(describeApiError(err).message);
    }
  };

  const remove = async () => {
    if (!toDelete) return;
    try {
      await examsApi.delete(toDelete.id);
      setToDelete(null);
      await load();
    } catch (err) {
      setError(describeApiError(err).message);
    }
  };

  const create = async (form: {
    name: string;
    type: string;
    session: string;
    startDate: string;
    endDate: string;
    paperSubmitFrom: string;
    paperSubmitTo: string;
    classes: string[];
    notifyNote: string;
    notify: boolean;
  }) => {
    setSaving(true);
    setError(null);
    try {
      await examsApi.create({
        ...form,
        notifyTeachers: form.notify,
        branchId: currentBranchId !== "all" ? currentBranchId : null,
      });
      setModal(false);
      await load();
    } catch (err) {
      setError(describeApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <BranchBoard<ExamItem>
        title="Examinations"
        subtitle="Notify exam dates → build class-wise paper timetable → collect question papers from teachers."
        Icon={GraduationCap}
        nameLabel="Exam"
        countNoun="exams"
        rows={rows}
        loading={loading}
        groupBy={(r) => r.status}
        groupColorOf={(k) => COLORS[k]}
        nameOf={(r) => r.name}
        subtitleOf={(r) => `${r.type} · ${r.session}`}
        searchTextOf={(r) => `${r.name} ${r.type} ${r.session} ${r.status}`}
        primaryAction={
          <>
            <Link
              href="/exams/schedule"
              className="hidden h-9 items-center gap-2 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 text-[14px] hover:bg-[var(--theme-hover)] lg:inline-flex"
            >
              <CalendarDays className="h-[18px] w-[18px]" /> Date Sheet
            </Link>
            <Link
              href="/results"
              className="hidden h-9 items-center gap-2 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 text-[14px] hover:bg-[var(--theme-hover)] lg:inline-flex"
            >
              <Award className="h-[18px] w-[18px]" /> Results
            </Link>
            <button
              type="button"
              onClick={() => setModal(true)}
              className="ic-plus-btn inline-flex h-9 items-center gap-2 rounded bg-[var(--theme-primary)] px-3.5 text-[14px] font-medium text-white hover:bg-[var(--theme-primary-hover)]"
            >
              <Plus className="ic-plus h-[18px] w-[18px]" /> New Exam
            </button>
          </>
        }
        columns={[
          { key: "type", label: "Type", width: "110px", cell: (r) => r.type },
          { key: "session", label: "Session", width: "110px", cell: (r) => r.session },
          { key: "start", label: "Start", width: "110px", cell: (r) => r.startDate },
          { key: "end", label: "End", width: "110px", cell: (r) => r.endDate },
          {
            key: "submit",
            label: "Paper due",
            width: "120px",
            cell: (r) => r.paperSubmitTo || "—",
          },
          {
            key: "classes",
            label: "Classes",
            width: "80px",
            cell: (r) => r.classesCount ?? r.classes?.length ?? 0,
          },
          {
            key: "papers",
            label: "Papers",
            width: "80px",
            cell: (r) => r.submissionsCount ?? 0,
          },
          {
            key: "status",
            label: "Status",
            width: "120px",
            cell: (r) => <StatusPill label={r.status} />,
          },
        ]}
        detailFields={(r) => [
          { label: "Exam", value: r.name },
          { label: "Type", value: r.type },
          { label: "Session", value: r.session },
          { label: "Start", value: r.startDate },
          { label: "End", value: r.endDate },
          {
            label: "Paper submit window",
            value:
              r.paperSubmitFrom || r.paperSubmitTo
                ? `${r.paperSubmitFrom || "—"} → ${r.paperSubmitTo || "—"}`
                : "—",
          },
          {
            label: "Classes",
            value: r.classes?.length ? r.classes.join(", ") : String(r.classesCount ?? 0),
          },
          { label: "Slots", value: String(r.slotsCount ?? 0) },
          { label: "Papers submitted", value: String(r.submissionsCount ?? 0) },
          { label: "Status", value: r.status },
          { label: "Notify note", value: r.notifyNote || "—" },
        ]}
        menu={(r) => [
          {
            label: "View question papers",
            Icon: FileText,
            onClick: () => openPapers(r),
          },
          {
            label: "Date sheet",
            Icon: CalendarDays,
            onClick: () => {
              window.location.href = `/exams/schedule?examId=${r.id}`;
            },
          },
          ...(r.status === "Draft" || r.status === "Notified"
            ? [
                {
                  label: "Notify teachers",
                  Icon: Bell,
                  onClick: () => notify(r),
                },
              ]
            : [
                {
                  label: "Re-notify",
                  Icon: Bell,
                  onClick: () => notify(r),
                },
              ]),
          {
            label: "Email notice",
            Icon: Mail,
            onClick: () => {
              setEmailExam(r);
              setEmailTo("");
              setEmailNote(r.notifyNote || `Please note the examination schedule for ${r.name}.`);
            },
          },
          {
            label: "Open results",
            Icon: Award,
            onClick: () => {
              window.location.href = `/results`;
            },
          },
          {
            label: "Delete",
            Icon: Trash2,
            danger: true,
            onClick: () => setToDelete(r),
          },
        ]}
        mobileRows={(r) => [
          { label: "Type", value: r.type },
          { label: "Session", value: r.session },
          { label: "Start", value: r.startDate },
          { label: "Status", value: <StatusPill label={r.status} /> },
        ]}
        emptyTitle="No exams"
        emptyMessage={
          error ||
          "Create an exam notice (Monthly / Mid-Term / Final), then build the class-wise date sheet."
        }
      />

      {error ? (
        <p className="px-4 pb-2 text-[13px] text-[var(--theme-danger)] sm:px-6">{error}</p>
      ) : null}

      <ExamFormModal
        open={modal}
        saving={saving}
        classNames={classNames}
        onClose={() => setModal(false)}
        onSave={create}
      />

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={remove}
        title="Delete exam"
        confirmLabel="Delete"
        message={`Delete ${toDelete?.name}? Timetable slots and paper submissions will also be removed.`}
      />

      <Modal
        open={!!emailExam}
        onClose={() => setEmailExam(null)}
        title="Email exam notice"
        subtitle={emailExam?.name}
        width="max-w-md"
        footer={
          <>
            <Btn variant="secondary" onClick={() => setEmailExam(null)}>Cancel</Btn>
            <Btn
              variant="primary"
              Icon={Mail}
              disabled={!emailTo.trim() || emailing}
              loading={emailing}
              loadingLabel="Sending…"
              onClick={async () => {
                if (!emailExam || !emailTo.trim()) return;
                setEmailing(true);
                try {
                  const res = await lettersApi.sendEmail({
                    to: emailTo.trim(),
                    title: `Examination notice — ${emailExam.name}`,
                    subject: `Exam: ${emailExam.name} (${emailExam.startDate} – ${emailExam.endDate})`,
                    template: "exam_notice",
                    messageHtml: letterHtmlForEmail({
                      title: emailExam.name,
                      paragraphs: [
                        emailNote || "Please find the examination details below.",
                        "Kindly prepare according to the published date sheet.",
                      ],
                      details: [
                        ["Exam", emailExam.name],
                        ["Type", emailExam.type],
                        ["Session", emailExam.session],
                        ["Start", emailExam.startDate],
                        ["End", emailExam.endDate],
                        ["Classes", emailExam.classes?.join(", ") || "—"],
                        ["Status", emailExam.status],
                      ],
                    }),
                  });
                  alert(res.delivered ? "Email sent successfully." : `Email not delivered (${res.reason || "check Resend config"}).`);
                  if (res.delivered) setEmailExam(null);
                } catch (err) {
                  alert(describeApiError(err).message);
                } finally {
                  setEmailing(false);
                }
              }}
            >
              Send email
            </Btn>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Recipient email">
            <Input
              type="email"
              value={emailTo}
              onChange={(e) => setEmailTo(e.target.value)}
              placeholder="parent@email.com or student@email.com"
            />
          </Field>
          <Field label="Message">
            <Textarea value={emailNote} onChange={(e) => setEmailNote(e.target.value)} rows={4} />
          </Field>
        </div>
      </Modal>

      <Modal
        open={!!papersExam}
        onClose={() => setPapersExam(null)}
        title={papersExam ? `Question papers — ${papersExam.name}` : "Question papers"}
        subtitle="Files/images submitted by subject teachers"
        width="max-w-2xl"
        footer={<Btn variant="secondary" onClick={() => setPapersExam(null)}>Close</Btn>}
      >
        {submissions.length === 0 ? (
          <p className="py-6 text-center text-[14px] text-[var(--theme-text-muted)]">
            No question papers submitted yet for this exam.
          </p>
        ) : (
          <div className="divide-y divide-[var(--theme-border)]">
            {submissions.map((s) => (
              <div key={s.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start">
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-medium">
                    {s.subject} · {s.cls}
                    {s.section ? `-${s.section}` : ""}
                  </p>
                  <p className="text-[13px] text-[var(--theme-text-muted)]">
                    {s.teacherName} · {s.submittedAt || "—"} · <StatusPill label={s.status} />
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(s.files || []).map((f, i) => (
                      <a
                        key={i}
                        href={f.data}
                        download={f.name}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded border border-[var(--theme-border)] px-2 py-1 text-[12px] text-[var(--theme-primary)] hover:underline"
                      >
                        <Eye className="h-3 w-3" />
                        {f.name}
                      </a>
                    ))}
                  </div>
                </div>
                {s.status === "Submitted" ? (
                  <div className="flex shrink-0 gap-2">
                    <Btn variant="secondary" onClick={() => reviewPaper(s.id, "Approved")}>
                      Approve
                    </Btn>
                    <Btn variant="secondary" onClick={() => reviewPaper(s.id, "Rejected")}>
                      Reject
                    </Btn>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Modal>
    </>
  );
}

function ExamFormModal({
  open,
  onClose,
  onSave,
  saving,
  classNames,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (form: {
    name: string;
    type: string;
    session: string;
    startDate: string;
    endDate: string;
    paperSubmitFrom: string;
    paperSubmitTo: string;
    classes: string[];
    notifyNote: string;
    notify: boolean;
  }) => Promise<void>;
  saving: boolean;
  classNames: string[];
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState("Mid-Term");
  const [session, setSession] = useState("2025-2026");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [paperSubmitFrom, setPaperSubmitFrom] = useState("");
  const [paperSubmitTo, setPaperSubmitTo] = useState("");
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [notifyNote, setNotifyNote] = useState("");
  const [notify, setNotify] = useState(true);

  useEffect(() => {
    if (!open) return;
    setName("");
    setType("Mid-Term");
    setSession("2025-2026");
    setStartDate("");
    setEndDate("");
    setPaperSubmitFrom("");
    setPaperSubmitTo("");
    setSelectedClasses([]);
    setNotifyNote("");
    setNotify(true);
  }, [open]);

  const toggleClass = (c: string) => {
    setSelectedClasses((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  };

  const valid = name.trim() && startDate && endDate && endDate >= startDate;

  return (
    <Modal
      open={open}
      onClose={onClose}
      width="max-w-xl"
      title="Announce exam"
      subtitle="Notify teachers of exam dates and the question-paper submission window."
      footer={
        <>
          <Btn variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Btn>
          <Btn
            variant="primary"
            loading={saving}
            loadingLabel="Saving…"
            disabled={!valid}
            onClick={() =>
              onSave({
                name: name.trim(),
                type,
                session,
                startDate,
                endDate,
                paperSubmitFrom: paperSubmitFrom || new Date().toISOString().slice(0, 10),
                paperSubmitTo: paperSubmitTo || startDate,
                classes: selectedClasses,
                notifyNote,
                notify,
              })
            }
          >
            {notify ? "Create & notify" : "Save as draft"}
          </Btn>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Exam name" className="sm:col-span-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Mid-Term 2026"
          />
        </Field>
        <Field label="Type">
          <Select options={EXAM_TYPES} value={type} onChange={(e) => setType(e.target.value)} />
        </Field>
        <Field label="Session">
          <Input value={session} onChange={(e) => setSession(e.target.value)} />
        </Field>
        <Field label="Exam start date">
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </Field>
        <Field label="Exam end date">
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </Field>
        <Field label="Paper submit from">
          <Input
            type="date"
            value={paperSubmitFrom}
            onChange={(e) => setPaperSubmitFrom(e.target.value)}
          />
        </Field>
        <Field label="Paper submit to">
          <Input
            type="date"
            value={paperSubmitTo}
            onChange={(e) => setPaperSubmitTo(e.target.value)}
          />
        </Field>
        <Field label="Classes (optional)" className="sm:col-span-2">
          {classNames.length === 0 ? (
            <p className="text-[13px] text-[var(--theme-text-muted)]">No classes found.</p>
          ) : (
            <div className="flex max-h-28 flex-wrap gap-2 overflow-y-auto rounded border border-[var(--theme-border)] p-2">
              {classNames.map((c) => {
                const on = selectedClasses.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleClass(c)}
                    className={`rounded px-2.5 py-1 text-[12px] ${
                      on
                        ? "bg-[var(--theme-primary)] text-white"
                        : "bg-[var(--theme-card-subtle)] text-[var(--theme-text)]"
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          )}
        </Field>
        <Field label="Notify note" className="sm:col-span-2">
          <Textarea
            value={notifyNote}
            onChange={(e) => setNotifyNote(e.target.value)}
            placeholder="Optional message for teachers about paper format, marks, etc."
            rows={3}
          />
        </Field>
        <label className="sm:col-span-2 flex items-center gap-2 text-[14px]">
          <input
            type="checkbox"
            checked={notify}
            onChange={(e) => setNotify(e.target.checked)}
            className="h-4 w-4"
          />
          Notify teachers &amp; students now (App notice)
        </label>
        <p className="sm:col-span-2 text-[12px] text-[var(--theme-text-muted)]">
          Status options later: {STATUSES.join(" · ")}. After create, add the class-wise date sheet
          under Date Sheet so each teacher gets a paper task.
        </p>
      </div>
    </Modal>
  );
}
