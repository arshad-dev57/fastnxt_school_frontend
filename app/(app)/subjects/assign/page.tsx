"use client";

import { useMemo, useState } from "react";
import { Plus, BookOpen, Trash2, UserCheck, School, ClipboardList, Filter, Layers } from "lucide-react";
import {
  Avatar, Badge, Btn, EmptyState, Field, RowMenu, Select, Td, Th, ToolbarBtn, cn,
} from "@/components/ui";
import {
  Board, BoardBar, BoardBody, BoardHead, BoardSearch, BoardTabs, BoardToolbar, BarCell, GroupHead, GroupTable,
} from "@/components/board";
import { CLASS_NAMES, SECTIONS, SUBJECT_ROWS, EMPLOYEE_ROWS } from "@/lib/mock-data";

type Assignment = { id: number; cls: string; section: string; subject: string; teacher: string; date: string };

const TEACHERS = EMPLOYEE_ROWS.filter((e) => e.department === "Academics").map((e) => e.name);
const PALETTE = ["#579BFC", "#A25DDC", "#00C875", "#FF158A", "#FDAB3D", "#037F4C"];
const COLS = "grid-cols-[44px_110px_minmax(180px,1.4fr)_minmax(160px,1fr)_150px_64px]";

const SEED: Assignment[] = [
  { id: 1, cls: "Grade 10", section: "A", subject: "Mathematics", teacher: "Priya Nair", date: "2026-01-04" },
  { id: 2, cls: "Grade 10", section: "A", subject: "English", teacher: "Liam Bennett", date: "2026-01-04" },
  { id: 3, cls: "Grade 10", section: "B", subject: "Computer Studies", teacher: "Farhan Sheikh", date: "2026-01-05" },
  { id: 4, cls: "Grade 9", section: "B", subject: "General Science", teacher: "Kiran Shah", date: "2026-01-06" },
  { id: 5, cls: "Grade 9", section: "A", subject: "Islamiat", teacher: "Ayesha Malik", date: "2026-01-07" },
];

