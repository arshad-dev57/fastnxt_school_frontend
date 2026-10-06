"use client";

import { useState } from "react";
import { Scale } from "lucide-react";
import { Badge } from "@/components/ui";
import { FilterSelect, RC, ReportCard, ReportPage, ReportTable, RRow, RTotal, money } from "@/components/report";
import { TablePageSkeleton, useInitialLoading } from "@/components/skeleton";
import { TRIAL_BALANCE } from "@/lib/accounting-mock-data";

export default function TrialBalancePage() {
  const [year, setYear] = useState("2026-2027");
  const [from, setFrom] = useState("01 Jul 2026");
  const [to, setTo] = useState("31 Oct 2026");

  const totalDebit = TRIAL_BALANCE.reduce((s, r) => s + r.debit, 0);
  const totalCredit = TRIAL_BALANCE.reduce((s, r) => s + r.credit, 0);
  const diff = totalDebit - totalCredit;

  const loading = useInitialLoading();
  if (loading) return <TablePageSkeleton rows={9} cols={3} />;

  return (
    <ReportPage
      title="Trial Balance"
      subtitle="Debit and credit balances for the selected period."
      Icon={Scale}
      filters={
        <>
          <FilterSelect label="Financial Year" options={["2026-2027", "2025-2026"]} value={year} onChange={setYear} />
          <FilterSelect label="Date From" options={["01 Jul 2026", "01 Aug 2026", "01 Sep 2026"]} value={from} onChange={setFrom} />
          <FilterSelect label="Date To" options={["31 Oct 2026", "30 Sep 2026", "31 Dec 2026"]} value={to} onChange={setTo} />
        </>
      }
    >
      <ReportCard
        title="Trial Balance"
        subtitle={`${year} · ${from} — ${to}`}
        right={<Badge label={diff === 0 ? "Balanced" : `Difference ${money(diff)}`} tone={diff === 0 ? "green" : "red"} />}
      >
        <ReportTable columns={[{ label: "Account Code" }, { label: "Account" }, { label: "Debit", align: "right" }, { label: "Credit", align: "right" }]}>
          {TRIAL_BALANCE.map((r) => (
            <RRow key={r.code}>
              <RC muted>{r.code}</RC>
              <RC>{r.name}</RC>
              <RC align="right">{money(r.debit)}</RC>
              <RC align="right">{money(r.credit)}</RC>
            </RRow>
          ))}
          <RTotal>
            <RC>—</RC>
            <RC>Total</RC>
            <RC align="right">{money(totalDebit)}</RC>
            <RC align="right">{money(totalCredit)}</RC>
          </RTotal>
        </ReportTable>
      </ReportCard>
    </ReportPage>
  );
}
