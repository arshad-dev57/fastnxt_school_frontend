"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Printer, RefreshCw, Search, FileText } from "lucide-react";
import {
  Btn, Card, EmptyState, PageHeader, Pagination, RowMenu,
  SearchBox, Select, Th, Td, cn, rs,
} from "@/components/ui";
import { BranchScopeBar } from "@/components/branch/branch-ui";
import { useBranch } from "@/lib/branch-context";
import { FeeReceiptPreviewModal } from "@/components/fees/fee-receipt-actions";
import {
  describeApiError,
  feesApi,
  type FeePaymentItem,
} from "@/lib/auth/api-client";

const COLS = "grid-cols-[130px_minmax(140px,1.2fr)_100px_110px_100px_100px_90px_100px_110px_64px]";
const METHODS = ["Cash", "Bank", "Cheque", "Online"];
const STATUSES = ["PAID", "PARTIAL PAYMENT"];
const PAGE_SIZE = 20;

function formatPaidAt(iso: string) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

export default function FeeReceiptsPage() {
  const { currentBranchId } = useBranch();
  const branchScope = currentBranchId !== "all" ? currentBranchId : undefined;

  const [rows, setRows] = useState<FeePaymentItem[]>([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("q") || "";
  });
  const [method, setMethod] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [view, setView] = useState<FeePaymentItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await feesApi.listPayments({
        q: q || undefined,
        method: method || undefined,
        status: status || undefined,
        from: from || undefined,
        to: to || undefined,
        branchId: branchScope,
        page,
        pageSize: PAGE_SIZE,
      });
      setRows(res.payments ?? []);
      setMeta(res.meta ?? { page, pageSize: PAGE_SIZE, total: 0, totalPages: 1 });
    } catch (err) {
      setError(describeApiError(err).message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [q, method, status, from, to, branchScope, page]);

  useEffect(() => {
    const t = setTimeout(() => { load(); }, 250);
    return () => clearTimeout(t);
  }, [load]);

  const openReceipt = async (row: FeePaymentItem, duplicate = false) => {
    try {
      if (duplicate) {
        const res = await feesApi.reprintReceipt(row.id);
        setView(res.receipt);
      } else {
        const res = await feesApi.getReceipt(row.id);
        setView(res.receipt);
      }
    } catch (err) {
      setError(describeApiError(err).message);
    }
  };

  return (
    <>
      <PageHeader
        title="Fee Receipts"
        subtitle="Search payment history and reprint original or duplicate receipts from saved payment records."
        actions={
          <>
            <Link
              href="/fees/invoices"
              className="hidden items-center gap-2 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3.5 py-2 text-[14px] hover:bg-[var(--theme-hover)] sm:inline-flex"
            >
              <FileText className="h-[18px] w-[18px]" /> Invoices
            </Link>
            <Btn variant="secondary" Icon={RefreshCw} onClick={() => load()}>Refresh</Btn>
          </>
        }
      />

      <div className="flex min-h-0 flex-1 flex-col px-4 pb-24 sm:px-6">
        {error ? <p className="my-2 text-[13px] text-[var(--theme-danger)]">{error}</p> : null}

        <div className="flex shrink-0 flex-wrap items-center gap-2 pb-3">
          <SearchBox
            value={q}
            onChange={(v) => { setQ(v); setPage(1); }}
            placeholder="Name, admission, student ID, receipt or invoice #"
            className="w-full sm:w-80"
          />
          <Select value={method} onChange={(e) => { setMethod(e.target.value); setPage(1); }} options={METHODS} placeholder="All Methods" className="w-36" />
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} options={STATUSES} placeholder="All Status" className="w-44" />
          <input
            type="date"
            value={from}
            onChange={(e) => { setFrom(e.target.value); setPage(1); }}
            className="h-10 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-2 text-[13px]"
            title="From date"
          />
          <input
            type="date"
            value={to}
            onChange={(e) => { setTo(e.target.value); setPage(1); }}
            className="h-10 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-2 text-[13px]"
            title="To date"
          />
          <Btn variant="secondary" Icon={Search} onClick={() => load()}>Search</Btn>
        </div>

        <div className="shrink-0"><BranchScopeBar count={meta.total} noun="receipts" /></div>

        <Card pad={false} className="mt-2 flex min-h-0 flex-1 flex-col overflow-hidden">
          {loading ? (
            <p className="px-4 py-8 text-center text-[13px] text-[var(--theme-text-muted)]">Loading…</p>
          ) : (
            <>
              <div className="hidden min-h-0 flex-1 md:block">
                <div className="h-[min(62vh,640px)] overflow-auto overscroll-contain">
                  <div className="min-w-[1100px]">
                    <div className={cn("sticky top-0 z-10 grid", COLS, "border-b border-[var(--theme-border)] bg-[var(--theme-surface)] shadow-sm")}>
                      <Th className="border-l border-[var(--theme-border)]">Receipt No</Th>
                      <Th className="border-l border-[var(--theme-border)]">Student</Th>
                      <Th className="border-l border-[var(--theme-border)]">Class</Th>
                      <Th className="border-l border-[var(--theme-border)]">Invoice</Th>
                      <Th className="border-l border-[var(--theme-border)]">Date</Th>
                      <Th className="border-l border-[var(--theme-border)]">Amount</Th>
                      <Th className="border-l border-[var(--theme-border)]">Method</Th>
                      <Th className="border-l border-[var(--theme-border)]">Status</Th>
                      <Th className="border-l border-[var(--theme-border)]">Cashier</Th>
                      <Th className="border-l border-[var(--theme-border)]"><span className="sr-only">Actions</span></Th>
                    </div>
                    {rows.map((r) => (
                      <div key={r.id} className={cn("grid", COLS, "border-b border-[var(--theme-border)] bg-[var(--theme-surface)] text-[13.5px] last:border-b-0 hover:bg-[var(--theme-hover)]")}>
                        <Td className="border-l border-[var(--theme-border)] font-mono text-[12.5px]">{r.receiptNo}</Td>
                        <Td className="border-l border-[var(--theme-border)] font-medium">
                          <span className="truncate">{r.studentName}</span>
                          {(r.admissionNo || r.studentCode) ? (
                            <span className="block truncate text-[11px] text-[var(--theme-text-faint)]">
                              {[r.admissionNo, r.studentCode].filter(Boolean).join(" · ")}
                            </span>
                          ) : null}
                        </Td>
                        <Td className="border-l border-[var(--theme-border)]">{r.cls}-{r.section}</Td>
                        <Td className="border-l border-[var(--theme-border)] font-mono text-[12px] text-[var(--theme-text-muted)]">{r.invoiceNo}</Td>
                        <Td className="border-l border-[var(--theme-border)] text-[var(--theme-text-muted)]">{formatPaidAt(r.paidAt)}</Td>
                        <Td className="border-l border-[var(--theme-border)] font-medium text-[var(--theme-success-text)]">{rs(r.amount)}</Td>
                        <Td className="border-l border-[var(--theme-border)]">{r.method}</Td>
                        <Td className="border-l border-[var(--theme-border)] text-[12px] font-semibold">{r.status}</Td>
                        <Td className="border-l border-[var(--theme-border)] text-[var(--theme-text-muted)]">{r.cashierName || "—"}</Td>
                        <Td className="justify-center border-l border-[var(--theme-border)]">
                          <RowMenu items={[
                            { label: "View / Print", Icon: Eye, onClick: () => openReceipt(r, false) },
                            { label: "Duplicate Copy", Icon: Printer, onClick: () => openReceipt(r, true) },
                          ]} />
                        </Td>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="max-h-[min(62vh,640px)] space-y-3 overflow-auto p-3 md:hidden">
                {rows.map((r) => (
                  <div key={r.id} className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-3 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{r.studentName}</p>
                        <p className="font-mono text-[12px] text-[var(--theme-text-faint)]">{r.receiptNo}</p>
                      </div>
                      <p className="font-semibold text-[var(--theme-success-text)]">{rs(r.amount)}</p>
                    </div>
                    <p className="mt-1 text-[12px] text-[var(--theme-text-muted)]">
                      {r.invoiceNo} · {formatPaidAt(r.paidAt)} · {r.method}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Btn size="sm" variant="secondary" Icon={Eye} onClick={() => openReceipt(r, false)}>View</Btn>
                      <Btn size="sm" variant="primary" Icon={Printer} onClick={() => openReceipt(r, true)}>Duplicate</Btn>
                    </div>
                  </div>
                ))}
              </div>

              {rows.length === 0 && (
                <EmptyState
                  Icon={FileText}
                  title="No fee receipts found"
                  message="Collect a fee payment to generate a receipt, or adjust your search filters."
                />
              )}
              <div className="shrink-0 border-t border-[var(--theme-border)]">
                <Pagination page={meta.page} pages={meta.totalPages} onPage={setPage} total={meta.total} />
              </div>
            </>
          )}
        </Card>
      </div>

      <FeeReceiptPreviewModal open={!!view} receipt={view} onClose={() => setView(null)} />
    </>
  );
}
