"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, Printer, RefreshCw, Wallet } from "lucide-react";
import { Btn, Card, EmptyState, PageHeader, rs } from "@/components/ui";
import { FeeReceiptPreviewModal } from "@/components/fees/fee-receipt-actions";
import { useMyStudent } from "@/lib/hooks/use-my-student";
import { describeApiError, feesApi, type FeePaymentItem } from "@/lib/auth/api-client";

function formatPaidAt(iso: string) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function StudentFeesPage() {
  const { student, loading: studentLoading, error: studentError } = useMyStudent();
  const [payments, setPayments] = useState<FeePaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<FeePaymentItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await feesApi.listMyPayments({ page: 1, pageSize: 50 });
      setPayments(res.payments ?? []);
    } catch (err) {
      setError(describeApiError(err).message);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (student?.id) load();
    else if (!studentLoading) setLoading(false);
  }, [student?.id, studentLoading, load]);

  const openReceipt = async (row: FeePaymentItem) => {
    try {
      const res = await feesApi.getReceipt(row.id);
      setView(res.receipt);
    } catch (err) {
      setError(describeApiError(err).message);
    }
  };

  if (studentLoading && !student) {
    return <p className="px-4 py-16 text-center text-[14px] text-[var(--theme-text-muted)]">Loading…</p>;
  }

  if (studentError && !student) {
    return (
      <div className="px-4 py-16 text-center sm:px-6">
        <p className="text-[15px] font-medium text-[var(--theme-danger)]">{studentError}</p>
        <p className="mt-2 text-[13px] text-[var(--theme-text-muted)]">
          Ask the office to link your login email to a student record.
        </p>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="My Fee Receipts"
        subtitle={
          student
            ? `${student.name} · ${student.cls}-${student.section} — saved payment receipts from the school office`
            : "Saved payment receipts"
        }
        actions={<Btn variant="secondary" Icon={RefreshCw} onClick={() => load()}>Refresh</Btn>}
      />

      <div className="space-y-3 px-4 pb-24 sm:px-6">
        {error ? <p className="text-[13px] text-[var(--theme-danger)]">{error}</p> : null}

        {loading ? (
          <p className="py-8 text-center text-[13px] text-[var(--theme-text-muted)]">Loading receipts…</p>
        ) : payments.length === 0 ? (
          <EmptyState
            Icon={Wallet}
            title="No fee receipts yet"
            message="When the accounts office records a fee payment for you, the receipt will appear here."
          />
        ) : (
          payments.map((p) => (
            <Card key={p.id} className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-[13px] font-semibold">{p.receiptNo}</p>
                <p className="text-[13px] text-[var(--theme-text-muted)]">
                  {p.invoiceNo} · {p.period} · {formatPaidAt(p.paidAt)}
                </p>
                <p className="text-[12px] text-[var(--theme-text-faint)]">
                  {p.method} · {p.status}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[var(--theme-success-text)]">{rs(p.amount)}</span>
                <Btn size="sm" variant="secondary" Icon={Eye} onClick={() => openReceipt(p)}>View</Btn>
                <Btn size="sm" variant="primary" Icon={Printer} onClick={() => openReceipt(p)}>Print</Btn>
              </div>
            </Card>
          ))
        )}
      </div>

      <FeeReceiptPreviewModal
        open={!!view}
        receipt={view}
        onClose={() => setView(null)}
        title="Fee Receipt"
        allowDuplicate={false}
      />
    </>
  );
}
