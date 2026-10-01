"use client";

import { useMemo, useState } from "react";
import { Printer, SlidersHorizontal, Users } from "lucide-react";
import { Badge, Btn, Card, CardHead, PageHeader, Select, Th, Td, cn } from "@/components/ui";
import { STUDENT_ROWS, CLASS_NAMES, SECTIONS, GENDERS, SCHOOL } from "@/lib/mock-data";

const COLS = "grid-cols-[60px_120px_minmax(160px,1.4fr)_80px_110px_80px_130px]";

export default function PrintBasicListPage() {
  const [cls, setCls] = useState("");
  const [section, setSection] = useState("");
  const [gender, setGender] = useState("");
  const [status, setStatus] = useState("");
  const [showMeta, setShowMeta] = useState(true);

  const list = useMemo(() => STUDENT_ROWS
    .filter((s) => (cls ? s.cls === cls : true))
    .filter((s) => (section ? s.section === section : true))
    .filter((s) => (gender ? s.gender === gender : true))
    .filter((s) => (status ? s.status === status : true)),
  [cls, section, gender, status]);

  const activeFilters = [
    cls && `Class: ${cls}`, section && `Section: ${section}`, gender && `Gender: ${gender}`, status && `Status: ${status}`,
  ].filter(Boolean) as string[];

  return (
    <>
      <div className="no-print">
        <PageHeader title="Print Basic List" subtitle="Generate a printable student list filtered by class, section, gender and status."
          actions={<Btn variant="primary" Icon={Printer} onClick={() => window.print()}>Print List</Btn>} />

        <div className="px-4 pb-24 sm:px-6">
          <Card pad={false}>
            <CardHead title="Filters" subtitle="Choose the criteria for the printed list" Icon={SlidersHorizontal} />
            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
              <Select value={cls} onChange={(e) => setCls(e.target.value)} options={CLASS_NAMES} placeholder="All Classes" />
              <Select value={section} onChange={(e) => setSection(e.target.value)} options={SECTIONS} placeholder="All Sections" />
              <Select value={gender} onChange={(e) => setGender(e.target.value)} options={GENDERS} placeholder="All Genders" />
              <Select value={status} onChange={(e) => setStatus(e.target.value)} options={["Active", "Inactive"]} placeholder="All Status" />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E6E9EF] px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                {activeFilters.length ? activeFilters.map((f) => <Badge key={f} label={f} tone="blue" />) : <span className="text-[13px] text-[#9699A6]">No filters applied — showing all students</span>}
              </div>
              <label className="flex items-center gap-2 text-[13px] text-[#676879]">
                <input type="checkbox" checked={showMeta} onChange={(e) => setShowMeta(e.target.checked)} className="h-4 w-4 accent-[#2563EB]" /> Include header &amp; filters
              </label>
            </div>
          </Card>

          <p className="mt-4 text-[13px] text-[#676879]">{list.length} student(s) match the current filters. Use “Print List” to print or save as PDF.</p>
        </div>
      </div>

      {/* PRINTABLE DOCUMENT */}
      <div className="px-4 pb-24 sm:px-6">
        <div className="print-area mx-auto max-w-[900px] rounded-lg border border-[#E6E9EF] bg-white p-6">
          {showMeta && (
            <div className="mb-4 flex items-start justify-between gap-4 border-b-2 border-[#2563EB] pb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#6C47FF] text-[22px] font-extrabold text-white">B</span>
                <div>
                  <h1 className="text-[19px] font-bold leading-tight">{SCHOOL.name}</h1>
                  <p className="text-[12px] text-[#676879]">{SCHOOL.address}</p>
                  <p className="text-[12px] text-[#676879]">{SCHOOL.phone} · {SCHOOL.email}</p>
                </div>
              </div>
              <div className="text-right text-[12px] text-[#676879]">
                <p>Date</p>
                <p className="font-semibold text-[#323338]">{new Date().toISOString().slice(0, 10)}</p>
              </div>
            </div>
          )}

          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[16px] font-bold">Student Basic List</h2>
            <span className="text-[12px] text-[#676879]">Session {SCHOOL.session}</span>
          </div>
          {showMeta && activeFilters.length > 0 && (
            <p className="mb-3 text-[12px] text-[#676879]">Filters — {activeFilters.join(" · ")}</p>
          )}

          <div className="hidden md:block">
            <div className={cn("grid", COLS, "border-y border-[#E6E9EF] bg-[#F6F7FB]")}>
              <Th className="border-l border-[#E6E9EF]">#</Th>
              <Th className="border-l border-[#E6E9EF]">Student ID</Th>
              <Th className="border-l border-[#E6E9EF]">Student Name</Th>
              <Th className="border-l border-[#E6E9EF]">Gender</Th>
              <Th className="border-l border-[#E6E9EF]">Class</Th>
              <Th className="border-l border-[#E6E9EF]">Section</Th>
              <Th className="border-l border-[#E6E9EF]">Contact</Th>
            </div>
            {list.map((s, i) => (
              <div key={s.id} className={cn("grid", COLS, "border-b border-[#E6E9EF] text-[13px]")}>
                <Td className="border-l border-[#E6E9EF] text-[#676879]">{i + 1}</Td>
                <Td className="border-l border-[#E6E9EF] font-mono text-[12px] text-[#676879]">{s.id}</Td>
                <Td className="border-l border-[#E6E9EF] font-medium">{s.name}</Td>
                <Td className="border-l border-[#E6E9EF] text-[#676879]">{s.gender}</Td>
                <Td className="border-l border-[#E6E9EF]">{s.cls}</Td>
                <Td className="border-l border-[#E6E9EF]">{s.section}</Td>
                <Td className="border-l border-[#E6E9EF] text-[#676879]">{s.contact}</Td>
              </div>
            ))}
          </div>

          <div className="md:hidden">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="bg-[#F6F7FB]">
                  {["#", "ID", "Name", "Class"].map((h) => <th key={h} className="border border-[#E6E9EF] px-2 py-1 text-left">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {list.map((s, i) => (
                  <tr key={s.id}>
                    <td className="border border-[#E6E9EF] px-2 py-1">{i + 1}</td>
                    <td className="border border-[#E6E9EF] px-2 py-1 font-mono">{s.id}</td>
                    <td className="border border-[#E6E9EF] px-2 py-1">{s.name}</td>
                    <td className="border border-[#E6E9EF] px-2 py-1">{s.cls}-{s.section}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {list.length === 0 && <p className="py-8 text-center text-[14px] text-[#676879]">No students match the selected filters.</p>}

          <div className="mt-6 flex items-center justify-between border-t border-dashed border-[#C5C7D0] pt-3 text-[11px] text-[#9699A6]">
            <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> Total: {list.length} students</span>
            <span>{SCHOOL.website}</span>
          </div>
        </div>
      </div>
    </>
  );
}
