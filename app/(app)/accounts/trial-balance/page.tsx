"use client";

import { useEffect, useState } from "react";
import { Scale, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui";
import { RC, ReportCard, ReportPage, ReportTable, RRow, RTotal, money } from "@/components/report";
import { TablePageSkeleton } from "@/components/skeleton";
import { accountsApi, type TrialBalanceResponse } from "@/lib/auth/api-client";
import { useBranch } from "@/lib/branch-context";

export default function TrialBalancePage() {
  const { currentBranchId } = useBranch();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState<TrialBalanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrialBalance = async () => {
    setLoading(true);
    setError(null);
    try {
      const branchScope = currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined;
      const res = await accountsApi.getTrialBalance({
        from: from || undefined,
        to: to || undefined,
        branchId: branchScope,
      });
      setData(res);
    } catch (e: any) {
      setError(e?.message || "Failed to load trial balance.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrialBalance();
  }, [from, to, currentBranchId]);

  const rows = data?.rows || [];
  const totalDebit = data?.totalDebit || 0;
  const totalCredit = data?.totalCredit || 0;
  const diff = data?.difference || totalDebit - totalCredit;
  const balanced = data?.balanced ?? diff === 0;

  return (
    <ReportPage
      title="Trial Balance"
      subtitle="Debit and credit balance verification for all ledger accounts."
      Icon={Scale}
      filters={
        <>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-[var(--theme-text-muted)]">From Date</span>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="h-9 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-2.5 text-[13px] outline-none focus:border-[var(--theme-primary)]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-[var(--theme-text-muted)]">To Date</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-9 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-2.5 text-[13px] outline-none focus:border-[var(--theme-primary)]"
            />
          </div>

          <button
            type="button"
            onClick={fetchTrialBalance}
            className="inline-flex h-9 self-end items-center gap-1.5 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-3 text-[13px] hover:bg-[var(--theme-hover)]"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Recompute
          </button>
        </>
      }
    >
      {error && (
        <div className="mb-4 rounded-lg border border-[var(--theme-danger)] bg-[var(--theme-danger-soft)] p-3 text-[14px] text-[var(--theme-danger-text)]">
          {error}
        </div>
      )}

      {loading && !data ? (
        <TablePageSkeleton rows={9} cols={4} />
      ) : (
        <ReportCard
          title="Trial Balance Report"
          subtitle={`${from ? `From ${from}` : "Inception"} — ${to ? `To ${to}` : "Current"}`}
          right={
            <Badge
              label={balanced ? "Balanced (Double-entry OK)" : `Difference: ${money(diff)}`}
              tone={balanced ? "green" : "red"}
            />
          }
        >
          <ReportTable
            columns={[
              { label: "Account Code" },
              { label: "Account Name" },
              { label: "Type" },
              { label: "Debit", align: "right" },
              { label: "Credit", align: "right" },
            ]}
          >
            {rows.length === 0 ? (
              <RRow>
                <RC colSpan={5} className="text-center text-[var(--theme-text-muted)] py-6">
                  No accounts or movements found.
                </RC>
              </RRow>
            ) : (
              rows.map((r) => (
                <RRow key={r.code}>
                  <RC muted className="font-mono">{r.code}</RC>
                  <RC className="font-medium">{r.name}</RC>
                  <RC muted>{r.type}</RC>
                  <RC align="right" className="tabular-nums">
                    {r.debit > 0 ? money(r.debit) : "—"}
                  </RC>
                  <RC align="right" className="tabular-nums">
                    {r.credit > 0 ? money(r.credit) : "—"}
                  </RC>
                </RRow>
              ))
            )}

            <RTotal>
              <RC>—</RC>
              <RC>Total</RC>
              <RC>—</RC>
              <RC align="right" className="font-bold tabular-nums">{money(totalDebit)}</RC>
              <RC align="right" className="font-bold tabular-nums">{money(totalCredit)}</RC>
            </RTotal>
          </ReportTable>
        </ReportCard>
      )}
    </ReportPage>
  );
}
