"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Filter, ArrowUpDown, Eye, CreditCard, Trash2, FileText, Printer, Settings2 } from "lucide-react";
import {
  Btn, Card, ConfirmDialog, EmptyState, Field, Modal, PageHeader, Pagination, RowMenu,
  SearchBox, Select, SplitButton, Th, Td, cn, rs, INVOICE_COLORS, PillSelect,
} from "@/components/ui";
import { useBranch } from "@/lib/branch-context";
import { BranchScopeBar } from "@/components/branch/branch-ui";
import { FeeVoucherDocument } from "@/components/fees/fee-voucher";
import {
  describeApiError,
  feesApi,
  studentsApi,
  type DiscountTypeItem,
  type FeeInvoiceItem,
  type FeeInvoiceStatus,
  type FeeParticularItem,
  type FeeVoucherSchoolInfo,
  type FeeVoucherTemplate,
  type StudentItem,
} from "@/lib/auth/api-client";

const COLS = "grid-cols-[130px_minmax(150px,1.2fr)_100px_110px_100px_100px_100px_90px_90px_100px_120px_64px]";
const STEPS = 8;
const STATUSES: FeeInvoiceStatus[] = ["Paid", "Partially Paid", "Pending", "Overdue"];

export default function FeeInvoicesPage() {
  const { currentBranchId } = useBranch();
  const branchScope = currentBranchId !== "all" ? currentBranchId : undefined;

  const [rows, setRows] = useState<FeeInvoiceItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [particulars, setParticulars] = useState<FeeParticularItem[]>([]);
  const [discounts, setDiscounts] = useState<DiscountTypeItem[]>([]);
  const [voucherTemplate, setVoucherTemplate] = useState<FeeVoucherTemplate | null>(null);
  const [voucherSchool, setVoucherSchool] = useState<FeeVoucherSchoolInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [cls, setCls] = useState("");
  const [status, setStatus] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<FeeInvoiceItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<FeeInvoiceItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [invRes, stRes, partRes, discRes, tmplRes] = await Promise.all([
        feesApi.listInvoices({ branchId: branchScope }),
        studentsApi.list({ branchId: branchScope, status: "Active" }),
        feesApi.listParticulars({ status: "Active", branchId: branchScope }),
        feesApi.listDiscounts({ status: "Active", branchId: branchScope }),
        feesApi.getVoucherTemplate(),
      ]);
      setRows(invRes.invoices ?? []);
      setStudents(stRes.students ?? []);
      setParticulars(partRes.particulars ?? []);
      setDiscounts(discRes.discounts ?? []);
      setVoucherTemplate(tmplRes.template);
      setVoucherSchool(tmplRes.school);
    } catch (err) {
      setError(describeApiError(err).message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [branchScope]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => rows
    .filter((r) => r.student.toLowerCase().includes(q.toLowerCase()) || r.invoiceNo.toLowerCase().includes(q.toLowerCase()))
    .filter((r) => (cls ? r.cls === cls : true))
    .filter((r) => (status ? r.status === status : true))
    .sort((a, b) => (sortAsc ? a.student.localeCompare(b.student) : b.student.localeCompare(a.student))),
  [rows, q, cls, status, sortAsc]);

  const pages = Math.max(1, Math.ceil(filtered.length / STEPS));
  const current = Math.min(page, pages);
  const paged = filtered.slice((current - 1) * STEPS, current * STEPS);
  const classOptions = [...new Set(rows.map((i) => i.cls).filter(Boolean))];

  const markPaid = async (id: string) => {
    try {
      const res = await feesApi.recordPayment(id);
      setRows((p) => p.map((r) => (r.id === id ? res.invoice : r)));
      if (view?.id === id) setView(res.invoice);
    } catch (err) {
      setError(describeApiError(err).message);
    }
  };

  const setStatusRemote = async (id: string, next: FeeInvoiceStatus) => {
    try {
      const res = await feesApi.updateInvoice(id, { status: next });
      setRows((p) => p.map((r) => (r.id === id ? res.invoice : r)));
    } catch (err) {
      setError(describeApiError(err).message);
    }
  };

  const remove = async () => {
    if (!toDelete) return;
    try {
      await feesApi.deleteInvoice(toDelete.id);
      setToDelete(null);
      await load();
    } catch (err) {
      setError(describeApiError(err).message);
    }
  };

  const totals = {
    billed: filtered.reduce((a, r) => a + r.total, 0),
    paid: filtered.reduce((a, r) => a + r.paid, 0),
    balance: filtered.reduce((a, r) => a + r.balance, 0),
  };

  return (
    <>
      <PageHeader title="Fee Invoices" subtitle="Track billed, paid and outstanding fee invoices. Preview prints Bank, Student and School copies."
        actions={
          <>
            <Link href="/settings/fee-voucher" className="hidden items-center gap-2 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3.5 py-2 text-[14px] hover:bg-[var(--theme-hover)] sm:inline-flex">
              <Settings2 className="h-[18px] w-[18px]" /> Voucher Layout
            </Link>
            <Link href="/fees/structure" className="hidden items-center gap-2 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3.5 py-2 text-[14px] hover:bg-[var(--theme-hover)] lg:inline-flex">
              <FileText className="h-[18px] w-[18px]" /> Fee Structure
            </Link>
            <SplitButton label="Create Invoice" Icon={Plus} onClick={() => setCreating(true)} />
          </>
        } />

      <div className="flex min-h-0 flex-1 flex-col px-4 pb-24 sm:px-6">
        {error ? <p className="my-2 text-[13px] text-[var(--theme-danger)]">{error}</p> : null}
        <div className="my-3 grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-4">
          <Mini label="Invoices" value={String(filtered.length)} tone="blue" />
          <Mini label="Total Billed" value={rs(totals.billed)} tone="purple" />
          <Mini label="Collected" value={rs(totals.paid)} tone="green" />
          <Mini label="Outstanding" value={rs(totals.balance)} tone="red" />
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 pb-3">
          <SearchBox value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search invoice or student" className="w-full sm:w-64" />
          <Select value={cls} onChange={(e) => { setCls(e.target.value); setPage(1); }} options={classOptions} placeholder="All Classes" className="w-36" />
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} options={STATUSES} placeholder="All Status" className="w-40" />
          <Btn variant="secondary" Icon={ArrowUpDown} onClick={() => setSortAsc((s) => !s)}>{sortAsc ? "A–Z" : "Z–A"}</Btn>
          <Btn variant="secondary" Icon={Filter} className="hidden lg:inline-flex">Filter</Btn>
        </div>

        <div className="shrink-0"><BranchScopeBar count={filtered.length} noun="invoices" /></div>

        <Card pad={false} className="mt-2 flex min-h-0 flex-1 flex-col overflow-hidden">
          {loading ? (
            <p className="px-4 py-8 text-center text-[13px] text-[var(--theme-text-muted)]">Loading…</p>
          ) : (
            <>
              <div className="hidden min-h-0 flex-1 md:block">
                <div className="h-[min(62vh,640px)] overflow-auto overscroll-contain">
                  <div className="min-w-[1240px]">
                    <div className={cn("sticky top-0 z-10 grid", COLS, "border-b border-[var(--theme-border)] bg-[var(--theme-surface)] shadow-sm")}>
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
                        <Td className="border-l border-[var(--theme-border)] font-mono text-[12.5px] text-[var(--theme-text-muted)]">{r.invoiceNo}</Td>
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
                          <PillSelect<FeeInvoiceStatus> value={r.status as FeeInvoiceStatus} options={STATUSES} colors={INVOICE_COLORS}
                            onPick={(s) => setStatusRemote(r.id, s)} className="w-32" />
                        </Td>
                        <Td className="justify-center border-l border-[var(--theme-border)]">
                          <RowMenu items={[
                            { label: "View Voucher", Icon: Eye, onClick: () => setView(r) },
                            { label: "Record Payment", Icon: CreditCard, onClick: () => markPaid(r.id) },
                            { label: "Delete", Icon: Trash2, danger: true, onClick: () => setToDelete(r) },
                          ]} />
                        </Td>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="max-h-[min(62vh,640px)] space-y-3 overflow-auto p-3 md:hidden">
                {paged.map((r) => (
                  <div key={r.id} className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-3 shadow-sm" style={{ borderLeft: "6px solid var(--theme-info)" }}>
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-medium">{r.student}</p>
                        <p className="font-mono text-[12px] text-[var(--theme-text-faint)]">{r.invoiceNo}</p>
                      </div>
                      <PillSelect<FeeInvoiceStatus> value={r.status as FeeInvoiceStatus} options={STATUSES} colors={INVOICE_COLORS}
                        onPick={(s) => setStatusRemote(r.id, s)} className="w-32" />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-[13px]">
                      <Info label="Class" value={`${r.cls}-${r.section}`} />
                      <Info label="Period" value={r.period} />
                      <Info label="Total" value={rs(r.total)} />
                      <Info label="Balance" value={rs(r.balance)} />
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Btn size="sm" variant="secondary" Icon={Eye} onClick={() => setView(r)}>Voucher</Btn>
                      <Btn size="sm" variant="primary" Icon={CreditCard} onClick={() => markPaid(r.id)}>Mark Paid</Btn>
                    </div>
                  </div>
                ))}
              </div>

              {filtered.length === 0 && (
                <EmptyState Icon={FileText} title="No invoices found" message="Adjust the filters or create a new invoice."
                  action={<Btn variant="primary" Icon={Plus} onClick={() => setCreating(true)}>Create Invoice</Btn>} />
              )}
              <div className="shrink-0 border-t border-[var(--theme-border)]">
                <Pagination page={current} pages={pages} onPage={setPage} total={filtered.length} />
              </div>
            </>
          )}
        </Card>
      </div>

      <CreateInvoice
        open={creating}
        students={students}
        particulars={particulars}
        discounts={discounts}
        branchId={branchScope}
        onClose={() => setCreating(false)}
        onCreated={async (inv) => {
          setCreating(false);
          setView(inv);
          await load();
        }}
      />

      <Modal
        open={!!view}
        onClose={() => setView(null)}
        title="Fee Voucher"
        subtitle={view ? `${view.invoiceNo} · Bank + Student + School copies` : undefined}
        width="max-w-4xl"
        footer={
          <>
            <Link href="/settings/fee-voucher" className="mr-auto text-[13px] text-[var(--theme-primary)] hover:underline">
              Edit voucher layout
            </Link>
            <Btn variant="secondary" onClick={() => setView(null)}>Close</Btn>
            <Btn variant="primary" Icon={Printer} onClick={() => window.print()}>Print / PDF</Btn>
            <Btn variant="primary" Icon={CreditCard} onClick={() => { if (view) markPaid(view.id); }}>Record Full Payment</Btn>
          </>
        }
      >
        {view ? (
          <FeeVoucherDocument
            invoice={view}
            template={voucherTemplate}
            school={voucherSchool}
          />
        ) : null}
      </Modal>

      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={remove}
        title="Delete invoice" confirmLabel="Delete" message={`Delete invoice ${toDelete?.invoiceNo}? This cannot be undone.`} />
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
  return (
    <div className="rounded-lg border border-[var(--theme-border)] px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-[var(--theme-text-faint)]">{label}</p>
      <p className="truncate text-[14px] font-medium">{value}</p>
    </div>
  );
}

