"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Btn, Checkbox, Field, Input, Select, Textarea } from "@/components/ui";
import { useBranch } from "@/lib/branch-context";
import {
  classesApi,
  describeApiError,
  onlineClassesApi,
  subjectsApi,
} from "@/lib/auth/api-client";

type Props = {
  successPath: string;
  settingsPath: string;
};

type ClassOption = { label: string; cls: string; section: string };

export function CreateOnlineClassForm({ successPath, settingsPath }: Props) {
  const router = useRouter();
  const { currentBranchId } = useBranch();
  const [classOptions, setClassOptions] = useState<ClassOption[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [students, setStudents] = useState<Array<{ id: string; name: string; studentId: string | null }>>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [allStudents, setAllStudents] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleReady, setGoogleReady] = useState<boolean | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    classKey: "",
    subjectName: "",
    date: "",
    time: "",
    durationMinutes: "45",
  });

  const selectedClass = useMemo(
    () => classOptions.find((c) => c.label === form.classKey) || null,
    [classOptions, form.classKey]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const branchScope = currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined;
        const [clsRes, subRes, gRes] = await Promise.all([
          classesApi.list({ branchId: branchScope }),
          subjectsApi.list({ branchId: branchScope }).catch(() => ({ subjects: [] })),
          onlineClassesApi.googleStatus().catch(() => ({ configured: false, integration: null })),
        ]);
        if (cancelled) return;
        const opts: ClassOption[] = [];
        for (const c of clsRes.classes || []) {
          const sections = Array.isArray(c.sections) && c.sections.length ? c.sections : ["A"];
          for (const sec of sections) {
            opts.push({ label: `${c.name}-${sec}`, cls: c.name, section: sec });
          }
        }
        setClassOptions(opts);
        setSubjects((subRes.subjects || []).map((s) => s.name).filter(Boolean));
        setGoogleReady(Boolean(gRes.configured && gRes.integration?.connected));
      } catch (err) {
        if (!cancelled) setError(describeApiError(err).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentBranchId]);

  const loadStudents = useCallback(async () => {
    if (!selectedClass) {
      setStudents([]);
      return;
    }
    try {
      const res = await onlineClassesApi.eligibleStudents({
        cls: selectedClass.cls,
        section: selectedClass.section,
        branchId: currentBranchId,
      });
      setStudents(res.students || []);
    } catch {
      setStudents([]);
    }
  }, [selectedClass, currentBranchId]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!selectedClass) {
      setError("Select a class and section.");
      return;
    }
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!form.date || !form.time) {
      setError("Schedule date and start time are required.");
      return;
    }
    if (googleReady === false) {
      setError("Connect your Google account in Online Classes settings before creating a Meet class.");
      return;
    }

    const scheduledAt = new Date(`${form.date}T${form.time}:00`);
    if (Number.isNaN(scheduledAt.getTime())) {
      setError("Invalid date/time.");
      return;
    }

    setSaving(true);
    try {
      const res = await onlineClassesApi.create({
        title: form.title.trim(),
        description: form.description.trim(),
        cls: selectedClass.cls,
        section: selectedClass.section,
        subjectName: form.subjectName || undefined,
        scheduledAt: scheduledAt.toISOString(),
        durationMinutes: Math.max(15, Number(form.durationMinutes) || 45),
        studentIds: allStudents ? [] : selectedStudents,
        branchId: currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Karachi",
      });
      router.push(`${successPath}/${res.class.id}`);
    } catch (err) {
      setError(describeApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl space-y-4 px-4 py-4 sm:px-6">
      <div>
        <h1 className="text-[22px] font-semibold text-[var(--theme-text)]">Create Online Class</h1>
        <p className="mt-1 text-[13px] text-[var(--theme-text-muted)]">
          Creates a real Google Meet conference space and notifies enrolled students.
        </p>
      </div>

      {googleReady === false ? (
        <div className="rounded-lg border border-[var(--theme-warning)]/30 bg-[var(--theme-warning)]/10 px-3 py-2 text-[13px]">
          Google account not connected.{" "}
          <a href={settingsPath} className="font-medium underline">
            Open Google settings
          </a>
        </div>
      ) : null}

      <div className="grid gap-4 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 sm:grid-cols-2">
        <Field label="Title" className="sm:col-span-2">
          <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Midterm revision — Module 2" required />
        </Field>
        <Field label="Class / Section">
          <Select
            value={form.classKey}
            onChange={(e) => setForm((f) => ({ ...f, classKey: e.target.value }))}
            options={classOptions.map((c) => c.label)}
            placeholder="Select class"
            required
          />
        </Field>
        <Field label="Subject">
          <Select
            value={form.subjectName}
            onChange={(e) => setForm((f) => ({ ...f, subjectName: e.target.value }))}
            options={subjects}
            placeholder="Optional subject"
          />
        </Field>
        <Field label="Date">
          <Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required />
        </Field>
        <Field label="Start time">
          <Input type="time" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} required />
        </Field>
        <Field label="Duration (minutes)">
          <Input
            type="number"
            min={15}
            step={5}
            value={form.durationMinutes}
            onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))}
          />
        </Field>
        <Field label="Description / instructions" className="sm:col-span-2">
          <Textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="What students should prepare before joining"
          />
        </Field>
      </div>

      <div className="space-y-3 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4">
        <label className="flex items-center gap-2 text-[14px] text-[var(--theme-text)]">
          <Checkbox checked={allStudents} onChange={setAllStudents} />
          Include all students in this section
        </label>
        {!allStudents ? (
          <div className="max-h-56 space-y-2 overflow-y-auto rounded border border-[var(--theme-border)] p-2">
            {students.length === 0 ? (
              <p className="px-2 py-3 text-[13px] text-[var(--theme-text-muted)]">No active students found for this section.</p>
            ) : (
              students.map((s) => {
                const checked = selectedStudents.includes(s.id);
                return (
                  <label key={s.id} className="flex items-center gap-2 rounded px-2 py-1.5 text-[13px] hover:bg-[var(--theme-sidebar)]">
                    <Checkbox
                      checked={checked}
                      onChange={(v) =>
                        setSelectedStudents((prev) => (v ? [...prev, s.id] : prev.filter((id) => id !== s.id)))
                      }
                    />
                    <span>
                      {s.name}
                      {s.studentId ? ` · ${s.studentId}` : ""}
                    </span>
                  </label>
                );
              })
            )}
          </div>
        ) : null}
      </div>

      {error ? <p className="text-[13px] text-[var(--theme-danger)]">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        <Btn type="submit" variant="primary" loading={saving} disabled={saving}>
          Create Class
        </Btn>
        <Btn type="button" variant="secondary" onClick={() => router.back()}>
          Cancel
        </Btn>
      </div>
    </form>
  );
}
