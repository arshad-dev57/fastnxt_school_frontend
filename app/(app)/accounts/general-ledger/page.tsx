"use client";

import { useMemo, useState } from "react";
import { BookOpen } from "lucide-react";
import { rs } from "@/components/ui";
import { FilterSelect, RC, ReportCard, ReportPage, ReportTable, RRow, RTotal, money } from "@/components/report";
import { TablePageSkeleton, useInitialLoading } from "@/components/skeleton";
import { LEDGER } from "@/lib/accounting-mock-data";

const ACCOUNT_OPTIONS = Object.keys(LEDGER);

export default function GeneralLedgerPage() {
  const [account, setAccount] = useState(ACCOUNT_OPTIONS[0]);
  const [from, setFrom] = useState("01 Oct 2026");
  const [to, setTo] = useState("31 Oct 2026");
  const [kind, setKind] = useState("All Transactions");

  const book = LEDGER[account] ?? LEDGER[ACCOUNT_OPTIONS[0]];

  const { rows, totalDebit, totalCredit, closing } = useMemo(() => {
    const debit = book.lines.reduce((s, l) => s + (l.debit ?? 0), 0);
    const credit = book.lines.reduce((s, l) => s + (l.credit ?? 0), 0);
    const last = book.lines[book.lines.length - 1];
    return { rows: book.lines, totalDebit: debit, totalCredit: credit, closing: last ? last.balance : book.opening };
  }, [book]);

  const loading = useInitialLoading();
  if (loading) return <TablePageSkeleton rows={8} cols={5} />;

  return (
    <ReportPage
      title="General Ledger"
      subtitle="Account-wise transactions with running balance."
      Icon={BookOpen}
      filters={
        <>
          <FilterSelect label="Account" options={ACCOUNT_OPTIONS} value={account} onChange={setAccount} />
          <FilterSelect label="Date From" options={["01 Oct 2026", "01 Sep 2026"]} value={from} onChange={setFrom} />
          <FilterSelect label="Date To" options={["31 Oct 2026", "30 Sep 2026"]} value={to} onChange={setTo} />
          <FilterSelect label="Type" options={["All Transactions", "Debit Only", "Credit Only"]} value={kind} onChange={setKind} />
        </>
      }
    >
      <ReportCard title={`Account: ${account}`} subtitle={`${from} — ${to}`}>
        <ReportTable columns={[{ label: "Date" }, { label: "Reference" }, { label: "Description" }, { label: "Debit", align: "right" }, { label: "Credit", align: "right" }, { label: "Balance", align: "right" }]}>
          <RRow>
            <RC muted>{from}</RC>
            <RC muted>—</RC>
            <RC muted>Opening Balance</RC>
            <RC align="right" muted>—</RC>
            <RC align="right" muted>—</RC>
            <RC align="right" muted>{rs(book.opening)}</RC>
          </RRow>
          {rows.map((l) => (
            <RRow key={`${l.date}-${l.reference}`}>
              <RC muted>{l.date}</RC>
              <RC muted>{l.reference}</RC>
              <RC>{l.description}</RC>
              <RC align="right">{money(l.debit)}</RC>
              <RC align="right">{money(l.credit)}</RC>
              <RC align="right">{rs(l.balance)}</RC>
            </RRow>
          ))}
          <RTotal>
            <RC>—</RC>
            <RC>—</RC>
            <RC>Totals</RC>
            <RC align="right">{money(totalDebit)}</RC>
            <RC align="right">{money(totalCredit)}</RC>
            <RC align="right" className="text-[var(--theme-success-text)]">{rs(closing)}</RC>
          </RTotal>
        </ReportTable>
      </ReportCard>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Opening Balance" value={rs(book.opening)} />
        <Metric label="Total Debit" value={rs(totalDebit)} />
        <Metric label="Total Credit" value={rs(totalCredit)} />
        <Metric label="Closing Balance" value={rs(closing)} tone />
      </div>
    </ReportPage>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: boolean }) {
  return (
    <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-[var(--theme-text-faint)]">{label}</p>
      <p className={tone ? "mt-0.5 text-[16px] font-bold text-[var(--theme-success-text)]" : "mt-0.5 text-[16px] font-bold"}>{value}</p>
    </div>
  );
}
