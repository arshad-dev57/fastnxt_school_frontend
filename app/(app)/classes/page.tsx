"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Plus, Filter, ArrowUpDown, Eye, Pencil, Trash2, School, Users, Building2, BookOpen, Layers,
} from "lucide-react";
import {
  Avatar, Badge, Btn, ConfirmDialog, EmptyState, Field, Input, Modal, PillSelect, RowMenu,
  Select, SplitButton, Td, Textarea, Th, ToolbarBtn, cn, ACTIVE_COLORS,
} from "@/components/ui";
import {
  Board, BoardBar, BoardBody, BoardHead, BoardSearch, BoardTabs, BoardToolbar, BarCell, GroupHead, GroupTable,
} from "@/components/board";
import { CLASS_ROWS, SESSIONS, CLASS_NAMES, type ClassRow } from "@/lib/mock-data";

const SECTIONS_ALL = ["A", "B", "C", "D"];
const STATUSES: ClassRow["status"][] = ["Active", "Inactive"];
const TABS = ["All", "Active", "Inactive"] as const;
type Tab = (typeof TABS)[number];
const COLS = "grid-cols-[44px_minmax(180px,1.3fr)_90px_150px_100px_minmax(160px,1fr)_130px_64px]";

export default function AllClassesPage() {
  const [rows, setRows] = useState<ClassRow[]>(CLASS_ROWS);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<Tab>("All");
  const [section, setSection] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [modal, setModal] = useState<{ mode: "add" | "edit"; row?: ClassRow } | null>(null);
  const [view, setView] = useState<ClassRow | null>(null);
  const [toDelete, setToDelete] = useState<ClassRow | null>(null);

  const groups = useMemo(() => {
    const base = rows
      .filter((r) => tab === "All" || r.status === tab)
      .filter((r) => r.name.toLowerCase().includes(q.toLowerCase()) || r.code.toLowerCase().includes(q.toLowerCase()))
      .filter((r) => (section ? r.sections.includes(section) : true))
      .sort((a, b) => (sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)));
    return STATUSES
      .map((s) => ({ status: s, color: ACTIVE_COLORS[s], items: base.filter((r) => r.status === s) }))
      .filter((g) => g.items.length > 0);
  }, [rows, q, tab, section, sortAsc]);

  const total = groups.reduce((n, g) => n + g.items.length, 0);

  const save = (row: ClassRow) => {
    setRows((p) => (modal?.mode === "edit" ? p.map((r) => (r.id === row.id ? row : r)) : [row, ...p]));
    setModal(null);
  };
  const setStatus = (id: string, status: ClassRow["status"]) =>
    setRows((p) => p.map((r) => (r.id === id ? { ...r, status } : r)));

  const rowMenu = (r: ClassRow) => [
    { label: "View", Icon: Eye, onClick: () => setView(r) },
    { label: "Edit", Icon: Pencil, onClick: () => setModal({ mode: "edit", row: r }) },
    { label: "Delete", Icon: Trash2, danger: true, onClick: () => setToDelete(r) },
  ];

  return (
    <Board>
      <BoardBar>
        <BoardHead
          Icon={School}
          title="All Classes"
          subtitle="Manage school classes, sections and class teachers."
          actions={
            <>
              <div className="hidden -space-x-2 md:flex">
                {rows.slice(0, 3).map((r) => (
                  <span key={r.id} className="rounded-full ring-2 ring-white"><Avatar name={r.teacher} size={32} /></span>
                ))}
              </div>
              <Link href="/subjects/assign" className="hidden h-9 items-center gap-2 rounded border border-[#C5C7D0] bg-white px-3 text-[14px] hover:bg-[#F5F6F8] lg:flex">
                <BookOpen className="h-[18px] w-[18px]" /> Assign Subjects
              </Link>
            </>
          }
        />
        <BoardTabs tabs={TABS} value={tab} onChange={setTab} />
        <BoardToolbar>
          <SplitButton label="Add Class" Icon={Plus} onClick={() => setModal({ mode: "add" })} />
          <BoardSearch value={q} onChange={setQ} placeholder="Search classes" />
          <ToolbarBtn Icon={ArrowUpDown} label={sortAsc ? "A–Z" : "Z–A"} onClick={() => setSortAsc((s) => !s)} />
          <div className="shrink-0"><Select value={section} onChange={(e) => setSection(e.target.value)} options={SECTIONS_ALL} placeholder="All Sections" className="h-9 w-36" /></div>
          <ToolbarBtn Icon={Filter} label="Filter" />
          <ToolbarBtn Icon={Layers} label="Group by" />
        </BoardToolbar>
      </BoardBar>

      <BoardBody>
        {total === 0 && (
          <EmptyState Icon={School} title="No classes found" message="Try adjusting your filters, or add a new class."
            action={<Btn variant="primary" Icon={Plus} onClick={() => setModal({ mode: "add" })}>Add Class</Btn>} />
        )}

        <div className="space-y-8 md:min-w-[900px]">
          {groups.map((g) => {
            const open = !collapsed[g.status];
            return (
              <section key={g.status}>
                <GroupHead title={g.status} color={g.color} count={g.items.length} open={open}
                  onToggle={() => setCollapsed((p) => ({ ...p, [g.status]: open }))} />

                {open && (
                  <>
                    {/* DESKTOP TABLE */}
                    <div className="hidden md:block">
                      <GroupTable>
                        <div className={cn("grid", COLS, "border-b border-[#E6E9EF] bg-white")}>
                          <div className="border-l-[6px]" style={{ borderColor: g.color }} />
                          <Th className="border-l border-[#E6E9EF]">Class</Th>
                          <Th className="border-l border-[#E6E9EF]">Code</Th>
                          <Th className="border-l border-[#E6E9EF]">Sections</Th>
                          <Th className="border-l border-[#E6E9EF]">Students</Th>
                          <Th className="border-l border-[#E6E9EF]">Class Teacher</Th>
                          <Th className="border-l border-[#E6E9EF]">Status</Th>
                          <Th className="border-l border-[#E6E9EF]"><span className="sr-only">Actions</span></Th>
                        </div>
                        {g.items.map((r) => (
                          <div key={r.id} className={cn("row grid", COLS, "border-b border-[#E6E9EF] bg-white text-[15px] transition-colors last:border-b-0 hover:bg-[#F5F6F8]")}>
                            <BarCell color={g.color} className="py-2.5">
                              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#CCE5FF] text-[#0060B9]"><School className="h-4 w-4" /></span>
                            </BarCell>
                            <Td className="gap-2 font-medium"><span className="truncate">{r.name}</span></Td>
                            <Td className="border-l border-[#E6E9EF] text-[#676879]">{r.code}</Td>
                            <Td className="gap-1 border-l border-[#E6E9EF]">{r.sections.map((s) => <Badge key={s} label={s} tone="gray" />)}</Td>
                            <Td className="border-l border-[#E6E9EF] text-[#676879]">{r.students}</Td>
                            <Td className="border-l border-[#E6E9EF]"><span className="truncate">{r.teacher}</span></Td>
                            <Td className="border-l border-[#E6E9EF]">
                              <PillSelect<ClassRow["status"]> value={r.status} options={STATUSES} colors={ACTIVE_COLORS} onPick={(s) => setStatus(r.id, s)} className="w-24" menuWidth="w-32" />
                            </Td>
                            <Td className="justify-center border-l border-[#E6E9EF]"><RowMenu items={rowMenu(r)} /></Td>
                          </div>
                        ))}
                      </GroupTable>
                    </div>

                    {/* MOBILE CARDS */}
                    <div className="space-y-3 md:hidden">
                      {g.items.map((r) => (
                        <div key={r.id} className="rounded-lg border border-[#E6E9EF] bg-white p-3 shadow-sm" style={{ borderLeft: `6px solid ${g.color}` }}>
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
                            <PillSelect<ClassRow["status"]> value={r.status} options={STATUSES} colors={ACTIVE_COLORS} onPick={(s) => setStatus(r.id, s)} className="w-24" menuWidth="w-32" />
                          </div>
                          <p className="mt-2 text-[13px] text-[#676879]">Teacher: {r.teacher}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </section>
            );
          })}
        </div>
      </BoardBody>

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
    </Board>
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
                <input type="checkbox" checked={sections.includes(s)} onChange={(e) => setSections((p) => (e.target.checked ? [...p, s] : p.filter((x) => x !== s)))} className="h-4 w-4 accent-[#2563EB]" /> Section {s}
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
