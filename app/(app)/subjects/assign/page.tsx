"use client";

import { useState } from "react";
import { Plus, BookOpen, Trash2, UserCheck, School, ClipboardList } from "lucide-react";
import {
  Badge, Btn, Card, CardHead, EmptyState, Field, PageHeader, RowMenu, Select, Th, Td, cn,
} from "@/components/ui";
import { CLASS_NAMES, SECTIONS, SUBJECT_ROWS, EMPLOYEE_ROWS } from "@/lib/mock-data";

type Assignment = { id: number; cls: string; section: string; subject: string; teacher: string; date: string };

const TEACHERS = EMPLOYEE_ROWS.filter((e) => e.department === "Academics").map((e) => e.name);
const COLS = "grid-cols-[minmax(140px,1fr)_90px_minmax(160px,1.2fr)_minmax(140px,1fr)_120px_64px]";

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
  const [filterClass, setFilterClass] = useState("");

  const canAssign = !!(cls && section && subject && teacher);
  const assign = () => {
    if (!canAssign) return;
    setList((p) => [{ id: Date.now(), cls, section, subject, teacher, date: new Date().toISOString().slice(0, 10) }, ...p]);
    setSubject(""); setTeacher("");
  };

  const filtered = filterClass ? list.filter((a) => a.cls === filterClass) : list;

  return (
    <>
      <PageHeader title="Assign Subjects" subtitle="Link subjects to classes, sections and teachers." />

      <div className="grid grid-cols-1 gap-5 px-4 pb-24 pt-4 sm:px-6 xl:grid-cols-3">
        <Card pad={false} className="xl:col-span-1">
          <CardHead title="New assignment" subtitle="Select class, section, subject and teacher" Icon={ClipboardList} />
          <div className="space-y-4 p-4">
            <Field label="Class"><Select options={CLASS_NAMES} value={cls} onChange={(e) => setCls(e.target.value)} placeholder="Select class" /></Field>
            <Field label="Section"><Select options={SECTIONS} value={section} onChange={(e) => setSection(e.target.value)} placeholder="Select section" /></Field>
            <Field label="Subject"><Select options={SUBJECT_ROWS.map((s) => s.name)} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Select subject" /></Field>
            <Field label="Teacher"><Select options={TEACHERS} value={teacher} onChange={(e) => setTeacher(e.target.value)} placeholder="Select teacher" /></Field>
            <Btn variant="primary" Icon={Plus} className="w-full" disabled={!canAssign} onClick={assign}>Assign Subject</Btn>
            {!canAssign && <p className="text-[12px] text-[#9699A6]">Fill all fields to enable assignment.</p>}
          </div>
        </Card>

        <div className="space-y-5 xl:col-span-2">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Mini label="Assignments" value={list.length} Icon={ClipboardList} />
            <Mini label="Classes covered" value={new Set(list.map((a) => a.cls)).size} Icon={School} />
            <Mini label="Teachers involved" value={new Set(list.map((a) => a.teacher)).size} Icon={UserCheck} />
          </div>

          <Card pad={false}>
            <CardHead title="Assigned subjects" subtitle="Current subject–class assignments" Icon={BookOpen}
              right={<Select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} options={CLASS_NAMES} placeholder="All Classes" className="w-40" />} />

            <div className="hidden md:block">
              <div className={cn("grid", COLS, "border-b border-[#E6E9EF] bg-white")}>
                <Th className="border-l border-[#E6E9EF]">Class</Th>
                <Th className="border-l border-[#E6E9EF]">Section</Th>
                <Th className="border-l border-[#E6E9EF]">Subject</Th>
                <Th className="border-l border-[#E6E9EF]">Teacher</Th>
                <Th className="border-l border-[#E6E9EF]">Assigned</Th>
                <Th className="border-l border-[#E6E9EF]"><span className="sr-only">Actions</span></Th>
              </div>
              {filtered.map((a) => (
                <div key={a.id} className={cn("grid", COLS, "border-b border-[#E6E9EF] bg-white text-[14px] last:border-b-0 hover:bg-[#F5F6F8]")}>
                  <Td className="border-l border-[#E6E9EF] font-medium">{a.cls}</Td>
                  <Td className="border-l border-[#E6E9EF]"><Badge label={a.section} tone="gray" /></Td>
                  <Td className="gap-2 border-l border-[#E6E9EF]"><BookOpen className="h-4 w-4 text-[#5A34D6]" />{a.subject}</Td>
                  <Td className="border-l border-[#E6E9EF] text-[#676879]">{a.teacher}</Td>
                  <Td className="border-l border-[#E6E9EF] text-[#676879]">{a.date}</Td>
                  <Td className="justify-center border-l border-[#E6E9EF]"><RowMenu items={[{ label: "Remove", Icon: Trash2, danger: true, onClick: () => setList((p) => p.filter((x) => x.id !== a.id)) }]} /></Td>
                </div>
              ))}
            </div>

            <div className="space-y-2 p-3 md:hidden">
              {filtered.map((a) => (
                <div key={a.id} className="rounded-lg border border-[#E6E9EF] bg-white p-3" style={{ borderLeft: "6px solid #A25DDC" }}>
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-medium">{a.subject}</p>
                      <p className="text-[13px] text-[#676879]">{a.cls}-{a.section} · {a.teacher}</p>
                    </div>
                    <button onClick={() => setList((p) => p.filter((x) => x.id !== a.id))} className="text-[#DF2F4A]" aria-label="Remove"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>

            {filtered.length === 0 && <EmptyState Icon={BookOpen} title="No assignments" message="Use the form to assign subjects to classes." />}
          </Card>
        </div>
      </div>
    </>
  );
}

function Mini({ label, value, Icon }: { label: string; value: number; Icon: React.ElementType }) {
  return (
    <Card>
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#CCE5FF] text-[#0060B9]"><Icon className="h-[18px] w-[18px]" /></span>
      <p className="mt-2 text-[22px] font-bold">{value}</p>
      <p className="text-[13px] text-[#676879]">{label}</p>
    </Card>
  );
}
