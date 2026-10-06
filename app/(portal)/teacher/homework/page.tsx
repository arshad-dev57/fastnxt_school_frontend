"use client";

import { useState } from "react";
import { CheckCircle2, NotebookPen, Plus, Trash2 } from "lucide-react";
import { Btn, Field, Input, Modal, PageHeader, Select, StatCard, Textarea } from "@/components/ui";
import { PortalBoard } from "@/components/portal/portal-board";
import { ProgressMeter } from "@/components/portal/portal-ui";
import { StatusPill } from "@/components/board-kit";
import { simulateDelay } from "@/components/skeleton";
import { PORTAL_FORM_OPTIONS, PORTAL_TEACHER, teacherClassSectionLabels, teacherHomework } from "@/lib/portal-data";
import type { HomeworkRow } from "@/lib/school-mock-data";

/* ===========================================================================
   Teacher Homework = the Admin /homework module. The Teacher role holds
   "create" + "edit" here, so this page adds the assignment composer using the
   exact HomeworkRow fields the Admin already uses (title, subject, class,
   section, assigned, due). Nothing new is invented.
   ========================================================================== */

const COLORS: Record<string, string> = {
  Open: "var(--theme-info)", "Due Soon": "var(--theme-warning)",
  Grading: "var(--theme-accent-2)", Closed: "var(--theme-success)",
};

export default function TeacherHomeworkPage() {
  const [rows, setRows] = useState<HomeworkRow[]>(teacherHomework);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<HomeworkRow | null>(null);

  const totalSubmissions = rows.reduce((n, r) => n + r.submitted, 0);
  const totalStudents = rows.reduce((n, r) => n + r.total, 0);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--theme-surface)]">
      <PageHeader
        title="Homework & Assignments"
        subtitle={`Assignments set by ${PORTAL_TEACHER.name} across your sections.`}
        actions={<Btn variant="primary" Icon={Plus} onClick={() => setOpen(true)}>New Assignment</Btn>}
      />

      <div className="grid grid-cols-2 gap-3 px-4 pt-4 sm:grid-cols-4 sm:px-6">
        <StatCard label="Assignments" value={rows.length} Icon={NotebookPen} tone="blue" sub="Set by you" />
        <StatCard label="Open" value={rows.filter((r) => r.status === "Open" || r.status === "Due Soon").length} Icon={NotebookPen} tone="orange" sub="Still accepting" />
        <StatCard label="Grading" value={rows.filter((r) => r.status === "Grading").length} Icon={NotebookPen} tone="purple" sub="Awaiting you" />
        <StatCard label="Submissions" value={`${totalSubmissions}/${totalStudents}`} Icon={NotebookPen} tone="green" sub="Across all work" />
      </div>

      <div className="mt-2">
        <PortalBoard
          title="My Assignments"
          subtitle="Track due dates and class submission progress."
          Icon={NotebookPen}
          nameLabel="Assignment"
          rows={rows}
          keyOf={(r) => r.id}
          nameOf={(r) => r.title}
          subtitleOf={(r) => `${r.cls}-${r.section} · ${r.subject}`}
          searchTextOf={(r) => `${r.title} ${r.subject} ${r.cls} ${r.section} ${r.status}`}
          searchPlaceholder="Search assignment"
          scopeLabel="My sections"
          countNoun="assignments"
          groupBy={(r) => r.status}
          groupColorOf={(k) => COLORS[k]}
          columns={[
            { key: "cls", label: "Class", width: "120px", cell: (r) => `${r.cls}-${r.section}` },
            { key: "subject", label: "Subject", width: "130px", cell: (r) => r.subject },
            { key: "assigned", label: "Assigned", width: "120px", cell: (r) => r.assigned },
            { key: "due", label: "Due Date", width: "120px", cell: (r) => r.due },
            { key: "progress", label: "Submissions", width: "minmax(160px,1fr)", cell: (r) => (
              <div className="min-w-[130px]"><ProgressMeter value={r.total ? (r.submitted / r.total) * 100 : 0} label={`${r.submitted}/${r.total}`} /></div>
            ) },
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
          ]}
          menu={(r) => [
            { label: "Close assignment", Icon: CheckCircle2, onClick: () => setRows((p) => p.map((x) => (x.id === r.id ? { ...x, status: "Closed" } : x))) },
            { label: "Delete", Icon: Trash2, danger: true, onClick: () => setRows((p) => p.filter((x) => x.id !== r.id)) },
          ]}
          emptyTitle="No assignments"
          emptyMessage="Create your first assignment to get started."
          minWidth={980}
        />
      </div>

      <NewAssignmentModal
        open={open}
        onClose={() => setOpen(false)}
        onSave={(row) => { setRows((p) => [row, ...p]); setCreated(row); }}
        saving={saving}
        setSaving={setSaving}
      />

      <Modal open={!!created} onClose={() => setCreated(null)} title="Assignment created" width="max-w-md"
        footer={<Btn variant="primary" onClick={() => setCreated(null)}>Close</Btn>}>
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--theme-success-soft)] text-[var(--theme-success-text)]"><CheckCircle2 className="h-7 w-7 icon-pop" /></span>
          <p className="text-[15px] font-medium">{created?.title}</p>
          <p className="text-[13px] text-[var(--theme-text-muted)]">Assigned to {created?.cls}-{created?.section} · due {created?.due}</p>
        </div>
      </Modal>
    </div>
  );
}

/* Composer uses only fields that already exist on the Admin HomeworkRow. */
function NewAssignmentModal({ open, onClose, onSave, saving, setSaving }: {
  open: boolean; onClose: () => void; onSave: (row: HomeworkRow) => void;
  saving: boolean; setSaving: (v: boolean) => void;
}) {
  const [title, setTitle] = useState("");
  const [section, setSection] = useState(teacherClassSectionLabels[0] ?? "Grade 10-A");
  const [subject, setSubject] = useState(PORTAL_FORM_OPTIONS.subjects[0]);
  const [due, setDue] = useState("");
  const [desc, setDesc] = useState("");
  const valid = !!title.trim() && !!due;

  const save = async () => {
    if (!valid) return;
    setSaving(true);
    await simulateDelay();
    const [cls, sec] = section.split("-");
    onSave({
      id: `HW-${Date.now()}`,
      branchId: "BR-MAIN",
      cls, section: sec, subject, title: title.trim(), teacher: PORTAL_TEACHER.name,
      assigned: new Date().toISOString().slice(0, 10), due,
      submitted: 0, total: 32, status: "Open",
    });
    setSaving(false);
    setTitle(""); setDue(""); setDesc("");
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} width="max-w-xl" title="New Assignment" subtitle="Set homework for your sections"
      footer={<><Btn variant="secondary" onClick={onClose} disabled={saving}>Cancel</Btn>
        <Btn variant="primary" onClick={save} loading={saving} loadingLabel="Creating…" disabled={!valid}>Create Assignment</Btn></>}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Title" className="sm:col-span-2"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Quadratic Equations — Worksheet 5" /></Field>
        <Field label="Class & Section">
          <Select options={teacherClassSectionLabels} value={section} onChange={(e) => setSection(e.target.value)} />
        </Field>
        <Field label="Subject">
          <Select options={PORTAL_FORM_OPTIONS.subjects} value={subject} onChange={(e) => setSubject(e.target.value)} />
        </Field>
        <Field label="Due Date"><Input type="date" value={due} onChange={(e) => setDue(e.target.value)} /></Field>
        <Field label="Instructions" className="sm:col-span-2">
          <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Optional notes for students" />
        </Field>
      </div>
    </Modal>
  );
}
