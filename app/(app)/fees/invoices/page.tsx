"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Filter, ArrowUpDown, Eye, CreditCard, Trash2, FileText, Printer, Settings2, ReceiptText } from "lucide-react";
import {
  Btn, Card, ConfirmDialog, EmptyState, Field, Modal, PageHeader, Pagination, RowMenu,
  SearchBox, Select, SplitButton, Th, Td, cn, rs,
} from "@/components/ui";
import { StatusPill } from "@/components/board-kit";
import { useBranch } from "@/lib/branch-context";
import { BranchScopeBar } from "@/components/branch/branch-ui";
import { FeeVoucherDocument } from "@/components/fees/fee-voucher";
import { FeeReceiptPreviewModal } from "@/components/fees/fee-receipt-actions";
import {
  describeApiError,
  feesApi,
  studentsApi,
  type DiscountTypeItem,
  type FeeInvoiceItem,
  type FeeInvoiceStatus,
  type FeePaymentItem,
  type FeeStructureItem,
  type FeeVoucherSchoolInfo,
  type FeeVoucherTemplate,
  type StudentItem,
} from "@/lib/auth/api-client";

const COLS = "grid-cols-[130px_minmax(150px,1.2fr)_100px_110px_100px_100px_100px_90px_90px_100px_120px_64px]";
const STEPS = 8;
const STATUSES: FeeInvoiceStatus[] = ["Paid", "Partially Paid", "Pending", "Overdue"];
const SESSIONS = ["2023-2024", "2024-2025", "2025-2026"];

