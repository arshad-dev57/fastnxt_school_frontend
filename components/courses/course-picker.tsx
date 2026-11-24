"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Btn, Field, Input, Select } from "@/components/ui";
import { coursesApi, describeApiError, type CourseItem } from "@/lib/auth/api-client";

export function CoursePicker({
  courses,
  value,
  onChange,
  onCreated,
  category = "general",
  label = "Course",
  required = false,
  placeholder = "Select course",
}: {
  courses: CourseItem[];
  value: string;
  onChange: (course: CourseItem | null) => void;
  onCreated?: (course: CourseItem) => void;
  /** general shows every course. it and nursing show that category, plus any already selected name. */
  category?: string;
  label?: string;
  required?: boolean;
  placeholder?: string;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const options = courses.filter((course) => {
    if (course.status && course.status !== "Active") return course.name === value;
    if (!category || category === "general" || category === "all") return true;
    return course.category === category || course.name === value;
  });
  const names = options.map((course) => course.name);

  const save = async () => {
    const nextName = name.trim();
    if (!nextName) return;
    setSaving(true);
    setError(null);
    try {
      const res = await coursesApi.create({
        name: nextName,
        category: category === "all" ? "general" : category,
      });
      onCreated?.(res.course);
      onChange(res.course);
      setName("");
      setAdding(false);
    } catch (err) {
      setError(describeApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Field label={required ? `${label} *` : label}>
      <div className="flex gap-2">
        <div className="min-w-0 flex-1">
          <Select
            options={names.length ? names : value ? [value] : []}
            value={value}
            onChange={(e) => {
              const picked = options.find((course) => course.name === e.target.value) || null;
              onChange(picked);
            }}
            placeholder={names.length ? placeholder : "No courses yet — add one"}
          />
        </div>
        <Btn type="button" variant="secondary" Icon={Plus} onClick={() => setAdding((open) => !open)}>
          Add
        </Btn>
      </div>
      {adding ? (
        <div className="mt-2 flex gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New course name"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void save();
              }
            }}
          />
          <Btn type="button" variant="primary" loading={saving} onClick={() => void save()}>
            Save
          </Btn>
        </div>
      ) : null}
      {error ? <p className="mt-1 text-[12px] text-rose-600">{error}</p> : null}
    </Field>
  );
}
