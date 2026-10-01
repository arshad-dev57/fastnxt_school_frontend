"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Filter, ArrowUpDown, Eye, Pencil, Trash2, IdCard, UserPlus,
} from "lucide-react";
import {
  Avatar, Badge, Btn, Card, ConfirmDialog, EmptyState, Field, Input, Modal, PageHeader,
  Pagination, RowMenu, SearchBox, Select, Th, Td, cn,
} from "@/components/ui";
import { STUDENT_ROWS, CLASS_NAMES, SECTIONS, GENDERS, type StudentRow } from "@/lib/mock-data";

const COLS = "grid-cols-[120px_minmax(170px,1.3fr)_80px_100px_80px_minmax(140px,1fr)_120px_110px_100px_64px]";
const STEPS = 8;

export default function AllStudentsPage() {
  const [rows, setRows] = useState<StudentRow[]>(STUDENT_ROWS);
  const [q, setQ] = useState("");
  const [cls, setCls] = useState("");
  const [section, setSection] = useState("");
  const [status, setStatus] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<StudentRow | null>(null);
  const [editing, setEditing] = useState<StudentRow | null>(null);
  const [toDelete, setToDelete] = useState<StudentRow | null>(null);

  const filtered = useMemo(() => rows
    .filter((r) => r.name.toLowerCase().includes(q.toLowerCase()) || r.id.toLowerCase().includes(q.toLowerCase()) || r.guardian.toLowerCase().includes(q.toLowerCase()))
    .filter((r) => (cls ? r.cls === cls : true))
    .filter((r) => (section ? r.section === section : true))
    .filter((r) => (status ? r.status === status : true))
    .sort((a, b) => (sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name))),
  [rows, q, cls, section, status, sortAsc]);

  const pages = Math.max(1, Math.ceil(filtered.length / STEPS));
  const current = Math.min(page, pages);
  const paged = filtered.slice((current - 1) * STEPS, current * STEPS);

  const rowMenu = (r: StudentRow) => [
    { label: "View", Icon: Eye, onClick: () => setView(r) },
    { label: "Edit", Icon: Pencil, onClick: () => setEditing(r) },
    { label: "Delete", Icon: Trash2, danger: true, onClick: () => setToDelete(r) },
  ];

  return (
    <>
      <PageHeader title="All Students" subtitle="Complete student directory with class, section and guardian details."
        actions={
          <>
            <Link href="/students/id-cards" className="hidden items-center gap-2 rounded border border-[#C5C7D0] bg-white px-3.5 py-2 text-[14px] hover:bg-[#F5F6F8] lg:inline-flex"><IdCard className="h-[18px] w-[18px]" /> ID Cards</Link>
            <Link href="/students/new" className="inline-flex items-center gap-2 rounded bg-[#2563EB] px-3.5 py-2 text-[14px] font-medium text-white hover:bg-[#1D4ED8]"><UserPlus className="h-[18px] w-[18px]" /> Add New Student</Link>
          </>
        } />

      <div className="px-4 pb-24 sm:px-6">
        <div className="flex flex-wrap items-center gap-2 py-3">
          <SearchBox value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search by name, ID or guardian" className="w-full sm:w-72" />
          <div className="flex flex-wrap items-center gap-2">
            <Select value={cls} onChange={(e) => { setCls(e.target.value); setPage(1); }} options={CLASS_NAMES} placeholder="All Classes" className="w-36" />
            <Select value={section} onChange={(e) => { setSection(e.target.value); setPage(1); }} options={SECTIONS} placeholder="All Sections" className="w-32" />
            <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} options={["Active", "Inactive"]} placeholder="All Status" className="w-32" />
            <Btn variant="secondary" Icon={ArrowUpDown} onClick={() => setSortAsc((s) => !s)}>{sortAsc ? "A–Z" : "Z–A"}</Btn>
            <Btn variant="secondary" Icon={Filter} className="hidden lg:inline-flex">More Filters</Btn>
          </div>
        </div>

        <Card pad={false}>
          <div className="hidden md:block">
            <div className={cn("grid", COLS, "border-b border-[#E6E9EF] bg-white")}>
              <Th className="border-l border-[#E6E9EF]">Student ID</Th>
              <Th className="border-l border-[#E6E9EF]">Student</Th>
              <Th className="border-l border-[#E6E9EF]">Gender</Th>
              <Th className="border-l border-[#E6E9EF]">Class</Th>
              <Th className="border-l border-[#E6E9EF]">Section</Th>
              <Th className="border-l border-[#E6E9EF]">Guardian</Th>
              <Th className="border-l border-[#E6E9EF]">Contact</Th>
              <Th className="border-l border-[#E6E9EF]">Admission</Th>
              <Th className="border-l border-[#E6E9EF]">Status</Th>
              <Th className="border-l border-[#E6E9EF]"><span className="sr-only">Actions</span></Th>
            </div>
            {paged.map((r) => (
              <div key={r.id} className={cn("grid", COLS, "border-b border-[#E6E9EF] bg-white text-[14px] last:border-b-0 hover:bg-[#F5F6F8]")}>
                <Td className="border-l border-[#E6E9EF] font-mono text-[13px] text-[#676879]">{r.id}</Td>
                <Td className="border-l border-[#E6E9EF]">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Avatar name={r.name} />
                    <span className="truncate font-medium">{r.name}</span>
                  </div>
                </Td>
                <Td className="border-l border-[#E6E9EF] text-[#676879]">{r.gender}</Td>
                <Td className="border-l border-[#E6E9EF]">{r.cls}</Td>
                <Td className="border-l border-[#E6E9EF]"><Badge label={r.section} tone="gray" /></Td>
                <Td className="border-l border-[#E6E9EF]"><span className="truncate">{r.guardian}</span></Td>
                <Td className="border-l border-[#E6E9EF] text-[#676879]">{r.contact}</Td>
                <Td className="border-l border-[#E6E9EF] text-[#676879]">{r.admissionDate}</Td>
                <Td className="border-l border-[#E6E9EF]"><Badge label={r.status} /></Td>
                <Td className="justify-center border-l border-[#E6E9EF]"><RowMenu items={rowMenu(r)} /></Td>
              </div>
            ))}
          </div>

          <div className="space-y-3 p-3 md:hidden">
            {paged.map((r) => (
              <div key={r.id} className="rounded-lg border border-[#E6E9EF] bg-white p-3 shadow-sm" style={{ borderLeft: "6px solid #579BFC" }}>
                <div className="flex items-start gap-3">
                  <Avatar name={r.name} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[16px] font-medium">{r.name}</p>
                    <p className="font-mono text-[12px] text-[#9699A6]">{r.id}</p>
                  </div>
                  <RowMenu items={rowMenu(r)} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[13px]">
                  <Info label="Class" value={`${r.cls}-${r.section}`} />
                  <Info label="Gender" value={r.gender} />
                  <Info label="Guardian" value={r.guardian} />
                  <Info label="Contact" value={r.contact} />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Badge label={r.status} />
                  <span className="text-[12px] text-[#9699A6]">Admitted {r.admissionDate}</span>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && <EmptyState title="No students found" message="Try adjusting the filters or search for a different student." />}
          <Pagination page={current} pages={pages} onPage={setPage} total={filtered.length} />
        </Card>
      </div>

      <Modal open={!!view} onClose={() => setView(null)} title={view?.name ?? ""} subtitle={view?.id} width="max-w-xl"
        footer={<><Btn variant="secondary" onClick={() => setView(null)}>Close</Btn>
          <Btn variant="primary" Icon={Pencil} onClick={() => { setEditing(view); setView(null); }}>Edit</Btn></>}>
        {view && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 rounded-lg bg-[#F6F7FB] p-4">
              <Avatar name={view.name} size={56} />
              <div className="min-w-0">
                <p className="truncate text-[17px] font-semibold">{view.name}</p>
                <p className="text-[13px] text-[#676879]">{view.cls}-{view.section} · {view.gender}</p>
                <div className="mt-1"><Badge label={view.status} /></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Info label="Student ID" value={view.id} />
              <Info label="Admission Date" value={view.admissionDate} />
              <Info label="Guardian" value={view.guardian} />
              <Info label="Contact" value={view.contact} />
              <Info label="Class" value={view.cls} />
              <Info label="Section" value={view.section} />
            </div>
          </div>
        )}
      </Modal>

      <EditStudentForm student={editing} onClose={() => setEditing(null)}
        onSave={(s) => { setRows((p) => p.map((r) => (r.id === s.id ? s : r))); setEditing(null); }} />

      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={() => setRows((p) => p.filter((r) => r.id !== toDelete?.id))}
        title="Delete student" confirmLabel="Delete" message={`Remove ${toDelete?.name} from the student directory? This action cannot be undone.`} />
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#E6E9EF] px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-[#9699A6]">{label}</p>
      <p className="truncate text-[14px] font-medium">{value}</p>
    </div>
  );
}

