"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, NotebookPen, Paperclip, Plus, Trash2, X } from "lucide-react";
import { Btn, Field, Input, Modal, PageHeader, Select, StatCard, Textarea } from "@/components/ui";
import { PortalBoard } from "@/components/portal/portal-board";
import { ProgressMeter } from "@/components/portal/portal-ui";
import { StatusPill } from "@/components/board-kit";
import { useAuth } from "@/lib/auth/auth-context";
import { useBranch } from "@/lib/branch-context";
import {
  classesApi,
  describeApiError,
  employeesApi,
  homeworkApi,
  subjectsApi,
  uploadsApi,
  type EmployeeItem,
  type HomeworkAttachment,
  type HomeworkItem,
  type SubjectAssignmentItem,
} from "@/lib/auth/api-client";
import { PORTAL_FORM_OPTIONS, teacherClassSections } from "@/lib/portal-data";

const COLORS: Record<string, string> = {
  Open: "var(--theme-info)",
  "Due Soon": "var(--theme-warning)",
  Grading: "var(--theme-accent-2)",
  Closed: "var(--theme-success)",
};

type ClassOption = {
  label: string;
  cls: string;
  section: string;
};

export default function TeacherHomeworkPage() {
  const { user } = useAuth();
  const { currentBranchId } = useBranch();

  const [rows, setRows] = useState<HomeworkItem[]>([]);
  const [classOptions, setClassOptions] = useState<ClassOption[]>([]);
  const [teacherAssignments, setTeacherAssignments] = useState<SubjectAssignmentItem[]>([]);
  const [allSubjectsList, setAllSubjectsList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<HomeworkItem | null>(null);

  const teacherName = user?.name || "Teacher";

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const branchScope = currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined;

      // 1. Resolve exact teacher name from employees directory
      const empRes = await employeesApi.list({ q: user.email, branchId: branchScope }).catch(() => ({ employees: [] }));
      const emps: EmployeeItem[] = empRes.employees ?? [];
      const matched =
        emps.find((e) => e.email?.toLowerCase() === (user.email || "").toLowerCase()) ||
        emps.find((e) => e.name?.toLowerCase() === (user.name || "").toLowerCase()) ||
        (emps.length > 0 ? emps[0] : null);

      const resolvedTeacherName = matched?.name || user.name || "";
      const nameLower = resolvedTeacherName.toLowerCase();

      // 2. Fetch homework, classes, subject assignments, and subjects
      const [hwRes, clsRes, assignRes, subRes] = await Promise.all([
        homeworkApi.list({ branchId: currentBranchId }),
        classesApi.list({ branchId: branchScope }).catch(() => ({ classes: [] })),
        subjectsApi.listAssignments({ teacher: resolvedTeacherName, branchId: branchScope }).catch(() => ({ assignments: [] })),
        subjectsApi.list({ branchId: branchScope }).catch(() => ({ subjects: [] })),
      ]);

      setRows(hwRes.homework || []);

      const assignments: SubjectAssignmentItem[] = (assignRes.assignments || []).filter(
        (a) => !nameLower || (a.teacher || "").toLowerCase() === nameLower
      );
      setTeacherAssignments(assignments);

      // 3. Extract teacher's assigned classes & sections (Class Teacher roles + Subject Assignments)
      const matchedClasses: ClassOption[] = [];

      // A. Classes where this teacher is assigned as Class Teacher
      const allClasses = clsRes.classes || [];
      const myClassTeacherClasses = allClasses.filter((c) => nameLower && (c.teacher || "").toLowerCase() === nameLower);

      myClassTeacherClasses.forEach((c) => {
        const sections = Array.isArray(c.sections) && c.sections.length > 0 ? c.sections : ["A"];
        sections.forEach((sec) => {
          const label = `${c.name}-${sec}`;
          if (!matchedClasses.some((mc) => mc.label === label)) {
            matchedClasses.push({ label, cls: c.name, section: sec });
          }
        });
      });

      // B. Classes from Subject Assignments
      assignments.forEach((a) => {
        if (a.cls && a.section) {
          const label = `${a.cls}-${a.section}`;
          if (!matchedClasses.some((mc) => mc.label === label)) {
            matchedClasses.push({ label, cls: a.cls, section: a.section });
          }
        }
      });

      // C. Fallback to portal-data teacher sections if no API assignment found
      if (matchedClasses.length > 0) {
        setClassOptions(matchedClasses);
      } else {
        const fallback = teacherClassSections.map((ts) => ({
          label: ts.label,
          cls: ts.cls,
          section: ts.section,
        }));
        setClassOptions(fallback);
      }

      // 4. Collect overall subjects list
      const subSet = new Set<string>();
      assignments.forEach((a) => {
        if (a.subject) subSet.add(a.subject);
      });
      (subRes.subjects || []).forEach((s) => {
        if (s.name) subSet.add(s.name);
      });

      if (subSet.size > 0) {
        setAllSubjectsList(Array.from(subSet));
      } else {
        setAllSubjectsList(PORTAL_FORM_OPTIONS.subjects);
      }
    } catch (err) {
      console.error("Failed to load homework page data:", err);
    } finally {
      setLoading(false);
    }
  }, [user, currentBranchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateHomework = async (data: {
    title: string;
    cls: string;
    section: string;
    subject: string;
    due: string;
    instructions: string;
    attachments: HomeworkAttachment[];
  }) => {
    setSaving(true);
    try {
      const res = await homeworkApi.create({
        title: data.title,
        cls: data.cls,
        section: data.section,
        subject: data.subject,
        due: data.due,
        instructions: data.instructions,
        teacher: teacherName,
        teacherId: user?.id,
        branchId: currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined,
        attachments: data.attachments,
        status: "Open",
        total: 30,
        submitted: 0,
      });
      setRows((prev) => [res.homework, ...prev]);
      setCreated(res.homework);
    } catch (err) {
      console.error("Failed to create assignment:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await homeworkApi.update(id, { status: newStatus });
      setRows((prev) => prev.map((r) => (r.id === id ? res.homework : r)));
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleDeleteHomework = async (id: string) => {
    try {
      await homeworkApi.delete(id);
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error("Failed to delete homework:", err);
    }
  };

  const totalSubmissions = rows.reduce((n, r) => n + (r.submitted || 0), 0);
  const totalStudents = rows.reduce((n, r) => n + (r.total || 0), 0);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--theme-surface)]">
      <PageHeader
        title="Homework & Assignments"
        subtitle={`Branch-scoped assignments managed by ${teacherName}.`}
        actions={
          <Btn variant="primary" Icon={Plus} onClick={() => setOpen(true)}>
            New Assignment
          </Btn>
        }
      />

      <div className="grid grid-cols-2 gap-3 px-4 pt-4 sm:grid-cols-4 sm:px-6">
        <StatCard label="Assignments" value={rows.length} Icon={NotebookPen} tone="blue" sub="Total assignments" />
        <StatCard
          label="Open"
          value={rows.filter((r) => r.status === "Open" || r.status === "Due Soon").length}
          Icon={NotebookPen}
          tone="orange"
          sub="Accepting submissions"
        />
        <StatCard
          label="Grading"
          value={rows.filter((r) => r.status === "Grading").length}
          Icon={NotebookPen}
          tone="purple"
          sub="Awaiting evaluation"
        />
        <StatCard
          label="Submissions"
          value={`${totalSubmissions}/${totalStudents}`}
          Icon={NotebookPen}
          tone="green"
          sub="Across all work"
        />
      </div>

      <div className="mt-2">
        <PortalBoard
          title="Assignments List"
          subtitle={loading ? "Loading assignments..." : "Track due dates, attachments, and student submission progress."}
          Icon={NotebookPen}
          nameLabel="Assignment"
          rows={rows}
          keyOf={(r) => r.id}
          nameOf={(r) => r.title}
          subtitleOf={(r) => `${r.cls}-${r.section} · ${r.subject}`}
          searchTextOf={(r) => `${r.title} ${r.subject} ${r.cls} ${r.section} ${r.status}`}
          searchPlaceholder="Search assignment..."
          scopeLabel="Current branch"
          countNoun="assignments"
          groupBy={(r) => r.status}
          groupColorOf={(k) => COLORS[k] ?? "var(--theme-primary)"}
          columns={[
            { key: "cls", label: "Class", width: "120px", cell: (r) => `${r.cls}-${r.section}` },
            { key: "subject", label: "Subject", width: "130px", cell: (r) => r.subject },
            { key: "assigned", label: "Assigned", width: "120px", cell: (r) => r.assigned },
            { key: "due", label: "Due Date", width: "120px", cell: (r) => r.due },
            {
              key: "files",
              label: "Files",
              width: "100px",
              cell: (r) =>
                r.attachments && r.attachments.length > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded bg-[var(--theme-card-subtle)] px-2 py-0.5 text-xs text-[var(--theme-text)]">
                    <Paperclip className="h-3 w-3" />
                    {r.attachments.length}
                  </span>
                ) : (
                  <span className="text-xs text-[var(--theme-text-muted)]">—</span>
                ),
            },
            {
              key: "progress",
              label: "Submissions",
              width: "minmax(160px,1fr)",
              cell: (r) => (
                <div className="min-w-[130px]">
                  <ProgressMeter
                    value={r.total ? (r.submitted / r.total) * 100 : 0}
                    label={`${r.submitted}/${r.total}`}
                  />
                </div>
              ),
            },
            { key: "status", label: "Status", width: "120px", cell: (r) => <StatusPill label={r.status} /> },
          ]}
          detailFields={(r) => [
            { label: "Title", value: r.title },
            { label: "Class", value: `${r.cls}-${r.section}` },
            { label: "Subject", value: r.subject },
            { label: "Teacher", value: r.teacher },
            { label: "Assigned", value: r.assigned },
            { label: "Due", value: r.due },
            { label: "Submissions", value: `${r.submitted} of ${r.total}` },
            { label: "Status", value: <StatusPill label={r.status} /> },
            { label: "Instructions", value: r.instructions || "No instructions provided." },
            {
              label: "Attachments",
              value:
                r.attachments && r.attachments.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {r.attachments.map((att, idx) => (
                      <a
                        key={idx}
                        href={att.url || att.data || "#"}
                        download={att.name}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded border border-[var(--theme-border)] bg-[var(--theme-card)] px-2.5 py-1 text-xs text-[var(--theme-primary)] hover:underline"
                      >
                        <Paperclip className="h-3.5 w-3.5" />
                        <span className="max-w-[160px] truncate">{att.name}</span>
                        <Download className="h-3 w-3 opacity-60" />
                      </a>
                    ))}
                  </div>
                ) : (
                  "No attachments"
                ),
            },
          ]}
          menu={(r) => [
            {
              label: "Mark as Grading",
              Icon: NotebookPen,
              onClick: () => handleUpdateStatus(r.id, "Grading"),
            },
            {
              label: "Close assignment",
              Icon: CheckCircle2,
              onClick: () => handleUpdateStatus(r.id, "Closed"),
            },
            {
              label: "Delete",
              Icon: Trash2,
              danger: true,
              onClick: () => handleDeleteHomework(r.id),
            },
          ]}
          emptyTitle="No assignments"
          emptyMessage="Create your first assignment to get started."
          minWidth={980}
        />
      </div>

      <NewAssignmentModal
        open={open}
        onClose={() => setOpen(false)}
        onSave={handleCreateHomework}
        saving={saving}
        classOptions={classOptions}
        teacherAssignments={teacherAssignments}
        allSubjectsList={allSubjectsList}
      />

      <Modal
        open={!!created}
        onClose={() => setCreated(null)}
        title="Assignment Created"
        width="max-w-md"
        footer={<Btn variant="primary" onClick={() => setCreated(null)}>Close</Btn>}
      >
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--theme-success-soft)] text-[var(--theme-success-text)]">
            <CheckCircle2 className="h-7 w-7 icon-pop" />
          </span>
          <p className="text-[15px] font-medium">{created?.title}</p>
          <p className="text-[13px] text-[var(--theme-text-muted)]">
            Assigned to {created?.cls}-{created?.section} · due {created?.due}
          </p>
          {created?.attachments && created.attachments.length > 0 && (
            <p className="text-xs text-[var(--theme-primary)] font-medium">
              {created.attachments.length} attachment(s) included
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}

function NewAssignmentModal({
  open,
  onClose,
  onSave,
  saving,
  classOptions,
  teacherAssignments,
  allSubjectsList,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    cls: string;
    section: string;
    subject: string;
    due: string;
    instructions: string;
    attachments: HomeworkAttachment[];
  }) => Promise<void>;
  saving: boolean;
  classOptions: ClassOption[];
  teacherAssignments: SubjectAssignmentItem[];
  allSubjectsList: string[];
}) {
  const [title, setTitle] = useState("");
  const [selectedClassLabel, setSelectedClassLabel] = useState("");
  const [subject, setSubject] = useState("");
  const [due, setDue] = useState("");
  const [desc, setDesc] = useState("");
  const [attachments, setAttachments] = useState<HomeworkAttachment[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  useEffect(() => {
    if (classOptions.length > 0 && (!selectedClassLabel || !classOptions.some((c) => c.label === selectedClassLabel))) {
      setSelectedClassLabel(classOptions[0].label);
    }
  }, [classOptions, selectedClassLabel]);

  // Compute available subjects specifically for the selected class & section
  const availableSubjects = useMemo(() => {
    if (!selectedClassLabel) return allSubjectsList;
    const found = classOptions.find((c) => c.label === selectedClassLabel);
    if (!found) return allSubjectsList;

    const matchedAssignments = teacherAssignments.filter(
      (a) => a.cls.toLowerCase() === found.cls.toLowerCase() && a.section.toLowerCase() === found.section.toLowerCase()
    );

    const subjectsForClass = Array.from(new Set(matchedAssignments.map((a) => a.subject).filter(Boolean)));
    if (subjectsForClass.length > 0) {
      return subjectsForClass;
    }
    return allSubjectsList;
  }, [selectedClassLabel, classOptions, teacherAssignments, allSubjectsList]);

  useEffect(() => {
    if (availableSubjects.length > 0 && (!subject || !availableSubjects.includes(subject))) {
      setSubject(availableSubjects[0]);
    }
  }, [availableSubjects, subject]);

  const valid = !!title.trim() && !!due && !uploadingFiles && !!selectedClassLabel;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    e.target.value = "";
    if (!files || files.length === 0) return;

    setUploadingFiles(true);
    try {
      const uploaded: HomeworkAttachment[] = [];
      for (const file of Array.from(files)) {
        const res = await uploadsApi.upload(file, { purpose: "homework", folder: "homework" });
        uploaded.push({
          name: res.upload.name || file.name,
          type: res.upload.type || file.type,
          size: res.upload.size || file.size,
          url: res.upload.url,
          publicId: res.upload.publicId,
        });
      }
      setAttachments((prev) => [...prev, ...uploaded]);
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      alert(describeApiError(err).message);
    } finally {
      setUploadingFiles(false);
    }
  };

  const removeAttachment = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const save = async () => {
    if (!valid) return;
    const foundClass = classOptions.find((c) => c.label === selectedClassLabel);
    const cls = foundClass ? foundClass.cls : selectedClassLabel.split("-")[0];
    const section = foundClass ? foundClass.section : selectedClassLabel.split("-")[1] || "A";

    await onSave({
      title: title.trim(),
      cls,
      section,
      subject,
      due,
      instructions: desc,
      attachments,
    });

    setTitle("");
    setDue("");
    setDesc("");
    setAttachments([]);
    onClose();
  };

  const classSelectLabels = classOptions.map((c) => c.label);

  return (
    <Modal
      open={open}
      onClose={onClose}
      width="max-w-xl"
      title="New Assignment"
      subtitle="Set homework for your assigned classes and subjects with optional file attachments"
      footer={
        <>
          <Btn variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Btn>
          <Btn variant="primary" onClick={save} loading={saving} loadingLabel="Creating…" disabled={!valid}>
            Create Assignment
          </Btn>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Title" className="sm:col-span-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Quadratic Equations — Worksheet 5"
          />
        </Field>
        <Field label="Class & Section">
          <Select
            options={classSelectLabels}
            value={selectedClassLabel}
            onChange={(e) => setSelectedClassLabel(e.target.value)}
          />
        </Field>
        <Field label="Subject">
          <Select
            options={availableSubjects}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </Field>
        <Field label="Due Date">
          <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        </Field>
        <Field label="Instructions" className="sm:col-span-2">
          <Textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Optional notes or instructions for students..."
          />
        </Field>

        <Field label="Attach Files / Documents" className="sm:col-span-2">
          <div className="flex flex-col gap-2">
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="block w-full text-xs text-[var(--theme-text-muted)] file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[var(--theme-primary-soft)] file:text-[var(--theme-primary)] hover:file:bg-[var(--theme-primary-soft)]/80 cursor-pointer"
            />
            {attachments.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-2">
                {attachments.map((att, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 rounded-md border border-[var(--theme-border)] bg-[var(--theme-card)] px-2.5 py-1 text-xs"
                  >
                    <Paperclip className="h-3.5 w-3.5 text-[var(--theme-text-muted)]" />
                    <span className="max-w-[160px] truncate font-medium">{att.name}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(idx)}
                      className="ml-1 text-[var(--theme-text-muted)] hover:text-[var(--theme-danger)]"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Field>
      </div>
    </Modal>
  );
}
