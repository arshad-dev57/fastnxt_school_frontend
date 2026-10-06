"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Filter, ArrowUpDown, Eye, CreditCard, Trash2, FileText } from "lucide-react";
import {
  Badge, Btn, Card, ConfirmDialog, EmptyState, Field, Modal, PageHeader, Pagination, RowMenu,
  SearchBox, Select, SplitButton, Th, Td, cn, rs, INVOICE_COLORS, PillSelect,
} from "@/components/ui";
import { INVOICES, STUDENT_ROWS, FEE_PARTICULARS, SCHOOL, type InvoiceRow, type InvoiceStatus } from "@/lib/mock-data";
import { useBranch } from "@/lib/branch-context";
import { isInBranchScope } from "@/lib/branch-scope";
import { BranchScopeBar } from "@/components/branch/branch-ui";

const COLS = "grid-cols-[130px_minmax(150px,1.2fr)_100px_110px_100px_100px_100px_90px_90px_100px_120px_64px]";
const STEPS = 8;
const STATUSES: InvoiceStatus[] = ["Paid", "Partially Paid", "Pending", "Overdue"];

export default function FeeInvoicesPage() {
  const { currentBranchId } = useBranch();
  const [rows, setRows] = useState<InvoiceRow[]>(INVOICES);
  const [q, setQ] = useState("");
  const [cls, setCls] = useState("");
  const [status, setStatus] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<InvoiceRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<InvoiceRow | null>(null);

  const filtered = useMemo(() => rows
    .filter((r) => isInBranchScope(r.id, currentBranchId))
    .filter((r) => r.student.toLowerCase().includes(q.toLowerCase()) || r.id.toLowerCase().includes(q.toLowerCase()))
    .filter((r) => (cls ? r.cls === cls : true))
    .filter((r) => (status ? r.status === status : true))
    .sort((a, b) => (sortAsc ? a.student.localeCompare(b.student) : b.student.localeCompare(a.student))),
  [rows, currentBranchId, q, cls, status, sortAsc]);

  const pages = Math.max(1, Math.ceil(filtered.length / STEPS));
  const current = Math.min(page, pages);
  const paged = filtered.slice((current - 1) * STEPS, current * STEPS);

  const markPaid = (id: string) =>
    setRows((p) => p.map((r) => (r.id === id ? { ...r, status: "Paid", paid: r.total - r.discount, balance: 0 } : r)));

  const totals = {
    billed: filtered.reduce((a, r) => a + r.total, 0),
    paid: filtered.reduce((a, r) => a + r.paid, 0),
    balance: filtered.reduce((a, r) => a + r.balance, 0),
  };

  return (
    <>
      <PageHeader title="Fee Invoices" subtitle="Track billed, paid and outstanding fee invoices."
        actions={
          <>
            <Link href="/fees/structure" className="hidden items-center gap-2 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3.5 py-2 text-[14px] hover:bg-[var(--theme-hover)] sm:inline-flex">
              <FileText className="h-[18px] w-[18px]" /> Fee Structure
            </Link>
            <SplitButton label="Create Invoice" Icon={Plus} onClick={() => setCreating(true)} />
          </>
        } />

      <div className="px-4 pb-24 sm:px-6">
        <div className="my-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Mini label="Invoices" value={String(filtered.length)} tone="blue" />
          <Mini label="Total Billed" value={rs(totals.billed)} tone="purple" />
          <Mini label="Collected" value={rs(totals.paid)} tone="green" />
          <Mini label="Outstanding" value={rs(totals.balance)} tone="red" />
        </div>

        <div className="flex flex-wrap items-center gap-2 pb-3">
          <SearchBox value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search invoice or student" className="w-full sm:w-64" />
          <div className="flex flex-wrap items-center gap-2">
            <Select value={cls} onChange={(e) => { setCls(e.target.value); setPage(1); }} options={[...new Set(INVOICES.map((i) => i.cls))]} placeholder="All Classes" className="w-36" />
            <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} options={STATUSES} placeholder="All Status" className="w-40" />
            <Btn variant="secondary" Icon={ArrowUpDown} onClick={() => setSortAsc((s) => !s)}>{sortAsc ? "A–Z" : "Z–A"}</Btn>
            <Btn variant="secondary" Icon={Filter} className="hidden lg:inline-flex">Filter</Btn>
          </div>
        </div>

        <BranchScopeBar count={filtered.length} noun="invoices" />

        <Card pad={false}>
          <div className="hidden md:block">
            <div className="overflow-x-auto">
              <div className="min-w-[1240px]">
                <div className={cn("grid", COLS, "border-b border-[var(--theme-border)] bg-[var(--theme-surface)]")}>
                  <Th className="border-l border-[var(--theme-border)]">Invoice No</Th>
                  <Th className="border-l border-[var(--theme-border)]">Student</Th>
                  <Th className="border-l border-[var(--theme-border)]">Class</Th>
                  <Th className="border-l border-[var(--theme-border)]">Period</Th>
                  <Th className="border-l border-[var(--theme-border)]">Issue</Th>
                  <Th className="border-l border-[var(--theme-border)]">Due</Th>
                  <Th className="border-l border-[var(--theme-border)]">Total</Th>
                  <Th className="border-l border-[var(--theme-border)]">Disc.</Th>
                  <Th className="border-l border-[var(--theme-border)]">Paid</Th>
                  <Th className="border-l border-[var(--theme-border)]">Balance</Th>
                  <Th className="border-l border-[var(--theme-border)]">Status</Th>
                  <Th className="border-l border-[var(--theme-border)]"><span className="sr-only">Actions</span></Th>
                </div>
                {paged.map((r) => (
                  <div key={r.id} className={cn("grid", COLS, "border-b border-[var(--theme-border)] bg-[var(--theme-surface)] text-[13.5px] last:border-b-0 hover:bg-[var(--theme-hover)]")}>
                    <Td className="border-l border-[var(--theme-border)] font-mono text-[12.5px] text-[var(--theme-text-muted)]">{r.id}</Td>
                    <Td className="border-l border-[var(--theme-border)] font-medium"><span className="truncate">{r.student}</span></Td>
                    <Td className="border-l border-[var(--theme-border)]">{r.cls}-{r.section}</Td>
                    <Td className="border-l border-[var(--theme-border)] text-[var(--theme-text-muted)]">{r.period}</Td>
                    <Td className="border-l border-[var(--theme-border)] text-[var(--theme-text-muted)]">{r.issue}</Td>
                    <Td className="border-l border-[var(--theme-border)] text-[var(--theme-text-muted)]">{r.due}</Td>
                    <Td className="border-l border-[var(--theme-border)] font-medium">{rs(r.total)}</Td>
                    <Td className="border-l border-[var(--theme-border)] text-[var(--theme-text-muted)]">{r.discount ? rs(r.discount) : "—"}</Td>
                    <Td className="border-l border-[var(--theme-border)] text-[var(--theme-success-text)]">{rs(r.paid)}</Td>
                    <Td className={cn("border-l border-[var(--theme-border)] font-medium", r.balance > 0 && "text-[var(--theme-danger-text)]")}>{rs(r.balance)}</Td>
                    <Td className="border-l border-[var(--theme-border)]">
                      <PillSelect<InvoiceStatus> value={r.status} options={STATUSES} colors={INVOICE_COLORS} onPick={(s) => setRows((p) => p.map((x) => (x.id === r.id ? { ...x, status: s } : x)))} className="w-32" />
                    </Td>
                    <Td className="justify-center border-l border-[var(--theme-border)]">
                      <RowMenu items={[
                        { label: "View / Preview", Icon: Eye, onClick: () => setView(r) },
                        { label: "Record Payment", Icon: CreditCard, onClick: () => markPaid(r.id) },
                        { label: "Delete", Icon: Trash2, danger: true, onClick: () => setToDelete(r) },
                      ]} />
                    </Td>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3 p-3 md:hidden">
            {paged.map((r) => (
              <div key={r.id} className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-3 shadow-sm" style={{ borderLeft: "6px solid var(--theme-info)" }}>
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium">{r.student}</p>
                    <p className="font-mono text-[12px] text-[var(--theme-text-faint)]">{r.id}</p>
                  </div>
                  <PillSelect<InvoiceStatus> value={r.status} options={STATUSES} colors={INVOICE_COLORS} onPick={(s) => setRows((p) => p.map((x) => (x.id === r.id ? { ...x, status: s } : x)))} className="w-32" />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[13px]">
                  <Info label="Class" value={`${r.cls}-${r.section}`} />
                  <Info label="Period" value={r.period} />
                  <Info label="Total" value={rs(r.total)} />
                  <Info label="Balance" value={rs(r.balance)} />
                </div>
                <div className="mt-3 flex gap-2">
                  <Btn size="sm" variant="secondary" Icon={Eye} onClick={() => setView(r)}>Preview</Btn>
                  <Btn size="sm" variant="primary" Icon={CreditCard} onClick={() => markPaid(r.id)}>Mark Paid</Btn>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && <EmptyState Icon={FileText} title="No invoices found" message="Adjust the filters or create a new invoice." action={<Btn variant="primary" Icon={Plus} onClick={() => setCreating(true)}>Create Invoice</Btn>} />}
          <Pagination page={current} pages={pages} onPage={setPage} total={filtered.length} />
        </Card>
      </div>

      <CreateInvoice open={creating} onClose={() => setCreating(false)}
        onCreate={(inv) => { setRows((p) => [inv, ...p]); setCreating(false); setView(inv); }} />

      <Modal open={!!view} onClose={() => setView(null)} title="Fee Invoice" subtitle={view?.id} width="max-w-3xl"
        footer={<><Btn variant="secondary" onClick={() => setView(null)}>Close</Btn>
          <Btn variant="primary" Icon={CreditCard} onClick={() => { if (view) markPaid(view.id); }}>Record Full Payment</Btn></>}>
        {view && <InvoiceDoc inv={view} />}
      </Modal>

      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={() => setRows((p) => p.filter((r) => r.id !== toDelete?.id))}
        title="Delete invoice" confirmLabel="Delete" message={`Delete invoice ${toDelete?.id}? This cannot be undone.`} />
    </>
  );
}

function Mini({ label, value, tone }: { label: string; value: string; tone: "blue" | "green" | "red" | "purple" }) {
  const cls = tone === "green" ? "text-[var(--theme-success-text)]" : tone === "red" ? "text-[var(--theme-danger-text)]" : tone === "purple" ? "text-[var(--theme-accent-strong)]" : "text-[var(--theme-primary-soft-text)]";
  return (
    <Card>
      <p className="text-[12px] text-[var(--theme-text-faint)]">{label}</p>
      <p className={cn("text-[19px] font-bold", cls)}>{value}</p>
    </Card>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (<div className="rounded-lg border border-[var(--theme-border)] px-3 py-2"><p className="text-[11px] uppercase tracking-wide text-[var(--theme-text-faint)]">{label}</p><p className="truncate text-[14px] font-medium">{value}</p></div>);
}

function CreateInvoice({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (inv: InvoiceRow) => void }) {
  const [student, setStudent] = useState("");
  const [period, setPeriod] = useState("Jan 2026");
  const [issue, setIssue] = useState(new Date().toISOString().slice(0, 10));
  const [due, setDue] = useState("2026-01-10");
  const [picked, setPicked] = useState<string[]>(FEE_PARTICULARS.slice(0, 4).map((p) => p.particular));
  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (open) { setStudent(""); setPeriod("Jan 2026"); setPicked(FEE_PARTICULARS.slice(0, 4).map((p) => p.particular)); }
  }

  const lines = FEE_PARTICULARS.filter((p) => picked.includes(p.particular));
  const total = lines.reduce((a, p) => a + p.amount, 0);
  const s = STUDENT_ROWS.find((x) => x.name === student);

  const create = () => {
    if (!s) return;
    onCreate({
      id: `INV-2026-${String(Date.now()).slice(-4)}`, student: s.name, cls: s.cls, section: s.section,
      period, issue, due, total, discount: 0, paid: 0, balance: total, status: "Pending",
    });
  };

  return (
    <Modal open={open} onClose={onClose} width="max-w-xl" title="Create Fee Invoice" subtitle="Generate an invoice for a student"
      footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn variant="primary" disabled={!s || total === 0} onClick={create}>Create Invoice</Btn></>}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Student" className="sm:col-span-2"><Select options={STUDENT_ROWS.map((x) => x.name)} value={student} onChange={(e) => setStudent(e.target.value)} placeholder="Select student" /></Field>
          <Field label="Billing Period"><Select options={["Jan 2026", "Feb 2026", "Mar 2026"]} value={period} onChange={(e) => setPeriod(e.target.value)} /></Field>
          <Field label="Due Date"><input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="h-10 w-full rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 text-[14px] outline-none focus:border-[var(--theme-primary)]" /></Field>
          <Field label="Issue Date" className="sm:col-span-2"><input type="date" value={issue} onChange={(e) => setIssue(e.target.value)} className="h-10 w-full rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 text-[14px] outline-none focus:border-[var(--theme-primary)]" /></Field>
        </div>

        <div>
          <p className="mb-2 text-[13px] font-medium">Fee particulars</p>
          <div className="space-y-1.5 rounded-lg border border-[var(--theme-border)] p-3">
            {FEE_PARTICULARS.map((p) => (
              <label key={p.id} className="flex items-center gap-2.5 text-[14px]">
                <input type="checkbox" checked={picked.includes(p.particular)} className="h-4 w-4 accent-[var(--theme-primary)]"
                  onChange={(e) => setPicked((prev) => (e.target.checked ? [...prev, p.particular] : prev.filter((x) => x !== p.particular)))} />
                <span className="flex-1">{p.particular}</span>
                <span className="text-[var(--theme-text-muted)]">{rs(p.amount)}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-[var(--theme-sidebar)] px-4 py-3">
          <span className="text-[14px] text-[var(--theme-text-muted)]">Invoice Total</span>
          <span className="text-[18px] font-bold">{rs(total)}</span>
        </div>
      </div>
    </Modal>
  );
}

function InvoiceDoc({ inv }: { inv: InvoiceRow }) {
  const lines = FEE_PARTICULARS.slice(0, 4);
  return (
    <div className="print-area mx-auto max-w-[720px] bg-[var(--theme-surface)] p-4 text-[var(--theme-text)] sm:p-6">
      <div className="flex items-start justify-between gap-4 border-b-2 border-[var(--theme-primary)] pb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--theme-accent)] text-[20px] font-extrabold text-white">B</span>
          <div>
            <h1 className="text-[18px] font-bold leading-tight">{SCHOOL.name}</h1>
            <p className="text-[12px] text-[var(--theme-text-muted)]">{SCHOOL.address}</p>
            <p className="text-[12px] text-[var(--theme-text-muted)]">{SCHOOL.phone} · {SCHOOL.email}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-wide text-[var(--theme-text-faint)]">Invoice</p>
          <p className="font-mono text-[14px] font-semibold">{inv.id}</p>
          <div className="mt-1"><Badge label={inv.status} /></div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-[var(--theme-text-faint)]">Billed To</p>
          <p className="text-[15px] font-semibold">{inv.student}</p>
          <p className="text-[13px] text-[var(--theme-text-muted)]">Class {inv.cls}-{inv.section}</p>
        </div>
        <div className="text-[13px]">
          <p><span className="text-[var(--theme-text-muted)]">Billing Period:</span> <span className="font-medium">{inv.period}</span></p>
          <p><span className="text-[var(--theme-text-muted)]">Issue Date:</span> {inv.issue}</p>
          <p><span className="text-[var(--theme-text-muted)]">Due Date:</span> {inv.due}</p>
        </div>
      </div>

      <table className="mt-4 w-full border-collapse text-[13px]">
        <thead>
          <tr className="bg-[var(--theme-sidebar)]">
            <th className="border border-[var(--theme-border)] px-3 py-2 text-left">Fee Particular</th>
            <th className="border border-[var(--theme-border)] px-3 py-2 text-left">Frequency</th>
            <th className="border border-[var(--theme-border)] px-3 py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((p) => (
            <tr key={p.id}>
              <td className="border border-[var(--theme-border)] px-3 py-2">{p.particular}</td>
              <td className="border border-[var(--theme-border)] px-3 py-2 text-[var(--theme-text-muted)]">{p.frequency}</td>
              <td className="border border-[var(--theme-border)] px-3 py-2 text-right">{rs(p.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="ml-auto mt-4 w-full max-w-[300px] space-y-1.5 text-[13px]">
        <InvRow label="Subtotal" value={rs(inv.total)} />
        <InvRow label="Discount" value={inv.discount ? `− ${rs(inv.discount)}` : "—"} />
        <div className="flex items-center justify-between border-t border-[var(--theme-border)] pt-1.5 text-[15px] font-bold"><span>Total</span><span>{rs(inv.total)}</span></div>
        <InvRow label="Paid" value={rs(inv.paid)} green />
        <div className="flex items-center justify-between text-[15px] font-bold"><span>Balance Due</span><span className={inv.balance > 0 ? "text-[var(--theme-danger-text)]" : "text-[var(--theme-success-text)]"}>{rs(inv.balance)}</span></div>
      </div>

      <p className="mt-6 border-t border-dashed border-[var(--theme-border-strong)] pt-3 text-center text-[11px] text-[var(--theme-text-faint)]">
        Thank you · Payments are non-refundable · {SCHOOL.website}
      </p>
    </div>
  );
}

function InvRow({ label, value, green }: { label: string; value: string; green?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[var(--theme-text-muted)]">{label}</span>
      <span className={cn("font-medium", green && "text-[var(--theme-success-text)]")}>{value}</span>
    </div>
  );
}