function CreateInvoice({ open, onClose, onCreated, students, particulars, discounts, branchId }: {
  open: boolean;
  onClose: () => void;
  onCreated: (inv: FeeInvoiceItem) => void | Promise<void>;
  students: StudentItem[];
  particulars: FeeParticularItem[];
  discounts: DiscountTypeItem[];
  branchId?: string;
}) {
  const [studentId, setStudentId] = useState("");
  const [period, setPeriod] = useState(() => new Date().toLocaleString("en-US", { month: "short", year: "numeric" }));
  const [issue, setIssue] = useState(new Date().toISOString().slice(0, 10));
  const [due, setDue] = useState(new Date().toISOString().slice(0, 10));
  const [picked, setPicked] = useState<string[]>([]);
  const [discountTypeId, setDiscountTypeId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wasOpen, setWasOpen] = useState(open);

  if (wasOpen !== open) {
    setWasOpen(open);
    if (open) {
      setStudentId("");
      setPeriod(new Date().toLocaleString("en-US", { month: "short", year: "numeric" }));
      setPicked(particulars.slice(0, 4).map((p) => p.id));
      setDiscountTypeId("");
      setError(null);
    }
  }

  const lines = particulars.filter((p) => picked.includes(p.id));
  const total = lines.reduce((a, p) => a + p.amount, 0);
  const disc = discounts.find((d) => d.id === discountTypeId);
  const discountAmount = disc
    ? disc.basis === "Percentage"
      ? Math.round((total * disc.value) / 100)
      : disc.value
    : 0;

  const create = async () => {
    if (!studentId || total === 0) return;
    setSaving(true);
    setError(null);
    try {
      const res = await feesApi.createInvoice({
        studentId,
        period,
        issue,
        due,
        particularIds: picked,
        discountTypeId: discountTypeId || undefined,
        branchId: branchId ?? null,
      });
      await onCreated(res.invoice);
    } catch (err) {
      setError(describeApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} width="max-w-xl" title="Create Fee Invoice" subtitle="Generate an invoice for a student"
      footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" loading={saving} disabled={!studentId || total === 0} onClick={create}>Create Invoice</Btn></>}>
      <div className="space-y-4">
        {error ? <p className="text-[13px] text-[var(--theme-danger)]">{error}</p> : null}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Student" className="sm:col-span-2">
            <Select
              options={students.map((s) => `${s.name} (${s.cls}-${s.section})`)}
              value={students.find((s) => s.id === studentId) ? `${students.find((s) => s.id === studentId)!.name} (${students.find((s) => s.id === studentId)!.cls}-${students.find((s) => s.id === studentId)!.section})` : ""}
              onChange={(e) => {
                const label = e.target.value;
                const st = students.find((s) => `${s.name} (${s.cls}-${s.section})` === label);
                setStudentId(st?.id || "");
              }}
              placeholder={students.length ? "Select student" : "No students found"}
            />
          </Field>
          <Field label="Billing Period"><input value={period} onChange={(e) => setPeriod(e.target.value)} className="h-10 w-full rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 text-[14px]" /></Field>
          <Field label="Due Date"><input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="h-10 w-full rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 text-[14px]" /></Field>
          <Field label="Issue Date"><input type="date" value={issue} onChange={(e) => setIssue(e.target.value)} className="h-10 w-full rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 text-[14px]" /></Field>
          <Field label="Discount Type">
            <Select
              options={["No discount", ...discounts.map((d) => d.name)]}
              value={disc?.name || "No discount"}
              onChange={(e) => {
                const d = discounts.find((x) => x.name === e.target.value);
                setDiscountTypeId(d?.id || "");
              }}
            />
          </Field>
        </div>

        <div>
          <p className="mb-2 text-[13px] font-medium">Fee particulars</p>
          <div className="space-y-1.5 rounded-lg border border-[var(--theme-border)] p-3">
            {particulars.length === 0 ? (
              <p className="text-[13px] text-[var(--theme-text-muted)]">No active particulars. Add them under Fees Particulars first.</p>
            ) : particulars.map((p) => (
              <label key={p.id} className="flex items-center gap-2.5 text-[14px]">
                <input type="checkbox" checked={picked.includes(p.id)} className="h-4 w-4 accent-[var(--theme-primary)]"
                  onChange={(e) => setPicked((prev) => (e.target.checked ? [...prev, p.id] : prev.filter((x) => x !== p.id)))} />
                <span className="flex-1">{p.particular}</span>
                <span className="text-[var(--theme-text-muted)]">{rs(p.amount)}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-1 rounded-lg bg-[var(--theme-sidebar)] px-4 py-3 text-[14px]">
          <div className="flex justify-between"><span className="text-[var(--theme-text-muted)]">Subtotal</span><span>{rs(total)}</span></div>
          <div className="flex justify-between"><span className="text-[var(--theme-text-muted)]">Discount</span><span>{discountAmount ? `− ${rs(discountAmount)}` : "—"}</span></div>
          <div className="flex justify-between font-bold"><span>Invoice Total</span><span>{rs(Math.max(0, total - discountAmount))}</span></div>
        </div>
      </div>
    </Modal>
  );
}

