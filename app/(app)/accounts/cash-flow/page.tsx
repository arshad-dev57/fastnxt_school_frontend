"use client";

import { Fragment, useEffect, useState } from "react";
import { Activity, RefreshCw } from "lucide-react";
import { rs } from "@/components/ui";
import { RC, ReportCard, ReportPage, ReportTable, RRow, RSection, RTotal, moneySigned } from "@/components/report";
import { TablePageSkeleton } from "@/components/skeleton";
import { accountsApi, type CashFlowResponse } from "@/lib/auth/api-client";
import { useBranch } from "@/lib/branch-context";

export default function CashFlowPage() {
  const { currentBranchId } = useBranch();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState<CashFlowResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCashFlow = async () => {
    setLoading(true);
    setError(null);
    try {
      const branchScope = currentBranchId && currentBranchId !== "all" ? currentBranchId : undefined;
      const res = await accountsApi.getCashFlow({
        from: from || undefined,
        to: to || undefined,
        branchId: branchScope,
      });
      setData(res);
    } catch (e: any) {
      setError(e?.message || "Failed to load cash flow statement.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCashFlow();
  }, [from, to, currentBranchId]);

  const opening = data?.opening || 0;
  const sections = data?.sections || [];
  const netTotal = data?.netTotal || 0;
  const closing = data?.closing ?? opening + netTotal;

  return (
    <ReportPage
      title="Cash Flow"
      subtitle="Operating, investing and financing cash movements derived from ledger."
      Icon={Activity}
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
            onClick={fetchCashFlow}
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
        <ReportCard
          title="Cash Flow Statement"
          subtitle={`${from ? `From ${from}` : "Inception"} — ${to ? `To ${to}` : "Present"}`}
        >
          <ReportTable minWidth={480} columns={[{ label: "Activity / Movement" }, { label: "Net Amount", align: "right" }]}>
            <RRow>
              <RC muted className="font-medium">Opening Cash & Bank</RC>
              <RC align="right" muted className="font-semibold">{rs(opening)}</RC>
            </RRow>

            {sections.map((s) => (
              <Fragment key={s.title}>
                <RSection label={s.title} colSpan={2} />
                {s.lines.length === 0 ? (
                  <RRow>
                    <RC muted colSpan={2} className="text-center py-2 text-[12px]">
                      No movement in {s.title.toLowerCase()} for this period.
                    </RC>
                  </RRow>
                ) : (
                  s.lines.map((l) => (
                    <RRow key={l.name}>
                      <RC>{l.name}</RC>
                      <RC align="right" danger={l.amount < 0} className="tabular-nums">
                        {moneySigned(l.amount)}
                      </RC>
                    </RRow>
                  ))
                )}
                <RRow className="font-semibold bg-[var(--theme-surface)]">
                  <RC>Net {s.title.replace(" Activities", "")}</RC>
                  <RC align="right" danger={s.net < 0} className="tabular-nums">
                    {moneySigned(s.net)}
                  </RC>
                </RRow>
              </Fragment>
            ))}

            <RTotal>
              <RC>Net Cash Flow (Period Movement)</RC>
              <RC align="right" danger={netTotal < 0} className="tabular-nums font-bold">
                {moneySigned(netTotal)}
              </RC>
            </RTotal>

            <RTotal>
              <RC>Closing Cash & Bank Balance</RC>
              <RC align="right" className="text-[var(--theme-success-text)] font-bold text-[16px]">
                {rs(closing)}
              </RC>
            </RTotal>
          </ReportTable>
        </ReportCard>
      )}
    </ReportPage>
  );
}
