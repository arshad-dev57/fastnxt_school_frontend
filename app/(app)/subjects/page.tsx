"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Filter, ArrowUpDown, Eye, Pencil, Trash2, BookOpen, Layers } from "lucide-react";
import {
  Btn, ConfirmDialog, EmptyState, Field, Input, Modal, PillSelect, RowMenu,
  Select, SplitButton, Td, Th, ToolbarBtn, cn, ACTIVE_COLORS,
} from "@/components/ui";
import {
  Board, BoardBar, BoardBody, BoardHead, BoardSearch, BoardTabs, BoardToolbar, BarCell, BoardPill, GroupHead, GroupTable,
} from "@/components/board";
import { SUBJECT_ROWS, type SubjectRow } from "@/lib/mock-data";

const TYPES: SubjectRow["type"][] = ["Core", "Elective", "Activity"];
const TYPE_COLORS: Record<string, string> = { Core: "#579BFC", Elective: "#A25DDC", Activity: "#FDAB3D" };
const STATUSES: SubjectRow["status"][] = ["Active", "Inactive"];
const TABS = ["All", "Active", "Inactive"] as const;
type Tab = (typeof TABS)[number];
const COLS = "grid-cols-[44px_minmax(200px,1.4fr)_120px_130px_140px_130px_64px]";

export default function AllSubjectsPage() {
  const [rows, setRows] = useState<SubjectRow[]>(SUBJECT_ROWS);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<Tab>("All");
  const [sortAsc, setSortAsc] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [modal, setModal] = useState<{ mode: "add" | "edit"; row?: SubjectRow } | null>(null);
  const [view, setView] = useState<SubjectRow | null>(null);
  const [toDelete, setToDelete] = useState<SubjectRow | null>(null);

  const groups = useMemo(() => {
    const base = rows
      .filter((r) => tab === "All" || r.status === tab)
      .filter((r) => r.name.toLowerCase().includes(q.toLowerCase()) || r.code.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => (sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)));
    return TYPES
      .map((t) => ({ type: t, color: TYPE_COLORS[t], items: base.filter((r) => r.type === t) }))
      .filter((g) => g.items.length > 0);
  }, [rows, q, tab, sortAsc]);

  const total = groups.reduce((n, g) => n + g.items.length, 0);

  const save = (row: SubjectRow) => {
    setRows((p) => (modal?.mode === "edit" ? p.map((r) => (r.id === row.id ? row : r)) : [row, ...p]));
    setModal(null);
  };
  const setStatus = (id: string, status: SubjectRow["status"]) =>
    setRows((p) => p.map((r) => (r.id === id ? { ...r, status } : r)));

  const rowMenu = (r: SubjectRow) => [
    { label: "View", Icon: Eye, onClick: () => setView(r) },
    { label: "Edit", Icon: Pencil, onClick: () => setModal({ mode: "edit", row: r }) },
    { label: "Delete", Icon: Trash2, danger: true, onClick: () => setToDelete(r) },
  ];

  return (
    <Board>
      <BoardBar>
        <BoardHead
          Icon={BookOpen}
          title="All Subjects"
          subtitle="Manage the subjects offered across all classes."
          actions={
            <Link href="/subjects/assign" className="hidden h-9 items-center gap-2 rounded border border-[#C5C7D0] bg-white px-3 text-[14px] hover:bg-[#F5F6F8] sm:flex">
              <BookOpen className="h-[18px] w-[18px]" /> Assign Subjects
            </Link>
          }
        />
        <BoardTabs tabs={TABS} value={tab} onChange={setTab} />
        <BoardToolbar>
          <SplitButton label="Add Subject" Icon={Plus} onClick={() => setModal({ mode: "add" })} />
          <BoardSearch value={q} onChange={setQ} placeholder="Search subjects" />
          <ToolbarBtn Icon={ArrowUpDown} label={sortAsc ? "A–Z" : "Z–A"} onClick={() => setSortAsc((s) => !s)} />
          <ToolbarBtn Icon={Filter} label="Filter" />
          <ToolbarBtn Icon={Layers} label="Group by" />
        </BoardToolbar>
      </BoardBar>

      <BoardBody>
        {total === 0 && (
          <EmptyState Icon={BookOpen} title="No subjects found" message="Adjust your filters or add a new subject."
            action={<Btn variant="primary" Icon={Plus} onClick={() => setModal({ mode: "add" })}>Add Subject</Btn>} />
        )}

        <div className="space-y-8 md:min-w-[820px]">
          {groups.map((g) => {
            const open = !collapsed[g.type];
            return (
              <section key={g.type}>
                <GroupHead title={g.type} color={g.color} count={g.items.length} open={open}
                  onToggle={() => setCollapsed((p) => ({ ...p, [g.type]: open }))} />

                {open && (
                  <>
                    {/* DESKTOP TABLE */}
                    <div className="hidden md:block">
                      <GroupTable>
                        <div className={cn("grid", COLS, "border-b border-[#E6E9EF] bg-white")}>
                          <div className="border-l-[6px]" style={{ borderColor: g.color }} />
                          <Th className="border-l border-[#E6E9EF]">Subject</Th>
                          <Th className="border-l border-[#E6E9EF]">Subject Code</Th>
                          <Th className="border-l border-[#E6E9EF]">Type</Th>
                          <Th className="border-l border-[#E6E9EF]">Assigned Classes</Th>
                          <Th className="border-l border-[#E6E9EF]">Status</Th>
                          <Th className="border-l border-[#E6E9EF]"><span className="sr-only">Actions</span></Th>
                        </div>
                        {g.items.map((r) => (
                          <div key={r.id} className={cn("row grid", COLS, "border-b border-[#E6E9EF] bg-white text-[15px] transition-colors last:border-b-0 hover:bg-[#F5F6F8]")}>
                            <BarCell color={g.color} className="py-2.5">
                              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E7DEFF] text-[#5A34D6]"><BookOpen className="h-4 w-4" /></span>
                            </BarCell>
                            <Td className="gap-2 font-medium"><span className="truncate">{r.name}</span></Td>
                            <Td className="border-l border-[#E6E9EF] text-[#676879]">{r.code}</Td>
                            <Td className="border-l border-[#E6E9EF]"><BoardPill label={r.type} color={TYPE_COLORS[r.type]} /></Td>
                            <Td className="border-l border-[#E6E9EF] text-[#676879]">{r.classes} classes</Td>
                            <Td className="border-l border-[#E6E9EF]">
                              <PillSelect<SubjectRow["status"]> value={r.status} options={STATUSES} colors={ACTIVE_COLORS} onPick={(s) => setStatus(r.id, s)} className="w-24" menuWidth="w-32" />
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
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E7DEFF] text-[#5A34D6]"><BookOpen className="h-4 w-4" /></span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[16px] font-medium">{r.name}</p>
                              <p className="text-[13px] text-[#676879]">{r.code} · {r.classes} classes</p>
                            </div>
                            <RowMenu items={rowMenu(r)} />
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <BoardPill label={r.type} color={TYPE_COLORS[r.type]} />
                            <PillSelect<SubjectRow["status"]> value={r.status} options={STATUSES} colors={ACTIVE_COLORS} onPick={(s) => setStatus(r.id, s)} className="w-24" menuWidth="w-32" />
                          </div>
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

      <SubjectForm modal={modal} onClose={() => setModal(null)} onSave={save} />

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
    </Board>
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
