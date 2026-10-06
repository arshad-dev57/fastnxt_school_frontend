"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Filter, ArrowUpDown, Eye, Pencil, Trash2, Receipt, Tags, Calculator } from "lucide-react";
import {
  Badge, Btn, Card, ConfirmDialog, EmptyState, Field, Input, Modal, PageHeader,
  Pagination, RowMenu, SearchBox, Select, SplitButton, Textarea, Th, Td, cn, rs,
} from "@/components/ui";
import { FEE_PARTICULARS, FREQUENCIES, type FeeParticular } from "@/lib/mock-data";

const COLS = "grid-cols-[minmax(160px,1.2fr)_minmax(220px,1.8fr)_120px_120px_110px_64px]";
const STEPS = 6;

export default function FeeParticularsPage() {
  const [rows, setRows] = useState<FeeParticular[]>(FEE_PARTICULARS);
  const [q, setQ] = useState("");
  const [freq, setFreq] = useState("");
  const [status, setStatus] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<{ mode: "add" | "edit"; row?: FeeParticular } | null>(null);
  const [view, setView] = useState<FeeParticular | null>(null);
  const [toDelete, setToDelete] = useState<FeeParticular | null>(null);

  const filtered = useMemo(() => rows
    .filter((r) => r.particular.toLowerCase().includes(q.toLowerCase()))
    .filter((r) => (freq ? r.frequency === freq : true))
    .filter((r) => (status ? r.status === status : true))
    .sort((a, b) => (sortAsc ? a.particular.localeCompare(b.particular) : b.particular.localeCompare(a.particular))),
  [rows, q, freq, status, sortAsc]);

  const pages = Math.max(1, Math.ceil(filtered.length / STEPS));
  const current = Math.min(page, pages);
  const paged = filtered.slice((current - 1) * STEPS, current * STEPS);
  const totalMonthly = rows.filter((r) => r.frequency === "Monthly" && r.status === "Active").reduce((a, r) => a + r.amount, 0);

  const rowMenu = (r: FeeParticular) => [
    { label: "View", Icon: Eye, onClick: () => setView(r) },
    { label: "Edit", Icon: Pencil, onClick: () => setModal({ mode: "edit", row: r }) },
    { label: "Delete", Icon: Trash2, danger: true, onClick: () => setToDelete(r) },
  ];

  return (
    <>
      <PageHeader title="Fees Particulars" subtitle="Define the individual fee heads charged by the school."
        actions={
          <>
            <Link href="/fees/structure" className="hidden items-center gap-2 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3.5 py-2 text-[14px] hover:bg-[var(--theme-hover)] sm:inline-flex">
              <Calculator className="h-[18px] w-[18px]" /> Fee Structure
            </Link>
            <SplitButton label="Add Particular" Icon={Plus} onClick={() => setModal({ mode: "add" })} />
          </>
        } />

      <div className="px-4 pb-24 sm:px-6">
        <div className="flex flex-wrap items-center gap-2 py-3">
          <SearchBox value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search particulars" className="w-full sm:w-64" />
          <div className="flex flex-wrap items-center gap-2">
            <Select value={freq} onChange={(e) => { setFreq(e.target.value); setPage(1); }} options={[...FREQUENCIES]} placeholder="All Frequencies" className="w-40" />
            <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} options={["Active", "Inactive"]} placeholder="All Status" className="w-36" />
            <Btn variant="secondary" Icon={ArrowUpDown} onClick={() => setSortAsc((s) => !s)}>{sortAsc ? "A–Z" : "Z–A"}</Btn>
            <Btn variant="secondary" Icon={Filter} className="hidden lg:inline-flex">Filter</Btn>
          </div>
        </div>

        <div className="mb-3 flex items-center gap-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-sidebar)] px-4 py-3 text-[13px]">
          <Tags className="h-4 w-4 text-[var(--theme-accent-strong)]" />
          <span className="text-[var(--theme-text-muted)]">Active monthly total:</span>
          <span className="font-semibold">{rs(totalMonthly)}</span>
        </div>

        <Card pad={false}>
          <div className="hidden md:block">
            <div className={cn("grid", COLS, "border-b border-[var(--theme-border)] bg-[var(--theme-surface)]")}>
              <Th className="border-l border-[var(--theme-border)]">Particular</Th>
              <Th className="border-l border-[var(--theme-border)]">Description</Th>
              <Th className="border-l border-[var(--theme-border)]">Amount</Th>
              <Th className="border-l border-[var(--theme-border)]">Frequency</Th>
              <Th className="border-l border-[var(--theme-border)]">Status</Th>
              <Th className="border-l border-[var(--theme-border)]"><span className="sr-only">Actions</span></Th>
            </div>
            {paged.map((r) => (
              <div key={r.id} className={cn("grid", COLS, "border-b border-[var(--theme-border)] bg-[var(--theme-surface)] text-[14px] last:border-b-0 hover:bg-[var(--theme-hover)]")}>
                <Td className="gap-2 border-l border-[var(--theme-border)] font-medium"><Receipt className="h-4 w-4 text-[var(--theme-accent-strong)]" />{r.particular}</Td>
                <Td className="border-l border-[var(--theme-border)] text-[var(--theme-text-muted)]"><span className="truncate">{r.description}</span></Td>
                <Td className="border-l border-[var(--theme-border)] font-medium">{rs(r.amount)}</Td>
                <Td className="border-l border-[var(--theme-border)]"><Badge label={r.frequency} tone="blue" /></Td>
                <Td className="border-l border-[var(--theme-border)]"><Badge label={r.status} /></Td>
                <Td className="justify-center border-l border-[var(--theme-border)]"><RowMenu items={rowMenu(r)} /></Td>
              </div>
            ))}
          </div>

          <div className="space-y-3 p-3 md:hidden">
            {paged.map((r) => (
              <div key={r.id} className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-3 shadow-sm" style={{ borderLeft: "6px solid var(--theme-accent-2)" }}>
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium">{r.particular}</p>
                    <p className="text-[13px] text-[var(--theme-text-muted)]">{r.description}</p>
                  </div>
                  <RowMenu items={rowMenu(r)} />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[15px] font-semibold">{rs(r.amount)}</span>
                  <Badge label={r.frequency} tone="blue" />
                  <Badge label={r.status} />
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && <EmptyState Icon={Receipt} title="No fee particulars" message="Add a fee head to start building the fee structure." action={<Btn variant="primary" Icon={Plus} onClick={() => setModal({ mode: "add" })}>Add Particular</Btn>} />}
          <Pagination page={current} pages={pages} onPage={setPage} total={filtered.length} />
        </Card>
      </div>

      <ParticularForm modal={modal} onClose={() => setModal(null)}
        onSave={(row) => { setRows((p) => (modal?.mode === "edit" ? p.map((r) => (r.id === row.id ? row : r)) : [row, ...p])); setModal(null); }} />

      <Modal open={!!view} onClose={() => setView(null)} title={view?.particular ?? ""} subtitle="Fee particular details"
        footer={<Btn variant="secondary" onClick={() => setView(null)}>Close</Btn>}>
        {view && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Info label="Amount" value={rs(view.amount)} />
              <Info label="Frequency" value={view.frequency} />
              <Info label="Status" value={view.status} />
              <Info label="ID" value={view.id} />
            </div>
            <div className="rounded-lg bg-[var(--theme-sidebar)] p-3 text-[13px] text-[var(--theme-text-muted)]">{view.description}</div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={() => setRows((p) => p.filter((r) => r.id !== toDelete?.id))}
        title="Delete particular" confirmLabel="Delete" message={`Delete ${toDelete?.particular}? It will be removed from all fee structures.`} />
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (<div><p className="text-[12px] text-[var(--theme-text-faint)]">{label}</p><p className="text-[14px] font-medium">{value}</p></div>);
}

function ParticularForm({ modal, onClose, onSave }: { modal: { mode: "add" | "edit"; row?: FeeParticular } | null; onClose: () => void; onSave: (r: FeeParticular) => void }) {
  const blank: FeeParticular = { id: "", particular: "", description: "", amount: 0, frequency: "Monthly", status: "Active" };
  const [form, setForm] = useState<FeeParticular>(modal?.row ?? blank);
  const key = `${modal?.mode ?? ""}-${modal?.row?.id ?? ""}`;
  const [lastKey, setLastKey] = useState(key);
  if (lastKey !== key) { setLastKey(key); setForm(modal?.row ?? blank); }
  const set = (patch: Partial<FeeParticular>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <Modal open={!!modal} onClose={onClose} width="max-w-lg"
      title={modal?.mode === "edit" ? "Edit Particular" : "New Fee Particular"} subtitle="Define a fee head and its default amount."
      footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={() => onSave({ ...form, id: form.id || `FP-${String(Date.now()).slice(-3)}` })}>{modal?.mode === "edit" ? "Save Changes" : "Create Particular"}</Btn></>}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Particular" className="sm:col-span-2"><Input value={form.particular} onChange={(e) => set({ particular: e.target.value })} placeholder="e.g. Tuition Fee" /></Field>
        <Field label="Description" className="sm:col-span-2"><Textarea value={form.description} onChange={(e) => set({ description: e.target.value })} placeholder="Short description" /></Field>
        <Field label="Amount (Rs)"><Input type="number" value={form.amount} onChange={(e) => set({ amount: Number(e.target.value) })} /></Field>
        <Field label="Frequency"><Select options={[...FREQUENCIES]} value={form.frequency} onChange={(e) => set({ frequency: e.target.value as FeeParticular["frequency"] })} /></Field>
        <Field label="Status"><Select options={["Active", "Inactive"]} value={form.status} onChange={(e) => set({ status: e.target.value as FeeParticular["status"] })} /></Field>
      </div>
    </Modal>
  );
}
