"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Filter, ArrowUpDown, Eye, Pencil, Trash2, Receipt, Tags, Calculator } from "lucide-react";
import {
  Badge, Btn, Card, ConfirmDialog, EmptyState, Field, Input, Modal, PageHeader,
  Pagination, RowMenu, SearchBox, Select, SplitButton, Textarea, Th, Td, cn, rs,
} from "@/components/ui";
import { useBranch } from "@/lib/branch-context";
import {
  describeApiError,
  feesApi,
  type FeeParticularItem,
} from "@/lib/auth/api-client";

const COLS = "grid-cols-[minmax(160px,1.2fr)_minmax(220px,1.8fr)_120px_120px_110px_64px]";
const STEPS = 6;
const FREQUENCIES = ["Monthly", "Quarterly", "Annually", "One-time"];

export default function FeeParticularsPage() {
  const { currentBranchId } = useBranch();
  const [rows, setRows] = useState<FeeParticularItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [freq, setFreq] = useState("");
  const [status, setStatus] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<{ mode: "add" | "edit"; row?: FeeParticularItem } | null>(null);
  const [view, setView] = useState<FeeParticularItem | null>(null);
  const [toDelete, setToDelete] = useState<FeeParticularItem | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await feesApi.listParticulars({
        branchId: currentBranchId !== "all" ? currentBranchId : undefined,
      });
      setRows(res.particulars ?? []);
    } catch (err) {
      setError(describeApiError(err).message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [currentBranchId]);

  useEffect(() => { load(); }, [load]);

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

  const save = async (form: FeeParticularItem) => {
    setSaving(true);
    setError(null);
    try {
      if (modal?.mode === "edit" && form.id) {
        await feesApi.updateParticular(form.id, form);
      } else {
        await feesApi.createParticular({
          ...form,
          branchId: currentBranchId !== "all" ? currentBranchId : null,
        });
      }
      setModal(null);
      await load();
    } catch (err) {
      setError(describeApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!toDelete) return;
    try {
      await feesApi.deleteParticular(toDelete.id);
      setToDelete(null);
      await load();
    } catch (err) {
      setError(describeApiError(err).message);
    }
  };

  const rowMenu = (r: FeeParticularItem) => [
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
        {error ? <p className="my-2 text-[13px] text-[var(--theme-danger)]">{error}</p> : null}
        <div className="flex flex-wrap items-center gap-2 py-3">
          <SearchBox value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search particulars" className="w-full sm:w-64" />
          <Select value={freq} onChange={(e) => { setFreq(e.target.value); setPage(1); }} options={FREQUENCIES} placeholder="All Frequencies" className="w-40" />
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} options={["Active", "Inactive"]} placeholder="All Status" className="w-36" />
          <Btn variant="secondary" Icon={ArrowUpDown} onClick={() => setSortAsc((s) => !s)}>{sortAsc ? "A–Z" : "Z–A"}</Btn>
          <Btn variant="secondary" Icon={Filter} className="hidden lg:inline-flex">Filter</Btn>
        </div>

        <div className="mb-3 flex items-center gap-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-sidebar)] px-4 py-3 text-[13px]">
          <Tags className="h-4 w-4 text-[var(--theme-accent-strong)]" />
          <span className="text-[var(--theme-text-muted)]">Active monthly total:</span>
          <span className="font-semibold">{rs(totalMonthly)}</span>
        </div>

        <Card pad={false}>
          {loading ? (
            <p className="px-4 py-8 text-center text-[13px] text-[var(--theme-text-muted)]">Loading…</p>
          ) : (
            <>
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
              {filtered.length === 0 && (
                <EmptyState Icon={Receipt} title="No fee particulars" message="Add a fee head to start building the fee structure."
                  action={<Btn variant="primary" Icon={Plus} onClick={() => setModal({ mode: "add" })}>Add Particular</Btn>} />
              )}
              <Pagination page={current} pages={pages} onPage={setPage} total={filtered.length} />
            </>
          )}
        </Card>
      </div>

      <ParticularForm modal={modal} saving={saving} onClose={() => setModal(null)} onSave={save} />

      <Modal open={!!view} onClose={() => setView(null)} title={view?.particular ?? ""} subtitle="Fee particular details"
        footer={<Btn variant="secondary" onClick={() => setView(null)}>Close</Btn>}>
        {view && (
          <div className="grid grid-cols-2 gap-3">
            <Info label="Amount" value={rs(view.amount)} />
            <Info label="Frequency" value={view.frequency} />
            <Info label="Status" value={view.status} />
            <Info label="Description" value={view.description || "—"} />
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={remove}
        title="Delete particular" confirmLabel="Delete" message={`Delete ${toDelete?.particular}?`} />
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (<div><p className="text-[12px] text-[var(--theme-text-faint)]">{label}</p><p className="text-[14px] font-medium">{value}</p></div>);
}

function ParticularForm({ modal, onClose, onSave, saving }: {
  modal: { mode: "add" | "edit"; row?: FeeParticularItem } | null;
  onClose: () => void;
  onSave: (r: FeeParticularItem) => void;
  saving: boolean;
}) {
  const blank: FeeParticularItem = { id: "", particular: "", description: "", amount: 0, frequency: "Monthly", status: "Active" };
  const [form, setForm] = useState<FeeParticularItem>(modal?.row ?? blank);
  const key = `${modal?.mode ?? ""}-${modal?.row?.id ?? ""}`;
  const [lastKey, setLastKey] = useState(key);
  if (lastKey !== key) { setLastKey(key); setForm(modal?.row ?? blank); }
  const set = (patch: Partial<FeeParticularItem>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <Modal open={!!modal} onClose={onClose} width="max-w-lg"
      title={modal?.mode === "edit" ? "Edit Particular" : "New Fee Particular"}
      footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" loading={saving} onClick={() => onSave(form)}>{modal?.mode === "edit" ? "Save Changes" : "Create Particular"}</Btn></>}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Particular" className="sm:col-span-2"><Input value={form.particular} onChange={(e) => set({ particular: e.target.value })} /></Field>
        <Field label="Description" className="sm:col-span-2"><Textarea value={form.description || ""} onChange={(e) => set({ description: e.target.value })} /></Field>
        <Field label="Amount (Rs)"><Input type="number" value={form.amount} onChange={(e) => set({ amount: Number(e.target.value) })} /></Field>
        <Field label="Frequency"><Select options={FREQUENCIES} value={form.frequency} onChange={(e) => set({ frequency: e.target.value })} /></Field>
        <Field label="Status"><Select options={["Active", "Inactive"]} value={form.status} onChange={(e) => set({ status: e.target.value })} /></Field>
      </div>
    </Modal>
  );
}
