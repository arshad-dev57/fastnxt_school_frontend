"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Filter, ArrowUpDown, Eye, Pencil, Trash2, BookOpen } from "lucide-react";
import {
  Badge, Btn, Card, ConfirmDialog, EmptyState, Field, Input, Modal, PageHeader,
  Pagination, RowMenu, SearchBox, Select, SplitButton, Th, Td, cn, type Tone,
} from "@/components/ui";
import { SUBJECT_ROWS, type SubjectRow } from "@/lib/mock-data";

const COLS = "grid-cols-[minmax(200px,1.6fr)_120px_120px_140px_110px_64px]";
const TYPES = ["Core", "Elective", "Activity"];
const STEPS = 6;
const typeTone = (t: string): Tone => (t === "Core" ? "blue" : t === "Elective" ? "purple" : "orange");

export default function AllSubjectsPage() {
  const [rows, setRows] = useState<SubjectRow[]>(SUBJECT_ROWS);
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<{ mode: "add" | "edit"; row?: SubjectRow } | null>(null);
  const [view, setView] = useState<SubjectRow | null>(null);
  const [toDelete, setToDelete] = useState<SubjectRow | null>(null);

  const filtered = useMemo(() => rows
    .filter((r) => r.name.toLowerCase().includes(q.toLowerCase()) || r.code.toLowerCase().includes(q.toLowerCase()))
    .filter((r) => (type ? r.type === type : true))
    .filter((r) => (status ? r.status === status : true))
    .sort((a, b) => (sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name))),
  [rows, q, type, status, sortAsc]);

  const pages = Math.max(1, Math.ceil(filtered.length / STEPS));
  const current = Math.min(page, pages);
  const paged = filtered.slice((current - 1) * STEPS, current * STEPS);

  const rowMenu = (r: SubjectRow) => [
    { label: "View", Icon: Eye, onClick: () => setView(r) },
    { label: "Edit", Icon: Pencil, onClick: () => setModal({ mode: "edit", row: r }) },
    { label: "Delete", Icon: Trash2, danger: true, onClick: () => setToDelete(r) },
  ];

  return (
    <>
      <PageHeader title="All Subjects" subtitle="Manage the subjects offered across all classes."
        actions={
          <>
            <Link href="/subjects/assign" className="hidden items-center gap-2 rounded border border-[#C5C7D0] bg-white px-3.5 py-2 text-[14px] hover:bg-[#F5F6F8] sm:inline-flex">
              <Plus className="h-[18px] w-[18px]" /> Assign Subjects
            </Link>
            <SplitButton label="Add Subject" Icon={Plus} onClick={() => setModal({ mode: "add" })} />
          </>
        } />

      <div className="px-4 pb-24 sm:px-6">
        <div className="flex flex-wrap items-center gap-2 py-3">
          <SearchBox value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search subjects" className="w-full sm:w-64" />
          <div className="flex flex-wrap items-center gap-2">
            <Select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} options={TYPES} placeholder="All Types" className="w-36" />
            <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} options={["Active", "Inactive"]} placeholder="All Status" className="w-36" />
            <Btn variant="secondary" Icon={ArrowUpDown} onClick={() => setSortAsc((s) => !s)}>{sortAsc ? "A–Z" : "Z–A"}</Btn>
            <Btn variant="secondary" Icon={Filter} className="hidden sm:inline-flex">Filter</Btn>
          </div>
        </div>

        <Card pad={false}>
          <div className="hidden md:block">
            <div className={cn("grid", COLS, "border-b border-[#E6E9EF] bg-white")}>
              <Th className="border-l border-[#E6E9EF]">Subject</Th>
              <Th className="border-l border-[#E6E9EF]">Subject Code</Th>
              <Th className="border-l border-[#E6E9EF]">Type</Th>
              <Th className="border-l border-[#E6E9EF]">Assigned Classes</Th>
              <Th className="border-l border-[#E6E9EF]">Status</Th>
              <Th className="border-l border-[#E6E9EF]"><span className="sr-only">Actions</span></Th>
            </div>
            {paged.map((r) => (
              <div key={r.id} className={cn("grid", COLS, "border-b border-[#E6E9EF] bg-white text-[14px] transition-colors last:border-b-0 hover:bg-[#F5F6F8]")}>
                <Td className="gap-2.5 border-l border-[#E6E9EF] font-medium">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E7DEFF] text-[#5A34D6]"><BookOpen className="h-4 w-4" /></span>
                  <span className="truncate">{r.name}</span>
                </Td>
                <Td className="border-l border-[#E6E9EF] text-[#676879]">{r.code}</Td>
                <Td className="border-l border-[#E6E9EF]"><Badge label={r.type} tone={typeTone(r.type)} /></Td>
                <Td className="border-l border-[#E6E9EF] text-[#676879]">{r.classes} classes</Td>
                <Td className="border-l border-[#E6E9EF]"><Badge label={r.status} /></Td>
                <Td className="justify-center border-l border-[#E6E9EF]"><RowMenu items={rowMenu(r)} /></Td>
              </div>
            ))}
          </div>

          <div className="space-y-3 p-3 md:hidden">
            {paged.map((r) => (
              <div key={r.id} className="rounded-lg border border-[#E6E9EF] bg-white p-3 shadow-sm" style={{ borderLeft: "6px solid #A25DDC" }}>
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E7DEFF] text-[#5A34D6]"><BookOpen className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[16px] font-medium">{r.name}</p>
                    <p className="text-[13px] text-[#676879]">{r.code} · {r.classes} classes</p>
                  </div>
                  <RowMenu items={rowMenu(r)} />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Badge label={r.type} tone={typeTone(r.type)} />
                  <Badge label={r.status} />
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && <EmptyState Icon={BookOpen} title="No subjects found" message="Adjust your filters or add a new subject." action={<Btn variant="primary" Icon={Plus} onClick={() => setModal({ mode: "add" })}>Add Subject</Btn>} />}
          <Pagination page={current} pages={pages} onPage={setPage} total={filtered.length} />
        </Card>
      </div>

      <SubjectForm modal={modal} onClose={() => setModal(null)}
        onSave={(row) => { setRows((p) => (modal?.mode === "edit" ? p.map((r) => (r.id === row.id ? row : r)) : [row, ...p])); setModal(null); }} />

      <Modal open={!!view} onClose={() => setView(null)} title={view?.name ?? ""} subtitle="Subject details"
        footer={<Btn variant="secondary" onClick={() => setView(null)}>Close</Btn>}>
        {view && (
          <div className="grid grid-cols-2 gap-3">
            <Detail label="Subject Code" value={view.code} />
            <Detail label="Type" value={view.type} />
            <Detail label="Assigned Classes" value={`${view.classes} classes`} />
            <Detail label="Status" value={view.status} />
            <Detail label="Subject ID" value={view.id} />
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={() => setRows((p) => p.filter((r) => r.id !== toDelete?.id))}
        title="Delete subject" confirmLabel="Delete" message={`Delete ${toDelete?.name}? This will remove it from all assigned classes.`} />
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (<div><p className="text-[12px] text-[#9699A6]">{label}</p><p className="text-[14px] font-medium">{value}</p></div>);
}

function SubjectForm({ modal, onClose, onSave }: { modal: { mode: "add" | "edit"; row?: SubjectRow } | null; onClose: () => void; onSave: (r: SubjectRow) => void }) {
  const blank: SubjectRow = { id: "", name: "", code: "", type: "Core", classes: 0, status: "Active" };
  const [form, setForm] = useState<SubjectRow>(modal?.row ?? blank);
  const key = `${modal?.mode ?? ""}-${modal?.row?.id ?? ""}`;
  const [lastKey, setLastKey] = useState(key);
  if (lastKey !== key) { setLastKey(key); setForm(modal?.row ?? blank); }
  const set = (patch: Partial<SubjectRow>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <Modal open={!!modal} onClose={onClose} width="max-w-lg"
      title={modal?.mode === "edit" ? "Edit Subject" : "New Subject"} subtitle="Add a subject to the school curriculum."
      footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={() => onSave({ ...form, id: form.id || `SUB-${String(Date.now()).slice(-3)}` })}>{modal?.mode === "edit" ? "Save Changes" : "Create Subject"}</Btn></>}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Subject Name" className="sm:col-span-2"><Input value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Mathematics" /></Field>
        <Field label="Subject Code"><Input value={form.code} onChange={(e) => set({ code: e.target.value.toUpperCase() })} placeholder="e.g. MATH" /></Field>
        <Field label="Type"><Select options={TYPES} value={form.type} onChange={(e) => set({ type: e.target.value as SubjectRow["type"] })} /></Field>
        <Field label="Assigned Classes"><Input type="number" value={form.classes} onChange={(e) => set({ classes: Number(e.target.value) })} /></Field>
        <Field label="Status"><Select options={["Active", "Inactive"]} value={form.status} onChange={(e) => set({ status: e.target.value as SubjectRow["status"] })} /></Field>
      </div>
    </Modal>
  );
}
