"use client";

import { useMemo, useState } from "react";
import { ChevronDown, School, BookOpen, Plus } from "lucide-react";
import Link from "next/link";
import { Badge, Card, PageHeader, SearchBox, Select, cn } from "@/components/ui";
import { CLASS_ROWS, SUBJECT_ROWS } from "@/lib/mock-data";

const CORE = SUBJECT_ROWS.filter((s) => s.type === "Core").map((s) => s.name);
const EXTRA = SUBJECT_ROWS.filter((s) => s.type !== "Core");
const subjectsFor = (i: number) => [...CORE, ...EXTRA.filter((_, k) => (k + i) % 2 === 0).map((s) => s.name)];

export default function ClassesWithSubjectsPage() {
  const [q, setQ] = useState("");
  const [section, setSection] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({ "CLS-12": true, "CLS-11": true });

  const list = useMemo(() => CLASS_ROWS
    .map((c, i) => ({ ...c, subjects: subjectsFor(i) }))
    .filter((c) => c.name.toLowerCase().includes(q.toLowerCase()))
    .filter((c) => (section ? c.sections.includes(section) : true)),
  [q, section]);

  return (
    <>
      <PageHeader title="Classes with Subjects" subtitle="Overview of the subjects assigned to each class."
        actions={<Link href="/subjects/assign" className="inline-flex items-center gap-2 rounded bg-[#2563EB] px-3.5 py-2 text-[14px] font-medium text-white hover:bg-[#0060B9]"><Plus className="h-[18px] w-[18px]" /> Assign Subjects</Link>} />

      <div className="px-4 pb-24 sm:px-6">
        <div className="flex flex-wrap items-center gap-2 py-3">
          <SearchBox value={q} onChange={setQ} placeholder="Search classes" className="w-full sm:w-64" />
          <Select value={section} onChange={(e) => setSection(e.target.value)} options={["A", "B", "C", "D"]} placeholder="All Sections" className="w-40" />
        </div>

        <div className="space-y-3">
          {list.map((c) => {
            const isOpen = !!open[c.id];
            return (
              <Card key={c.id} pad={false}>
                <button onClick={() => setOpen((p) => ({ ...p, [c.id]: !p[c.id] }))}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[#F5F6F8]">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#CCE5FF] text-[#0060B9]"><School className="h-[18px] w-[18px]" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold">{c.name}</p>
                    <p className="text-[12px] text-[#676879]">{c.code} · {c.sections.length} sections · {c.students} students</p>
                  </div>
                  <span className="hidden items-center gap-1 text-[13px] text-[#676879] sm:flex"><BookOpen className="h-4 w-4" /> {c.subjects.length} subjects</span>
                  <ChevronDown className={cn("h-5 w-5 shrink-0 text-[#9699A6] transition-transform", isOpen && "rotate-180")} />
                </button>
                {isOpen && (
                  <div className="border-t border-[#E6E9EF] px-4 py-3">
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {c.sections.map((s) => <Badge key={s} label={`Section ${s}`} tone="gray" />)}
                      <Badge label={c.status} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {c.subjects.map((s) => (
                        <span key={s} className="inline-flex items-center gap-1.5 rounded-full border border-[#E6E9EF] bg-[#F6F7FB] px-2.5 py-1 text-[13px]">
                          <BookOpen className="h-3.5 w-3.5 text-[#5A34D6]" /> {s}
                        </span>
                      ))}
                    </div>
                    <p className="mt-3 text-[13px] text-[#676879]">Class teacher: <span className="font-medium text-[#323338]">{c.teacher}</span></p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
}
