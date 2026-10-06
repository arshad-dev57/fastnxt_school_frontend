"use client";

import { Fragment, useState } from "react";
import { Activity } from "lucide-react";
import { rs } from "@/components/ui";
import { FilterSelect, RC, ReportCard, ReportPage, ReportTable, RRow, RSection, RTotal, moneySigned } from "@/components/report";
import { TablePageSkeleton, useInitialLoading } from "@/components/skeleton";
import { CASH_FLOW } from "@/lib/accounting-mock-data";

export default function CashFlowPage() {
  const [year, setYear] = useState("2026-2027");

  const nets = CASH_FLOW.sections.map((s) => s.lines.reduce((a, l) => a + l.amount, 0));
  const netTotal = nets.reduce((a, b) => a + b, 0);
  const closing = CASH_FLOW.opening + netTotal;

  const loading = useInitialLoading();
  if (loading) return <TablePageSkeleton rows={9} cols={2} />;

  return (
    <ReportPage
      title="Cash Flow"
      subtitle="Operating, investing and financing cash movements."
      Icon={Activity}
      filters={<FilterSelect label="Financial Year" options={["2026-2027", "2025-2026"]} value={year} onChange={setYear} />}
    >
      <ReportCard title="Cash Flow Statement" subtitle={year}>
        <ReportTable minWidth={480} columns={[{ label: "Description" }, { label: "Amount", align: "right" }]}>
          <RRow><RC muted>Opening Cash</RC><RC align="right" muted>{rs(CASH_FLOW.opening)}</RC></RRow>
          {CASH_FLOW.sections.map((s, i) => (
            <Fragment key={s.title}>
              <RSection label={s.title} colSpan={2} />
              {s.lines.map((l) => (
                <RRow key={l.name}><RC>{l.name}</RC><RC align="right" danger={l.amount < 0}>{moneySigned(l.amount)}</RC></RRow>
              ))}
              <RRow className="font-medium">
                <RC>Net {s.title.replace(" Activities", "")}</RC>
                <RC align="right" danger={nets[i] < 0}>{moneySigned(nets[i])}</RC>
              </RRow>
            </Fragment>
          ))}
          <RTotal>
            <RC>Net Cash Flow</RC>
            <RC align="right" danger={netTotal < 0}>{moneySigned(netTotal)}</RC>
          </RTotal>
          <RTotal>
            <RC>Closing Cash</RC>
            <RC align="right" className="text-[var(--theme-success-text)]">{rs(closing)}</RC>
          </RTotal>
        </ReportTable>
      </ReportCard>
    </ReportPage>
  );
}