export default function FeeInvoicesPage() {
  const { currentBranchId } = useBranch();
  const branchScope = currentBranchId !== "all" ? currentBranchId : undefined;

  const [rows, setRows] = useState<FeeInvoiceItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
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
  const [paying, setPaying] = useState<FeeInvoiceItem | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("Cash");
  const [payReference, setPayReference] = useState("");
  const [paySaving, setPaySaving] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<FeePaymentItem | null>(null);
  const [invoicePayments, setInvoicePayments] = useState<FeePaymentItem[]>([]);
  const [historyFor, setHistoryFor] = useState<FeeInvoiceItem | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [invRes, stRes, discRes, tmplRes] = await Promise.all([
        feesApi.listInvoices({ branchId: branchScope }),
        studentsApi.list({ branchId: branchScope, status: "Active" }),
        feesApi.listDiscounts({ status: "Active", branchId: branchScope }),
        feesApi.getVoucherTemplate(),
      ]);
      setRows(invRes.invoices ?? []);
      setStudents(stRes.students ?? []);
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

  const filtered = useMemo(() => {
    const term = q.toLowerCase().trim();
    return rows
      .filter((r) => {
        if (!term) return true;
        const student = students.find((s) => s.id === r.studentId);
        const hay = [
          r.student,
          r.invoiceNo,
          r.studentCode || "",
          student?.admissionNo || "",
          student?.studentId || "",
        ].join(" ").toLowerCase();
        return hay.includes(term);
      })
      .filter((r) => (cls ? r.cls === cls : true))
      .filter((r) => (status ? r.status === status : true))
      .sort((a, b) => (sortAsc ? a.student.localeCompare(b.student) : b.student.localeCompare(a.student)));
  }, [rows, q, cls, status, sortAsc, students]);

  const pages = Math.max(1, Math.ceil(filtered.length / STEPS));
  const current = Math.min(page, pages);
  const paged = filtered.slice((current - 1) * STEPS, current * STEPS);
  const classOptions = [...new Set(rows.map((i) => i.cls).filter(Boolean))];

  const openCollect = (inv: FeeInvoiceItem) => {
    if (inv.balance <= 0) {
      setError("This invoice is already fully paid.");
      return;
    }
    setPaying(inv);
    setPayAmount(String(inv.balance));
    setPayMethod("Cash");
    setPayReference("");
    setPayError(null);
  };

  const submitPayment = async () => {
    if (!paying) return;
    const amount = Number(payAmount);
    if (!amount || amount <= 0) {
      setPayError("Payment amount must be greater than zero.");
      return;
    }
    if (amount > paying.balance) {
      setPayError(`Amount exceeds outstanding balance (Rs ${paying.balance}).`);
      return;
    }
    setPaySaving(true);
    setPayError(null);
    try {
      const idempotencyKey =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `pay-${paying.id}-${Date.now()}`;
      const res = await feesApi.recordPayment(paying.id, {
        amount,
        method: payMethod,
        reference: payReference || undefined,
        idempotencyKey,
        branchId: branchScope ?? null,
      });
      setRows((p) => p.map((r) => (r.id === paying.id ? res.invoice : r)));
      if (view?.id === paying.id) setView(res.invoice);
      setPaying(null);
      setReceipt(res.payment);
    } catch (err) {
      setPayError(describeApiError(err).message);
    } finally {
      setPaySaving(false);
    }
  };

  const openPaymentHistory = async (inv: FeeInvoiceItem) => {
    setHistoryFor(inv);
    try {
      const res = await feesApi.listInvoicePayments(inv.id);
      setInvoicePayments(res.payments ?? []);
    } catch (err) {
      setError(describeApiError(err).message);
      setInvoicePayments([]);
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
      <PageHeader title="Fee Invoices" subtitle="Track billed, paid and outstanding fee invoices. Collect payments to generate fee receipts."
        actions={
          <>
            <Link href="/fees/receipts" className="hidden items-center gap-2 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3.5 py-2 text-[14px] hover:bg-[var(--theme-hover)] sm:inline-flex">
              <ReceiptText className="h-[18px] w-[18px]" /> Receipts
            </Link>
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
          <SearchBox value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Student, admission, ID or invoice #" className="w-full sm:w-72" />
          <Select value={cls} onChange={(e) => { setCls(e.target.value); setPage(1); }} options={classOptions} placeholder="All Classes" className="w-36" />
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} options={STATUSES} placeholder="All Status" className="w-40" />
          <Btn variant="secondary" Icon={ArrowUpDown} onClick={() => setSortAsc((s) => !s)}>{sortAsc ? "A–Z" : "Z–A"}</Btn>
          <Btn variant="secondary" Icon={Filter} className="hidden lg:inline-flex" onClick={() => setShowFilters((v) => !v)}>
            {showFilters ? "Hide Filters" : "Filters"}
          </Btn>
        </div>
        {showFilters ? (
          <p className="pb-2 text-[12px] text-[var(--theme-text-muted)]">
            Searching name, admission number, student ID and invoice number. Status and class filters apply above.
          </p>
        ) : null}

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
                          <StatusPill label={r.status} />
                        </Td>
                        <Td className="justify-center border-l border-[var(--theme-border)]">
                          <RowMenu items={[
                            { label: "View Voucher", Icon: Eye, onClick: () => setView(r) },
                            ...(r.balance > 0
                              ? [{ label: "Collect Payment", Icon: CreditCard, onClick: () => openCollect(r) }]
                              : []),
                            { label: "Payment History", Icon: ReceiptText, onClick: () => openPaymentHistory(r) },
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
                      <StatusPill label={r.status} />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-[13px]">
                      <Info label="Class" value={`${r.cls}-${r.section}`} />
                      <Info label="Period" value={r.period} />
                      <Info label="Total" value={rs(r.total)} />
                      <Info label="Balance" value={rs(r.balance)} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Btn size="sm" variant="secondary" Icon={Eye} onClick={() => setView(r)}>Voucher</Btn>
                      {r.balance > 0 ? (
                        <Btn size="sm" variant="primary" Icon={CreditCard} onClick={() => openCollect(r)}>Collect</Btn>
                      ) : null}
                      <Btn size="sm" variant="secondary" Icon={ReceiptText} onClick={() => openPaymentHistory(r)}>History</Btn>
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
            <Btn variant="primary" Icon={Printer} onClick={() => window.print()}>Print Voucher</Btn>
            {view && view.balance > 0 ? (
              <Btn variant="primary" Icon={CreditCard} onClick={() => { setView(null); openCollect(view); }}>
                Collect Payment
              </Btn>
            ) : null}
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

      <Modal
        open={!!paying}
        onClose={() => !paySaving && setPaying(null)}
        title="Collect Fee Payment"
        subtitle={paying ? `${paying.student} · ${paying.invoiceNo}` : undefined}
        footer={
          <>
            <Btn variant="secondary" onClick={() => setPaying(null)} disabled={paySaving}>Cancel</Btn>
            <Btn variant="primary" loading={paySaving} loadingLabel="Recording…" onClick={submitPayment}>
              Confirm Payment
            </Btn>
          </>
        }
      >
        {payError ? <p className="mb-3 text-[13px] text-[var(--theme-danger)]">{payError}</p> : null}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-[13px]">
            <div className="rounded border border-[var(--theme-border)] p-2.5">
              <span className="text-[11px] text-[var(--theme-text-muted)]">Outstanding</span>
              <p className="font-bold text-[var(--theme-danger-text)]">{rs(paying?.balance || 0)}</p>
            </div>
            <div className="rounded border border-[var(--theme-border)] p-2.5">
              <span className="text-[11px] text-[var(--theme-text-muted)]">Already Paid</span>
              <p className="font-semibold">{rs(paying?.paid || 0)}</p>
            </div>
          </div>
          <Field label="Amount to Collect (Rs)">
            <input
              type="number"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              className="h-10 w-full rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 text-[14px]"
            />
          </Field>
          <Field label="Payment Method">
            <Select options={["Cash", "Bank", "Cheque", "Online"]} value={payMethod} onChange={(e) => setPayMethod(e.target.value)} />
          </Field>
          <Field label="Reference / Transaction No (optional)">
            <input
              value={payReference}
              onChange={(e) => setPayReference(e.target.value)}
              className="h-10 w-full rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 text-[14px]"
              placeholder="Cheque / online txn ref"
            />
          </Field>
          <p className="text-[12px] text-[var(--theme-text-muted)]">
            Payment is saved on the server first. A fee receipt is shown only after the backend confirms success.
          </p>
        </div>
      </Modal>

      <Modal
        open={!!historyFor}
        onClose={() => setHistoryFor(null)}
        title="Payment History"
        subtitle={historyFor ? `${historyFor.invoiceNo} · ${historyFor.student}` : undefined}
        width="max-w-2xl"
        footer={<Btn variant="secondary" onClick={() => setHistoryFor(null)}>Close</Btn>}
      >
        {invoicePayments.length === 0 ? (
          <EmptyState Icon={ReceiptText} title="No payments yet" message="Collect a payment to generate a receipt for this invoice." />
        ) : (
          <div className="space-y-2">
            {invoicePayments.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--theme-border)] px-3 py-2">
                <div className="min-w-0">
                  <p className="font-mono text-[13px] font-semibold">{p.receiptNo}</p>
                  <p className="text-[12px] text-[var(--theme-text-muted)]">
                    {new Date(p.paidAt).toLocaleString()} · {p.method} · {p.status}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[var(--theme-success-text)]">{rs(p.amount)}</span>
                  <Btn size="sm" variant="secondary" Icon={Printer} onClick={() => { setHistoryFor(null); setReceipt(p); }}>
                    Reprint
                  </Btn>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <FeeReceiptPreviewModal
        open={!!receipt}
        receipt={receipt}
        onClose={() => setReceipt(null)}
        title="Payment Successful — Fee Receipt"
      />

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

function CreateInvoice({ open, onClose, onCreated, students, discounts, branchId }: {
  open: boolean;
  onClose: () => void;
  onCreated: (inv: FeeInvoiceItem) => void | Promise<void>;
  students: StudentItem[];
  discounts: DiscountTypeItem[];
  branchId?: string;
}) {
  const [studentId, setStudentId] = useState("");
  const [session, setSession] = useState("2025-2026");
  const [period, setPeriod] = useState(() => new Date().toLocaleString("en-US", { month: "short", year: "numeric" }));
  const [issue, setIssue] = useState(new Date().toISOString().slice(0, 10));
  const [due, setDue] = useState(new Date().toISOString().slice(0, 10));
  const [structure, setStructure] = useState<FeeStructureItem[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [structureLoading, setStructureLoading] = useState(false);
  const [discountTypeId, setDiscountTypeId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wasOpen, setWasOpen] = useState(open);

  const selected = students.find((s) => s.id === studentId) || null;

  if (wasOpen !== open) {
    setWasOpen(open);
    if (open) {
      setStudentId("");
      setSession("2025-2026");
      setPeriod(new Date().toLocaleString("en-US", { month: "short", year: "numeric" }));
      setStructure([]);
      setPicked([]);
      setDiscountTypeId("");
      setError(null);
    }
  }

  useEffect(() => {
    if (!open || !selected) {
      setStructure([]);
      setPicked([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setStructureLoading(true);
      setError(null);
      try {
        const res = await feesApi.listStructure({
          session,
          cls: selected.cls,
          section: selected.section,
          branchId,
        });
        if (cancelled) return;
        let lines = res.structure ?? [];
        // If this section has no lines yet, fall back to any structure for the class.
        if (lines.length === 0) {
          const all = await feesApi.listStructure({ session, cls: selected.cls, branchId });
          if (cancelled) return;
          const byParticular = new Map<string, FeeStructureItem>();
          for (const row of all.structure ?? []) {
            const key = row.particularId || row.particular;
            if (!byParticular.has(key)) byParticular.set(key, row);
          }
          lines = [...byParticular.values()];
        }
        setStructure(lines);
        setPicked(lines.map((l) => l.id));
      } catch (err) {
        if (!cancelled) {
          setError(describeApiError(err).message);
          setStructure([]);
          setPicked([]);
        }
      } finally {
        if (!cancelled) setStructureLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, studentId, session, branchId, selected]);

  const lines = structure.filter((l) => picked.includes(l.id));
  const total = lines.reduce((a, l) => a + l.amount, 0);
  const disc = discounts.find((d) => d.id === discountTypeId);
  const discountAmount = disc
    ? disc.basis === "Percentage"
      ? Math.round((total * disc.value) / 100)
      : disc.value
    : 0;

  const create = async () => {
    if (!studentId || lines.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const res = await feesApi.createInvoice({
        studentId,
        period,
        issue,
        due,
        session,
        useStructure: true,
        lines: lines.map((l) => ({
          particularId: l.particularId ?? null,
          particular: l.particular,
          amount: l.amount,
          frequency: l.frequency,
        })),
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
    <Modal open={open} onClose={onClose} width="max-w-xl" title="Create Fee Invoice" subtitle="Fees come from the class fee structure"
      footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" loading={saving} disabled={!studentId || lines.length === 0 || total === 0} onClick={create}>Create Invoice</Btn></>}>
      <div className="space-y-4">
        {error ? <p className="text-[13px] text-[var(--theme-danger)]">{error}</p> : null}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Student" className="sm:col-span-2">
            <Select
              options={students.map((s) => `${s.name} (${s.cls}-${s.section})`)}
              value={selected ? `${selected.name} (${selected.cls}-${selected.section})` : ""}
              onChange={(e) => {
                const label = e.target.value;
                const st = students.find((s) => `${s.name} (${s.cls}-${s.section})` === label);
                setStudentId(st?.id || "");
                if (st?.session && SESSIONS.includes(st.session)) setSession(st.session);
              }}
              placeholder={students.length ? "Select student" : "No students found"}
            />
          </Field>
          <Field label="Session">
            <Select options={SESSIONS} value={session} onChange={(e) => setSession(e.target.value)} />
          </Field>
          <Field label="Billing Period"><input value={period} onChange={(e) => setPeriod(e.target.value)} className="h-10 w-full rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 text-[14px]" /></Field>
          <Field label="Due Date"><input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="h-10 w-full rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 text-[14px]" /></Field>
          <Field label="Issue Date"><input type="date" value={issue} onChange={(e) => setIssue(e.target.value)} className="h-10 w-full rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 text-[14px]" /></Field>
          <Field label="Discount Type" className="sm:col-span-2">
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
          <p className="mb-2 text-[13px] font-medium">
            Fee structure{selected ? ` · ${selected.cls}-${selected.section}` : ""}
          </p>
          <div className="space-y-1.5 rounded-lg border border-[var(--theme-border)] p-3">
            {!selected ? (
              <p className="text-[13px] text-[var(--theme-text-muted)]">Select a student to load class fees.</p>
            ) : structureLoading ? (
              <p className="text-[13px] text-[var(--theme-text-muted)]">Loading fee structure…</p>
            ) : structure.length === 0 ? (
              <p className="text-[13px] text-[var(--theme-text-muted)]">
                No fee structure for {selected.cls}-{selected.section} ({session}). Add lines under Fee Structure first.
              </p>
            ) : structure.map((l) => (
              <label key={l.id} className="flex items-center gap-2.5 text-[14px]">
                <input type="checkbox" checked={picked.includes(l.id)} className="h-4 w-4 accent-[var(--theme-primary)]"
                  onChange={(e) => setPicked((prev) => (e.target.checked ? [...prev, l.id] : prev.filter((x) => x !== l.id)))} />
                <span className="flex-1">{l.particular}</span>
                <span className="text-[12px] text-[var(--theme-text-faint)]">{l.frequency}</span>
                <span className="text-[var(--theme-text-muted)]">{rs(l.amount)}</span>
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

