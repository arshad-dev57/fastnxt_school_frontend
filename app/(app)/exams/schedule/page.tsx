"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CalendarDays, Plus, Trash2 } from "lucide-react";
import { BranchBoard } from "@/components/branch/branch-board";
import {
  Btn,
  ConfirmDialog,
  Field,
  Input,
  Modal,
  Select,
} from "@/components/ui";
import { useBranch } from "@/lib/branch-context";
import {
  classesApi,
  describeApiError,
  examsApi,
  subjectsApi,
  type ExamItem,
  type ExamSlotItem,
  type SubjectItem,
} from "@/lib/auth/api-client";

export default function ExamSchedulePage() {
  const { currentBranchId } = useBranch();
  const searchParams = useSearchParams();
  const examIdParam = searchParams.get("examId") || "";

  const [exams, setExams] = useState<ExamItem[]>([]);
  const [examId, setExamId] = useState(examIdParam);
  const [rows, setRows] = useState<ExamSlotItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<ExamSlotItem | null>(null);
  const [classNames, setClassNames] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);

  useEffect(() => {
    if (examIdParam) setExamId(examIdParam);
  }, [examIdParam]);

  const loadExams = useCallback(async () => {
    try {
      const res = await examsApi.list({
        branchId: currentBranchId !== "all" ? currentBranchId : undefined,
      });
      const list = res.exams ?? [];
      setExams(list);
      if (!examId && list.length) setExamId(list[0].id);
    } catch (err) {
      setError(describeApiError(err).message);
    }
  }, [currentBranchId, examId]);

  const loadSlots = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await examsApi.listSlots({
        examId: examId || undefined,
        branchId: currentBranchId !== "all" ? currentBranchId : undefined,
      });
      setRows(res.slots ?? []);
    } catch (err) {
      setError(describeApiError(err).message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [examId, currentBranchId]);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  useEffect(() => {
    const branchScope = currentBranchId !== "all" ? currentBranchId : undefined;
    Promise.all([
      classesApi.list({ status: "Active", branchId: branchScope }),
      subjectsApi.list({ status: "Active", branchId: branchScope }),
    ])
      .then(([cRes, sRes]) => {
        setClassNames((cRes.classes ?? []).map((c) => c.name));
        setSubjects(sRes.subjects ?? []);
      })
      .catch(() => {
        setClassNames([]);
        setSubjects([]);
      });
  }, [currentBranchId]);

  const examOptions = useMemo(
    () => ["All exams", ...exams.map((e) => `${e.name} (${e.type})`)],
    [exams]
  );

  const selectedExamLabel = useMemo(() => {
    if (!examId) return "All exams";
    const e = exams.find((x) => x.id === examId);
    return e ? `${e.name} (${e.type})` : "All exams";
  }, [examId, exams]);

  const create = async (form: {
    cls: string;
    section: string;
    subject: string;
    date: string;
    startTime: string;
    endTime: string;
    room: string;
    invigilator: string;
  }) => {
    if (!examId) {
      setError("Select an exam first.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const subject = subjects.find((s) => s.name === form.subject);
      await examsApi.createSlot({
        examId,
        ...form,
        subjectId: subject?.id || null,
        branchId: currentBranchId !== "all" ? currentBranchId : null,
      });
      setModal(false);
      await loadSlots();
    } catch (err) {
      setError(describeApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!toDelete) return;
    try {
      await examsApi.deleteSlot(toDelete.id);
      setToDelete(null);
      await loadSlots();
    } catch (err) {
      setError(describeApiError(err).message);
    }
  };

  return (
    <>
      <BranchBoard<ExamSlotItem>
        title="Examination Date Sheet"
        subtitle="Class-wise paper timetable. Assigned subject teachers are notified to submit question papers."
        Icon={CalendarDays}
        nameLabel="Paper"
        countNoun="papers"
        rows={rows}
        loading={loading}
        groupBy={(r) => r.exam || "Exam"}
        nameOf={(r) => `${r.cls}${r.section ? `-${r.section}` : ""} · ${r.subject}`}
        subtitleOf={(r) => `${r.date} · ${r.startTime}–${r.endTime}`}
        searchTextOf={(r) =>
          `${r.cls} ${r.section} ${r.subject} ${r.exam} ${r.room} ${r.invigilator} ${r.teacherName}`
        }
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            <Select
              options={examOptions}
              value={selectedExamLabel}
              onChange={(e) => {
                const label = e.target.value;
                if (label === "All exams") {
                  setExamId("");
                  return;
                }
                const found = exams.find((x) => `${x.name} (${x.type})` === label);
                setExamId(found?.id || "");
              }}
              className="w-56"
            />
          </div>
        }
        primaryAction={
          <>
            <Link
              href="/exams"
              className="inline-flex h-9 items-center gap-2 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 text-[14px] hover:bg-[var(--theme-hover)]"
            >
              ← All Exams
            </Link>
            <button
              type="button"
              disabled={!examId}
              onClick={() => setModal(true)}
              className="ic-plus-btn inline-flex h-9 items-center gap-2 rounded bg-[var(--theme-primary)] px-3.5 text-[14px] font-medium text-white hover:bg-[var(--theme-primary-hover)] disabled:opacity-50"
            >
              <Plus className="ic-plus h-[18px] w-[18px]" /> Add paper
            </button>
          </>
        }
        columns={[
          { key: "date", label: "Date", width: "120px", cell: (r) => r.date },
          {
            key: "time",
            label: "Time",
            width: "130px",
            cell: (r) => `${r.startTime}–${r.endTime}`,
          },
          { key: "room", label: "Hall", width: "100px", cell: (r) => r.room || "—" },
          {
            key: "teacher",
            label: "Paper setter",
            width: "minmax(140px,1fr)",
            cell: (r) => r.teacherName || "—",
          },
          {
            key: "inv",
            label: "Invigilator",
            width: "minmax(120px,1fr)",
            cell: (r) => r.invigilator || "—",
          },
        ]}
        detailFields={(r) => [
          { label: "Exam", value: r.exam || "—" },
          { label: "Class", value: `${r.cls}${r.section ? `-${r.section}` : ""}` },
          { label: "Subject", value: r.subject },
          { label: "Date", value: r.date },
          { label: "Time", value: `${r.startTime} – ${r.endTime}` },
          { label: "Hall", value: r.room || "—" },
          { label: "Paper setter", value: r.teacherName || "—" },
          { label: "Invigilator", value: r.invigilator || "—" },
        ]}
        menu={(r) => [
          {
            label: "Delete",
            Icon: Trash2,
            danger: true,
            onClick: () => setToDelete(r),
          },
        ]}
        mobileRows={(r) => [
          { label: "Date", value: r.date },
          { label: "Time", value: `${r.startTime}–${r.endTime}` },
          { label: "Hall", value: r.room || "—" },
          { label: "Setter", value: r.teacherName || "—" },
        ]}
        emptyTitle="No scheduled papers"
        emptyMessage={
          error ||
          (examId
            ? "Add class/subject papers for this exam. Teachers will be notified to submit question papers."
            : "Select an exam, then add paper slots.")
        }
      />

      {error ? (
        <p className="px-4 pb-2 text-[13px] text-[var(--theme-danger)] sm:px-6">{error}</p>
      ) : null}

      <SlotFormModal
        open={modal}
        saving={saving}
        classNames={classNames}
        subjectNames={subjects.map((s) => s.name)}
        onClose={() => setModal(false)}
        onSave={create}
      />

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={remove}
        title="Delete paper slot"
        confirmLabel="Delete"
        message={`Remove ${toDelete?.subject} for ${toDelete?.cls}?`}
      />
    </>
  );
}

function SlotFormModal({
  open,
  onClose,
  onSave,
  saving,
  classNames,
  subjectNames,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (form: {
    cls: string;
    section: string;
    subject: string;
    date: string;
    startTime: string;
    endTime: string;
    room: string;
    invigilator: string;
  }) => Promise<void>;
  saving: boolean;
  classNames: string[];
  subjectNames: string[];
}) {
  const [cls, setCls] = useState("");
  const [section, setSection] = useState("");
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("11:00");
  const [room, setRoom] = useState("");
  const [invigilator, setInvigilator] = useState("");

  useEffect(() => {
    if (!open) return;
    setCls(classNames[0] || "");
    setSection("");
    setSubject(subjectNames[0] || "");
    setDate("");
    setStartTime("09:00");
    setEndTime("11:00");
    setRoom("");
    setInvigilator("");
  }, [open, classNames, subjectNames]);

  const valid = cls && subject && date && startTime && endTime;

  return (
    <Modal
      open={open}
      onClose={onClose}
      width="max-w-lg"
      title="Add paper to date sheet"
      subtitle="Subject teacher is auto-assigned from subject assignments and notified."
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
                cls,
                section,
                subject,
                date,
                startTime,
                endTime,
                room,
                invigilator,
              })
            }
          >
            Add paper
          </Btn>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Class">
          <Select
            options={classNames.length ? classNames : ["Grade 1"]}
            value={cls}
            onChange={(e) => setCls(e.target.value)}
          />
        </Field>
        <Field label="Section (optional)">
          <Input
            value={section}
            onChange={(e) => setSection(e.target.value)}
            placeholder="e.g. A — leave blank for whole class"
          />
        </Field>
        <Field label="Subject" className="sm:col-span-2">
          <Select
            options={subjectNames.length ? subjectNames : ["Mathematics"]}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </Field>
        <Field label="Paper date">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Hall / Room">
          <Input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="Hall A" />
        </Field>
        <Field label="Start time">
          <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </Field>
        <Field label="End time">
          <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </Field>
        <Field label="Invigilator" className="sm:col-span-2">
          <Input
            value={invigilator}
            onChange={(e) => setInvigilator(e.target.value)}
            placeholder="Optional"
          />
        </Field>
      </div>
    </Modal>
  );
}