export default function AssignSubjectsPage() {
  const [cls, setCls] = useState("");
  const [section, setSection] = useState("");
  const [subject, setSubject] = useState("");
  const [teacher, setTeacher] = useState("");
  const [list, setList] = useState<Assignment[]>(SEED);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("All");

  const canAssign = !!(cls && section && subject && teacher);
  const assign = () => {
    if (!canAssign) return;
    setList((p) => [{ id: Date.now(), cls, section, subject, teacher, date: new Date().toISOString().slice(0, 10) }, ...p]);
    setSubject(""); setTeacher("");
  };

  const classTabs = useMemo(() => ["All", ...Array.from(new Set(list.map((a) => a.cls)))], [list]);

  const byClass = useMemo(() => {
    const filtered = list
      .filter((a) => tab === "All" || a.cls === tab)
      .filter((a) => q === "" || a.subject.toLowerCase().includes(q.toLowerCase()) || a.teacher.toLowerCase().includes(q.toLowerCase()));
    return Array.from(new Set(filtered.map((a) => a.cls)))
      .map((name, i) => ({ cls: name, color: PALETTE[i % PALETTE.length], items: filtered.filter((a) => a.cls === name) }));
  }, [list, tab, q]);

  const total = byClass.reduce((n, g) => n + g.items.length, 0);

  return (
    <Board>
      <BoardBar>
        <BoardHead Icon={ClipboardList} title="Assign Subjects" subtitle="Link subjects to classes, sections and teachers." />
        <BoardTabs tabs={classTabs} value={tab} onChange={setTab} />
        <BoardToolbar>
          <BoardSearch value={q} onChange={setQ} placeholder="Search subject or teacher" className="ml-0" />
          <ToolbarBtn Icon={Filter} label="Filter" />
          <ToolbarBtn Icon={Layers} label="Group by" />
        </BoardToolbar>
      </BoardBar>

      <BoardBody>
        {/* NEW ASSIGNMENT PANEL */}
        <div className="overflow-hidden rounded-l border-y border-r border-[#E6E9EF] bg-white">
          <div className="p-3 sm:p-4" style={{ borderLeft: "6px solid #2563EB" }}>
            <div className="flex flex-wrap items-center gap-2 text-[15px] font-semibold">
              <ClipboardList className="h-[18px] w-[18px] text-[#2563EB]" /> New assignment
              <span className="text-[13px] font-normal text-[#676879]">Select class, section, subject and teacher</span>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <Field label="Class"><Select options={CLASS_NAMES} value={cls} onChange={(e) => setCls(e.target.value)} placeholder="Select class" /></Field>
              <Field label="Section"><Select options={SECTIONS} value={section} onChange={(e) => setSection(e.target.value)} placeholder="Select section" /></Field>
              <Field label="Subject"><Select options={SUBJECT_ROWS.map((s) => s.name)} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Select subject" /></Field>
              <Field label="Teacher"><Select options={TEACHERS} value={teacher} onChange={(e) => setTeacher(e.target.value)} placeholder="Select teacher" /></Field>
              <div className="flex flex-col justify-end">
                <Btn variant="primary" Icon={Plus} className="w-full" disabled={!canAssign} onClick={assign}>Assign Subject</Btn>
                {!canAssign && <p className="mt-1 text-[12px] text-[#9699A6]">Fill all fields to enable.</p>}
              </div>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Mini label="Assignments" value={list.length} Icon={ClipboardList} color="#2563EB" />
          <Mini label="Classes covered" value={new Set(list.map((a) => a.cls)).size} Icon={School} color="#00C875" />
          <Mini label="Teachers involved" value={new Set(list.map((a) => a.teacher)).size} Icon={UserCheck} color="#A25DDC" />
        </div>

        {/* ASSIGNED SUBJECTS — grouped by class */}
        {total === 0 && <EmptyState Icon={BookOpen} title="No assignments" message="Use the form above to assign subjects to classes." />}

        <div className="mt-6 space-y-8 md:min-w-[760px]">
          {byClass.map((g) => (
            <section key={g.cls}>
              <GroupHead title={g.cls} color={g.color} count={g.items.length} />

              <div className="hidden md:block">
                <GroupTable>
                  <div className={cn("grid", COLS, "border-b border-[#E6E9EF] bg-white")}>
                    <div className="border-l-[6px]" style={{ borderColor: g.color }} />
                    <Th className="border-l border-[#E6E9EF]">Section</Th>
                    <Th className="border-l border-[#E6E9EF]">Subject</Th>
                    <Th className="border-l border-[#E6E9EF]">Teacher</Th>
                    <Th className="border-l border-[#E6E9EF]">Assigned</Th>
                    <Th className="border-l border-[#E6E9EF]"><span className="sr-only">Actions</span></Th>
                  </div>
                  {g.items.map((a) => (
                    <div key={a.id} className={cn("row grid", COLS, "border-b border-[#E6E9EF] bg-white text-[15px] transition-colors last:border-b-0 hover:bg-[#F5F6F8]")}>
                      <BarCell color={g.color} className="py-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#CCE5FF] text-[#0060B9]"><BookOpen className="h-4 w-4" /></span>
                      </BarCell>
                      <Td className="border-l border-[#E6E9EF]"><Badge label={a.section} tone="gray" /></Td>
                      <Td className="gap-2 border-l border-[#E6E9EF] font-medium"><BookOpen className="h-4 w-4 shrink-0 text-[#5A34D6]" /><span className="truncate">{a.subject}</span></Td>
                      <Td className="gap-2 border-l border-[#E6E9EF]"><Avatar name={a.teacher} size={28} /><span className="truncate">{a.teacher}</span></Td>
                      <Td className="border-l border-[#E6E9EF] text-[#676879]"><span className="rounded-full border border-[#E6E9EF] px-3 py-0.5">{a.date}</span></Td>
                      <Td className="justify-center border-l border-[#E6E9EF]"><RowMenu items={[{ label: "Remove", Icon: Trash2, danger: true, onClick: () => setList((p) => p.filter((x) => x.id !== a.id)) }]} /></Td>
                    </div>
                  ))}
                </GroupTable>
              </div>

              {/* MOBILE */}
              <div className="space-y-3 md:hidden">
                {g.items.map((a) => (
                  <div key={a.id} className="rounded-lg border border-[#E6E9EF] bg-white p-3 shadow-sm" style={{ borderLeft: `6px solid ${g.color}` }}>
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-medium">{a.subject}</p>
                        <p className="text-[13px] text-[#676879]">{a.cls}-{a.section} · {a.date}</p>
                      </div>
                      <button onClick={() => setList((p) => p.filter((x) => x.id !== a.id))} className="text-[#DF2F4A]" aria-label="Remove"><Trash2 className="h-4 w-4" /></button>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-[13px] text-[#676879]"><Avatar name={a.teacher} size={26} /><span className="font-medium text-[#323338]">{a.teacher}</span></div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </BoardBody>
    </Board>
  );
}

function Mini({ label, value, Icon, color }: { label: string; value: number; Icon: React.ElementType; color: string }) {
  return (
    <div className="rounded-lg border border-[#E6E9EF] bg-white p-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${color}1A`, color }}><Icon className="h-[18px] w-[18px]" /></span>
      <p className="mt-2 text-[22px] font-bold">{value}</p>
      <p className="text-[13px] text-[#676879]">{label}</p>
    </div>
  );
}

