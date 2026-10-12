"use client";

import { useRef, useState } from "react";
import { AlertCircle, Users } from "lucide-react";
import { Btn, Field, Input, Modal, Select, Textarea } from "@/components/ui";
import type { ClassItem, TeacherOption } from "@/lib/auth/api-client";

type ClassFormData = {
  name: string;
  code: string;
  session: string;
  sections: string[];
  teacherId: string;
  description: string;
  status: "Active" | "Inactive";
};

const SESSIONS = ["2025-2026", "2024-2025", "2026-2027"];
const CLASS_NAMES = [
  "Nursery", "KG", "Prep", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5",
  "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12",
  "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
  "Class 6", "Class 7", "Class 8", "Class 9", "Class 10",
];

export type ClassFormModalState = { mode: "add" | "edit"; row?: ClassItem } | null;

export function ClassFormModal({
  modal,
  teachers,
  saving,
  apiError,
  onClose,
  onSave,
}: {
  modal: ClassFormModalState;
  teachers: TeacherOption[];
  saving: boolean;
  apiError: string | null;
  onClose: () => void;
  onSave: (payload: Partial<ClassItem> & { teacherId?: string | null }) => void;
}) {
  const blank: ClassFormData = {
    name: "",
    code: "",
    session: "2025-2026",
    sections: ["A"],
    teacherId: "",
    description: "",
    status: "Active",
  };
  const [form, setForm] = useState<ClassFormData>(blank);
  const [sections, setSections] = useState<string[]>(["A"]);

  const key = `${modal?.mode ?? ""}-${modal?.row?.id ?? "new"}`;
  const lastKey = useRef(key);
  if (lastKey.current !== key) {
    lastKey.current = key;
    if (modal?.row) {
      setForm({
        name: modal.row.name,
        code: modal.row.code,
        session: modal.row.session,
        sections: modal.row.sections,
        teacherId: modal.row.teacherId ?? "",
        description: modal.row.description,
        status: modal.row.status,
      });
      setSections(modal.row.sections);
    } else {
      setForm(blank);
      setSections(["A"]);
    }
  }

  const set = (patch: Partial<ClassFormData>) => setForm((f) => ({ ...f, ...patch }));

  const submit = () => {
    const teacher = teachers.find((t) => t.id === form.teacherId);
    onSave({
      name: form.name,
      code: form.code,
      session: form.session,
      sections,
      teacherId: form.teacherId || null,
      teacher: teacher?.name || undefined,
      description: form.description,
      status: form.status,
    });
  };

  return (
    <Modal
      open={!!modal}
      onClose={onClose}
      width="max-w-2xl"
      title={modal?.mode === "edit" ? "Edit Class" : "New Class"}
      subtitle="Define the class, sections and class teacher."
      footer={
        <>
          <Btn variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Btn>
          <Btn variant="primary" onClick={submit} disabled={saving || !form.name.trim()}>
            {saving ? "Saving…" : modal?.mode === "edit" ? "Save Changes" : "Create Class"}
          </Btn>
        </>
      }
    >
      {apiError && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-[var(--theme-danger-border)] bg-[var(--theme-danger-soft)] px-3 py-2 text-[13px] text-[var(--theme-danger-text)]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {apiError}
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Class Name">
          <Input
            value={form.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder="e.g. Grade 5"
            list="class-names-list"
          />
          <datalist id="class-names-list">
            {CLASS_NAMES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
        <Field label="Class Code">
          <Input
            value={form.code}
            onChange={(e) => set({ code: e.target.value.toUpperCase() })}
            placeholder="e.g. G5"
          />
        </Field>
        <Field label="Academic Session">
          <Select options={SESSIONS} value={form.session} onChange={(e) => set({ session: e.target.value })} />
        </Field>
        <Field label="Class Teacher">
          <select
            value={form.teacherId}
            onChange={(e) => set({ teacherId: e.target.value })}
            className="h-9 w-full rounded border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 text-[14px] focus:border-[var(--theme-primary)] focus:outline-none"
          >
            <option value="">— Select a teacher —</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} {t.designation ? `(${t.designation})` : ""}
              </option>
            ))}
          </select>
          {teachers.length === 0 && (
            <p className="mt-1 text-[12px] text-[var(--theme-text-muted)]">
              No teachers found. Add employees with a teaching designation first.
            </p>
          )}
        </Field>
        <Field label="Sections" className="sm:col-span-2">
          <div className="flex flex-wrap gap-3">
            {["A", "B", "C", "D"].map((s) => (
              <label key={s} className="flex items-center gap-2 text-[14px]">
                <input
                  type="checkbox"
                  checked={sections.includes(s)}
                  onChange={(e) =>
                    setSections((p) => (e.target.checked ? [...p, s] : p.filter((x) => x !== s)))
                  }
                  className="h-4 w-4 accent-[var(--theme-primary)]"
                />
                Section {s}
              </label>
            ))}
          </div>
        </Field>
        <Field label="Description" className="sm:col-span-2">
          <Textarea
            value={form.description}
            onChange={(e) => set({ description: e.target.value })}
            placeholder="Short description / notes about this class"
          />
        </Field>
        <Field label="Status">
          <Select
            options={["Active", "Inactive"]}
            value={form.status}
            onChange={(e) => set({ status: e.target.value as ClassFormData["status"] })}
          />
        </Field>
        <div className="flex items-end gap-2 text-[13px] text-[var(--theme-text-muted)]">
          <Users className="h-4 w-4" /> Students are added from the Students module.
        </div>
      </div>
    </Modal>
  );
}
