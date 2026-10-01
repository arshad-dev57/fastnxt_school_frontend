"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Filter, Layers, School, BookOpen, Plus } from "lucide-react";
import { Avatar, Badge, EmptyState, Select, ToolbarBtn } from "@/components/ui";
import {
  Board, BoardBar, BoardBody, BoardHead, BoardSearch, BoardTabs, BoardToolbar, GroupHead,
} from "@/components/board";
import { CLASS_ROWS, SUBJECT_ROWS } from "@/lib/mock-data";

const CORE = SUBJECT_ROWS.filter((s) => s.type === "Core").map((s) => s.name);
const EXTRA = SUBJECT_ROWS.filter((s) => s.type !== "Core");
const subjectsFor = (i: number) => [...CORE, ...EXTRA.filter((_, k) => (k + i) % 2 === 0).map((s) => s.name)];

const PALETTE = ["#579BFC", "#A25DDC", "#00C875", "#FF158A", "#FDAB3D", "#037F4C"];
const TABS = ["All", "Active", "Inactive"] as const;
type Tab = (typeof TABS)[number];

export default function ClassesWithSubjectsPage() {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<Tab>("All");
  const [section, setSection] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const list = useMemo(() => CLASS_ROWS
    .map((c, i) => ({ ...c, subjects: subjectsFor(i), color: PALETTE[i % PALETTE.length] }))
    .filter((c) => (tab === "All" || c.status === tab))
    .filter((c) => c.name.toLowerCase().includes(q.toLowerCase()))
    .filter((c) => (section ? c.sections.includes(section) : true)),
  [q, tab, section]);

  return (
    <Board>
      <BoardBar>
        <BoardHead
          Icon={School}
          title="Classes with Subjects"
          subtitle="Overview of the subjects assigned to each class."
          actions={
            <Link href="/subjects/assign" className="flex h-9 items-center gap-2 rounded bg-[#2563EB] px-3.5 text-[14px] font-medium text-white hover:bg-[#1D4ED8]">
              <Plus className="h-[18px] w-[18px]" /> Assign Subjects
            </Link>
          }
        />
        <BoardTabs tabs={TABS} value={tab} onChange={setTab} />
        <BoardToolbar>
          <BoardSearch value={q} onChange={setQ} placeholder="Search classes" className="ml-0" />
          <div className="shrink-0"><Select value={section} onChange={(e) => setSection(e.target.value)} options={["A", "B", "C", "D"]} placeholder="All Sections" className="h-9 w-40" /></div>
          <ToolbarBtn Icon={Filter} label="Filter" />
          <ToolbarBtn Icon={Layers} label="Group by" />
        </BoardToolbar>
      </BoardBar>

      <BoardBody>
        {list.length === 0 && (
          <EmptyState Icon={School} title="No classes found" message="Try adjusting your search or filters." />
        )}

        <div className="space-y-6">
          {list.map((c) => {
            const open = !collapsed[c.id];
            return (
              <section key={c.id}>
                <GroupHead title={c.name} color={c.color} count={c.subjects.length} open={open}
                  onToggle={() => setCollapsed((p) => ({ ...p, [c.id]: open }))} />

                {open && (
                  <div className="overflow-hidden rounded-l border-y border-r border-[#E6E9EF] bg-white">
                    <div className="p-3 sm:p-4" style={{ borderLeft: `6px solid ${c.color}` }}>
                      <div className="flex flex-wrap items-center gap-2 text-[13px] text-[#676879]">
                        <span className="rounded-full border border-[#E6E9EF] px-2.5 py-0.5">{c.code}</span>
                        <span>{c.sections.length} sections · {c.students} students</span>
                        {c.sections.map((s) => <Badge key={s} label={`Section ${s}`} tone="gray" />)}
                        <Badge label={c.status} />
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {c.subjects.map((s) => (
                          <span key={s} className="inline-flex items-center gap-1.5 rounded-sm border border-[#E6E9EF] bg-[#F6F7FB] px-2.5 py-1 text-[13px]">
                            <BookOpen className="h-3.5 w-3.5 text-[#5A34D6]" /> {s}
                          </span>
                        ))}
                      </div>

                      <div className="mt-3 flex items-center gap-2 text-[13px] text-[#676879]">
                        <Avatar name={c.teacher} size={28} />
                        Class teacher: <span className="font-medium text-[#323338]">{c.teacher}</span>
                      </div>

                      <div className="mt-3">
                        <Link href="/subjects/assign" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#2563EB] hover:underline">
                          <Plus className="h-3.5 w-3.5" /> Assign more subjects
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </BoardBody>
    </Board>
  );
}
