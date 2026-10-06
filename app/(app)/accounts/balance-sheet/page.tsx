"use client";

import { useState } from "react";
import { Building2 } from "lucide-react";
import { rs } from "@/components/ui";
import { FilterSelect, RC, ReportCard, ReportPage, ReportTable, RRow, RSection, RTotal, money } from "@/components/report";
import { TablePageSkeleton, useInitialLoading } from "@/components/skeleton";
import { BALANCE_SHEET } from "@/lib/accounting-mock-data";

export default function BalanceSheetPage() {
  const [year, setYear] = useState("2026-2027");
  const [asOf, setAsOf] = useState("31 Oct 2026");

  const t = (rows: { amount: number }[]) => rows.reduce((s, r) => s + r.amount, 0);
  const totalAssets = t(BALANCE_SHEET.assets);
  const totalLiabilities = t(BALANCE_SHEET.liabilities);
  const totalEquity = t(BALANCE_SHEET.equity);
  const balanced = totalAssets === totalLiabilities + totalEquity;

  const loading = useInitialLoading();
  if (loading) return <TablePageSkeleton rows={9} cols={2} />;

  return (
    <ReportPage
      title="Balance Sheet"
      subtitle="Assets, liabilities and school fund as at the selected date."
      Icon={Building2}
      filters={
        <>
          <FilterSelect label="Financial Year" options={["2026-2027", "2025-2026"]} value={year} onChange={setYear} />
          <FilterSelect label="As at" options={["31 Oct 2026", "30 Sep 2026", "30 Jun 2026"]} value={asOf} onChange={setAsOf} />
        </>
      }
    >
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ReportCard title="Assets" subtitle={`As at ${asOf}`}>
          <ReportTable minWidth={360} columns={[{ label: "Account" }, { label: "Amount", align: "right" }]}>
            <RSection label="Assets" colSpan={2} />
            {BALANCE_SHEET.assets.map((r) => (
              <RRow key={r.name}><RC>{r.name}</RC><RC align="right">{money(r.amount)}</RC></RRow>
            ))}
            <RTotal><RC>Total Assets</RC><RC align="right">{rs(totalAssets)}</RC></RTotal>
          </ReportTable>
        </ReportCard>

        <ReportCard title="Liabilities & School Fund" subtitle={`As at ${asOf}`}
          right={balanced ? undefined : undefined}>
          <ReportTable minWidth={360} columns={[{ label: "Account" }, { label: "Amount", align: "right" }]}>
            <RSection label="Liabilities" colSpan={2} />
            {BALANCE_SHEET.liabilities.map((r) => (
              <RRow key={r.name}><RC>{r.name}</RC><RC align="right">{money(r.amount)}</RC></RRow>
            ))}
            <RRow className="font-medium"><RC>Total Liabilities</RC><RC align="right">{rs(totalLiabilities)}</RC></RRow>
            <RSection label="Equity / School Fund" colSpan={2} />
            {BALANCE_SHEET.equity.map((r) => (
              <RRow key={r.name}><RC>{r.name}</RC><RC align="right">{money(r.amount)}</RC></RRow>
            ))}
            <RRow className="font-medium"><RC>Total Equity</RC><RC align="right">{rs(totalEquity)}</RC></RRow>
            <RTotal><RC>Total Liabilities + Equity</RC><RC align="right">{rs(totalLiabilities + totalEquity)}</RC></RTotal>
          </ReportTable>
        </ReportCard>
      </div>

      <ReportCard pad>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[14px] text-[var(--theme-text-muted)]">
            Total Assets <span className="font-semibold text-[var(--theme-text)]">{rs(totalAssets)}</span> ·
            Total Liabilities + Equity <span className="font-semibold text-[var(--theme-text)]">{rs(totalLiabilities + totalEquity)}</span>
          </p>
          <span className={balanced ? "text-[13px] font-semibold text-[var(--theme-success-text)]" : "text-[13px] font-semibold text-[var(--theme-danger-text)]"}>
            {balanced ? "Balanced" : `Difference ${rs(Math.abs(totalAssets - totalLiabilities - totalEquity))}`}
          </span>
        </div>
      </ReportCard>
    </ReportPage>
  );
}
