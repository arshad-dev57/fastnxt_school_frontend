"use client";

import { useMemo, useState } from "react";
import { Printer, IdCard, Check, Search } from "lucide-react";
import { Avatar, Btn, Card, CardHead, Checkbox, EmptyState, PageHeader, SearchBox, Select, cn } from "@/components/ui";
import { STUDENT_ROWS, CLASS_NAMES, SECTIONS, SCHOOL, type StudentRow } from "@/lib/mock-data";

export default function StudentIdCardsPage() {
  const [q, setQ] = useState("");
  const [cls, setCls] = useState("");
  const [section, setSection] = useState("");
  const [selected, setSelected] = useState<string[]>(["STD-1001", "STD-1004"]);

  const list = useMemo(() => STUDENT_ROWS
    .filter((s) => s.name.toLowerCase().includes(q.toLowerCase()) || s.id.toLowerCase().includes(q.toLowerCase()))
    .filter((s) => (cls ? s.cls === cls : true))
    .filter((s) => (section ? s.section === section : true)),
  [q, cls, section]);

  const toggle = (id: string) => setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const selectedStudents = STUDENT_ROWS.filter((s) => selected.includes(s.id));

  return (
    <>
      <div className="no-print">
        <PageHeader title="Student ID Cards" subtitle="Select students and print official school ID cards."
          actions={<Btn variant="primary" Icon={Printer} onClick={() => window.print()} disabled={selected.length === 0}>Print {selected.length ? `(${selected.length})` : ""}</Btn>} />

        <div className="px-4 pb-24 sm:px-6">
          <div className="flex flex-wrap items-center gap-2 py-3">
            <SearchBox value={q} onChange={setQ} placeholder="Search students" className="w-full sm:w-72" />
            <Select value={cls} onChange={(e) => setCls(e.target.value)} options={CLASS_NAMES} placeholder="All Classes" className="w-36" />
            <Select value={section} onChange={(e) => setSection(e.target.value)} options={SECTIONS} placeholder="All Sections" className="w-32" />
          </div>

          <Card pad={false}>
            <CardHead title="Select students" subtitle={`${selected.length} selected`} Icon={IdCard}
              right={<Btn size="sm" variant="secondary" onClick={() => setSelected(selected.length === list.length ? [] : list.map((s) => s.id))}>{selected.length === list.length && list.length > 0 ? "Clear all" : "Select all"}</Btn>} />
            <div className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((s) => (
                <button key={s.id} type="button" onClick={() => toggle(s.id)}
                  className={cn("flex items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                    selected.includes(s.id) ? "border-[#2563EB] bg-[#EAF4FF]" : "border-[#E6E9EF] hover:bg-[#F5F6F8]")}>
                  <Checkbox checked={selected.includes(s.id)} onChange={() => toggle(s.id)} />
                  <Avatar name={s.name} size={34} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium">{s.name}</p>
                    <p className="text-[12px] text-[#676879]">{s.id} · {s.cls}-{s.section}</p>
                  </div>
                  {selected.includes(s.id) && <Check className="h-4 w-4 shrink-0 text-[#2563EB]" />}
                </button>
              ))}
            </div>
            {list.length === 0 && <EmptyState Icon={Search} title="No students found" message="Adjust the search or filters." />}
          </Card>
        </div>
      </div>

      <div className="no-print px-4 sm:px-6">
        <h2 className="mb-2 text-[15px] font-semibold">Card preview {selectedStudents.length > 0 && <span className="text-[#676879]">({selectedStudents.length})</span>}</h2>
      </div>
      <div className="px-4 pb-24 sm:px-6">
        <div className="print-area flex flex-wrap gap-4 rounded-lg border border-[#E6E9EF] bg-[#F6F7FB] p-4">
          {selectedStudents.map((s) => <IdCardView key={s.id} s={s} />)}
          {selectedStudents.length === 0 && <p className="w-full py-10 text-center text-[14px] text-[#676879]">Select students above to preview their ID cards.</p>}
        </div>
      </div>
    </>
  );
}

function IdCardView({ s }: { s: StudentRow }) {
  return (
    <div className="print-break w-[330px] max-w-full overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-[#E6E9EF]">
      <div className="flex items-center gap-2 bg-gradient-to-r from-[#6C47FF] to-[#A25DDC] px-3 py-2.5 text-white">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 text-[15px] font-extrabold">B</span>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold leading-tight">{SCHOOL.shortName}</p>
          <p className="text-[10px] text-white/80">{SCHOOL.session} · Student ID Card</p>
        </div>
      </div>
      <div className="flex gap-3 p-3">
        <span className="flex h-[88px] w-[72px] shrink-0 items-center justify-center rounded-lg bg-[#F0F1F4] text-[24px] font-bold text-[#676879]">
          {s.name.split(" ").map((x) => x[0]).join("").slice(0, 2)}
        </span>
        <div className="min-w-0 flex-1 space-y-1 text-[11px]">
          <p className="text-[15px] font-bold leading-tight">{s.name}</p>
          <p className="text-[#676879]"><span className="font-medium text-[#323338]">ID:</span> {s.id}</p>
          <p className="text-[#676879]"><span className="font-medium text-[#323338]">Class:</span> {s.cls} - {s.section}</p>
          <p className="text-[#676879]"><span className="font-medium text-[#323338]">Gender:</span> {s.gender}</p>
          <p className="text-[#676879]"><span className="font-medium text-[#323338]">Contact:</span> {s.contact}</p>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-[#E6E9EF] px-3 py-1.5 text-[9px] text-[#9699A6]">
        <span>{SCHOOL.phone}</span>
        <span className="font-mono">ADM {s.admissionDate}</span>
      </div>
    </div>
  );
}
