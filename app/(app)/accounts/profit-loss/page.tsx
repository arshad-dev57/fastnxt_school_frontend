"use client";

import { useCallback, useEffect, useState } from "react";
import { TrendingUp, RefreshCw } from "lucide-react";
import { Badge, Btn, rs } from "@/components/ui";
import { RC, ReportCard, ReportPage, ReportTable, RRow, RSection, RTotal, money } from "@/components/report";
import { TablePageSkeleton } from "@/components/skeleton";
import { accountsApi, describeApiError, type ProfitLossResponse } from "@/lib/auth/api-client";
import { useBranch } from "@/lib/branch-context";

export default function ProfitLossPage() {
  const { currentBranchId } = useBranch();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState<ProfitLossResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfitLoss = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const branchScope = currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined;
      const res = await accountsApi.getProfitLoss({
        from: from || undefined,
        to: to || undefined,
        branchId: branchScope,
      });
      setData(res);
    } catch (e: unknown) {
      setError(describeApiError(e).message || "Failed to load profit and loss statement.");
    } finally {
      setLoading(false);
    }
  }, [from, to, currentBranchId]);

  useEffect(() => {
    void fetchProfitLoss();
  }, [fetchProfitLoss]);

  const income = data?.income || [];
  const expenses = data?.expenses || [];
  const incomeTotal = data?.totalIncome || 0;
  const expenseTotal = data?.totalExpenses || 0;
  const net = data?.net || 0;
  const periodLabel = `${from ? `From ${from}` : "Inception"} — ${to ? `To ${to}` : "Present"}`;

  return (
    <ReportPage
      title="Profit & Loss"
      subtitle="Income, expenses and the school's net financial surplus for the period."
      printSubtitle={periodLabel}
      Icon={TrendingUp}
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

          <Btn
            variant="secondary"
            Icon={RefreshCw}
            onClick={() => void fetchProfitLoss()}
            loading={loading}
            loadingLabel="Recomputing…"
            className="self-end"
          >
            Recompute
          </Btn>
        </>
      }
    >
      {error && (
        <div className="mb-4 rounded-lg border border-[var(--theme-danger)] bg-[var(--theme-danger-soft)] p-3 text-[14px] text-[var(--theme-danger-text)]">
          {error}
        </div>
      )}

      {loading && !data ? (
        <TablePageSkeleton rows={9} cols={2} />
      ) : (
        <div className={loading ? "pointer-events-none opacity-60" : undefined}>
          <ReportCard
            title="Statement of Profit & Loss"
            subtitle={periodLabel}
            right={
              <Badge
                label={net >= 0 ? `Net Surplus: ${rs(net)}` : `Net Deficit: ${rs(Math.abs(net))}`}
                tone={net >= 0 ? "green" : "red"}
              />
            }
          >
            <ReportTable minWidth={460} columns={[{ label: "Account Description" }, { label: "Amount", align: "right" }]}>
              <RSection label="Income" colSpan={2} />
              {income.length === 0 ? (
                <RRow>
                  <RC muted colSpan={2} className="text-center py-3">No income posted for this period.</RC>
                </RRow>
              ) : (
                income.map((r) => (
                  <RRow key={r.name}>
                    <RC>{r.name}</RC>
                    <RC align="right" className="tabular-nums font-medium">{money(r.amount)}</RC>
                  </RRow>
                ))
              )}
              <RRow className="font-semibold bg-[var(--theme-surface)]">
                <RC>Total Income</RC>
                <RC align="right" className="text-[var(--theme-success-text)] tabular-nums">{rs(incomeTotal)}</RC>
              </RRow>

              <RSection label="Operating Expenses" colSpan={2} />
              {expenses.length === 0 ? (
                <RRow>
                  <RC muted colSpan={2} className="text-center py-3">No expenses posted for this period.</RC>
                </RRow>
              ) : (
                expenses.map((r) => (
                  <RRow key={r.name}>
                    <RC>{r.name}</RC>
                    <RC align="right" className="tabular-nums font-medium">{money(r.amount)}</RC>
                  </RRow>
                ))
              )}
              <RRow className="font-semibold bg-[var(--theme-surface)]">
                <RC>Total Expenses</RC>
                <RC align="right" className="text-[var(--theme-danger-text)] tabular-nums">{rs(expenseTotal)}</RC>
              </RRow>

              <RTotal>
                <RC>Net Surplus / (Deficit)</RC>
                <RC
                  align="right"
                  className={net >= 0 ? "text-[var(--theme-success-text)] font-bold text-[16px]" : "text-[var(--theme-danger-text)] font-bold text-[16px]"}
                >
                  {rs(net)}
                </RC>
              </RTotal>
            </ReportTable>
          </ReportCard>
        </div>
      )}
    </ReportPage>
  );
}
