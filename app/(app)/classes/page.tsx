"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Plus, Filter, ArrowUpDown, Eye, Pencil, Trash2, School, Users, Building2, BookOpen,
} from "lucide-react";
import {
  Badge, Btn, Card, Checkbox, ConfirmDialog, EmptyState, Field, Input, Modal, PageHeader,
  Pagination, RowMenu, SearchBox, Select, SplitButton, Textarea, Th, Td, cn,
} from "@/components/ui";
import { CLASS_ROWS, SESSIONS, CLASS_NAMES, type ClassRow } from "@/lib/mock-data";

const COLS = "grid-cols-[minmax(200px,1.4fr)_90px_140px_100px_minmax(160px,1fr)_110px_64px]";
const STEPS = 5;

export default function AllClassesPage() {
  const [rows, setRows] = useState<ClassRow[]>(CLASS_ROWS);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<{ mode: "add" | "edit"; row?: ClassRow } | null>(null);
  const [view, setView] = useState<ClassRow | null>(null);
  const [toDelete, setToDelete] = useState<ClassRow | null>(null);

  const filtered = useMemo(() => {
    return rows
      .filter((r) => r.name.toLowerCase().includes(q.toLowerCase()) || r.code.toLowerCase().includes(q.toLowerCase()))
      .filter((r) => (status ? r.status === status : true))
      .sort((a, b) => (sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)));
  }, [rows, q, status, sortAsc]);

  const pages = Math.max(1, Math.ceil(filtered.length / STEPS));
  const current = Math.min(page, pages);
  const paged = filtered.slice((current - 1) * STEPS, current * STEPS);

  const save = (row: ClassRow) => {
    setRows((p) => (modal?.mode === "edit" ? p.map((r) => (r.id === row.id ? row : r)) : [row, ...p]));
    setModal(null);
  };

  const rowMenu = (r: ClassRow) => [
    { label: "View", Icon: Eye, onClick: () => setView(r) },
    { label: "Edit", Icon: Pencil, onClick: () => setModal({ mode: "edit", row: r }) },
    { label: "Delete", Icon: Trash2, danger: true, onClick: () => setToDelete(r) },
  ];

  return (
    <>
      <PageHeader
        title="All Classes"
        subtitle="Manage school classes, sections and class teachers."
        actions={
          <>
            <Link href="/subjects/assign" className="hidden items-center gap-2 rounded border border-[#C5C7D0] bg-white px-3.5 py-2 text-[14px] hover:bg-[#F5F6F8] sm:inline-flex">
              <BookOpen className="h-[18px] w-[18px]" /> Assign Subjects
            </Link>
            <SplitButton label="Add Class" Icon={Plus} onClick={() => setModal({ mode: "add" })} />
          </>
        }
      />

      <div className="px-4 pb-24 sm:px-6">
        <div className="flex flex-wrap items-center gap-2 py-3">
          <SearchBox value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search classes" className="w-full sm:w-64" />
          <div className="flex items-center gap-2">
            <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} options={["Active", "Inactive"]} placeholder="All Status" className="w-36" />
            <Btn variant="secondary" Icon={ArrowUpDown} onClick={() => setSortAsc((s) => !s)}>{sortAsc ? "A–Z" : "Z–A"}</Btn>
            <Btn variant="secondary" Icon={Filter} className="hidden sm:inline-flex">Filter</Btn>
          </div>
        </div>

        <Card pad={false}>
          <div className="hidden md:block">
            <div className={cn("grid", COLS, "border-b border-[#E6E9EF] bg-white")}>
              <Th className="border-l border-[#E6E9EF]">Class</Th>
              <Th className="border-l border-[#E6E9EF]">Code</Th>
              <Th className="border-l border-[#E6E9EF]">Sections</Th>
              <Th className="border-l border-[#E6E9EF]">Students</Th>
              <Th className="border-l border-[#E6E9EF]">Class Teacher</Th>
              <Th className="border-l border-[#E6E9EF]">Status</Th>
              <Th className="border-l border-[#E6E9EF]"><span className="sr-only">Actions</span></Th>
            </div>
            {paged.map((r) => (
              <div key={r.id} className={cn("grid", COLS, "border-b border-[#E6E9EF] bg-white text-[14px] transition-colors last:border-b-0 hover:bg-[#F5F6F8]")}>
                <Td className="gap-2.5 border-l border-[#E6E9EF] font-medium">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#CCE5FF] text-[#0060B9]"><School className="h-4 w-4" /></span>
                  <span className="truncate">{r.name}</span>
                </Td>
                <Td className="border-l border-[#E6E9EF] text-[#676879]">{r.code}</Td>
                <Td className="gap-1 border-l border-[#E6E9EF]">{r.sections.map((s) => <Badge key={s} label={s} tone="gray" />)}</Td>
                <Td className="border-l border-[#E6E9EF] text-[#676879]">{r.students}</Td>
                <Td className="border-l border-[#E6E9EF]"><span className="truncate">{r.teacher}</span></Td>
                <Td className="border-l border-[#E6E9EF]"><Badge label={r.status} /></Td>
                <Td className="justify-center border-l border-[#E6E9EF]"><RowMenu items={rowMenu(r)} /></Td>
              </div>
            ))}
          </div>

          {/* MOBILE CARDS */}
          <div className="space-y-3 p-3 md:hidden">
            {paged.map((r) => (
              <div key={r.id} className="rounded-lg border border-[#E6E9EF] bg-white p-3 shadow-sm" style={{ borderLeft: "6px solid #579BFC" }}>
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#CCE5FF] text-[#0060B9]"><School className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[16px] font-medium">{r.name}</p>
                    <p className="text-[13px] text-[#676879]">{r.code} · {r.students} students</p>
                  </div>
                  <RowMenu items={rowMenu(r)} />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {r.sections.map((s) => <Badge key={s} label={`Section ${s}`} tone="gray" />)}
                  <Badge label={r.status} />
                </div>
                <p className="mt-2 text-[13px] text-[#676879]">Teacher: {r.teacher}</p>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <EmptyState Icon={School} title="No classes found" message="Try adjusting your search or filters, or add a new class."
              action={<Btn variant="primary" Icon={Plus} onClick={() => setModal({ mode: "add" })}>Add Class</Btn>} />
          )}
          <Pagination page={current} pages={pages} onPage={setPage} total={filtered.length} />
        </Card>
      </div>

      <ClassForm modal={modal} onClose={() => setModal(null)} onSave={save} />

      <Modal open={!!view} onClose={() => setView(null)} title={view?.name ?? ""} subtitle="Class details"
        footer={<Btn variant="secondary" onClick={() => setView(null)}>Close</Btn>}>
        {view && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Detail label="Class Code" value={view.code} />
              <Detail label="Status" value={view.status} />
              <Detail label="Students" value={String(view.students)} />
              <Detail label="Class Teacher" value={view.teacher} />
              <Detail label="Sections" value={view.sections.join(", ")} />
              <Detail label="Class ID" value={view.id} />
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-[#F6F7FB] p-3 text-[13px] text-[#676879]">
              <Building2 className="h-4 w-4" /> Session 2025-2026 · Academic year
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={() => setRows((p) => p.filter((r) => r.id !== toDelete?.id))}
        title="Delete class" confirmLabel="Delete" message={`Are you sure you want to delete ${toDelete?.name}? This action cannot be undone.`} />
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[12px] text-[#9699A6]">{label}</p>
      <p className="text-[14px] font-medium">{value}</p>
    </div>
  );
}

function ClassForm({ modal, onClose, onSave }: { modal: { mode: "add" | "edit"; row?: ClassRow } | null; onClose: () => void; onSave: (r: ClassRow) => void }) {
  const [form, setForm] = useState<ClassRow>(modal?.row ?? { id: "", name: "", code: "", sections: ["A"], students: 0, teacher: "", status: "Active" });
  const [sections, setSections] = useState<string[]>(modal?.row?.sections ?? ["A"]);

  const key = `${modal?.mode ?? ""}-${modal?.row?.id ?? ""}`;
  const [lastKey, setLastKey] = useState(key);
  if (lastKey !== key) {
    setLastKey(key);
    setForm(modal?.row ?? { id: "", name: "", code: "", sections: ["A"], students: 0, teacher: "", status: "Active" });
    setSections(modal?.row?.sections ?? ["A"]);
  }

  const set = (patch: Partial<ClassRow>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <Modal open={!!modal} onClose={onClose} width="max-w-2xl"
      title={modal?.mode === "edit" ? "Edit Class" : "New Class"} subtitle="Define the class, sections and class teacher."
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={() => onSave({ ...form, sections, id: form.id || `CLS-${String(Date.now()).slice(-4)}` })}>
            {modal?.mode === "edit" ? "Save Changes" : "Create Class"}
          </Btn>
        </>
      }>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Class Name"><Input value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Grade 5" list="class-names" /><datalist id="class-names">{CLASS_NAMES.map((c) => <option key={c} value={c} />)}</datalist></Field>
        <Field label="Class Code"><Input value={form.code} onChange={(e) => set({ code: e.target.value.toUpperCase() })} placeholder="e.g. G5" /></Field>
        <Field label="Academic Session"><Select options={SESSIONS} value="2025-2026" onChange={() => {}} /></Field>
        <Field label="Class Teacher"><Input value={form.teacher} onChange={(e) => set({ teacher: e.target.value })} placeholder="Teacher name" /></Field>
        <Field label="Sections" className="sm:col-span-2">
          <div className="flex flex-wrap gap-3">
            {["A", "B", "C", "D"].map((s) => (
              <label key={s} className="flex items-center gap-2 text-[14px]">
                <Checkbox checked={sections.includes(s)} onChange={(v) => setSections((p) => (v ? [...p, s] : p.filter((x) => x !== s)))} /> Section {s}
              </label>
            ))}
          </div>
        </Field>
        <Field label="Description" className="sm:col-span-2"><Textarea placeholder="Short description / notes about this class" /></Field>
        <Field label="Status"><Select options={["Active", "Inactive"]} value={form.status} onChange={(e) => set({ status: e.target.value as ClassRow["status"] })} /></Field>
        <div className="flex items-end gap-2 text-[13px] text-[#676879]"><Users className="h-4 w-4" /> Students are added from the Students module.</div>
      </div>
    </Modal>
  );
}

