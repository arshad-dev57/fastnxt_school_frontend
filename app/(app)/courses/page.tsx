"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, Plus, Trash2 } from "lucide-react";
import { Btn, EmptyState, Field, Input, PageHeader, Select, Th, Td } from "@/components/ui";
import { coursesApi, describeApiError, type CourseItem } from "@/lib/auth/api-client";

const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "law", label: "Law" },
  { value: "it", label: "IT" },
  { value: "nursing", label: "Nursing" },
];

function categoryLabel(value: string) {
  return CATEGORIES.find((item) => item.value === value)?.label || "General";
}

export default function CoursesPage() {
  const [rows, setRows] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("general");
  const [duration, setDuration] = useState("");
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await coursesApi.list();
      setRows(res.courses || []);
    } catch (err) {
      setError(describeApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(
    () => rows.filter((row) => (filter ? row.category === filter : true)),
    [rows, filter],
  );

  const addCourse = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await coursesApi.create({
        name: name.trim(),
        category,
        duration: duration.trim() || undefined,
      });
      setRows((prev) => {
        const without = prev.filter((row) => row.id !== res.course.id);
        return [...without, res.course].sort((a, b) => a.name.localeCompare(b.name));
      });
      setName("");
      setDuration("");
    } catch (err) {
      setError(describeApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (course: CourseItem) => {
    if (!window.confirm(`Remove ${course.name}? Students who already have it will keep the name on their record.`)) return;
    try {
      await coursesApi.remove(course.id);
      setRows((prev) => prev.filter((row) => row.id !== course.id));
    } catch (err) {
      setError(describeApiError(err).message);
    }
  };

  return (
    <div className="mx-auto max-w-5xl pb-10">
      <PageHeader
        title="Courses"
        subtitle="Add the courses this school offers. They can be selected on an admission form, and they show on the student list, ID card and admission letter."
      />

      <div className="space-y-4 px-4 sm:px-6">
        {error ? (
          <div className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
        ) : null}

        <div className="grid gap-3 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 sm:grid-cols-[1.4fr_160px_160px_auto] sm:items-end">
          <Field label="Course name">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Web Design" />
          </Field>
          <Field label="Category">
            <Select
              options={CATEGORIES.map((item) => item.label)}
              value={categoryLabel(category)}
              onChange={(e) => {
                const next = CATEGORIES.find((item) => item.label === e.target.value);
                setCategory(next?.value || "general");
              }}
            />
          </Field>
          <Field label="Duration">
            <Input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Optional" />
          </Field>
          <Btn type="button" variant="primary" Icon={Plus} loading={saving} onClick={() => void addCourse()}>
            Add course
          </Btn>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            {["", ...CATEGORIES.map((item) => item.value)].map((value) => (
              <button
                key={value || "all"}
                type="button"
                onClick={() => setFilter(value)}
                className={`rounded-full border px-3 py-1 text-[13px] ${
                  filter === value
                    ? "border-[var(--theme-primary)] bg-[var(--theme-primary)] text-white"
                    : "border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-text-muted)]"
                }`}
              >
                {value ? categoryLabel(value) : "All"}
              </button>
            ))}
          </div>
          <Link href="/students/new" className="text-[13px] text-[var(--theme-primary)] hover:underline">
            Use a course on a new admission
          </Link>
        </div>

        {loading ? (
          <p className="py-10 text-center text-sm text-[var(--theme-text-muted)]">Loading courses…</p>
        ) : visible.length === 0 ? (
          <EmptyState
            Icon={BookOpen}
            title="No courses yet"
            message="Add a course above. Every school keeps its own list."
          />
        ) : (
          <div className="overflow-hidden rounded-lg border border-[var(--theme-border)]">
            <div className="grid grid-cols-[1.4fr_140px_140px_64px] border-b border-[var(--theme-border)] bg-[var(--theme-surface)]">
              <Th>Course</Th>
              <Th className="border-l border-[var(--theme-border)]">Category</Th>
              <Th className="border-l border-[var(--theme-border)]">Duration</Th>
              <Th className="border-l border-[var(--theme-border)]"><span className="sr-only">Remove</span></Th>
            </div>
            {visible.map((course) => (
              <div key={course.id} className="grid grid-cols-[1.4fr_140px_140px_64px] border-b border-[var(--theme-border)] last:border-b-0">
                <Td className="font-medium">{course.name}</Td>
                <Td className="border-l border-[var(--theme-border)] text-[var(--theme-text-muted)]">{categoryLabel(course.category)}</Td>
                <Td className="border-l border-[var(--theme-border)] text-[var(--theme-text-muted)]">{course.duration || "—"}</Td>
                <Td className="justify-center border-l border-[var(--theme-border)]">
                  <button
                    type="button"
                    onClick={() => void remove(course)}
                    className="rounded p-1 text-[var(--theme-text-muted)] hover:bg-[var(--theme-hover)] hover:text-rose-600"
                    aria-label={`Remove ${course.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </Td>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
