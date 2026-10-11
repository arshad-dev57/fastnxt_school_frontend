"use client";

import { useEffect, useState } from "react";
import { Building2, RefreshCw } from "lucide-react";
import { Badge, rs } from "@/components/ui";
import { RC, ReportCard, ReportPage, ReportTable, RRow, RSection, RTotal, money } from "@/components/report";
import { TablePageSkeleton } from "@/components/skeleton";
import { accountsApi, type BalanceSheetResponse } from "@/lib/auth/api-client";
import { useBranch } from "@/lib/branch-context";

export default function BalanceSheetPage() {
  const { currentBranchId } = useBranch();
  const [asOf, setAsOf] = useState(new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<BalanceSheetResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalanceSheet = async () => {
    setLoading(true);
    setError(null);
    try {
      const branchScope = currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined;
      const res = await accountsApi.getBalanceSheet({ asOf: asOf || undefined, branchId: branchScope });
      setData(res);
    } catch (e: any) {
      setError(e?.message || "Failed to load balance sheet.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalanceSheet();
  }, [asOf, currentBranchId]);

  const assets = data?.assets || [];
  const liabilities = data?.liabilities || [];
  const equity = data?.equity || [];
  const totalAssets = data?.totalAssets || 0;
  const totalLiabilities = data?.totalLiabilities || 0;
  const totalEquity = data?.totalEquity || 0;
  const balanced = data?.balanced ?? totalAssets === totalLiabilities + totalEquity;

  return (
    <ReportPage
      title="Balance Sheet"
      subtitle="Assets, liabilities and school fund as at the selected cutoff date."
      Icon={Building2}
      filters={
        <>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-[var(--theme-text-muted)]">As at Date</span>
            <input
              type="date"
              value={asOf}
              onChange={(e) => setAsOf(e.target.value)}
              className="h-9 rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-2.5 text-[13px] outline-none focus:border-[var(--theme-primary)]"
            />
          </div>

          <button
            type="button"
            onClick={fetchBalanceSheet}
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
        <TablePageSkeleton rows={9} cols={2} />
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <ReportCard
            title="Assets"
            subtitle={`As at ${asOf || "Today"}`}
            right={<Badge label={`Total Assets: ${rs(totalAssets)}`} tone="blue" />}
          >
            <ReportTable minWidth={360} columns={[{ label: "Account" }, { label: "Amount", align: "right" }]}>
              <RSection label="Asset Accounts" colSpan={2} />
              {assets.length === 0 ? (
                <RRow>
                  <RC muted colSpan={2} className="text-center py-3">No active assets with non-zero balances.</RC>
                </RRow>
              ) : (
                assets.map((r) => (
                  <RRow key={r.name}>
                    <RC>{r.name}</RC>
                    <RC align="right" className="tabular-nums font-medium">{money(r.amount)}</RC>
                  </RRow>
                ))
              )}
              <RTotal>
                <RC>Total Assets</RC>
                <RC align="right" className="font-bold text-[var(--theme-primary)]">{rs(totalAssets)}</RC>
              </RTotal>
            </ReportTable>
          </ReportCard>

          <ReportCard
            title="Liabilities & School Fund"
            subtitle={`As at ${asOf || "Today"}`}
            right={
              <Badge
                label={balanced ? "Ties Out (A = L + E)" : `Variance: ${money(totalAssets - (totalLiabilities + totalEquity))}`}
                tone={balanced ? "green" : "red"}
              />
            }
          >
            <ReportTable minWidth={360} columns={[{ label: "Account" }, { label: "Amount", align: "right" }]}>
              <RSection label="Liabilities" colSpan={2} />
              {liabilities.length === 0 ? (
                <RRow>
                  <RC muted colSpan={2} className="text-center py-2">No liabilities outstanding.</RC>
                </RRow>
              ) : (
                liabilities.map((r) => (
                  <RRow key={r.name}>
                    <RC>{r.name}</RC>
                    <RC align="right" className="tabular-nums font-medium">{money(r.amount)}</RC>
                  </RRow>
                ))
              )}
              <RRow className="font-semibold bg-[var(--theme-surface)]">
                <RC>Total Liabilities</RC>
                <RC align="right" className="tabular-nums">{rs(totalLiabilities)}</RC>
              </RRow>

              <RSection label="Equity / School Fund" colSpan={2} />
              {equity.length === 0 ? (
                <RRow>
                  <RC muted colSpan={2} className="text-center py-2">No equity accounts recorded.</RC>
                </RRow>
              ) : (
                equity.map((r) => (
                  <RRow key={r.name}>
                    <RC>{r.name}</RC>
                    <RC align="right" className="tabular-nums font-medium">{money(r.amount)}</RC>
                  </RRow>
                ))
              )}
              <RRow className="font-semibold bg-[var(--theme-surface)]">
                <RC>Total Equity</RC>
                <RC align="right" className="tabular-nums">{rs(totalEquity)}</RC>
              </RRow>

              <RTotal>
                <RC>Total Liabilities + Equity</RC>
                <RC align="right" className="font-bold text-[var(--theme-primary)]">
                  {rs(totalLiabilities + totalEquity)}
                </RC>
              </RTotal>
            </ReportTable>
          </ReportCard>
        </div>
      )}
    </ReportPage>
  );
}