function EditStudentForm({ student, onClose, onSave }: { student: StudentRow | null; onClose: () => void; onSave: (s: StudentRow) => void }) {
  const blank: StudentRow = { id: "", name: "", gender: "Male", cls: CLASS_NAMES[0], section: "A", guardian: "", contact: "", admissionDate: "", status: "Active" };
  const [form, setForm] = useState<StudentRow>(student ?? blank);
  const [lastId, setLastId] = useState(student?.id ?? "");
  if ((student?.id ?? "") !== lastId) { setLastId(student?.id ?? ""); setForm(student ?? blank); }
  const set = (patch: Partial<StudentRow>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <Modal open={!!student} onClose={onClose} width="max-w-xl" title="Edit Student" subtitle={student?.id}
      footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={() => onSave(form)}>Save Changes</Btn></>}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full Name" className="sm:col-span-2"><Input value={form.name} onChange={(e) => set({ name: e.target.value })} /></Field>
        <Field label="Gender"><Select options={GENDERS} value={form.gender} onChange={(e) => set({ gender: e.target.value as StudentRow["gender"] })} /></Field>
        <Field label="Status"><Select options={["Active", "Inactive"]} value={form.status} onChange={(e) => set({ status: e.target.value as StudentRow["status"] })} /></Field>
        <Field label="Class"><Select options={CLASS_NAMES} value={form.cls} onChange={(e) => set({ cls: e.target.value })} /></Field>
        <Field label="Section"><Select options={SECTIONS} value={form.section} onChange={(e) => set({ section: e.target.value })} /></Field>
        <Field label="Guardian"><Input value={form.guardian} onChange={(e) => set({ guardian: e.target.value })} /></Field>
        <Field label="Contact"><Input value={form.contact} onChange={(e) => set({ contact: e.target.value })} /></Field>
        <Field label="Admission Date" className="sm:col-span-2"><Input type="date" value={form.admissionDate} onChange={(e) => set({ admissionDate: e.target.value })} /></Field>
      </div>
    </Modal>
  );
}
