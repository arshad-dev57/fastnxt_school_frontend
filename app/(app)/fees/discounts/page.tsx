"use client";

import { useMemo, useState } from "react";
import { Plus, Filter, Eye, Pencil, Trash2, Percent, Tag } from "lucide-react";
import {
  Badge, Btn, Card, ConfirmDialog, EmptyState, Field, Input, Modal, PageHeader,
  Pagination, RowMenu, SearchBox, Select, SplitButton, Textarea, Th, Td, cn,
} from "@/components/ui";
import { DISCOUNT_TYPES, type DiscountType } from "@/lib/mock-data";

const COLS = "grid-cols-[minmax(160px,1.2fr)_130px_110px_minmax(200px,1.6fr)_110px_64px]";
const STEPS = 6;
const BASIS = ["Percentage", "Fixed Amount"];

export default function DiscountTypesPage() {
  const [rows, setRows] = useState<DiscountType[]>(DISCOUNT_TYPES);
  const [q, setQ] = useState("");
  const [basis, setBasis] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<{ mode: "add" | "edit"; row?: DiscountType } | null>(null);
  const [view, setView] = useState<DiscountType | null>(null);
  const [toDelete, setToDelete] = useState<DiscountType | null>(null);

  const filtered = useMemo(() => rows
    .filter((r) => r.name.toLowerCase().includes(q.toLowerCase()))
    .filter((r) => (basis ? r.basis === basis : true))
    .filter((r) => (status ? r.status === status : true)),
  [rows, q, basis, status]);

  const pages = Math.max(1, Math.ceil(filtered.length / STEPS));
  const current = Math.min(page, pages);
  const paged = filtered.slice((current - 1) * STEPS, current * STEPS);

  const rowMenu = (r: DiscountType) => [
    { label: "View", Icon: Eye, onClick: () => setView(r) },
    { label: "Edit", Icon: Pencil, onClick: () => setModal({ mode: "edit", row: r }) },
    { label: "Delete", Icon: Trash2, danger: true, onClick: () => setToDelete(r) },
  ];

  return (
    <>
      <PageHeader title="Discount Types" subtitle="Configure concessions such as sibling, scholarship and staff discounts."
        actions={<SplitButton label="Add Discount" Icon={Plus} onClick={() => setModal({ mode: "add" })} />} />

      <div className="px-4 pb-24 sm:px-6">
        <div className="flex flex-wrap items-center gap-2 py-3">
          <SearchBox value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search discounts" className="w-full sm:w-64" />
          <div className="flex flex-wrap items-center gap-2">
            <Select value={basis} onChange={(e) => { setBasis(e.target.value); setPage(1); }} options={BASIS} placeholder="All Basis" className="w-36" />
            <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} options={["Active", "Inactive"]} placeholder="All Status" className="w-36" />
            <Btn variant="secondary" Icon={Filter} className="hidden lg:inline-flex">Filter</Btn>
          </div>
        </div>

        <Card pad={false}>
          <div className="hidden md:block">
            <div className={cn("grid", COLS, "border-b border-[var(--theme-border)] bg-[var(--theme-surface)]")}>
              <Th className="border-l border-[var(--theme-border)]">Discount</Th>
              <Th className="border-l border-[var(--theme-border)]">Basis</Th>
              <Th className="border-l border-[var(--theme-border)]">Value</Th>
              <Th className="border-l border-[var(--theme-border)]">Description</Th>
              <Th className="border-l border-[var(--theme-border)]">Status</Th>
              <Th className="border-l border-[var(--theme-border)]"><span className="sr-only">Actions</span></Th>
            </div>
            {paged.map((r) => (
              <div key={r.id} className={cn("grid", COLS, "border-b border-[var(--theme-border)] bg-[var(--theme-surface)] text-[14px] last:border-b-0 hover:bg-[var(--theme-hover)]")}>
                <Td className="gap-2 border-l border-[var(--theme-border)] font-medium"><Tag className="h-4 w-4 text-[var(--theme-accent-strong)]" />{r.name}</Td>
                <Td className="border-l border-[var(--theme-border)]"><Badge label={r.basis} tone={r.basis === "Percentage" ? "purple" : "blue"} /></Td>
                <Td className="border-l border-[var(--theme-border)] font-medium">{r.basis === "Percentage" ? `${r.value}%` : `Rs ${r.value}`}</Td>
                <Td className="border-l border-[var(--theme-border)] text-[var(--theme-text-muted)]"><span className="truncate">{r.description}</span></Td>
                <Td className="border-l border-[var(--theme-border)]"><Badge label={r.status} /></Td>
                <Td className="justify-center border-l border-[var(--theme-border)]"><RowMenu items={rowMenu(r)} /></Td>
              </div>
            ))}
          </div>

          <div className="space-y-3 p-3 md:hidden">
            {paged.map((r) => (
              <div key={r.id} className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-3 shadow-sm" style={{ borderLeft: "6px solid var(--theme-success)" }}>
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium">{r.name}</p>
                    <p className="text-[13px] text-[var(--theme-text-muted)]">{r.description}</p>
                  </div>
                  <RowMenu items={rowMenu(r)} />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Badge label={r.basis} tone={r.basis === "Percentage" ? "purple" : "blue"} />
                  <span className="text-[14px] font-semibold">{r.basis === "Percentage" ? `${r.value}%` : `Rs ${r.value}`}</span>
                  <Badge label={r.status} />
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && <EmptyState Icon={Percent} title="No discount types" message="Add a discount to apply concessions on invoices." action={<Btn variant="primary" Icon={Plus} onClick={() => setModal({ mode: "add" })}>Add Discount</Btn>} />}
          <Pagination page={current} pages={pages} onPage={setPage} total={filtered.length} />
        </Card>
      </div>

      <DiscountForm modal={modal} onClose={() => setModal(null)}
        onSave={(row) => { setRows((p) => (modal?.mode === "edit" ? p.map((r) => (r.id === row.id ? row : r)) : [row, ...p])); setModal(null); }} />

      <Modal open={!!view} onClose={() => setView(null)} title={view?.name ?? ""} subtitle="Discount details"
        footer={<Btn variant="secondary" onClick={() => setView(null)}>Close</Btn>}>
        {view && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Info label="Basis" value={view.basis} />
              <Info label="Value" value={view.basis === "Percentage" ? `${view.value}%` : `Rs ${view.value}`} />
              <Info label="Status" value={view.status} />
              <Info label="ID" value={view.id} />
            </div>
            <div className="rounded-lg bg-[var(--theme-sidebar)] p-3 text-[13px] text-[var(--theme-text-muted)]">{view.description}</div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={() => setRows((p) => p.filter((r) => r.id !== toDelete?.id))}
        title="Delete discount type" confirmLabel="Delete" message={`Delete ${toDelete?.name}? Existing invoices will retain their applied discount.`} />
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (<div><p className="text-[12px] text-[var(--theme-text-faint)]">{label}</p><p className="text-[14px] font-medium">{value}</p></div>);
}

function DiscountForm({ modal, onClose, onSave }: { modal: { mode: "add" | "edit"; row?: DiscountType } | null; onClose: () => void; onSave: (r: DiscountType) => void }) {
  const blank: DiscountType = { id: "", name: "", basis: "Percentage", value: 0, description: "", status: "Active" };
  const [form, setForm] = useState<DiscountType>(modal?.row ?? blank);
  const key = `${modal?.mode ?? ""}-${modal?.row?.id ?? ""}`;
  const [lastKey, setLastKey] = useState(key);
  if (lastKey !== key) { setLastKey(key); setForm(modal?.row ?? blank); }
  const set = (patch: Partial<DiscountType>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <Modal open={!!modal} onClose={onClose} width="max-w-lg"
      title={modal?.mode === "edit" ? "Edit Discount" : "New Discount Type"} subtitle="Define a discount and how it is calculated."
      footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={() => onSave({ ...form, id: form.id || `DIS-${String(Date.now()).slice(-3)}` })}>{modal?.mode === "edit" ? "Save Changes" : "Create Discount"}</Btn></>}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Discount Name" className="sm:col-span-2"><Input value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Sibling Discount" /></Field>
        <Field label="Basis"><Select options={BASIS} value={form.basis} onChange={(e) => set({ basis: e.target.value as DiscountType["basis"] })} /></Field>
        <Field label={form.basis === "Percentage" ? "Value (%)" : "Value (Rs)"}><Input type="number" value={form.value} onChange={(e) => set({ value: Number(e.target.value) })} /></Field>
        <Field label="Description" className="sm:col-span-2"><Textarea value={form.description} onChange={(e) => set({ description: e.target.value })} /></Field>
        <Field label="Status"><Select options={["Active", "Inactive"]} value={form.status} onChange={(e) => set({ status: e.target.value as DiscountType["status"] })} /></Field>
      </div>
    </Modal>
  );
}
