"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Save, School, Users, Layers, AlertCircle, RefreshCw } from "lucide-react";
import { Btn, Card, CardHead, Checkbox, Field, Input, Modal, PageHeader, Select, Textarea } from "@/components/ui";
import { SuccessIcon } from "@/components/icons";
import { classesApi, type TeacherOption } from "@/lib/auth/api-client";

const SESSIONS = ["2025-2026", "2024-2025", "2026-2027"];
const CLASS_NAMES = [
  "Nursery", "KG", "Prep", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5",
  "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12",
  "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
  "Class 6", "Class 7", "Class 8", "Class 9", "Class 10",
];

export default function NewClassPage() {
  const router = useRouter();

  // Form state
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [session, setSession] = useState("2025-2026");
  const [teacherId, setTeacherId] = useState("");
  const [desc, setDesc] = useState("");
  const [status, setStatus] = useState("Active");
  const [sections, setSections] = useState<string[]>(["A"]);

  // Teachers dropdown
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [teachersLoading, setTeachersLoading] = useState(true);
  const [teachersError, setTeachersError] = useState<string | null>(null);

  // Submission state
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [createdName, setCreatedName] = useState("");

  const abortRef = useRef<AbortController | null>(null);

  const fetchTeachers = useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setTeachersLoading(true);
    setTeachersError(null);
    try {
      const res = await classesApi.listTeachers(undefined, ctrl.signal);
      setTeachers(res.teachers ?? []);
    } catch (err: unknown) {
      if ((err as { name?: string }).name === "AbortError") return;
      setTeachersError((err as Error).message || "Failed to load teachers.");
    } finally {
      setTeachersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeachers();
    return () => abortRef.current?.abort();
  }, [fetchTeachers]);

  // Auto-generate class code from name
  const handleNameChange = (val: string) => {
    setName(val);
    if (!code) {
      const words = val.trim().split(/\s+/);
      const auto = words.length > 1
        ? words.map((w) => w[0]).join("").toUpperCase()
        : val.substring(0, 3).toUpperCase();
      setCode(auto);
    }
  };

  const selectedTeacher = teachers.find((t) => t.id === teacherId);

  const handleSave = async () => {
    if (!name.trim()) {
      setSaveError("Class name is required.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const res = await classesApi.create({
        name: name.trim(),
        code: code.trim() || undefined,
        session,
        sections,
        teacherId: teacherId || null,
        teacher: selectedTeacher?.name || undefined,
        description: desc.trim() || undefined,
        status,
      });
      setCreatedName(res.class.name);
      setDone(true);
    } catch (err: unknown) {
      setSaveError((err as Error).message || "Failed to create class.");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setName("");
    setCode("");
    setSession("2025-2026");
    setTeacherId("");
    setDesc("");
    setStatus("Active");
    setSections(["A"]);
    setSaveError(null);
  };

  const back = (
    <Link href="/classes" className="flex h-9 w-9 items-center justify-center rounded text-[var(--theme-text-muted)] hover:bg-[var(--theme-hover)]" aria-label="Back">
      <ChevronLeft className="h-5 w-5" />
    </Link>
  );

  return (
    <>
      <PageHeader
        title="New Class"
        subtitle="Create a class, assign sections and a class teacher."
        back={back}
        actions={
          <Btn variant="primary" Icon={saving ? undefined : Save} onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? "Saving…" : "Save Class"}
          </Btn>
        }
      />

      {saveError && (
        <div className="mx-4 mt-2 flex items-center gap-2 rounded-lg border border-[var(--theme-danger-border)] bg-[var(--theme-danger-soft)] px-4 py-2 text-[13px] text-[var(--theme-danger-text)] sm:mx-6">
          <AlertCircle className="h-4 w-4 shrink-0" />{saveError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 px-4 pb-24 pt-4 sm:px-6 lg:grid-cols-3">
        {/* Left: form */}
        <Card pad={false} className="lg:col-span-2">
          <CardHead title="Class information" subtitle="Basic details for the new class" Icon={School} />
          <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
            <Field label="Class Name" hint="e.g. Grade 5, Nursery, KG">
              <Input value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="Enter class name" list="new-class-names" />
              <datalist id="new-class-names">{CLASS_NAMES.map((c) => <option key={c} value={c} />)}</datalist>
            </Field>

            <Field label="Class Code" hint="Auto-generated, or enter manually">
              <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. G5" />
            </Field>

            <Field label="Academic Session">
              <Select options={SESSIONS} value={session} onChange={(e) => setSession(e.target.value)} />
            </Field>

            <Field label="Class Teacher">
              {teachersLoading ? (
                <div className="flex h-9 items-center gap-2 rounded border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 text-[13px] text-[var(--theme-text-muted)]">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Loading teachers…
                </div>
              ) : teachersError ? (
                <div className="space-y-1">
                  <p className="text-[12px] text-[var(--theme-danger-text)]">{teachersError}</p>
                  <button onClick={fetchTeachers} className="text-[12px] text-[var(--theme-primary)] underline">Retry</button>
                </div>
              ) : (
                <>
                  <select
                    id="teacher-select"
                    value={teacherId}
                    onChange={(e) => setTeacherId(e.target.value)}
                    className="h-9 w-full rounded border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 text-[14px] focus:border-[var(--theme-primary)] focus:outline-none"
                  >
                    <option value="">— Select a teacher (optional) —</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}{t.designation ? ` — ${t.designation}` : ""}
                      </option>
                    ))}
                  </select>
                  {teachers.length === 0 && (
                    <p className="mt-1 text-[12px] text-[var(--theme-text-muted)]">
                      No teachers found.{" "}
                      <Link href="/employees/new" className="text-[var(--theme-primary)] underline">Add an employee</Link> with a teaching designation first.
                    </p>
                  )}
                </>
              )}
            </Field>

            <Field label="Sections" className="sm:col-span-2" hint="Select all sections that belong to this class">
              <div className="flex flex-wrap gap-4">
                {["A", "B", "C", "D"].map((s) => (
                  <label key={s} className="flex items-center gap-2 text-[14px]">
                    <Checkbox
                      checked={sections.includes(s)}
                      onChange={(v) => setSections((p) => (v ? [...p, s] : p.filter((x) => x !== s)))}
                    />
                    Section {s}
                  </label>
                ))}
              </div>
            </Field>

            <Field label="Description" className="sm:col-span-2">
              <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Optional notes about this class" />
            </Field>

            <Field label="Status">
              <Select options={["Active", "Inactive"]} value={status} onChange={(e) => setStatus(e.target.value)} />
            </Field>
          </div>
        </Card>

        {/* Right: summary + actions */}
        <div className="space-y-5">
          <Card pad={false}>
            <CardHead title="Summary" Icon={Layers} />
            <div className="space-y-3 p-4 text-[14px]">
              <Row label="Class" value={name || "—"} />
              <Row label="Code" value={code || "—"} />
              <Row label="Session" value={session} />
              <Row label="Sections" value={sections.join(", ") || "—"} />
              <Row label="Class Teacher" value={selectedTeacher?.name || "—"} />
              <Row label="Status" value={status} />
            </div>
          </Card>

          <Card>
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--theme-primary-soft)] text-[var(--theme-primary-soft-text)]">
                <Users className="h-4 w-4" />
              </span>
              <p className="text-[13px] leading-relaxed text-[var(--theme-text-muted)]">
                After creating the class you can assign subjects from the{" "}
                <Link href="/subjects/assign" className="font-medium text-[var(--theme-primary)] hover:underline">Subjects</Link>{" "}
                module and add students from the{" "}
                <Link href="/students" className="font-medium text-[var(--theme-primary)] hover:underline">Students</Link> module.
              </p>
            </div>
          </Card>

          <div className="flex flex-wrap gap-2">
            <Btn variant="primary" Icon={saving ? undefined : Save} onClick={handleSave} disabled={saving || !name.trim()}>
              {saving ? "Saving…" : "Save Class"}
            </Btn>
            <Btn variant="secondary" onClick={() => router.push("/classes")}>Cancel</Btn>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <Modal
        open={done}
        onClose={() => { setDone(false); router.push("/classes"); }}
        title="Class created"
        width="max-w-md"
        footer={
          <>
            <Btn variant="secondary" onClick={() => { setDone(false); router.push("/classes"); }}>View All Classes</Btn>
            <Btn variant="primary" onClick={() => { setDone(false); resetForm(); }}>Add Another</Btn>
          </>
        }
      >
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--theme-success-soft)] text-[var(--theme-success-text)]">
            <SuccessIcon className="h-7 w-7" />
          </span>
          <p className="text-[15px] font-medium">{createdName || "New class"} has been created successfully.</p>
          <p className="text-[13px] text-[var(--theme-text-muted)]">Sections: {sections.join(", ") || "None"} · Session {session}</p>
        </div>
      </Modal>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[var(--theme-text-muted)]">{label}</span>
      <span className="truncate font-medium">{value}</span>
    </div>
  );
}
