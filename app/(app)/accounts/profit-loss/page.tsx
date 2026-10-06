"use client";

import { useState } from "react";
import { TrendingUp } from "lucide-react";
import { Badge, rs } from "@/components/ui";
import { FilterSelect, RC, ReportCard, ReportPage, ReportTable, RRow, RSection, RTotal, money } from "@/components/report";
import { TablePageSkeleton, useInitialLoading } from "@/components/skeleton";
import { PROFIT_LOSS } from "@/lib/accounting-mock-data";

export default function ProfitLossPage() {
  const [year, setYear] = useState("2026-2027");
  const [period, setPeriod] = useState("Year to date");

  const incomeTotal = PROFIT_LOSS.income.reduce((s, r) => s + r.amount, 0);
  const expenseTotal = PROFIT_LOSS.expenses.reduce((s, r) => s + r.amount, 0);
  const net = incomeTotal - expenseTotal;

  const loading = useInitialLoading();
  if (loading) return <TablePageSkeleton rows={9} cols={2} />;

  return (
    <ReportPage
      title="Profit & Loss"
      subtitle="Income, expenses and the school's net surplus for the period."
      Icon={TrendingUp}
      filters={
        <>
          <FilterSelect label="Financial Year" options={["2026-2027", "2025-2026"]} value={year} onChange={setYear} />
          <FilterSelect label="Period" options={["Year to date", "This Month", "This Quarter", "Last Year"]} value={period} onChange={setPeriod} />
        </>
      }
    >
      <ReportCard title="Statement of Profit & Loss" subtitle={`${year} · ${period}`}
        right={<Badge label={net >= 0 ? "Surplus" : "Deficit"} tone={net >= 0 ? "green" : "red"} />}>
        <ReportTable minWidth={460} columns={[{ label: "Description" }, { label: "Amount", align: "right" }]}>
          <RSection label="Income" colSpan={2} />
          {PROFIT_LOSS.income.map((r) => (
            <RRow key={r.name}><RC>{r.name}</RC><RC align="right">{money(r.amount)}</RC></RRow>
          ))}
          <RRow className="font-medium"><RC>Total Income</RC><RC align="right">{rs(incomeTotal)}</RC></RRow>

          <RSection label="Expenses" colSpan={2} />
          {PROFIT_LOSS.expenses.map((r) => (
            <RRow key={r.name}><RC>{r.name}</RC><RC align="right">{money(r.amount)}</RC></RRow>
          ))}
          <RRow className="font-medium"><RC>Total Expenses</RC><RC align="right">{rs(expenseTotal)}</RC></RRow>

          <RTotal>
            <RC>Net Surplus</RC>
            <RC align="right" className={net >= 0 ? "text-[var(--theme-success-text)]" : "text-[var(--theme-danger-text)]"}>{rs(net)}</RC>
          </RTotal>
        </ReportTable>
      </ReportCard>
    </ReportPage>
  );
}
